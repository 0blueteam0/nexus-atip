/**
 * Evolution Agent (F Architecture Phase 3 - Layer 7)
 *
 * Self-improvement engine that analyzes learning data and proposes
 * routing/config optimizations. Two-phase: propose -> approve/apply.
 *
 * Design: Claude + Codex merged (threshold-based + health guardrails)
 * - Threshold-based recommendations (transparent, debuggable)
 * - Row-level rollback for weights, full snapshot for config_tweak
 * - Auto-apply: risk=low + confidence>0.8 + health guard
 */
'use strict';

const crypto = require('crypto');
const db = require('./db');
const { EVENT_TYPES } = require('./events');

// Thresholds for recommendation generation
const LOW_SUCCESS_THRESHOLD = 0.3;
const MIN_USAGE_FOR_ADJUSTMENT = 10;
const PATTERN_PROMOTION_OCCURRENCES = 5;
const PATTERN_PROMOTION_CONFIDENCE = 0.7;
const AUTO_APPLY_CONFIDENCE = 0.8;
const RECENT_FAILURE_BLOCK_THRESHOLD = 0.3; // block auto-apply if >30% recent failures

class EvolutionAgent {
  constructor({ learner, router, broadcaster }) {
    this.learner = learner;
    this.router = router;
    this.broadcaster = broadcaster;
  }

  /**
   * Run a full proposal cycle: analyze data -> generate recommendations
   */
  proposeCycle({ trigger = 'daily', actor = 'scheduler' } = {}) {
    const recommendations = [];

    // 1. Find poorly performing tools (weight adjustment)
    recommendations.push(...this._analyzeWeightAdjustments());

    // 2. Find ready pattern candidates (pattern promotion)
    recommendations.push(...this._analyzePatternPromotions());

    // 3. Analyze epsilon effectiveness (config tweak)
    recommendations.push(...this._analyzeConfigTweaks());

    // Persist all recommendations
    for (const rec of recommendations) {
      this._persistRecommendation(rec);
    }

    db.logEvolution('propose_cycle', `Generated ${recommendations.length} recommendations`,
      { trigger }, { count: recommendations.length }, 0);

    this.broadcaster.broadcast(EVENT_TYPES.EVOLUTION_PROPOSALS, {
      count: recommendations.length,
      types: recommendations.map(r => r.recommendation_type),
      trigger
    });

    return { count: recommendations.length, recommendations };
  }

  /**
   * Auto-apply low-risk recommendations with health guard
   */
  autoApplyLowRisk() {
    // Health guard: check recent apply failure rate
    if (!this._healthGuardPasses()) {
      return { applied: 0, blocked: true, reason: 'health guard failed' };
    }

    const d = db.getDb();
    const candidates = d.prepare(`
      SELECT * FROM evolution_recommendations
      WHERE status = 'proposed' AND risk_level = 'low' AND auto_applicable = 1 AND confidence >= ?
      ORDER BY confidence DESC LIMIT 10
    `).all(AUTO_APPLY_CONFIDENCE);

    const results = [];
    for (const rec of candidates) {
      const result = this.applyRecommendation(rec.id, 'auto-apply', true);
      results.push({ id: rec.id, ...result });
    }

    return { applied: results.filter(r => r.ok).length, total: candidates.length, results };
  }

  /**
   * Apply a single recommendation with snapshot + validation
   */
  applyRecommendation(recommendationId, actor = 'user', auto = false) {
    const d = db.getDb();
    const rec = d.prepare('SELECT * FROM evolution_recommendations WHERE id = ?').get(recommendationId);

    if (!rec) return { ok: false, error: 'not found' };
    if (rec.status !== 'proposed' && rec.status !== 'approved') {
      return { ok: false, error: `invalid status: ${rec.status}` };
    }

    try {
      // Create rollback snapshot
      const snapshotId = this._createSnapshot(rec);

      // Apply the change
      const proposed = JSON.parse(rec.proposed_state);
      this._applyChange(rec.recommendation_type, proposed);

      // Mark applied
      d.prepare(`
        UPDATE evolution_recommendations
        SET status = 'applied', applied_by = ?, applied_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(actor, recommendationId);

      // Record history
      this._recordHistory(recommendationId, 'apply', true, actor, null);

      db.logEvolution('apply', rec.title, JSON.parse(rec.before_state || '{}'), proposed,
        rec.expected_impact);

      return { ok: true, snapshotId };
    } catch (err) {
      d.prepare(`
        UPDATE evolution_recommendations
        SET status = 'failed', updated_at = datetime('now')
        WHERE id = ?
      `).run(recommendationId);

      this._recordHistory(recommendationId, 'apply', false, actor, err.message);
      return { ok: false, error: err.message };
    }
  }

  /**
   * Approve a recommendation (manual gate)
   */
  approveRecommendation(recommendationId, approver, note) {
    const d = db.getDb();
    d.prepare(`
      UPDATE evolution_recommendations
      SET status = 'approved', approved_by = ?, approved_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND status = 'proposed'
    `).run(approver, recommendationId);
    return { ok: true };
  }

  /**
   * Reject a recommendation
   */
  rejectRecommendation(recommendationId, approver, reason) {
    const d = db.getDb();
    d.prepare(`
      UPDATE evolution_recommendations
      SET status = 'rejected', rejected_by = ?, rejected_at = datetime('now'), rejection_reason = ?, updated_at = datetime('now')
      WHERE id = ? AND status IN ('proposed', 'approved')
    `).run(approver, reason, recommendationId);
    return { ok: true };
  }

  /**
   * Rollback an applied recommendation
   */
  rollback(recommendationId, actor, reason) {
    const d = db.getDb();

    const snapshot = d.prepare(`
      SELECT * FROM evolution_snapshots WHERE recommendation_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(recommendationId);

    if (!snapshot) return { ok: false, error: 'no snapshot found' };

    try {
      const stateBlob = JSON.parse(snapshot.state_blob);
      this._restoreSnapshot(snapshot.snapshot_type, stateBlob);

      d.prepare(`
        UPDATE evolution_recommendations
        SET status = 'rolled_back', updated_at = datetime('now')
        WHERE id = ?
      `).run(recommendationId);

      this._recordHistory(recommendationId, 'rollback', true, actor, reason);
      return { ok: true };
    } catch (err) {
      this._recordHistory(recommendationId, 'rollback', false, actor, err.message);
      return { ok: false, error: err.message };
    }
  }

  /**
   * Get recommendations with filters
   */
  getRecommendations({ status, riskLevel, limit } = {}) {
    const d = db.getDb();
    let sql = 'SELECT * FROM evolution_recommendations WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (riskLevel) { sql += ' AND risk_level = ?'; params.push(riskLevel); }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit || 50);
    return d.prepare(sql).all(...params);
  }

  /**
   * Get apply/rollback history
   */
  getHistory(limit = 20) {
    const d = db.getDb();
    return d.prepare('SELECT * FROM evolution_apply_history ORDER BY created_at DESC LIMIT ?').all(limit);
  }

  // === Private: Recommendation Generators ===

  _analyzeWeightAdjustments() {
    const d = db.getDb();
    const recs = [];

    try {
      // Find tools with low success rate and enough usage
      const poor = d.prepare(`
        SELECT tool_name, intent, weight, alpha, beta,
               CAST(alpha AS REAL) / (alpha + beta) AS success_rate
        FROM routing_weights
        WHERE (alpha + beta) >= ? AND weight < ?
        ORDER BY weight ASC LIMIT 10
      `).all(MIN_USAGE_FOR_ADJUSTMENT, LOW_SUCCESS_THRESHOLD);

      for (const tool of poor) {
        recs.push({
          recommendation_type: 'weight_adjustment',
          risk_level: 'low',
          title: `Reduce weight: ${tool.tool_name} for ${tool.intent}`,
          rationale: `Success rate ${Math.round(tool.success_rate * 100)}% over ${tool.alpha + tool.beta} uses`,
          before_state: { tool_name: tool.tool_name, intent: tool.intent, weight: tool.weight, alpha: tool.alpha, beta: tool.beta },
          proposed_state: { tool_name: tool.tool_name, intent: tool.intent, weight: 0.1, alpha: 1, beta: Math.max(1, tool.beta) },
          expected_impact: 0.05,
          confidence: Math.min(0.95, 0.5 + (tool.alpha + tool.beta) / 100),
          auto_applicable: 1
        });
      }

      // Find stale weights (old, unused)
      const stale = d.prepare(`
        SELECT tool_name, intent, weight, last_updated
        FROM routing_weights
        WHERE last_updated < datetime('now', '-14 days') AND weight > 0.1
        ORDER BY last_updated ASC LIMIT 5
      `).all();

      for (const tool of stale) {
        recs.push({
          recommendation_type: 'weight_adjustment',
          risk_level: 'low',
          title: `Decay stale weight: ${tool.tool_name} for ${tool.intent}`,
          rationale: `Not updated since ${tool.last_updated}`,
          before_state: { tool_name: tool.tool_name, intent: tool.intent, weight: tool.weight },
          proposed_state: { tool_name: tool.tool_name, intent: tool.intent, weight: Math.max(0.1, tool.weight * 0.5) },
          expected_impact: 0.02,
          confidence: 0.85,
          auto_applicable: 1
        });
      }
    } catch { /* tables may not exist */ }

    return recs;
  }

  _analyzePatternPromotions() {
    const d = db.getDb();
    const recs = [];

    try {
      const ready = d.prepare(`
        SELECT * FROM pattern_candidates
        WHERE status = 'candidate' AND occurrence_count >= ? AND confidence >= ?
        ORDER BY confidence DESC LIMIT 5
      `).all(PATTERN_PROMOTION_OCCURRENCES, PATTERN_PROMOTION_CONFIDENCE);

      for (const pattern of ready) {
        recs.push({
          recommendation_type: 'pattern_promotion',
          risk_level: 'medium',
          title: `Promote pattern: ${pattern.description}`,
          rationale: `Seen ${pattern.occurrence_count} times, confidence ${Math.round(pattern.confidence * 100)}%`,
          before_state: { pattern_hash: pattern.pattern_hash, status: 'candidate' },
          proposed_state: { pattern_hash: pattern.pattern_hash, status: 'promoted', tool_chain: pattern.tool_chain },
          expected_impact: 0.1,
          confidence: pattern.confidence,
          auto_applicable: 0 // patterns need review
        });
      }
    } catch { /* ignore */ }

    return recs;
  }

  _analyzeConfigTweaks() {
    const d = db.getDb();
    const recs = [];

    try {
      // Check if epsilon exploration is too aggressive or too conservative
      if (this.learner) {
        const stats = this.learner.getStats();
        const recentRate = stats.recentSuccessRate;

        // If exploration success rate is very high, reduce epsilon (exploit more)
        if (recentRate > 0.85 && stats.recentLearningEvents > 20) {
          recs.push({
            recommendation_type: 'config_tweak',
            risk_level: 'medium',
            title: 'Reduce epsilon (high success rate suggests exploitation is better)',
            rationale: `Recent success rate: ${Math.round(recentRate * 100)}%`,
            before_state: { epsilon: 0.15 },
            proposed_state: { epsilon: 0.08 },
            expected_impact: 0.03,
            confidence: 0.75,
            auto_applicable: 0 // config tweaks need approval
          });
        }
        // If exploration success rate is low, increase epsilon (explore more)
        if (recentRate < 0.4 && stats.recentLearningEvents > 20) {
          recs.push({
            recommendation_type: 'config_tweak',
            risk_level: 'medium',
            title: 'Increase epsilon (low success rate suggests more exploration needed)',
            rationale: `Recent success rate: ${Math.round(recentRate * 100)}%`,
            before_state: { epsilon: 0.15 },
            proposed_state: { epsilon: 0.25 },
            expected_impact: 0.05,
            confidence: 0.7,
            auto_applicable: 0
          });
        }
      }
    } catch { /* ignore */ }

    return recs;
  }

  // === Private: Snapshot & Apply ===

  _createSnapshot(rec) {
    const d = db.getDb();
    const id = `snap-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const beforeState = rec.before_state || '{}';
    const stateBlob = typeof beforeState === 'string' ? beforeState : JSON.stringify(beforeState);
    const checksum = crypto.createHash('sha256').update(stateBlob).digest('hex').slice(0, 16);

    d.prepare(`
      INSERT INTO evolution_snapshots (id, recommendation_id, snapshot_type, state_blob, checksum, created_by)
      VALUES (?, ?, ?, ?, ?, 'evolution-agent')
    `).run(id, rec.id, rec.recommendation_type, stateBlob, checksum);

    return id;
  }

  _applyChange(type, proposed) {
    const d = db.getDb();

    switch (type) {
      case 'weight_adjustment':
        if (proposed.tool_name && proposed.intent) {
          d.prepare(`
            UPDATE routing_weights
            SET weight = ?, alpha = COALESCE(?, alpha), beta = COALESCE(?, beta), last_updated = datetime('now')
            WHERE tool_name = ? AND intent = ?
          `).run(proposed.weight, proposed.alpha || null, proposed.beta || null,
                 proposed.tool_name, proposed.intent);
        }
        break;

      case 'pattern_promotion':
        if (proposed.pattern_hash) {
          d.prepare(`
            UPDATE pattern_candidates SET status = 'promoted' WHERE pattern_hash = ?
          `).run(proposed.pattern_hash);
        }
        break;

      case 'config_tweak':
        // Config tweaks are recorded but not auto-applied to running config
        // They would require a restart or dynamic config reload
        db.logEvolution('config_proposal', JSON.stringify(proposed), null, proposed, 0);
        break;
    }
  }

  _restoreSnapshot(snapshotType, stateBlob) {
    const d = db.getDb();

    switch (snapshotType) {
      case 'weight_adjustment':
        if (stateBlob.tool_name && stateBlob.intent) {
          d.prepare(`
            UPDATE routing_weights
            SET weight = ?, alpha = ?, beta = ?, last_updated = datetime('now')
            WHERE tool_name = ? AND intent = ?
          `).run(stateBlob.weight, stateBlob.alpha, stateBlob.beta,
                 stateBlob.tool_name, stateBlob.intent);
        }
        break;

      case 'pattern_promotion':
        if (stateBlob.pattern_hash) {
          d.prepare(`
            UPDATE pattern_candidates SET status = ? WHERE pattern_hash = ?
          `).run(stateBlob.status || 'candidate', stateBlob.pattern_hash);
        }
        break;
    }
  }

  _healthGuardPasses() {
    const d = db.getDb();
    try {
      const recent = d.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failures
        FROM evolution_apply_history
        WHERE created_at > datetime('now', '-24 hours')
      `).get();

      if (recent.total > 0 && (recent.failures / recent.total) > RECENT_FAILURE_BLOCK_THRESHOLD) {
        return false;
      }
    } catch { /* guard passes if table empty/not exist */ }
    return true;
  }

  _persistRecommendation(rec) {
    const d = db.getDb();
    const id = `evo-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    d.prepare(`
      INSERT INTO evolution_recommendations
        (id, recommendation_type, risk_level, title, rationale, before_state, proposed_state,
         expected_impact, confidence, auto_applicable, source_metrics)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, rec.recommendation_type, rec.risk_level, rec.title, rec.rationale,
           JSON.stringify(rec.before_state), JSON.stringify(rec.proposed_state),
           rec.expected_impact, rec.confidence, rec.auto_applicable,
           JSON.stringify({ generated_at: new Date().toISOString() }));
  }

  _recordHistory(recommendationId, action, success, actor, detail) {
    const d = db.getDb();
    const id = `hist-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    d.prepare(`
      INSERT INTO evolution_apply_history (id, recommendation_id, action, success, actor, details, error)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, recommendationId, action, success ? 1 : 0, actor,
           success ? detail : null, success ? null : detail);
  }
}

module.exports = { EvolutionAgent };
