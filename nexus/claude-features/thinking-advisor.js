/**
 * NEXUS Thinking Advisor - Extended Thinking Auto-Activation
 *
 * Analyzes task complexity and recommends the appropriate
 * thinking mode (think vs ultrathink) for Claude Code.
 * Auto-inserts thinking keywords when complexity >= 8.
 *
 * @module nexus/claude-features/thinking-advisor
 */

'use strict';

const { getEventBus } = require('../core/event-bus');

class ThinkingAdvisor {
  constructor(options = {}) {
    this.bus = getEventBus();
    this._thresholds = {
      think: options.thinkThreshold || 5,
      ultrathink: options.ultrathinkThreshold || 8
    };
    this._history = [];
  }

  /**
   * Advise on thinking mode based on task complexity
   * @param {Object} task - { type, prompt, complexity }
   * @returns {{mode: string, reason: string, autoInsert: boolean}}
   */
  advise(task) {
    const complexity = task.complexity || this._estimateComplexity(task);

    let mode, reason, autoInsert;

    if (complexity >= this._thresholds.ultrathink) {
      mode = 'ultrathink';
      reason = `Complexity ${complexity} >= ${this._thresholds.ultrathink} (architecture/multi-system)`;
      autoInsert = true;
    } else if (complexity >= this._thresholds.think) {
      mode = 'think';
      reason = `Complexity ${complexity} >= ${this._thresholds.think} (moderate analysis)`;
      autoInsert = false;
    } else {
      mode = 'none';
      reason = `Complexity ${complexity} < ${this._thresholds.think} (simple task)`;
      autoInsert = false;
    }

    const advice = { mode, reason, autoInsert, complexity };

    this._history.push({ ...advice, timestamp: Date.now(), taskType: task.type });
    if (this._history.length > 100) this._history = this._history.slice(-100);

    this.bus.emit('thinking:advised', advice);
    return advice;
  }

  /**
   * Estimate complexity from task signals
   */
  _estimateComplexity(task) {
    let score = 0;
    const prompt = (task.prompt || '').toLowerCase();

    // Architecture signals
    if (/architect|refactor|migrat|redesign|overhaul/.test(prompt)) score += 4;
    // Security signals
    if (/auth|secur|encrypt|token|permission/.test(prompt)) score += 3;
    // Scale signals
    if (/all files|entire|comprehensive|every/.test(prompt)) score += 3;
    // Multi-system signals
    if (/integrat|cross-|multi-|bridge|orchestrat/.test(prompt)) score += 2;
    // Prompt length as complexity proxy
    if (prompt.length > 500) score += 2;
    if (prompt.length > 200) score += 1;

    return score;
  }

  /**
   * Get thinking mode statistics
   */
  getStats() {
    const modes = { none: 0, think: 0, ultrathink: 0 };
    for (const entry of this._history) {
      modes[entry.mode] = (modes[entry.mode] || 0) + 1;
    }
    return {
      thresholds: this._thresholds,
      history: this._history.length,
      distribution: modes
    };
  }
}

module.exports = { ThinkingAdvisor };
