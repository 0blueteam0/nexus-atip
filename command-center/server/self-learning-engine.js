/**
 * Self-Learning Engine (F Architecture Layer 4)
 *
 * Bayesian weight adjustment engine that learns from tool/agent outcomes.
 * Extends autonomous-router.js with:
 *   - Adaptive weight decay (unused tools lose weight over time)
 *   - Multi-armed bandit exploration (epsilon-greedy)
 *   - Intent clustering (similar intents share weight updates)
 *   - Performance trend detection (improving/degrading tools)
 *
 * Usage:
 *   const engine = new SelfLearningEngine(db);
 *   engine.learn(toolName, intent, success, durationMs);
 *   engine.getBestTools(intent); // returns ranked tools with exploration
 *   engine.decayWeights(); // call periodically (e.g. every 5 min)
 */
'use strict';

const db = require('./db');

// Exploration rate: probability of trying a non-optimal tool
const EPSILON = 0.15;
// Weight decay factor per cycle (5 min default)
const DECAY_FACTOR = 0.995;
// Minimum weight before pruning
const MIN_WEIGHT = 0.05;
// Duration penalty threshold (ms) - tools slower than this get penalized
const SLOW_THRESHOLD_MS = 30000;
// Fast bonus threshold (ms) - tools faster than this get a bonus
const FAST_THRESHOLD_MS = 2000;

// Intent similarity clusters (related intents share partial weight updates)
const INTENT_CLUSTERS = {
  code: ['file_operation', 'architecture', 'design'],
  search: ['code_search', 'web_search', 'web_scrape', 'research'],
  ops: ['git_operation', 'deployment', 'setup'],
  analysis: ['testing', 'security', 'database'],
  media: ['image_processing', 'document', 'visualization']
};

class SelfLearningEngine {
  constructor({ antifragile } = {}) {
    this.antifragile = antifragile || null;
    this.learningLog = [];
    this.maxLogSize = 100;
    this.decayCounter = 0;
  }

  /**
   * Learn from a tool usage outcome
   * @param {string} toolName - Tool that was used
   * @param {string} intent - Detected intent category
   * @param {boolean} success - Whether the tool succeeded
   * @param {number} durationMs - Execution duration
   */
  learn(toolName, intent, success, durationMs) {
    // 1. Core Bayesian update (via db)
    db.updateRoutingWeight(toolName, intent, success);

    // 2. Duration-based adjustment
    if (durationMs != null) {
      this._adjustForDuration(toolName, intent, durationMs, success);
    }

    // 3. Cross-intent learning (related intents get partial update)
    this._crossIntentLearn(toolName, intent, success);

    // 4. Record for trend analysis
    this.learningLog.push({
      tool: toolName,
      intent,
      success,
      durationMs,
      ts: Date.now()
    });
    if (this.learningLog.length > this.maxLogSize) this.learningLog.shift();

    // 5. Record failure in antifragile engine (enriched memory)
    if (!success && this.antifragile) {
      this.antifragile.recordFailure({
        toolName, intent,
        error: `Tool failed (duration: ${durationMs}ms)`,
        context: { source: 'self-learning-engine' },
        nearMiss: durationMs != null && durationMs > SLOW_THRESHOLD_MS
      });
    }

    // 6. Log evolution event
    db.logEvolution('learn', `${toolName}/${intent}: ${success ? 'success' : 'fail'}`,
      { tool: toolName, intent }, { success, durationMs }, success ? 0.01 : -0.01);
  }

  /**
   * Get best tools with epsilon-greedy exploration
   * @param {string} intent - Intent to get tools for
   * @param {number} limit - Max results
   * @returns {Array} Ranked tools with exploration flag
   */
  getBestTools(intent, limit = 5) {
    const tools = db.getBestToolsForIntent(intent, limit + 2);

    if (tools.length === 0) return [];

    // Epsilon-greedy: with probability EPSILON, shuffle order
    const explore = Math.random() < EPSILON;

    if (explore && tools.length > 1) {
      // Swap top tool with a random one to explore
      const swapIdx = 1 + Math.floor(Math.random() * (tools.length - 1));
      const temp = tools[0];
      tools[0] = tools[swapIdx];
      tools[swapIdx] = temp;
      tools[0]._explored = true;
    }

    return tools.slice(0, limit).map(t => ({
      name: t.tool_name,
      weight: t.weight,
      confidence: this._computeConfidence(t.alpha, t.beta),
      explored: t._explored || false,
      alpha: t.alpha,
      beta: t.beta
    }));
  }

  /**
   * Decay all weights slightly (call periodically)
   * Prevents stale tools from dominating rankings.
   */
  decayWeights() {
    this.decayCounter++;
    const d = db.getDb();

    try {
      d.prepare(`
        UPDATE routing_weights
        SET weight = MAX(?, weight * ?),
            last_updated = datetime('now')
        WHERE weight > ?
      `).run(MIN_WEIGHT, DECAY_FACTOR, MIN_WEIGHT);

      // Prune very low weights older than 7 days
      d.prepare(`
        DELETE FROM routing_weights
        WHERE weight <= ? AND last_updated < datetime('now', '-7 days')
      `).run(MIN_WEIGHT);
    } catch (e) {
      // Ignore if tables don't exist yet
    }
  }

  /**
   * Get performance trends for a tool
   * @param {string} toolName - Tool to analyze
   * @returns {Object} Trend analysis
   */
  getTrend(toolName) {
    const recent = this.learningLog.filter(l => l.tool === toolName);
    if (recent.length < 3) return { trend: 'insufficient_data', samples: recent.length };

    const half = Math.floor(recent.length / 2);
    const firstHalf = recent.slice(0, half);
    const secondHalf = recent.slice(half);

    const firstRate = firstHalf.filter(l => l.success).length / firstHalf.length;
    const secondRate = secondHalf.filter(l => l.success).length / secondHalf.length;

    const delta = secondRate - firstRate;
    let trend = 'stable';
    if (delta > 0.15) trend = 'improving';
    else if (delta < -0.15) trend = 'degrading';

    return {
      trend,
      delta: Math.round(delta * 100) / 100,
      recentSuccessRate: Math.round(secondRate * 100) / 100,
      samples: recent.length
    };
  }

  /**
   * Get learning statistics
   */
  getStats() {
    const d = db.getDb();
    let totalWeights = 0, totalIntents = 0, avgWeight = 0;

    try {
      const stats = d.prepare(`
        SELECT COUNT(*) as total, COUNT(DISTINCT intent) as intents, AVG(weight) as avg_w
        FROM routing_weights
      `).get();
      totalWeights = stats.total;
      totalIntents = stats.intents;
      avgWeight = Math.round((stats.avg_w || 0) * 1000) / 1000;
    } catch (e) { /* tables may not exist */ }

    const recentLearning = this.learningLog.slice(-20);
    const recentSuccessRate = recentLearning.length > 0
      ? recentLearning.filter(l => l.success).length / recentLearning.length
      : 0;

    return {
      totalWeights,
      totalIntents,
      avgWeight,
      decayCycles: this.decayCounter,
      epsilon: EPSILON,
      recentLearningEvents: this.learningLog.length,
      recentSuccessRate: Math.round(recentSuccessRate * 100) / 100
    };
  }

  // --- Private methods ---

  _adjustForDuration(toolName, intent, durationMs, success) {
    if (!success) return; // Only reward fast successful tools

    const d = db.getDb();
    try {
      if (durationMs < FAST_THRESHOLD_MS) {
        // Fast tool bonus: slight alpha boost
        d.prepare(`
          UPDATE routing_weights
          SET alpha = alpha + 1,
              weight = CAST(alpha + 1 AS REAL) / (alpha + 1 + beta),
              last_updated = datetime('now')
          WHERE tool_name = ? AND intent = ?
        `).run(toolName, intent);
      } else if (durationMs > SLOW_THRESHOLD_MS) {
        // Slow tool penalty: slight beta boost
        d.prepare(`
          UPDATE routing_weights
          SET beta = beta + 1,
              weight = CAST(alpha AS REAL) / (alpha + beta + 1),
              last_updated = datetime('now')
          WHERE tool_name = ? AND intent = ?
        `).run(toolName, intent);
      }
    } catch (e) { /* ignore */ }
  }

  _crossIntentLearn(toolName, intent, success) {
    // Find which cluster this intent belongs to
    let cluster = null;
    for (const [name, intents] of Object.entries(INTENT_CLUSTERS)) {
      if (intents.includes(intent)) {
        cluster = intents;
        break;
      }
    }
    if (!cluster) return;

    // Apply partial update to related intents (25% strength)
    for (const relatedIntent of cluster) {
      if (relatedIntent === intent) continue;
      // Only update if the tool already has a weight for this intent
      const d = db.getDb();
      try {
        const existing = d.prepare(
          'SELECT * FROM routing_weights WHERE tool_name = ? AND intent = ?'
        ).get(toolName, relatedIntent);

        if (existing) {
          const partialAlpha = success ? 0.25 : 0;
          const partialBeta = success ? 0 : 0.25;
          d.prepare(`
            UPDATE routing_weights
            SET alpha = alpha + ?, beta = beta + ?,
                weight = CAST(alpha + ? AS REAL) / (alpha + ? + beta + ?),
                last_updated = datetime('now')
            WHERE tool_name = ? AND intent = ?
          `).run(partialAlpha, partialBeta, partialAlpha, partialAlpha, partialBeta,
                 toolName, relatedIntent);
        }
      } catch (e) { /* ignore */ }
    }
  }

  _computeConfidence(alpha, beta) {
    // Beta distribution confidence based on sample size
    const total = alpha + beta;
    if (total < 4) return 0.3; // Low confidence
    if (total < 10) return 0.5;
    if (total < 25) return 0.7;
    return Math.min(0.95, 0.7 + (total - 25) * 0.005);
  }
}

module.exports = { SelfLearningEngine };
