/**
 * NEXUS Checkpoint Store - SQLite-backed state persistence
 *
 * Provides LangGraph-style checkpointing:
 * - Auto-save state after each graph node execution
 * - Time-travel: roll back to any previous checkpoint
 * - Branching: fork state for alternative path exploration
 *
 * @module nexus/agent-framework/checkpoint-store
 */

'use strict';

const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'checkpoints.db');
const FALLBACK_PATH = path.join(__dirname, '..', 'data', 'checkpoints.json');

class CheckpointStore {
  constructor(options = {}) {
    this._dbPath = options.dbPath || DB_PATH;
    this._db = null;
    this._usingSqlite = false;
    this._fallbackData = { checkpoints: [], branches: [] };
    this._init();
  }

  _init() {
    // Try SQLite first, fall back to JSON
    try {
      const Database = require('better-sqlite3');
      const dir = path.dirname(this._dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      this._db = new Database(this._dbPath);
      this._db.pragma('journal_mode = WAL');
      this._db.exec(`
        CREATE TABLE IF NOT EXISTS checkpoints (
          id TEXT PRIMARY KEY,
          graph_id TEXT NOT NULL,
          run_id TEXT NOT NULL,
          node_id TEXT NOT NULL,
          step INTEGER NOT NULL,
          state TEXT NOT NULL,
          parent_id TEXT,
          branch TEXT DEFAULT 'main',
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_cp_run ON checkpoints(run_id, step);
        CREATE INDEX IF NOT EXISTS idx_cp_branch ON checkpoints(branch);
      `);
      this._usingSqlite = true;
    } catch {
      // SQLite not available - use JSON fallback
      this._usingSqlite = false;
      this._loadFallback();
    }
  }

  _loadFallback() {
    try {
      if (fs.existsSync(FALLBACK_PATH)) {
        this._fallbackData = JSON.parse(fs.readFileSync(FALLBACK_PATH, 'utf8'));
      }
    } catch {
      this._fallbackData = { checkpoints: [], branches: [] };
    }
  }

  _saveFallback() {
    try {
      const dir = path.dirname(FALLBACK_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      // Keep only last 200 checkpoints to prevent unbounded growth
      if (this._fallbackData.checkpoints.length > 200) {
        this._fallbackData.checkpoints = this._fallbackData.checkpoints.slice(-200);
      }
      fs.writeFileSync(FALLBACK_PATH, JSON.stringify(this._fallbackData, null, 2));
    } catch {
      // Non-fatal
    }
  }

  /**
   * Save a checkpoint after node execution
   * @param {Object} params
   * @param {string} params.graphId - Graph definition ID
   * @param {string} params.runId - Execution run ID
   * @param {string} params.nodeId - Current node ID
   * @param {number} params.step - Step number
   * @param {Object} params.state - Full state snapshot
   * @param {string} [params.parentId] - Previous checkpoint ID
   * @param {string} [params.branch] - Branch name (default: 'main')
   * @returns {{id: string, saved: boolean}}
   */
  save({ graphId, runId, nodeId, step, state, parentId, branch }) {
    const id = `cp-${runId}-${step}-${Date.now().toString(36)}`;
    const branchName = branch || 'main';
    const createdAt = Date.now();

    if (this._usingSqlite) {
      try {
        this._db.prepare(`
          INSERT INTO checkpoints (id, graph_id, run_id, node_id, step, state, parent_id, branch, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, graphId, runId, nodeId, step, JSON.stringify(state), parentId || null, branchName, createdAt);
        return { id, saved: true };
      } catch (e) {
        return { id, saved: false, error: e.message };
      }
    }

    // JSON fallback
    this._fallbackData.checkpoints.push({
      id, graphId, runId, nodeId, step,
      state, parentId: parentId || null,
      branch: branchName, createdAt
    });
    this._saveFallback();
    return { id, saved: true };
  }

  /**
   * Load a specific checkpoint
   * @param {string} checkpointId
   * @returns {Object|null}
   */
  load(checkpointId) {
    if (this._usingSqlite) {
      const row = this._db.prepare('SELECT * FROM checkpoints WHERE id = ?').get(checkpointId);
      if (!row) return null;
      return { ...row, state: JSON.parse(row.state) };
    }
    const cp = this._fallbackData.checkpoints.find(c => c.id === checkpointId);
    return cp || null;
  }

  /**
   * Get the latest checkpoint for a run
   * @param {string} runId
   * @param {string} [branch='main']
   * @returns {Object|null}
   */
  getLatest(runId, branch = 'main') {
    if (this._usingSqlite) {
      const row = this._db.prepare(
        'SELECT * FROM checkpoints WHERE run_id = ? AND branch = ? ORDER BY step DESC LIMIT 1'
      ).get(runId, branch);
      if (!row) return null;
      return { ...row, state: JSON.parse(row.state) };
    }
    const matches = this._fallbackData.checkpoints
      .filter(c => c.runId === runId && c.branch === branch)
      .sort((a, b) => b.step - a.step);
    return matches[0] || null;
  }

  /**
   * List all checkpoints for a run (time-travel view)
   * @param {string} runId
   * @returns {Array<{id, nodeId, step, branch, createdAt}>}
   */
  listForRun(runId) {
    if (this._usingSqlite) {
      return this._db.prepare(
        'SELECT id, node_id as nodeId, step, branch, created_at as createdAt FROM checkpoints WHERE run_id = ? ORDER BY step'
      ).all(runId);
    }
    return this._fallbackData.checkpoints
      .filter(c => c.runId === runId)
      .map(c => ({ id: c.id, nodeId: c.nodeId, step: c.step, branch: c.branch, createdAt: c.createdAt }))
      .sort((a, b) => a.step - b.step);
  }

  /**
   * Create a branch from a checkpoint (for alternative path exploration)
   * @param {string} checkpointId - Source checkpoint
   * @param {string} branchName - New branch name
   * @returns {{branched: boolean, checkpointId: string}}
   */
  branch(checkpointId, branchName) {
    const source = this.load(checkpointId);
    if (!source) return { branched: false, error: 'Source checkpoint not found' };

    const result = this.save({
      graphId: source.graphId || source.graph_id,
      runId: source.runId || source.run_id,
      nodeId: source.nodeId || source.node_id,
      step: source.step,
      state: source.state,
      parentId: checkpointId,
      branch: branchName
    });

    return { branched: true, checkpointId: result.id };
  }

  /**
   * Restore state from a checkpoint (time-travel)
   * @param {string} checkpointId
   * @returns {{restored: boolean, state: Object}}
   */
  restore(checkpointId) {
    const cp = this.load(checkpointId);
    if (!cp) return { restored: false, error: 'Checkpoint not found' };
    return { restored: true, state: cp.state, nodeId: cp.nodeId || cp.node_id, step: cp.step };
  }

  /**
   * Get store statistics
   */
  getStats() {
    if (this._usingSqlite) {
      const total = this._db.prepare('SELECT COUNT(*) as count FROM checkpoints').get().count;
      const runs = this._db.prepare('SELECT COUNT(DISTINCT run_id) as count FROM checkpoints').get().count;
      const branches = this._db.prepare('SELECT COUNT(DISTINCT branch) as count FROM checkpoints').get().count;
      return { backend: 'sqlite', total, runs, branches };
    }
    const runs = new Set(this._fallbackData.checkpoints.map(c => c.runId)).size;
    const branches = new Set(this._fallbackData.checkpoints.map(c => c.branch)).size;
    return {
      backend: 'json',
      totalCheckpoints: this._fallbackData.checkpoints.length,
      runs,
      branches
    };
  }

  /**
   * Close the database connection
   */
  close() {
    if (this._db) {
      try { this._db.close(); } catch {}
    }
  }
}

module.exports = { CheckpointStore };
