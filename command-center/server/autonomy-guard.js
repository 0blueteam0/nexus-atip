/**
 * Autonomy Guard (F Architecture Phase 6)
 *
 * Central safety gate for all autonomous actions.
 * Enforces blast-radius limits, approval gates, and audit trail.
 *
 * Used by: skill-factory, task-decomposer, evolution-agent, claude-remote-bridge
 */
'use strict';

const db = require('./db');

// Default blast-radius limits
const LIMITS = {
  max_concurrent_claude_tasks: parseInt(process.env.GUARD_MAX_TASKS) || 5,
  max_subtasks_per_plan: parseInt(process.env.GUARD_MAX_SUBTASKS) || 10,
  max_auto_deploys_per_day: parseInt(process.env.GUARD_MAX_DEPLOYS) || 3,
  max_files_per_action: parseInt(process.env.GUARD_MAX_FILES) || 20,
  recent_failure_block_threshold: 0.4,
  require_approval_for_risk: 'high' // 'high' = auto low+medium, manual high
};

class AutonomyGuard {
  constructor({ broadcaster }) {
    this.broadcaster = broadcaster;
    this.overrides = new Map(); // ruleId -> override
  }

  /**
   * Check if an autonomous action should proceed
   * Returns { allowed: true } or { blocked: true, reason: string }
   */
  checkAction({ actionType, module, description, riskLevel, metadata }) {
    const d = db.getDb();
    const risk = riskLevel || 'low';

    // 1. Risk-based approval gate
    if (risk === 'high' && LIMITS.require_approval_for_risk !== 'none') {
      this._audit(actionType, module, description, risk, false, true, 'high risk requires manual approval');
      return { blocked: true, reason: 'high risk requires manual approval' };
    }

    // 2. Recent failure rate check
    try {
      const recent = d.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN blocked = 1 THEN 0 WHEN approved = 0 THEN 1 ELSE 0 END) as failures
        FROM autonomy_audit
        WHERE module = ? AND created_at > datetime('now', '-1 hour')
      `).get(module);

      if (recent.total > 5 && (recent.failures / recent.total) > LIMITS.recent_failure_block_threshold) {
        this._audit(actionType, module, description, risk, false, true, 'recent failure rate too high');
        return { blocked: true, reason: `${module} failure rate too high in last hour` };
      }
    } catch { /* first run */ }

    // 3. Blast-radius limits
    if (actionType === 'skill_deploy') {
      try {
        const todayDeploys = d.prepare(`
          SELECT COUNT(*) as c FROM autonomy_audit
          WHERE action_type = 'skill_deploy' AND approved = 1
          AND created_at > datetime('now', '-1 day')
        `).get();
        if (todayDeploys.c >= LIMITS.max_auto_deploys_per_day) {
          this._audit(actionType, module, description, risk, false, true, 'daily deploy limit reached');
          return { blocked: true, reason: `daily auto-deploy limit (${LIMITS.max_auto_deploys_per_day}) reached` };
        }
      } catch {}
    }

    if (actionType === 'task_decompose' && metadata?.subtaskCount > LIMITS.max_subtasks_per_plan) {
      this._audit(actionType, module, description, risk, false, true, 'too many subtasks');
      return { blocked: true, reason: `subtask count ${metadata.subtaskCount} exceeds limit ${LIMITS.max_subtasks_per_plan}` };
    }

    // Allowed
    this._audit(actionType, module, description, risk, true, false, null);
    return { allowed: true };
  }

  /**
   * Get audit trail
   */
  getAudit({ limit, module, actionType } = {}) {
    const d = db.getDb();
    let sql = 'SELECT * FROM autonomy_audit WHERE 1=1';
    const params = [];
    if (module) { sql += ' AND module = ?'; params.push(module); }
    if (actionType) { sql += ' AND action_type = ?'; params.push(actionType); }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit || 50);
    return d.prepare(sql).all(...params);
  }

  /**
   * Get current limits
   */
  getLimits() {
    return { ...LIMITS };
  }

  /**
   * Get stats summary
   */
  getStats() {
    const d = db.getDb();
    try {
      const today = d.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN approved = 1 THEN 1 ELSE 0 END) as approved,
               SUM(CASE WHEN blocked = 1 THEN 1 ELSE 0 END) as blocked
        FROM autonomy_audit
        WHERE created_at > datetime('now', '-1 day')
      `).get();
      return { ...today, limits: LIMITS };
    } catch {
      return { total: 0, approved: 0, blocked: 0, limits: LIMITS };
    }
  }

  // === Private ===

  _audit(actionType, module, description, riskLevel, approved, blocked, blockReason) {
    const d = db.getDb();
    try {
      d.prepare(`
        INSERT INTO autonomy_audit (action_type, module, description, risk_level, approved, blocked, block_reason, actor)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'autonomy-guard')
      `).run(actionType, module, description, riskLevel, approved ? 1 : 0, blocked ? 1 : 0, blockReason);
    } catch { /* ignore */ }
  }
}

module.exports = { AutonomyGuard };
