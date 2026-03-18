/**
 * Antifragile Module (Taleb Incerto Principles)
 *
 * Implements 5 key principles from Nassim Taleb's Incerto series:
 * 1. No-op option: "doing nothing" is a valid and valuable action
 * 2. Irreversibility scoring: graduated risk, not binary block/allow
 * 3. Failure-enriched memory: learn equally from failures and successes
 * 4. Dynamic trust scores: agent authority adjusts based on outcomes
 * 5. Barbell strategy: 90% conservative + 10% exploratory dispatch
 *
 * Design: Claude + Codex merged analysis applied to F Architecture
 */
'use strict';

const db = require('./db');

// Irreversibility risk levels with required approval tiers
const IRREVERSIBILITY_LEVELS = {
  trivial:   { score: 0.1, approval: 'none',      description: 'Read-only, no side effects' },
  low:       { score: 0.3, approval: 'auto',       description: 'Reversible file changes' },
  moderate:  { score: 0.5, approval: 'auto',       description: 'Multi-file changes, config modifications' },
  high:      { score: 0.7, approval: 'review',     description: 'Database schema, deployment, git push' },
  critical:  { score: 0.9, approval: 'manual',     description: 'Irreversible deletion, production deploy' },
  forbidden: { score: 1.0, approval: 'block',      description: 'System-destructive operations' }
};

// Tool -> irreversibility classification
const TOOL_IRREVERSIBILITY = {
  'Read': 'trivial', 'Glob': 'trivial', 'Grep': 'trivial', 'WebSearch': 'trivial',
  'Write': 'low', 'Edit': 'low',
  'Bash': 'moderate', // refined by command content
  'Agent': 'moderate',
  'git push': 'high', 'git reset': 'critical',
  'rm': 'critical', 'DROP': 'forbidden', 'TRUNCATE': 'forbidden'
};

class AntifragileEngine {
  constructor({ broadcaster }) {
    this.broadcaster = broadcaster;
  }

  // ========== 1. NO-OP OPTION ==========

  /**
   * Evaluate whether "do nothing" is the best action.
   * Returns { shouldAct: boolean, reason: string, confidence: number }
   */
  evaluateNoOp({ intent, currentState, recentFailures }) {
    // If recent failure rate is high for this intent, consider no-op
    const d = db.getDb();
    let recentFails = 0;
    try {
      const result = d.prepare(`
        SELECT COUNT(*) as c FROM events
        WHERE event_type LIKE 'hook:%' AND data LIKE ? AND timestamp > datetime('now', '-10 minutes')
      `).get(`%"error":true%`);
      recentFails = result?.c || 0;
    } catch {}

    // Iatrogenics check: if many recent failures, doing nothing may be better
    if (recentFails > 5) {
      return {
        shouldAct: false,
        reason: `High recent failure rate (${recentFails} in 10min). Iatrogenics risk - inaction recommended.`,
        confidence: 0.8
      };
    }

    // If current state is stable and intent is low-priority, no-op is valid
    if (currentState === 'idle' && intent === 'setup') {
      return { shouldAct: false, reason: 'System stable, setup not urgent', confidence: 0.6 };
    }

    return { shouldAct: true, reason: 'Action warranted', confidence: 0.9 };
  }

  // ========== 2. IRREVERSIBILITY SCORING ==========

  /**
   * Score the irreversibility of an action.
   * Returns { score: 0-1, level: string, approval: string, description: string }
   */
  scoreIrreversibility({ toolName, command, targetFiles }) {
    let level = TOOL_IRREVERSIBILITY[toolName] || 'moderate';

    // Refine Bash commands
    if (toolName === 'Bash' && command) {
      if (/rm\s+(-rf?|--force)/i.test(command)) level = 'critical';
      else if (/git\s+(push|reset|clean|rebase)/i.test(command)) level = 'high';
      else if (/git\s+(add|commit)/i.test(command)) level = 'moderate';
      else if (/DROP|TRUNCATE|DELETE\s+FROM/i.test(command)) level = 'forbidden';
      else if (/npm\s+(install|uninstall)/i.test(command)) level = 'moderate';
      else if (/ls|cat|echo|grep|find|head|tail|curl/i.test(command)) level = 'trivial';
    }

    // Multi-file operations increase score
    if (targetFiles && targetFiles.length > 5) {
      const idx = Object.keys(IRREVERSIBILITY_LEVELS).indexOf(level);
      if (idx < Object.keys(IRREVERSIBILITY_LEVELS).length - 1) {
        level = Object.keys(IRREVERSIBILITY_LEVELS)[Math.min(idx + 1, 5)];
      }
    }

    return { ...IRREVERSIBILITY_LEVELS[level], level };
  }

  // ========== 3. FAILURE-ENRICHED MEMORY ==========

  /**
   * Record a failure with structured analysis for future learning.
   * Failures are first-class citizens, not just error logs.
   */
  recordFailure({ toolName, intent, error, context, nearMiss }) {
    const d = db.getDb();
    try {
      d.prepare(`
        INSERT INTO events (event_type, source, data)
        VALUES ('antifragile:failure', 'antifragile-engine', ?)
      `).run(JSON.stringify({
        tool: toolName,
        intent,
        error: typeof error === 'string' ? error : error?.message,
        context,
        nearMiss: nearMiss || false,
        lesson: this._extractLesson(toolName, intent, error),
        timestamp: Date.now()
      }));
    } catch { /* ignore */ }
  }

  /**
   * Get failure statistics for learning
   */
  getFailureStats(intent) {
    const d = db.getDb();
    try {
      const failures = d.prepare(`
        SELECT data FROM events
        WHERE event_type = 'antifragile:failure'
        AND data LIKE ?
        ORDER BY timestamp DESC LIMIT 20
      `).all(`%"intent":"${intent}"%`);

      const lessons = failures.map(f => {
        try { return JSON.parse(f.data); } catch { return null; }
      }).filter(Boolean);

      return {
        total: lessons.length,
        tools: [...new Set(lessons.map(l => l.tool))],
        lessons: [...new Set(lessons.map(l => l.lesson).filter(Boolean))],
        nearMisses: lessons.filter(l => l.nearMiss).length
      };
    } catch { return { total: 0, tools: [], lessons: [], nearMisses: 0 }; }
  }

  // ========== 4. DYNAMIC TRUST SCORES ==========

  /**
   * Get trust score for a tool/agent combination
   * Score: 0-1 (0=untrusted, 1=fully trusted)
   */
  getTrustScore(toolName) {
    const d = db.getDb();
    try {
      const stats = d.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes,
          AVG(duration_ms) as avg_duration
        FROM tool_usage
        WHERE tool_name = ? AND timestamp > datetime('now', '-7 days')
      `).get(toolName);

      if (!stats || stats.total < 3) return { score: 0.5, confidence: 'low', basis: 'insufficient data' };

      const successRate = stats.successes / stats.total;
      // Apply time decay: recent outcomes weighted more
      const trustScore = Math.min(0.95, Math.max(0.1, successRate));

      return {
        score: Math.round(trustScore * 100) / 100,
        confidence: stats.total > 10 ? 'high' : 'medium',
        basis: `${stats.successes}/${stats.total} success in 7 days`,
        avgDuration: stats.avg_duration ? Math.round(stats.avg_duration) : null
      };
    } catch {
      return { score: 0.5, confidence: 'low', basis: 'error' };
    }
  }

  /**
   * Check if a tool should have restricted authority based on trust
   */
  checkAuthority(toolName, actionLevel) {
    const trust = this.getTrustScore(toolName);
    const irrev = IRREVERSIBILITY_LEVELS[actionLevel] || IRREVERSIBILITY_LEVELS.moderate;

    // Low trust + high irreversibility = deny
    if (trust.score < 0.3 && irrev.score > 0.5) {
      return { allowed: false, reason: `Low trust (${trust.score}) for high-risk action (${actionLevel})` };
    }
    // Medium trust + critical irreversibility = require review
    if (trust.score < 0.6 && irrev.score > 0.7) {
      return { allowed: false, reason: `Medium trust (${trust.score}) needs review for critical action` };
    }

    return { allowed: true, trustScore: trust.score };
  }

  // ========== 5. BARBELL STRATEGY ==========

  /**
   * Apply barbell strategy to tool selection.
   * 90% proven tools, 10% exploration.
   */
  applyBarbell(tools, intent) {
    if (!tools || tools.length < 2) return { selected: tools, strategy: 'single_option' };

    // Sort by trust score
    const scored = tools.map(t => ({
      ...t,
      trust: this.getTrustScore(t.name || t).score
    })).sort((a, b) => b.trust - a.trust);

    // Barbell: recommend top proven tool, but suggest exploration candidate
    const conservative = scored[0]; // highest trust
    const explorer = scored[scored.length - 1]; // lowest trust (explore opportunity)

    // 90% conservative recommendation
    const shouldExplore = Math.random() < 0.10; // 10% exploration

    return {
      recommended: shouldExplore ? explorer : conservative,
      conservative,
      explorer,
      strategy: shouldExplore ? 'barbell_explore' : 'barbell_conservative',
      explorationRate: 0.10
    };
  }

  // ========== HELPERS ==========

  _extractLesson(toolName, intent, error) {
    const errStr = typeof error === 'string' ? error : error?.message || '';
    if (errStr.includes('ENOENT') || errStr.includes('not found')) return `File/path validation needed before using ${toolName}`;
    if (errStr.includes('EACCES') || errStr.includes('permission')) return `Permission check needed for ${toolName}`;
    if (errStr.includes('timeout')) return `${toolName} may need longer timeout for ${intent}`;
    if (errStr.includes('syntax') || errStr.includes('parse')) return `Input validation needed for ${toolName}`;
    return null;
  }

  /**
   * Get comprehensive antifragile status
   */
  getStatus() {
    const d = db.getDb();
    let failureCount = 0, nearMissCount = 0;
    try {
      failureCount = d.prepare("SELECT COUNT(*) as c FROM events WHERE event_type = 'antifragile:failure'").get().c;
      nearMissCount = d.prepare("SELECT COUNT(*) as c FROM events WHERE event_type = 'antifragile:failure' AND data LIKE '%\"nearMiss\":true%'").get().c;
    } catch {}

    return {
      failuresRecorded: failureCount,
      nearMisses: nearMissCount,
      irreversibilityLevels: Object.keys(IRREVERSIBILITY_LEVELS),
      barbellExplorationRate: 0.10,
      principles: ['no-op', 'irreversibility-scoring', 'failure-memory', 'dynamic-trust', 'barbell']
    };
  }
}

module.exports = { AntifragileEngine, IRREVERSIBILITY_LEVELS };
