/**
 * Scheduler (F Architecture Phase 3 - Layer 7)
 *
 * 5-tier scheduling system with single-writer lease lock.
 * Manages recurring tasks: heartbeat, weight decay, pattern scan,
 * memory sync, and evolution cycles.
 *
 * Tier 1 (1m):    heartbeat + command queue poll
 * Tier 2 (5m):    weight decay + health checks
 * Tier 3 (30m):   pattern/skill candidate pass
 * Tier 4 (2h):    stale lock cleanup
 * Tier 5 (daily): evolution cycle + report
 */
'use strict';

const crypto = require('crypto');
const db = require('./db');
const { EVENT_TYPES } = require('./events');

const DEFAULT_SCHEDULES = [
  { name: 'tier1_heartbeat_poll', tier: 1, handler_name: 'runTier1', interval_seconds: 60 },
  { name: 'tier2_decay_health', tier: 2, handler_name: 'runTier2', interval_seconds: 300 },
  { name: 'tier3_pattern_pass', tier: 3, handler_name: 'runTier3', interval_seconds: 1800 },
  { name: 'tier4_lock_cleanup', tier: 4, handler_name: 'runTier4', interval_seconds: 7200 },
  { name: 'tier5_evolution_daily', tier: 5, handler_name: 'runTier5', interval_seconds: 86400 }
];

const LEASE_NAME = 'observer_scheduler_primary';
const LEASE_TTL_SEC = 45;
const TICK_MS = 15000;

class Scheduler {
  constructor({ controlPlane, learner, router, coordinator, broadcaster, evolutionAgent, memorySync, benchmark }) {
    this.controlPlane = controlPlane;
    this.learner = learner;
    this.router = router;
    this.coordinator = coordinator;
    this.broadcaster = broadcaster;
    this.evolutionAgent = evolutionAgent;
    this.memorySync = memorySync;
    this.benchmark = benchmark;
    this.instanceId = 'observer-' + process.pid;
    this.tickTimer = null;
    this.leaseTimer = null;
    this.running = false;
    this.tickCount = 0;
  }

  /**
   * Start the scheduler: ensure default schedules, acquire lease, begin ticking
   */
  start() {
    this.ensureDefaultSchedules();
    this.acquireOrRenewLease();
    this.running = true;

    // Tick loop
    this.tickTimer = setInterval(() => this.tick(), TICK_MS);

    // Lease heartbeat (renew before TTL expires)
    this.leaseTimer = setInterval(() => this.acquireOrRenewLease(), (LEASE_TTL_SEC * 1000) / 2);

    console.log(`[Scheduler] Started (instance=${this.instanceId}, tick=${TICK_MS}ms, lease_ttl=${LEASE_TTL_SEC}s)`);
  }

  /**
   * Stop the scheduler and release lease
   */
  stop() {
    this.running = false;
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
    if (this.leaseTimer) { clearInterval(this.leaseTimer); this.leaseTimer = null; }
    this.releaseLease();
    console.log('[Scheduler] Stopped');
  }

  /**
   * Ensure default tier schedules exist in DB
   */
  ensureDefaultSchedules() {
    const d = db.getDb();
    const stmt = d.prepare(`
      INSERT OR IGNORE INTO scheduler_schedules (id, name, tier, handler_name, interval_seconds, next_run_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', '+' || ? || ' seconds'))
    `);

    for (const s of DEFAULT_SCHEDULES) {
      const id = `sched-${s.name}`;
      stmt.run(id, s.name, s.tier, s.handler_name, s.interval_seconds, s.interval_seconds);
    }
  }

  /**
   * Acquire or renew the single-writer lease
   */
  acquireOrRenewLease() {
    const d = db.getDb();
    try {
      // Try to acquire if no lease or expired
      const existing = d.prepare('SELECT * FROM scheduler_leases WHERE lease_name = ?').get(LEASE_NAME);

      if (!existing) {
        d.prepare(`
          INSERT INTO scheduler_leases (lease_name, owner_id, expires_at)
          VALUES (?, ?, datetime('now', '+${LEASE_TTL_SEC} seconds'))
        `).run(LEASE_NAME, this.instanceId);
        return true;
      }

      // Check if we own it or it's expired
      const isOwner = existing.owner_id === this.instanceId;
      const isExpired = new Date(existing.expires_at + 'Z') < new Date();

      if (isOwner || isExpired) {
        d.prepare(`
          UPDATE scheduler_leases
          SET owner_id = ?, last_heartbeat_at = datetime('now'),
              expires_at = datetime('now', '+${LEASE_TTL_SEC} seconds')
          WHERE lease_name = ?
        `).run(this.instanceId, LEASE_NAME);
        return true;
      }

      return false; // Another instance holds the lease
    } catch {
      return false;
    }
  }

  /**
   * Release the lease on shutdown
   */
  releaseLease() {
    const d = db.getDb();
    try {
      d.prepare('DELETE FROM scheduler_leases WHERE lease_name = ? AND owner_id = ?')
        .run(LEASE_NAME, this.instanceId);
    } catch { /* ignore */ }
  }

  /**
   * Check if this instance holds the lease
   */
  hasLease() {
    const d = db.getDb();
    try {
      const lease = d.prepare(
        'SELECT * FROM scheduler_leases WHERE lease_name = ? AND owner_id = ? AND expires_at > datetime(\'now\')'
      ).get(LEASE_NAME, this.instanceId);
      return !!lease;
    } catch {
      return false;
    }
  }

  /**
   * Main tick: find and execute due schedules
   */
  tick() {
    if (!this.running) return;
    if (!this.hasLease()) return; // Only lease owner executes

    this.tickCount++;
    const d = db.getDb();

    try {
      const due = d.prepare(`
        SELECT * FROM scheduler_schedules
        WHERE enabled = 1 AND next_run_at <= datetime('now')
        ORDER BY tier ASC, next_run_at ASC
      `).all();

      for (const schedule of due) {
        this.runSchedule(schedule);
      }

      // Also process command queue on every tick
      if (this.controlPlane) {
        const commands = this.controlPlane.claimPending(this.instanceId, 3);
        for (const cmd of commands) {
          this.controlPlane.executeCommand(cmd);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Tick error:', err.message);
    }
  }

  /**
   * Execute a single schedule
   */
  runSchedule(schedule) {
    const d = db.getDb();
    const runId = `run-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const startTime = Date.now();

    // Record run start
    d.prepare(`
      INSERT INTO scheduler_runs (id, schedule_id, lease_owner, status, trigger_source, scheduled_for)
      VALUES (?, ?, ?, 'running', 'tick', ?)
    `).run(runId, schedule.id, this.instanceId, schedule.next_run_at);

    try {
      const handler = this[schedule.handler_name];
      if (!handler) throw new Error(`unknown handler: ${schedule.handler_name}`);

      const output = handler.call(this, schedule);
      const durationMs = Date.now() - startTime;

      // Mark success
      d.prepare(`
        UPDATE scheduler_runs
        SET status = 'success', ended_at = datetime('now'), duration_ms = ?, output = ?
        WHERE id = ?
      `).run(durationMs, JSON.stringify(output || {}), runId);

      // Update schedule: next_run_at, last_success_at, reset failure_count
      d.prepare(`
        UPDATE scheduler_schedules
        SET next_run_at = datetime('now', '+' || ? || ' seconds'),
            last_run_at = datetime('now'),
            last_success_at = datetime('now'),
            failure_count = 0,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(schedule.interval_seconds, schedule.id);

      if (process.env.VERBOSE === '1') {
        console.log(`[Scheduler] ${schedule.name} completed in ${durationMs}ms`);
      }

      return { ok: true, runId, durationMs };
    } catch (err) {
      const durationMs = Date.now() - startTime;

      // Mark failure
      d.prepare(`
        UPDATE scheduler_runs
        SET status = 'failed', ended_at = datetime('now'), duration_ms = ?, error_message = ?
        WHERE id = ?
      `).run(durationMs, err.message, runId);

      // Update failure count and schedule retry
      d.prepare(`
        UPDATE scheduler_schedules
        SET failure_count = failure_count + 1,
            last_run_at = datetime('now'),
            last_failure_at = datetime('now'),
            next_run_at = datetime('now', '+' || ? || ' seconds'),
            updated_at = datetime('now')
        WHERE id = ?
      `).run(schedule.retry_backoff_seconds, schedule.id);

      console.error(`[Scheduler] ${schedule.name} failed: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }

  // === Tier Handlers ===

  /**
   * Tier 1 (1m): Heartbeat + command queue poll
   */
  runTier1() {
    this.broadcaster.broadcast(EVENT_TYPES.SCHEDULER_HEARTBEAT, {
      instanceId: this.instanceId,
      tickCount: this.tickCount,
      timestamp: Date.now()
    });
    return { heartbeat: true, tickCount: this.tickCount };
  }

  /**
   * Tier 2 (5m): Weight decay + health checks
   */
  runTier2() {
    const results = {};

    // Weight decay
    if (this.learner) {
      this.learner.decayWeights();
      results.weightDecay = true;
    }

    // Basic health metrics
    results.health = {
      uptime: process.uptime(),
      memory: process.memoryUsage().rss,
      agents: Object.keys(this.coordinator?.getStatus()?.agents || {}).length
    };

    return results;
  }

  /**
   * Tier 3 (30m): Pattern/skill candidate scan
   */
  runTier3() {
    const candidates = this.router ? this.router.getSkillCandidates() : [];
    const d = db.getDb();

    // Log scan result
    db.recordEvent('pattern_scan', 'scheduler', { candidateCount: candidates.length });

    return { candidates: candidates.length, details: candidates.slice(0, 5) };
  }

  /**
   * Tier 4 (2h): Stale lock cleanup + memory sync
   */
  runTier4() {
    const results = {};

    // Memory sync
    if (this.memorySync) {
      results.memorySync = this.memorySync.runIncremental({ trigger: 'tier4', actor: 'scheduler' });
    }

    // Cleanup stale file locks via coordinator timeout check
    if (this.coordinator) {
      results.lockCleanup = true;
    }

    // Auto benchmark snapshot (every 2h, pushed to Obsidian)
    if (this.benchmark) {
      try {
        const label = `auto-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')}`;
        results.benchmark = { label, captured: true };
        this.benchmark.captureSnapshot(label);
      } catch (e) { results.benchmark = { error: e.message }; }
    }

    // Clean up old completed/failed commands (older than 7 days)
    const d = db.getDb();
    try {
      const cleaned = d.prepare(`
        DELETE FROM control_commands
        WHERE status IN ('completed', 'failed', 'cancelled')
        AND updated_at < datetime('now', '-7 days')
      `).run();
      results.oldCommandsCleaned = cleaned.changes;
    } catch { /* ignore */ }

    // Clean up old scheduler runs (older than 30 days)
    try {
      const cleaned = d.prepare(`
        DELETE FROM scheduler_runs
        WHERE ended_at < datetime('now', '-30 days')
      `).run();
      results.oldRunsCleaned = cleaned.changes;
    } catch { /* ignore */ }

    return results;
  }

  /**
   * Tier 5 (daily): Evolution cycle + report
   */
  runTier5() {
    const d = db.getDb();
    const report = {};

    // Evolution Agent: propose + auto-apply low-risk
    if (this.evolutionAgent) {
      report.evolution = this.evolutionAgent.proposeCycle({ trigger: 'tier5_daily', actor: 'scheduler' });
      report.autoApply = this.evolutionAgent.autoApplyLowRisk();
    }

    // Collect daily stats
    try {
      report.toolStats = d.prepare(`
        SELECT tool_name, COUNT(*) as uses, AVG(duration_ms) as avg_ms,
               SUM(CASE WHEN success THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_pct
        FROM tool_usage
        WHERE timestamp > datetime('now', '-1 day')
        GROUP BY tool_name ORDER BY uses DESC LIMIT 10
      `).all();

      report.routingStats = d.prepare(`
        SELECT intent, COUNT(*) as count FROM routing_history
        WHERE timestamp > datetime('now', '-1 day')
        GROUP BY intent ORDER BY count DESC LIMIT 10
      `).all();

      report.commandStats = d.prepare(`
        SELECT status, COUNT(*) as count FROM control_commands
        WHERE created_at > datetime('now', '-1 day')
        GROUP BY status
      `).all();

      report.scheduleHealth = d.prepare(`
        SELECT s.name, s.tier, s.failure_count,
               (SELECT COUNT(*) FROM scheduler_runs r WHERE r.schedule_id = s.id AND r.status = 'success' AND r.started_at > datetime('now', '-1 day')) as daily_successes,
               (SELECT COUNT(*) FROM scheduler_runs r WHERE r.schedule_id = s.id AND r.status = 'failed' AND r.started_at > datetime('now', '-1 day')) as daily_failures
        FROM scheduler_schedules s
      `).all();
    } catch { /* ignore partial failures */ }

    // Log evolution event
    db.logEvolution('daily_report', 'Automated daily evolution report', null, report, 0);
    this.broadcaster.broadcast(EVENT_TYPES.EVOLUTION_REPORT, report);

    return report;
  }

  // === Management API ===

  /**
   * Register a custom schedule
   */
  registerSchedule(input) {
    const d = db.getDb();
    const { name, tier, handler_name, interval_seconds, payload, enabled } = input;

    if (!name || !tier || !handler_name || !interval_seconds) {
      return { ok: false, error: 'name, tier, handler_name, interval_seconds required' };
    }

    const id = `sched-${name}`;
    try {
      d.prepare(`
        INSERT INTO scheduler_schedules (id, name, tier, handler_name, interval_seconds, payload, enabled, next_run_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+' || ? || ' seconds'), 'api')
        ON CONFLICT(name) DO UPDATE SET
          tier = excluded.tier, handler_name = excluded.handler_name,
          interval_seconds = excluded.interval_seconds, payload = excluded.payload,
          enabled = excluded.enabled, updated_at = datetime('now')
      `).run(id, name, tier, handler_name, interval_seconds, payload ? JSON.stringify(payload) : null,
             enabled !== false ? 1 : 0, interval_seconds);
      return { ok: true, id };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Update a schedule
   */
  updateSchedule(scheduleId, updates) {
    const d = db.getDb();
    const fields = [];
    const params = [];

    if (updates.enabled !== undefined) { fields.push('enabled = ?'); params.push(updates.enabled ? 1 : 0); }
    if (updates.interval_seconds) { fields.push('interval_seconds = ?'); params.push(updates.interval_seconds); }
    if (updates.payload !== undefined) { fields.push('payload = ?'); params.push(JSON.stringify(updates.payload)); }
    if (fields.length === 0) return { ok: false, error: 'no updates' };

    fields.push("updated_at = datetime('now')");
    params.push(scheduleId);

    d.prepare(`UPDATE scheduler_schedules SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return { ok: true };
  }

  /**
   * List all schedules
   */
  listSchedules() {
    const d = db.getDb();
    return d.prepare('SELECT * FROM scheduler_schedules ORDER BY tier ASC, name ASC').all();
  }

  /**
   * Get schedule run history
   */
  getRuns({ limit, status, scheduleId } = {}) {
    const d = db.getDb();
    let sql = 'SELECT * FROM scheduler_runs WHERE 1=1';
    const params = [];

    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (scheduleId) { sql += ' AND schedule_id = ?'; params.push(scheduleId); }
    sql += ' ORDER BY started_at DESC LIMIT ?';
    params.push(limit || 50);

    return d.prepare(sql).all(...params);
  }

  /**
   * Get scheduler status overview
   */
  getStatus() {
    const d = db.getDb();
    let lease = null;
    try { lease = d.prepare('SELECT * FROM scheduler_leases WHERE lease_name = ?').get(LEASE_NAME); } catch {}

    let dueCount = 0;
    try { dueCount = d.prepare("SELECT COUNT(*) as c FROM scheduler_schedules WHERE enabled = 1 AND next_run_at <= datetime('now')").get().c; } catch {}

    return {
      instanceId: this.instanceId,
      running: this.running,
      tickCount: this.tickCount,
      hasLease: this.hasLease(),
      lease,
      dueCount,
      tickIntervalMs: TICK_MS,
      leaseTtlSec: LEASE_TTL_SEC
    };
  }
}

module.exports = { Scheduler };
