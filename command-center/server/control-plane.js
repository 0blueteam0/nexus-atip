/**
 * Control Plane (F Architecture Phase 3)
 *
 * Remote command queue with idempotency, auth, and lifecycle management.
 * Allows Mission Control and external systems to submit commands to Observer.
 *
 * Command types: enqueue_task, schedule_job, request_state, restart_component, update_config
 */
'use strict';

const crypto = require('crypto');
const db = require('./db');
const { EVENT_TYPES } = require('./events');

const ALLOWED_TYPES = new Set([
  'enqueue_task', 'schedule_job', 'request_state',
  'restart_component', 'update_config', 'dispatch_claude_task'
]);

class ControlPlane {
  constructor({ stateMachine, broadcaster, coordinator, scheduler, claudeBridge }) {
    this.stateMachine = stateMachine;
    this.broadcaster = broadcaster;
    this.coordinator = coordinator;
    this.scheduler = scheduler; // set after scheduler init
    this.claudeBridge = claudeBridge; // set after bridge init
    this.authToken = process.env.OBSERVER_AUTH_TOKEN || null;
  }

  /**
   * Express middleware for optional bearer token auth
   */
  authMiddleware() {
    return (req, res, next) => {
      if (!this.authToken) return next(); // auth disabled
      const header = req.headers.authorization;
      if (!header || header !== `Bearer ${this.authToken}`) {
        return res.status(401).json({ error: 'unauthorized' });
      }
      next();
    };
  }

  /**
   * Enqueue a new command with idempotency support
   */
  enqueueCommand(input) {
    const d = db.getDb();
    const { command_type, payload, idempotency_key, priority, target_component, requested_by, source } = input;

    if (!command_type || !ALLOWED_TYPES.has(command_type)) {
      return { ok: false, error: `invalid command_type: ${command_type}` };
    }
    if (!payload) {
      return { ok: false, error: 'payload required' };
    }

    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const payloadHash = crypto.createHash('sha256').update(payloadStr).digest('hex').slice(0, 16);

    // Idempotency check
    if (idempotency_key) {
      const existing = d.prepare(
        'SELECT id, status, command_type, payload_hash, result FROM control_commands WHERE idempotency_key = ?'
      ).get(idempotency_key);

      if (existing) {
        if (existing.payload_hash === payloadHash && existing.command_type === command_type) {
          return { ok: true, id: existing.id, status: existing.status, idempotent_replay: true };
        }
        return { ok: false, error: 'idempotency_key conflict: different payload/type' };
      }
    }

    const id = `cmd-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    d.prepare(`
      INSERT INTO control_commands (id, command_type, idempotency_key, payload_hash, payload, priority, target_component, requested_by, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, command_type, idempotency_key || null, payloadHash, payloadStr,
           priority || 50, target_component || null, requested_by || null, source || 'api');

    this._recordEvent(id, 'created', requested_by || 'api', null);
    this.broadcaster.broadcast(EVENT_TYPES.CONTROL_COMMAND_CREATED, { id, command_type, status: 'pending' });

    return { ok: true, id, status: 'pending' };
  }

  /**
   * Get command queue with filters
   */
  getQueue({ status, type, limit } = {}) {
    const d = db.getDb();
    let sql = 'SELECT * FROM control_commands WHERE 1=1';
    const params = [];

    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (type) { sql += ' AND command_type = ?'; params.push(type); }
    sql += ' ORDER BY priority ASC, created_at ASC LIMIT ?';
    params.push(limit || 50);

    return d.prepare(sql).all(...params);
  }

  /**
   * Claim pending commands for execution (atomic)
   */
  claimPending(workerId, limit = 5) {
    const d = db.getDb();

    const pending = d.prepare(`
      SELECT id FROM control_commands
      WHERE status = 'pending' AND not_before <= datetime('now')
      ORDER BY priority ASC, created_at ASC
      LIMIT ?
    `).all(limit);

    const claimed = [];
    const claimStmt = d.prepare(`
      UPDATE control_commands
      SET status = 'in_progress', attempts = attempts + 1, started_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `);
    const eventStmt = d.prepare(`
      INSERT INTO control_command_events (command_id, event_type, actor, detail)
      VALUES (?, 'claimed', ?, NULL)
    `);

    for (const { id } of pending) {
      const result = claimStmt.run(id);
      if (result.changes > 0) {
        eventStmt.run(id, workerId);
        const cmd = d.prepare('SELECT * FROM control_commands WHERE id = ?').get(id);
        claimed.push(cmd);
      }
    }

    return claimed;
  }

  /**
   * Execute a claimed command
   */
  executeCommand(command) {
    try {
      const payload = typeof command.payload === 'string' ? JSON.parse(command.payload) : command.payload;
      let result;

      switch (command.command_type) {
        case 'enqueue_task':
          result = this.coordinator.enqueueTask(
            payload.description, payload.priority, payload.preferred_agent
          );
          break;

        case 'schedule_job':
          if (this.scheduler) {
            result = this.scheduler.registerSchedule(payload);
          } else {
            result = { error: 'scheduler not initialized' };
          }
          break;

        case 'request_state':
          result = {
            agents: this.stateMachine.getAll(),
            team: this.coordinator.getStatus(),
            timestamp: Date.now()
          };
          break;

        case 'restart_component':
          // v1: record request only, do not directly restart
          result = { recorded: true, component: payload.component, note: 'manual restart required in v1' };
          this.broadcaster.broadcast(EVENT_TYPES.CONTROL_COMMAND_CREATED, { type: 'restart_request', ...payload });
          break;

        case 'dispatch_claude_task':
          if (this.claudeBridge) {
            result = this.claudeBridge.dispatch({
              prompt: payload.prompt,
              agentType: payload.agent_type,
              commandId: command.id,
              timeoutSec: payload.timeout_seconds,
              cwd: payload.cwd
            });
            // Claude tasks complete asynchronously - don't mark command completed here
            if (result.ok) return { ok: true, result, async: true };
          } else {
            result = { error: 'claude bridge not initialized' };
          }
          break;

        case 'update_config':
          // v1: record proposal only
          result = { recorded: true, config: payload, note: 'apply via approval path' };
          this.broadcaster.broadcast(EVENT_TYPES.CONTROL_COMMAND_CREATED, { type: 'config_proposal', ...payload });
          break;

        default:
          return { ok: false, error: `unhandled type: ${command.command_type}` };
      }

      this.completeCommand(command.id, result, 'scheduler');
      return { ok: true, result };
    } catch (err) {
      this.failCommand(command.id, err.message, true, 'scheduler');
      return { ok: false, error: err.message };
    }
  }

  /**
   * Mark command as completed
   */
  completeCommand(commandId, result, actor) {
    const d = db.getDb();
    d.prepare(`
      UPDATE control_commands
      SET status = 'completed', result = ?, completed_at = datetime('now'), acked_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(typeof result === 'string' ? result : JSON.stringify(result), commandId);
    this._recordEvent(commandId, 'completed', actor, null);
  }

  /**
   * Mark command as failed with optional retry
   */
  failCommand(commandId, error, retryable, actor) {
    const d = db.getDb();
    const cmd = d.prepare('SELECT attempts, max_attempts FROM control_commands WHERE id = ?').get(commandId);

    if (retryable && cmd && cmd.attempts < cmd.max_attempts) {
      // Retry with exponential backoff
      const backoffSec = Math.min(300, 30 * Math.pow(2, cmd.attempts));
      d.prepare(`
        UPDATE control_commands
        SET status = 'pending', last_error = ?,
            not_before = datetime('now', '+' || ? || ' seconds'),
            updated_at = datetime('now')
        WHERE id = ?
      `).run(error, backoffSec, commandId);
      this._recordEvent(commandId, 'retry_scheduled', actor, `backoff=${backoffSec}s`);
    } else {
      d.prepare(`
        UPDATE control_commands
        SET status = 'failed', last_error = ?, completed_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(error, commandId);
      this._recordEvent(commandId, 'failed', actor, error);
    }
  }

  /**
   * Cancel a command
   */
  cancelCommand(commandId, reason, actor) {
    const d = db.getDb();
    d.prepare(`
      UPDATE control_commands
      SET status = 'cancelled', last_error = ?, updated_at = datetime('now')
      WHERE id = ? AND status IN ('pending', 'in_progress')
    `).run(reason || 'cancelled', commandId);
    this._recordEvent(commandId, 'cancelled', actor, reason);
  }

  /**
   * Queue statistics
   */
  getStats() {
    const d = db.getDb();
    try {
      const byStatus = d.prepare(`
        SELECT status, COUNT(*) as count FROM control_commands GROUP BY status
      `).all();
      const byType = d.prepare(`
        SELECT command_type, COUNT(*) as count FROM control_commands GROUP BY command_type
      `).all();
      const oldest = d.prepare(`
        SELECT MIN(created_at) as oldest_pending FROM control_commands WHERE status = 'pending'
      `).get();
      const retryCount = d.prepare(`
        SELECT COUNT(*) as count FROM control_commands WHERE attempts > 1
      `).get();

      return { byStatus, byType, oldestPending: oldest?.oldest_pending, retryCount: retryCount?.count || 0 };
    } catch {
      return { byStatus: [], byType: [], oldestPending: null, retryCount: 0 };
    }
  }

  _recordEvent(commandId, eventType, actor, detail) {
    const d = db.getDb();
    try {
      d.prepare(`
        INSERT INTO control_command_events (command_id, event_type, actor, detail)
        VALUES (?, ?, ?, ?)
      `).run(commandId, eventType, actor || null, detail || null);
    } catch { /* ignore */ }
  }
}

module.exports = { ControlPlane };
