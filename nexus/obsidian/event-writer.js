/**
 * NEXUS Obsidian Event Writer
 *
 * Listens to EventBus events and converts them into Obsidian notes.
 * Acts as a middleware or standalone subscriber.
 *
 * Event -> Note mapping:
 *   task:completed       -> Tasks/Task-{id}.md
 *   graph:end            -> Sessions/ (append to session note)
 *   checkpoint:saved     -> Checkpoints/CP-{id}.md
 *   evolution:pattern    -> Knowledge/Pattern-{id}.md
 *   Daily aggregation    -> Costs/Cost-{date}.md
 *
 * @module nexus/obsidian/event-writer
 */

'use strict';

const { getEventBus } = require('../core/event-bus');
const { templates, isoDate } = require('./templates');

class EventWriter {
  /**
   * @param {import('./bridge').ObsidianBridge} bridge - Obsidian bridge instance
   * @param {Object} options
   * @param {string} options.basePath - Base path in vault (default: 'NEXUS')
   * @param {boolean} options.autoSubscribe - Auto-subscribe to events (default: true)
   */
  constructor(bridge, options = {}) {
    this._bridge = bridge;
    this._basePath = options.basePath || 'NEXUS';
    this._bus = getEventBus();
    this._unsubscribers = [];
    this._sessionData = {
      tasks: [],
      startTime: Date.now(),
      cost: 0,
      providers: new Set()
    };
    this._dailyCosts = {};
    this._stats = { notesCreated: 0, errors: 0 };

    if (options.autoSubscribe !== false) {
      this.subscribe();
    }
  }

  /**
   * Subscribe to all relevant EventBus events
   */
  subscribe() {
    this._unsubscribers.push(
      this._bus.on('task:completed', (data) => this._onTaskCompleted(data)),
      this._bus.on('task:failed', (data) => this._onTaskCompleted({ ...data, status: 'failed' })),
      this._bus.on('graph:end', (data) => this._onGraphEnd(data)),
      this._bus.on('checkpoint:saved', (data) => this._onCheckpointSaved(data)),
      this._bus.on('evolution:pattern', (data) => this._onPatternDiscovered(data)),
      this._bus.on('system:shutdown', () => this._onShutdown())
    );
  }

  /**
   * Unsubscribe from all events
   */
  unsubscribe() {
    for (const unsub of this._unsubscribers) {
      if (typeof unsub === 'function') unsub();
    }
    this._unsubscribers = [];
  }

  /**
   * Register as EventBus middleware (alternative to subscribe)
   * Returns the middleware function for bus.use()
   */
  asMiddleware() {
    return (entry) => {
      switch (entry.event) {
        case 'task:completed':
          this._onTaskCompleted(entry.data);
          break;
        case 'task:failed':
          this._onTaskCompleted({ ...entry.data, status: 'failed' });
          break;
        case 'graph:end':
          this._onGraphEnd(entry.data);
          break;
        case 'checkpoint:saved':
          this._onCheckpointSaved(entry.data);
          break;
        case 'evolution:pattern':
          this._onPatternDiscovered(entry.data);
          break;
      }
      // Never block events
      return true;
    };
  }

  // ─── Event Handlers ─────────────────────────────

  async _onTaskCompleted(data) {
    const taskId = data.taskId || data.id || `task-${Date.now()}`;
    const notePath = `${this._basePath}/Tasks/Task-${sanitize(taskId)}.md`;

    const content = templates.task({
      taskId,
      taskType: data.taskType || data.type || 'unknown',
      prompt: data.prompt || '',
      provider: data.provider || 'unknown',
      status: data.status || 'completed',
      cost: data.cost || 0,
      quality: data.quality || data.qualityScore || 0,
      sessionId: data.sessionId || '',
      startTime: data.timestamp || Date.now()
    });

    await this._writeNote(notePath, content);

    // Track for session summary
    this._sessionData.tasks.push({
      id: taskId,
      type: data.taskType || data.type,
      provider: data.provider,
      success: data.status !== 'failed'
    });
    this._sessionData.cost += data.cost || 0;
    if (data.provider) this._sessionData.providers.add(data.provider);

    // Track daily costs
    this._trackDailyCost(data);
  }

  async _onGraphEnd(data) {
    const sessionId = data.sessionId || data.runId || `session-${Date.now()}`;
    const notePath = `${this._basePath}/Sessions/Session-${sanitize(sessionId)}.md`;

    const content = templates.session({
      sessionId,
      providers: [...this._sessionData.providers],
      taskCount: this._sessionData.tasks.length,
      successRate: this._sessionData.tasks.length > 0
        ? this._sessionData.tasks.filter(t => t.success).length / this._sessionData.tasks.length
        : 0,
      startTime: this._sessionData.startTime,
      endTime: Date.now(),
      cost: this._sessionData.cost,
      tasks: this._sessionData.tasks
    });

    await this._writeNote(notePath, content);
  }

  async _onCheckpointSaved(data) {
    const cpId = data.id || data.checkpointId || `cp-${Date.now()}`;
    const notePath = `${this._basePath}/Checkpoints/CP-${sanitize(cpId)}.md`;

    const content = templates.checkpoint({
      checkpointId: cpId,
      runId: data.runId || '',
      graphId: data.graphId || '',
      node: data.node || data.nodeId || '',
      step: data.step || 0,
      state: data.state || {},
      timestamp: data.timestamp || Date.now()
    });

    await this._writeNote(notePath, content);
  }

  async _onPatternDiscovered(data) {
    const patternId = data.id || data.patternId || `pattern-${Date.now()}`;
    const notePath = `${this._basePath}/Knowledge/Pattern-${sanitize(patternId)}.md`;

    const content = templates.pattern({
      patternId,
      type: data.type || 'unknown',
      provider: data.provider || '',
      practice: data.practice || data.description || '',
      confidence: data.confidence || 0,
      observations: data.observations || 0,
      discoveredAt: data.timestamp || Date.now()
    });

    await this._writeNote(notePath, content);
  }

  async _onShutdown() {
    // Write daily cost report
    await this._writeDailyCostReport();
    // Flush pending notes
    await this._bridge.flush();
  }

  // ─── Cost Tracking ─────────────────────────────

  _trackDailyCost(data) {
    const date = isoDate();
    if (!this._dailyCosts[date]) {
      this._dailyCosts[date] = { totalCost: 0, totalTokens: 0, taskCount: 0, byProvider: {} };
    }

    const daily = this._dailyCosts[date];
    daily.totalCost += data.cost || 0;
    daily.totalTokens += (data.inputTokens || 0) + (data.outputTokens || 0);
    daily.taskCount++;

    const provider = data.provider || 'unknown';
    if (!daily.byProvider[provider]) {
      daily.byProvider[provider] = { cost: 0, tokens: 0, count: 0 };
    }
    daily.byProvider[provider].cost += data.cost || 0;
    daily.byProvider[provider].tokens += (data.inputTokens || 0) + (data.outputTokens || 0);
    daily.byProvider[provider].count++;
  }

  async _writeDailyCostReport() {
    for (const [date, data] of Object.entries(this._dailyCosts)) {
      const notePath = `${this._basePath}/Costs/Cost-${date}.md`;
      const content = templates.costReport({ date, ...data });
      await this._writeNote(notePath, content);
    }
  }

  // ─── Helpers ─────────────────────────────────

  async _writeNote(notePath, content) {
    try {
      await this._bridge.putNote(notePath, content);
      this._stats.notesCreated++;
    } catch {
      this._stats.errors++;
    }
  }

  /**
   * Write current session as a session note (for manual sync)
   */
  async writeSessionNote(sessionData = {}) {
    const sessionId = sessionData.sessionId || `session-${Date.now()}`;
    const notePath = `${this._basePath}/Sessions/Session-${sanitize(sessionId)}.md`;

    const merged = {
      sessionId,
      providers: sessionData.providers || [...this._sessionData.providers],
      taskCount: sessionData.taskCount || this._sessionData.tasks.length,
      successRate: sessionData.successRate || 0,
      startTime: sessionData.startTime || this._sessionData.startTime,
      endTime: sessionData.endTime || Date.now(),
      cost: sessionData.cost || this._sessionData.cost,
      tasks: sessionData.tasks || this._sessionData.tasks
    };

    const content = templates.session(merged);
    await this._writeNote(notePath, content);
    return { ok: true, path: notePath };
  }

  /**
   * Write provider status notes (for manual sync)
   */
  async writeProviderNotes(providers) {
    for (const [id, info] of Object.entries(providers)) {
      const notePath = `${this._basePath}/Providers/Provider-${sanitize(id)}.md`;
      const content = templates.provider({
        providerId: id,
        role: info.role || '',
        status: info.status || 'unknown',
        context: info.context || '',
        costTier: info.costTier || info.cost_tier || '',
        strengths: info.strengths || [],
        weaknesses: info.weaknesses || []
      });
      await this._writeNote(notePath, content);
    }
  }

  /**
   * Get writer stats
   */
  getStats() {
    return {
      notesCreated: this._stats.notesCreated,
      errors: this._stats.errors,
      trackedTasks: this._sessionData.tasks.length,
      trackedProviders: this._sessionData.providers.size,
      dailyCostDates: Object.keys(this._dailyCosts)
    };
  }
}

/**
 * Sanitize string for use in file paths
 */
function sanitize(str) {
  return String(str).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100);
}

module.exports = { EventWriter };
