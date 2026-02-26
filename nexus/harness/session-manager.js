/**
 * NEXUS Session Manager - Harness Layer
 *
 * Implements Anthropic's dual-phase session pattern:
 *   Phase 1: Orientation - Read progress.json, health check, identify priorities
 *   Phase 2: Incremental Progress - 1 task at a time, commit each, update progress
 *
 * HANDOFF is generated FROM progress.json (not written ad-hoc).
 *
 * @module nexus/harness/session-manager
 */

'use strict';

const { ProgressTracker } = require('./progress-tracker');
const { FeatureTracker } = require('./feature-tracker');
const { getEventBus } = require('../core/event-bus');

class SessionManager {
  constructor(options = {}) {
    this.progress = options.progressTracker || new ProgressTracker();
    this.features = options.featureTracker || new FeatureTracker();
    this.bus = getEventBus();
    this.oriented = false;
    this.orientation = null;
  }

  /**
   * Phase 1: Orientation
   * Read progress.json, run health check, identify priorities
   *
   * @returns {Object} Orientation result
   */
  async orient() {
    this.bus.emit('harness:orient:start', {});

    const currentProgress = this.progress.getProgress();
    const featureStats = this.features.getStats();

    this.orientation = {
      sessionId: currentProgress.sessionId,
      progress: currentProgress,
      features: featureStats,
      priorities: [],
      health: {},
      timestamp: new Date().toISOString()
    };

    // Identify priorities
    const activeTasks = this.progress.state?.activeTasks || [];
    if (activeTasks.length > 0) {
      this.orientation.priorities = activeTasks.map(t => ({
        id: t.id,
        description: t.description,
        priority: t.priority,
        reason: 'In progress from previous session'
      }));
    }

    // Check for failing features
    const failedFeatures = this.features.getFeatures('fail');
    if (failedFeatures.length > 0) {
      for (const f of failedFeatures) {
        this.orientation.priorities.push({
          id: f.id,
          description: `Fix: ${f.name}`,
          priority: 'high',
          reason: 'Feature currently failing'
        });
      }
    }

    this.oriented = true;
    this.bus.emit('harness:orient:done', this.orientation);

    return this.orientation;
  }

  /**
   * Phase 2: Track - Record incremental progress
   * Called after each task completion
   *
   * @param {Object} task - { id, description, priority }
   * @returns {Object} Tracked task entry
   */
  track(task) {
    if (!this.oriented) {
      // Auto-orient if not yet done
      this.orient();
    }

    const entry = this.progress.startTask(task);
    this.bus.emit('harness:track', { taskId: entry.id, description: entry.description });
    return entry;
  }

  /**
   * Complete a tracked task
   * @param {string} taskId
   * @param {Object} result - { success, commitHash, notes }
   */
  complete(taskId, result = {}) {
    const task = this.progress.completeTask(taskId, result);
    if (task) {
      this.bus.emit('harness:complete', {
        taskId,
        status: task.status,
        commitHash: result.commitHash
      });
    }
    return task;
  }

  /**
   * Record a git commit
   * @param {string} hash - Commit hash
   * @param {string} message - Commit message
   */
  recordCommit(hash, message) {
    this.progress.recordCommit(hash, message);
  }

  /**
   * Generate handoff document from progress.json
   * @returns {string} HANDOFF.md content
   */
  generateHandoff() {
    const data = this.progress.generateHandoff();
    const featureStats = this.features.getStats();

    const lines = [];
    lines.push(`# HANDOFF - ${data.generatedAt}`);
    lines.push(`\n> Generated from progress.json (session: ${data.sessionId})`);
    lines.push(`\n## Summary`);
    lines.push(`- Tasks completed: ${data.summary.tasksCompleted}`);
    lines.push(`- Tasks in progress: ${data.summary.tasksInProgress}`);
    lines.push(`- Commits: ${data.summary.commits}`);
    lines.push(`- Features: ${featureStats.pass}/${featureStats.total} passing`);

    if (data.activeTasks.length > 0) {
      lines.push(`\n## Active Tasks`);
      data.activeTasks.forEach(t => {
        lines.push(`- [${t.priority}] ${t.description} (since ${t.startedAt})`);
      });
    }

    if (data.recentCompleted.length > 0) {
      lines.push(`\n## Recently Completed`);
      data.recentCompleted.forEach(t => {
        lines.push(`- ${t.description} (${t.completedAt})`);
      });
    }

    if (data.recentCommits.length > 0) {
      lines.push(`\n## Recent Commits`);
      data.recentCommits.forEach(c => {
        lines.push(`- \`${c.hash}\`: ${c.message}`);
      });
    }

    if (data.nextPriorities.length > 0) {
      lines.push(`\n## Next Priorities`);
      data.nextPriorities.forEach(p => {
        lines.push(`- ${p.description} (${p.reason})`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Get session state
   */
  getState() {
    return {
      oriented: this.oriented,
      orientation: this.orientation,
      progress: this.progress.getProgress(),
      features: this.features.getStats()
    };
  }
}

module.exports = { SessionManager };
