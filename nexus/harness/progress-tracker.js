/**
 * NEXUS Progress Tracker
 *
 * Machine-readable progress.json management.
 * Tracks task completions, incremental progress, and generates handoffs.
 * Based on Anthropic Harness Engineering dual-phase pattern.
 *
 * @module nexus/harness/progress-tracker
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PROGRESS_PATH = path.join(__dirname, 'progress.json');

class ProgressTracker {
  constructor(options = {}) {
    this.progressPath = options.progressPath || PROGRESS_PATH;
    this.state = this._load();
  }

  /**
   * Record task start
   * @param {Object} task - { id, description, priority }
   */
  startTask(task) {
    const entry = {
      id: task.id || `task-${Date.now()}`,
      description: task.description || '',
      priority: task.priority || 'normal',
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      completedAt: null,
      commits: [],
      notes: []
    };

    this.state.activeTasks.push(entry);
    this.state.lastActivity = new Date().toISOString();
    this._save();
    return entry;
  }

  /**
   * Record task completion
   * @param {string} taskId - Task ID
   * @param {Object} result - { success, commitHash, notes }
   */
  completeTask(taskId, result = {}) {
    const idx = this.state.activeTasks.findIndex(t => t.id === taskId);
    if (idx === -1) return null;

    const task = this.state.activeTasks[idx];
    task.status = result.success !== false ? 'completed' : 'failed';
    task.completedAt = new Date().toISOString();
    if (result.commitHash) task.commits.push(result.commitHash);
    if (result.notes) task.notes.push(result.notes);

    // Move to completed
    this.state.completedTasks.push(task);
    this.state.activeTasks.splice(idx, 1);
    this.state.totalCompleted++;
    this.state.lastActivity = new Date().toISOString();
    this._save();

    return task;
  }

  /**
   * Record a commit against current session
   * @param {string} commitHash
   * @param {string} message
   */
  recordCommit(commitHash, message) {
    this.state.sessionCommits.push({
      hash: commitHash,
      message: message || '',
      timestamp: new Date().toISOString()
    });
    this.state.lastActivity = new Date().toISOString();
    this._save();
  }

  /**
   * Get current progress summary
   * @returns {Object} Progress state
   */
  getProgress() {
    return {
      sessionId: this.state.sessionId,
      activeTasks: this.state.activeTasks.length,
      completedTasks: this.state.totalCompleted,
      sessionCommits: this.state.sessionCommits.length,
      lastActivity: this.state.lastActivity,
      startedAt: this.state.startedAt
    };
  }

  /**
   * Generate HANDOFF data from progress.json
   * (Machine-readable, not ad-hoc)
   * @returns {Object} Handoff data
   */
  generateHandoff() {
    const handoff = {
      generatedAt: new Date().toISOString(),
      generatedFrom: 'progress.json',
      sessionId: this.state.sessionId,
      summary: {
        tasksCompleted: this.state.totalCompleted,
        tasksInProgress: this.state.activeTasks.length,
        commits: this.state.sessionCommits.length
      },
      activeTasks: this.state.activeTasks.map(t => ({
        id: t.id,
        description: t.description,
        priority: t.priority,
        status: t.status,
        startedAt: t.startedAt
      })),
      recentCompleted: this.state.completedTasks.slice(-5).map(t => ({
        id: t.id,
        description: t.description,
        completedAt: t.completedAt
      })),
      recentCommits: this.state.sessionCommits.slice(-5),
      nextPriorities: this._identifyNextPriorities()
    };

    return handoff;
  }

  /**
   * Start a new session (resets active state, preserves history)
   * @param {string} sessionId
   */
  newSession(sessionId) {
    // Archive current session
    if (this.state.activeTasks.length > 0 || this.state.sessionCommits.length > 0) {
      this.state.history.push({
        sessionId: this.state.sessionId,
        startedAt: this.state.startedAt,
        endedAt: new Date().toISOString(),
        tasksCompleted: this.state.totalCompleted,
        commits: this.state.sessionCommits.length
      });
    }

    // Reset for new session
    this.state.sessionId = sessionId || `session-${Date.now()}`;
    this.state.startedAt = new Date().toISOString();
    this.state.activeTasks = [];
    this.state.sessionCommits = [];
    this.state.totalCompleted = 0;
    this.state.lastActivity = new Date().toISOString();
    this._save();
  }

  /**
   * Identify next priorities based on progress
   */
  _identifyNextPriorities() {
    const priorities = [];

    // In-progress tasks are top priority
    for (const t of this.state.activeTasks) {
      priorities.push({
        id: t.id,
        description: t.description,
        reason: 'Currently in progress'
      });
    }

    return priorities;
  }

  _load() {
    try {
      if (fs.existsSync(this.progressPath)) {
        return JSON.parse(fs.readFileSync(this.progressPath, 'utf-8'));
      }
    } catch (e) { /* skip */ }

    return {
      version: '1.0.0',
      sessionId: `session-${Date.now()}`,
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      activeTasks: [],
      completedTasks: [],
      sessionCommits: [],
      totalCompleted: 0,
      history: []
    };
  }

  _save() {
    const dir = path.dirname(this.progressPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.progressPath, JSON.stringify(this.state, null, 2), 'utf-8');
  }
}

module.exports = { ProgressTracker };
