/**
 * NEXUS Cost Tracker - Real-time Cost Monitoring
 *
 * Tracks API costs per provider, session, and time period.
 * Integrates with PolicyMesh rate-governor for budget enforcement.
 *
 * @module nexus/observability/cost-tracker
 */

'use strict';

const path = require('path');
const fs = require('fs');

const COST_LOG_PATH = path.resolve(__dirname, '../knowledge/cost-log.json');

// Approximate cost per 1K tokens (USD)
const COST_TABLE = {
  'claude-code': { input: 0, output: 0, note: 'Max subscription' },
  'gemini-cli': { input: 0, output: 0, note: 'Free tier' },
  'codex-cli': { input: 0.003, output: 0.012, note: 'OpenAI API' },
  'ollama-cpu': { input: 0, output: 0, note: 'Local CPU' },
  'api-direct': { input: 0.005, output: 0.015, note: 'Direct API' }
};

class CostTracker {
  constructor() {
    this._entries = [];
    this._sessionStart = Date.now();
    this._loadHistory();
  }

  /**
   * Record a cost entry
   * @param {Object} entry - { provider, inputTokens, outputTokens, taskType, timestamp }
   */
  async trackCost(entry) {
    const costs = COST_TABLE[entry.provider] || { input: 0, output: 0 };
    const inputCost = (entry.inputTokens || 0) / 1000 * costs.input;
    const outputCost = (entry.outputTokens || 0) / 1000 * costs.output;

    const record = {
      provider: entry.provider,
      inputTokens: entry.inputTokens || 0,
      outputTokens: entry.outputTokens || 0,
      totalTokens: (entry.inputTokens || 0) + (entry.outputTokens || 0),
      costUsd: inputCost + outputCost,
      taskType: entry.taskType || 'unknown',
      timestamp: entry.timestamp || Date.now()
    };

    this._entries.push(record);
    this._persist();
  }

  /**
   * Get cost summary for a time range
   * @param {Object} timeRange - { from, to } (ms timestamps)
   * @returns {{total, byProvider, byTaskType, count}}
   */
  getCostSummary(timeRange = {}) {
    const from = timeRange.from || 0;
    const to = timeRange.to || Date.now();

    const filtered = this._entries.filter(e => e.timestamp >= from && e.timestamp <= to);

    const byProvider = {};
    const byTaskType = {};
    let total = 0;
    let totalTokens = 0;

    for (const e of filtered) {
      total += e.costUsd;
      totalTokens += e.totalTokens;

      if (!byProvider[e.provider]) byProvider[e.provider] = { cost: 0, tokens: 0, count: 0 };
      byProvider[e.provider].cost += e.costUsd;
      byProvider[e.provider].tokens += e.totalTokens;
      byProvider[e.provider].count++;

      if (!byTaskType[e.taskType]) byTaskType[e.taskType] = { cost: 0, count: 0 };
      byTaskType[e.taskType].cost += e.costUsd;
      byTaskType[e.taskType].count++;
    }

    return {
      total: Math.round(total * 10000) / 10000,
      totalTokens,
      byProvider,
      byTaskType,
      count: filtered.length,
      period: { from, to }
    };
  }

  /**
   * Get today's cost
   */
  getTodayCost() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.getCostSummary({ from: today.getTime() });
  }

  _loadHistory() {
    try {
      if (fs.existsSync(COST_LOG_PATH)) {
        this._entries = JSON.parse(fs.readFileSync(COST_LOG_PATH, 'utf8'));
      }
    } catch {
      this._entries = [];
    }
  }

  _persist() {
    try {
      const dir = path.dirname(COST_LOG_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      // Keep last 10000 entries
      const toSave = this._entries.slice(-10000);
      fs.writeFileSync(COST_LOG_PATH, JSON.stringify(toSave, null, 2));
    } catch {
      // Non-fatal
    }
  }
}

module.exports = { CostTracker, COST_TABLE };
