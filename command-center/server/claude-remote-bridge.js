/**
 * Claude Remote Bridge (F Architecture Phase 5)
 *
 * Dispatches tasks to Claude Code via `claude -p` CLI (headless mode).
 * Tracks sessions and tasks in SQLite. Streams output for real-time monitoring.
 *
 * Design: Claude + Codex merged (simple single-module + 5 guardrails)
 * - child_process.spawn for execution
 * - PID tracking, exit code capture, stderr tail
 * - Startup reconciliation for stale tasks
 * - Platform-specific cancel (Windows taskkill /T)
 * - Output size cap + structured parse fallback
 */
'use strict';

const { spawn } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');
const { EVENT_TYPES, createEvent } = require('./events');

// Config
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';
const MAX_CONCURRENT = parseInt(process.env.CLAUDE_MAX_CONCURRENT) || 3;
const DEFAULT_TIMEOUT_SEC = 600; // 10 minutes
const MAX_OUTPUT_BYTES = 1024 * 1024; // 1MB per task
const STDERR_TAIL_LINES = 20;
const CWD = process.env.CLAUDE_CWD || 'K:/PortableApps/genai';

// Agent type -> allowed tools mapping
const AGENT_CAPABILITIES = {
  'code-agent': ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'Agent'],
  'research-agent': ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'Agent'],
  'review-agent': ['Read', 'Glob', 'Grep', 'Bash'],
  'general': ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash']
};

class ClaudeRemoteBridge {
  constructor({ broadcaster }) {
    this.broadcaster = broadcaster;
    this.activeTasks = new Map(); // taskId -> { process, session }
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Startup: reconcile stale in-progress tasks from previous runs
   */
  reconcile() {
    const d = db.getDb();
    const stale = d.prepare(`
      SELECT id, pid FROM claude_tasks WHERE status IN ('running', 'pending')
    `).all();

    for (const task of stale) {
      // Check if PID is still alive
      if (task.pid && this._isPidAlive(task.pid)) {
        // Reattach would be complex; mark stale for manual review
        d.prepare(`
          UPDATE claude_tasks SET status = 'failed_stale', status_reason = 'observer restarted', completed_at = datetime('now')
          WHERE id = ?
        `).run(task.id);
      } else {
        d.prepare(`
          UPDATE claude_tasks SET status = 'failed_stale', status_reason = 'process gone after restart', completed_at = datetime('now')
          WHERE id = ?
        `).run(task.id);
      }
    }

    if (stale.length > 0) {
      console.log(`[Bridge] Reconciled ${stale.length} stale tasks`);
    }
  }

  /**
   * Dispatch a task to Claude Code
   */
  dispatch({ prompt, agentType, commandId, timeoutSec, cwd }) {
    const d = db.getDb();

    // Guard: max concurrent
    if (this.activeTasks.size >= MAX_CONCURRENT) {
      return { ok: false, error: `max concurrent tasks reached (${MAX_CONCURRENT})` };
    }

    const taskId = `ctask-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const agent = agentType || 'general';
    const tools = AGENT_CAPABILITIES[agent] || AGENT_CAPABILITIES.general;
    const timeout = timeoutSec || DEFAULT_TIMEOUT_SEC;

    // Create task record
    d.prepare(`
      INSERT INTO claude_tasks (id, command_id, prompt, agent_type, allowed_tools, status, timeout_seconds)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(taskId, commandId || null, prompt, agent, JSON.stringify(tools), timeout);

    // Spawn Claude process
    const args = [
      '-p', prompt,
      '--output-format', 'stream-json',
      '--allowedTools', tools.join(','),
      '--verbose'
    ];

    const taskCwd = cwd || CWD;
    const proc = spawn(CLAUDE_BIN, args, {
      cwd: taskCwd,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: this.isWindows,
      windowsHide: true
    });

    const pid = proc.pid;

    // Update task with PID
    d.prepare(`
      UPDATE claude_tasks SET status = 'running', pid = ?, started_at = datetime('now'), heartbeat_at = datetime('now')
      WHERE id = ?
    `).run(pid, taskId);

    // Track session
    const sessionId = `csess-${pid}`;
    d.prepare(`
      INSERT OR REPLACE INTO claude_sessions (id, name, pid, status, capabilities, cwd)
      VALUES (?, ?, ?, 'busy', ?, ?)
    `).run(sessionId, `claude-${agent}`, pid, JSON.stringify(tools), taskCwd);

    d.prepare(`UPDATE claude_tasks SET session_id = ? WHERE id = ?`).run(sessionId, taskId);

    // Collect output
    let stdout = '';
    let stderr = '';
    let outputBytes = 0;
    let lastResult = null;

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      outputBytes += text.length;

      if (outputBytes <= MAX_OUTPUT_BYTES) {
        stdout += text;
      }

      // Parse stream-json lines for progress
      const lines = text.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          if (msg.result) lastResult = msg.result;
          if (msg.type === 'tool_use') {
            this.broadcaster.broadcast('claude.task.tool_use', {
              taskId, tool: msg.tool, agentType: agent
            });
          }
        } catch { /* partial JSON line */ }
      }

      // Heartbeat update
      d.prepare(`UPDATE claude_tasks SET heartbeat_at = datetime('now'), output_size_bytes = ? WHERE id = ?`)
        .run(outputBytes, taskId);
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      // Keep only tail
      const lines = stderr.split('\n');
      if (lines.length > STDERR_TAIL_LINES) {
        stderr = lines.slice(-STDERR_TAIL_LINES).join('\n');
      }
    });

    // Timeout handler
    const timeoutTimer = setTimeout(() => {
      this._killProcess(proc, pid);
      d.prepare(`
        UPDATE claude_tasks SET status = 'failed', status_reason = 'timeout', stderr_tail = ?, completed_at = datetime('now')
        WHERE id = ?
      `).run(`Timeout after ${timeout}s`, taskId);
      this.activeTasks.delete(taskId);
      this._markSessionIdle(sessionId);
      this.broadcaster.broadcast('claude.task.timeout', { taskId, timeout });
    }, timeout * 1000);

    proc.on('close', (code) => {
      clearTimeout(timeoutTimer);
      this.activeTasks.delete(taskId);

      const success = code === 0;
      const status = success ? 'completed' : 'failed';
      const result = lastResult || (success ? stdout.slice(-2000) : null);

      d.prepare(`
        UPDATE claude_tasks
        SET status = ?, exit_code = ?, result = ?, stderr_tail = ?,
            output_size_bytes = ?, status_reason = ?, completed_at = datetime('now')
        WHERE id = ?
      `).run(status, code, result ? (typeof result === 'string' ? result : JSON.stringify(result)) : null,
             stderr.slice(-1000), outputBytes,
             success ? 'completed normally' : `exit code ${code}`, taskId);

      this._markSessionIdle(sessionId);

      this.broadcaster.broadcast(success ? 'claude.task.completed' : 'claude.task.failed', {
        taskId, exitCode: code, agentType: agent, outputBytes
      });

      db.recordEvent(success ? 'claude_task_complete' : 'claude_task_failed', 'bridge', {
        taskId, exitCode: code, agent, outputBytes, durationMs: Date.now() - proc.startTime
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutTimer);
      this.activeTasks.delete(taskId);

      d.prepare(`
        UPDATE claude_tasks SET status = 'failed', status_reason = ?, stderr_tail = ?, completed_at = datetime('now')
        WHERE id = ?
      `).run(`spawn error: ${err.message}`, err.message, taskId);

      this._markSessionIdle(sessionId);
    });

    proc.startTime = Date.now();
    this.activeTasks.set(taskId, { process: proc, sessionId, timeoutTimer });

    this.broadcaster.broadcast('claude.task.started', { taskId, agent, pid });

    return { ok: true, taskId, sessionId, pid };
  }

  /**
   * Cancel a running task
   */
  cancel(taskId, reason) {
    const d = db.getDb();
    const active = this.activeTasks.get(taskId);

    if (active) {
      clearTimeout(active.timeoutTimer);
      this._killProcess(active.process, active.process.pid);
      this.activeTasks.delete(taskId);
      this._markSessionIdle(active.sessionId);
    }

    d.prepare(`
      UPDATE claude_tasks SET status = 'cancelled', status_reason = ?, completed_at = datetime('now')
      WHERE id = ? AND status IN ('pending', 'running')
    `).run(reason || 'user cancelled', taskId);

    this.broadcaster.broadcast('claude.task.cancelled', { taskId, reason });
    return { ok: true };
  }

  /**
   * Get active sessions
   */
  getSessions() {
    const d = db.getDb();
    return d.prepare(`SELECT * FROM claude_sessions ORDER BY started_at DESC LIMIT 20`).all();
  }

  /**
   * Get tasks with filters
   */
  getTasks({ status, limit } = {}) {
    const d = db.getDb();
    let sql = 'SELECT * FROM claude_tasks WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit || 20);
    return d.prepare(sql).all(...params);
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      activeTasks: this.activeTasks.size,
      maxConcurrent: MAX_CONCURRENT,
      claudeBin: CLAUDE_BIN,
      cwd: CWD,
      isWindows: this.isWindows
    };
  }

  // === Private ===

  _killProcess(proc, pid) {
    try {
      if (this.isWindows) {
        spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { shell: true, stdio: 'ignore' });
      } else {
        process.kill(-pid, 'SIGTERM');
        setTimeout(() => { try { process.kill(-pid, 'SIGKILL'); } catch {} }, 3000);
      }
    } catch { /* process may already be dead */ }
  }

  _isPidAlive(pid) {
    try { process.kill(pid, 0); return true; }
    catch { return false; }
  }

  _markSessionIdle(sessionId) {
    const d = db.getDb();
    d.prepare(`UPDATE claude_sessions SET status = 'idle', last_heartbeat_at = datetime('now') WHERE id = ?`)
      .run(sessionId);
  }
}

module.exports = { ClaudeRemoteBridge };
