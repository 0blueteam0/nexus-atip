/**
 * Alerts Engine (F Architecture Phase 4)
 *
 * Rule-based alert system for Observer monitoring.
 * Evaluates conditions periodically and emits alert events.
 *
 * Default rules: queue backlog, scheduler failures, lease loss, memory sync failure.
 */
'use strict';

const db = require('./db');
const { EVENT_TYPES, createEvent } = require('./events');

class AlertsEngine {
  constructor({ broadcaster }) {
    this.broadcaster = broadcaster;
    this.rules = [];
    this.activeAlerts = new Map(); // ruleId -> { raised_at, severity, message }
    this.checkInterval = null;

    this._registerDefaultRules();
  }

  start(intervalMs = 30000) {
    this.checkInterval = setInterval(() => this.evaluate(), intervalMs);
    console.log(`[Alerts] Engine started (check every ${intervalMs / 1000}s, ${this.rules.length} rules)`);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Evaluate all rules and raise/clear alerts
   */
  evaluate() {
    for (const rule of this.rules) {
      try {
        const triggered = rule.condition();
        const wasActive = this.activeAlerts.has(rule.id);

        if (triggered && !wasActive) {
          // Raise alert
          const alert = {
            id: rule.id,
            severity: rule.severity,
            title: rule.title,
            message: typeof triggered === 'string' ? triggered : rule.title,
            raised_at: Date.now()
          };
          this.activeAlerts.set(rule.id, alert);
          this.broadcaster.broadcast(EVENT_TYPES.ALERT_RAISED, alert);
          db.recordEvent('alert_raised', 'alerts-engine', alert);
        } else if (!triggered && wasActive) {
          // Clear alert
          const prev = this.activeAlerts.get(rule.id);
          this.activeAlerts.delete(rule.id);
          this.broadcaster.broadcast(EVENT_TYPES.ALERT_CLEARED, {
            id: rule.id, cleared_at: Date.now(), was_active_ms: Date.now() - prev.raised_at
          });
          db.recordEvent('alert_cleared', 'alerts-engine', { id: rule.id });
        }
      } catch {
        // Rule evaluation failure - don't crash the engine
      }
    }
  }

  /**
   * Get all active alerts
   */
  getActive() {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get all registered rules
   */
  getRules() {
    return this.rules.map(r => ({
      id: r.id, title: r.title, severity: r.severity,
      active: this.activeAlerts.has(r.id)
    }));
  }

  /**
   * Add a custom alert rule
   */
  addRule(rule) {
    if (!rule.id || !rule.title || !rule.condition) {
      return { ok: false, error: 'id, title, condition required' };
    }
    this.rules.push(rule);
    return { ok: true, totalRules: this.rules.length };
  }

  /**
   * Manually test a specific rule
   */
  testRule(ruleId) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return { ok: false, error: 'rule not found' };
    try {
      const result = rule.condition();
      return { ok: true, triggered: !!result, detail: result };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // === Default Rules ===

  _registerDefaultRules() {
    const d = () => { try { return db.getDb(); } catch { return null; } };

    // Rule 1: Queue backlog (>20 pending commands for >5 minutes)
    this.rules.push({
      id: 'queue_backlog',
      title: 'Control plane queue backlog detected',
      severity: 'warning',
      condition: () => {
        const dbConn = d();
        if (!dbConn) return false;
        const result = dbConn.prepare(`
          SELECT COUNT(*) as c FROM control_commands
          WHERE status = 'pending' AND created_at < datetime('now', '-5 minutes')
        `).get();
        return result.c > 20 ? `${result.c} commands pending >5m` : false;
      }
    });

    // Rule 2: Scheduler consecutive failures (>=3 failed runs in 10 minutes)
    this.rules.push({
      id: 'scheduler_failures',
      title: 'Scheduler experiencing repeated failures',
      severity: 'critical',
      condition: () => {
        const dbConn = d();
        if (!dbConn) return false;
        const result = dbConn.prepare(`
          SELECT COUNT(*) as c FROM scheduler_runs
          WHERE status = 'failed' AND started_at > datetime('now', '-10 minutes')
        `).get();
        return result.c >= 3 ? `${result.c} failures in 10m` : false;
      }
    });

    // Rule 3: Lease loss (no active lease)
    this.rules.push({
      id: 'lease_lost',
      title: 'Scheduler lease not held',
      severity: 'critical',
      condition: () => {
        const dbConn = d();
        if (!dbConn) return false;
        const lease = dbConn.prepare(`
          SELECT * FROM scheduler_leases
          WHERE lease_name = 'observer_scheduler_primary' AND expires_at > datetime('now')
        `).get();
        return !lease ? 'No active lease' : false;
      }
    });

    // Rule 4: Memory sync consecutive failures
    this.rules.push({
      id: 'memory_sync_failures',
      title: 'Memory sync experiencing failures',
      severity: 'warning',
      condition: () => {
        const dbConn = d();
        if (!dbConn) return false;
        const recent = dbConn.prepare(`
          SELECT success FROM memory_sync_runs ORDER BY started_at DESC LIMIT 2
        `).all();
        if (recent.length < 2) return false;
        return recent.every(r => !r.success) ? 'Last 2 syncs failed' : false;
      }
    });

    // Rule 5: Evolution apply failure rate
    this.rules.push({
      id: 'evolution_apply_failures',
      title: 'Evolution auto-apply experiencing failures',
      severity: 'warning',
      condition: () => {
        const dbConn = d();
        if (!dbConn) return false;
        const result = dbConn.prepare(`
          SELECT COUNT(*) as total,
                 SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failures
          FROM evolution_apply_history
          WHERE created_at > datetime('now', '-24 hours')
        `).get();
        if (result.total < 2) return false;
        const rate = result.failures / result.total;
        return rate > 0.3 ? `${Math.round(rate * 100)}% failure rate` : false;
      }
    });
  }
}

module.exports = { AlertsEngine };
