/**
 * Task Decomposer (F Architecture Phase 6)
 *
 * Decomposes complex tasks into subtask DAGs and dispatches via Claude Remote Bridge.
 * Tracks execution progress and handles dependency ordering.
 */
'use strict';

const crypto = require('crypto');
const db = require('./db');

class TaskDecomposer {
  constructor({ claudeBridge, broadcaster, autonomyGuard }) {
    this.claudeBridge = claudeBridge;
    this.broadcaster = broadcaster;
    this.autonomyGuard = autonomyGuard;
  }

  /**
   * Create a decomposition plan from a task description
   * subtasks: [{ description, agentType, dependsOn: [index] }]
   */
  createPlan({ description, subtasks, parentTaskId }) {
    const d = db.getDb();

    if (!subtasks || !Array.isArray(subtasks) || subtasks.length === 0) {
      return { ok: false, error: 'subtasks array required' };
    }

    // Validate DAG (no circular dependencies)
    if (!this._validateDAG(subtasks)) {
      return { ok: false, error: 'circular dependency detected in subtasks' };
    }

    // Autonomy guard
    if (this.autonomyGuard) {
      const check = this.autonomyGuard.checkAction({
        actionType: 'task_decompose',
        module: 'task-decomposer',
        description: `Decompose: ${description} into ${subtasks.length} subtasks`,
        riskLevel: subtasks.length > 5 ? 'medium' : 'low'
      });
      if (check.blocked) return { ok: false, error: check.reason };
    }

    const planId = `plan-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // Build DAG edges
    const edges = [];
    subtasks.forEach((st, i) => {
      if (st.dependsOn) {
        for (const dep of st.dependsOn) {
          edges.push({ from: dep, to: i });
        }
      }
    });

    d.prepare(`
      INSERT INTO decomposition_plans (id, parent_task_id, description, subtasks, dag_edges, total_subtasks)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(planId, parentTaskId || null, description, JSON.stringify(subtasks),
           JSON.stringify(edges), subtasks.length);

    // Create run records for each subtask
    const insertRun = d.prepare(`
      INSERT INTO decomposition_runs (id, plan_id, subtask_index, subtask_description, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);

    subtasks.forEach((st, i) => {
      const runId = `drun-${planId}-${i}`;
      insertRun.run(runId, planId, i, st.description);
    });

    return { ok: true, planId, subtaskCount: subtasks.length, edges };
  }

  /**
   * Execute a decomposition plan (dispatch ready subtasks)
   */
  executePlan(planId) {
    const d = db.getDb();
    const plan = d.prepare('SELECT * FROM decomposition_plans WHERE id = ?').get(planId);
    if (!plan) return { ok: false, error: 'plan not found' };

    const subtasks = JSON.parse(plan.subtasks);
    const edges = JSON.parse(plan.dag_edges || '[]');
    const runs = d.prepare('SELECT * FROM decomposition_runs WHERE plan_id = ? ORDER BY subtask_index').all(planId);

    // Update plan status
    d.prepare(`UPDATE decomposition_plans SET status = 'running' WHERE id = ?`).run(planId);

    // Find ready subtasks (all dependencies completed)
    const dispatched = [];
    for (const run of runs) {
      if (run.status !== 'pending') continue;

      const deps = edges.filter(e => e.to === run.subtask_index).map(e => e.from);
      const allDepsComplete = deps.every(depIdx => {
        const depRun = runs.find(r => r.subtask_index === depIdx);
        return depRun && depRun.status === 'completed';
      });

      if (allDepsComplete) {
        const st = subtasks[run.subtask_index];
        const result = this.claudeBridge.dispatch({
          prompt: st.description,
          agentType: st.agentType || 'general',
          commandId: null,
          timeoutSec: st.timeout || 300
        });

        if (result.ok) {
          d.prepare(`
            UPDATE decomposition_runs
            SET status = 'running', claude_task_id = ?, started_at = datetime('now')
            WHERE id = ?
          `).run(result.taskId, run.id);
          dispatched.push({ subtaskIndex: run.subtask_index, taskId: result.taskId });
        }
      }
    }

    this.broadcaster.broadcast('decomposer.plan.executing', { planId, dispatched: dispatched.length });
    return { ok: true, dispatched };
  }

  /**
   * Update subtask status (called when claude task completes)
   */
  updateSubtaskStatus(claudeTaskId, status, result) {
    const d = db.getDb();
    const run = d.prepare('SELECT * FROM decomposition_runs WHERE claude_task_id = ?').get(claudeTaskId);
    if (!run) return;

    d.prepare(`
      UPDATE decomposition_runs SET status = ?, result = ?, ended_at = datetime('now'),
        duration_ms = CAST((julianday('now') - julianday(started_at)) * 86400000 AS INTEGER)
      WHERE id = ?
    `).run(status, result ? JSON.stringify(result) : null, run.id);

    // Check if plan is fully complete
    const plan = d.prepare('SELECT * FROM decomposition_plans WHERE id = ?').get(run.plan_id);
    const allRuns = d.prepare('SELECT status FROM decomposition_runs WHERE plan_id = ?').all(run.plan_id);
    const completedCount = allRuns.filter(r => r.status === 'completed').length;
    const failedCount = allRuns.filter(r => r.status === 'failed').length;

    d.prepare(`UPDATE decomposition_plans SET completed_subtasks = ? WHERE id = ?`)
      .run(completedCount, run.plan_id);

    if (completedCount + failedCount >= allRuns.length) {
      const planStatus = failedCount > 0 ? 'failed' : 'completed';
      d.prepare(`UPDATE decomposition_plans SET status = ?, completed_at = datetime('now') WHERE id = ?`)
        .run(planStatus, run.plan_id);
      this.broadcaster.broadcast('decomposer.plan.completed', {
        planId: run.plan_id, status: planStatus, completed: completedCount, failed: failedCount
      });
    } else if (status === 'completed') {
      // Dispatch next ready subtasks
      this.executePlan(run.plan_id);
    }
  }

  /**
   * Get plans with filters
   */
  getPlans({ status, limit } = {}) {
    const d = db.getDb();
    let sql = 'SELECT * FROM decomposition_plans WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit || 20);
    return d.prepare(sql).all(...params);
  }

  /**
   * Get runs for a plan
   */
  getPlanRuns(planId) {
    const d = db.getDb();
    return d.prepare('SELECT * FROM decomposition_runs WHERE plan_id = ? ORDER BY subtask_index').all(planId);
  }

  // === Private ===

  _validateDAG(subtasks) {
    // Topological sort to detect cycles
    const n = subtasks.length;
    const adj = Array.from({ length: n }, () => []);
    const inDegree = new Array(n).fill(0);

    subtasks.forEach((st, i) => {
      if (st.dependsOn) {
        for (const dep of st.dependsOn) {
          if (dep < 0 || dep >= n || dep === i) return false;
          adj[dep].push(i);
          inDegree[i]++;
        }
      }
    });

    const queue = [];
    for (let i = 0; i < n; i++) {
      if (inDegree[i] === 0) queue.push(i);
    }

    let processed = 0;
    while (queue.length > 0) {
      const node = queue.shift();
      processed++;
      for (const next of adj[node]) {
        inDegree[next]--;
        if (inDegree[next] === 0) queue.push(next);
      }
    }

    return processed === n;
  }
}

module.exports = { TaskDecomposer };
