/**
 * NEXUS SubAgent Manager - Context-Isolated Agent Spawning
 *
 * LangChain Deep Agents "subagent spawning" pattern:
 * - Main agent spawns isolated subagents for specific tasks
 * - Each subagent has independent context window
 * - Results flow back to main agent after completion
 *
 * Extends A2AHub delegateTask with lifecycle management.
 *
 * @module nexus/deep-agent/subagent-manager
 */

'use strict';

const { getEventBus } = require('../core/event-bus');

class SubAgentManager {
  constructor(options = {}) {
    this.bus = getEventBus();
    this._agents = new Map();
    this._maxConcurrent = options.maxConcurrent || 5;
    this._defaultTimeout = options.timeoutMs || 120000; // 2 min
    this._completedResults = [];
    this._maxHistory = options.maxHistory || 50;
  }

  /**
   * Spawn a subagent for a specific task
   * @param {Object} params
   * @param {string} params.name - Human-readable subagent name
   * @param {string} params.type - Agent type (explore, implement, verify, research)
   * @param {string} params.task - Task description
   * @param {Object} [params.context] - Initial context for the subagent
   * @param {number} [params.timeoutMs] - Timeout override
   * @returns {{spawned: boolean, agentId: string}}
   */
  spawn({ name, type, task, context, timeoutMs }) {
    if (this.getActiveCount() >= this._maxConcurrent) {
      return { spawned: false, reason: `Max concurrent agents reached (${this._maxConcurrent})` };
    }

    const agentId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timeout = timeoutMs || this._defaultTimeout;

    const agent = {
      id: agentId,
      name: name || `SubAgent-${type}`,
      type: type || 'general',
      task,
      context: context || {},
      status: 'running',
      spawnedAt: Date.now(),
      result: null,
      error: null,
      _timer: setTimeout(() => this._timeout(agentId), timeout)
    };

    this._agents.set(agentId, agent);

    this.bus.emit('subagent:spawned', {
      agentId, name: agent.name, type: agent.type, task
    });

    return { spawned: true, agentId };
  }

  /**
   * Report subagent completion
   * @param {string} agentId
   * @param {Object} result
   * @returns {boolean}
   */
  complete(agentId, result) {
    const agent = this._agents.get(agentId);
    if (!agent || agent.status !== 'running') return false;

    clearTimeout(agent._timer);
    agent.status = 'completed';
    agent.result = result;
    agent.completedAt = Date.now();
    agent.durationMs = agent.completedAt - agent.spawnedAt;

    this._completedResults.push({
      agentId,
      name: agent.name,
      type: agent.type,
      result,
      durationMs: agent.durationMs
    });

    // Trim history
    if (this._completedResults.length > this._maxHistory) {
      this._completedResults = this._completedResults.slice(-this._maxHistory);
    }

    this.bus.emit('subagent:completed', {
      agentId, name: agent.name, type: agent.type,
      durationMs: agent.durationMs
    });

    return true;
  }

  /**
   * Report subagent failure
   * @param {string} agentId
   * @param {string} error
   */
  fail(agentId, error) {
    const agent = this._agents.get(agentId);
    if (!agent || agent.status !== 'running') return false;

    clearTimeout(agent._timer);
    agent.status = 'failed';
    agent.error = error;
    agent.completedAt = Date.now();

    this.bus.emit('subagent:failed', { agentId, name: agent.name, error });
    return true;
  }

  /**
   * Handle timeout
   */
  _timeout(agentId) {
    const agent = this._agents.get(agentId);
    if (!agent || agent.status !== 'running') return;

    agent.status = 'timeout';
    agent.error = 'Execution timeout';
    agent.completedAt = Date.now();

    this.bus.emit('subagent:timeout', { agentId, name: agent.name });
  }

  /**
   * Get subagent by ID
   */
  getAgent(agentId) {
    const agent = this._agents.get(agentId);
    if (!agent) return null;
    const { _timer, ...safe } = agent;
    return safe;
  }

  /**
   * Get count of active (running) subagents
   */
  getActiveCount() {
    return [...this._agents.values()].filter(a => a.status === 'running').length;
  }

  /**
   * List all subagents
   */
  list() {
    return [...this._agents.values()].map(({ _timer, ...a }) => a);
  }

  /**
   * Get completed results (for main agent consumption)
   * @param {string} [type] - Filter by agent type
   */
  getResults(type) {
    if (type) {
      return this._completedResults.filter(r => r.type === type);
    }
    return this._completedResults;
  }

  /**
   * Collect all completed results and clear (one-time harvest)
   */
  harvest() {
    const results = [...this._completedResults];
    this._completedResults = [];
    return results;
  }

  /**
   * Get status summary
   */
  getStatus() {
    const agents = this.list();
    return {
      total: agents.length,
      running: agents.filter(a => a.status === 'running').length,
      completed: agents.filter(a => a.status === 'completed').length,
      failed: agents.filter(a => a.status === 'failed').length,
      timeout: agents.filter(a => a.status === 'timeout').length,
      maxConcurrent: this._maxConcurrent,
      pendingResults: this._completedResults.length
    };
  }
}

module.exports = { SubAgentManager };
