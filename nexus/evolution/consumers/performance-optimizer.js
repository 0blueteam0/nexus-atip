/**
 * NEXUS Performance Optimizer
 *
 * Analyzes task execution metrics to identify bottlenecks and
 * propose performance improvements.
 *
 * Metrics tracked:
 *   - Routing latency (task received -> provider selected)
 *   - Execution duration per provider
 *   - Token usage efficiency
 *   - Error recovery time
 *
 * @module nexus/evolution/consumers/performance-optimizer
 */

'use strict';

const { getEventBus } = require('../../core/event-bus');

class PerformanceOptimizer {
  constructor(options = {}) {
    this.thresholds = {
      slowRoutingMs: options.slowRoutingMs || 5000,
      highTokenUsage: options.highTokenUsage || 10000,
      maxErrorRate: options.maxErrorRate || 0.2
    };
    this.metrics = {
      providers: {},
      totalTasks: 0,
      totalErrors: 0,
      totalDurationMs: 0,
      totalTokens: 0
    };
    this._attached = false;
  }

  /**
   * Attach to EventBus for real-time monitoring
   */
  attach() {
    if (this._attached) return;
    const bus = getEventBus();

    bus.on('task:completed', (data) => this._recordSuccess(data));
    bus.on('task:failed', (data) => this._recordFailure(data));

    this._attached = true;
  }

  /**
   * Analyze history and identify bottlenecks
   * @param {Array} history - Event history
   * @returns {Array<Improvement>} Proposed improvements
   */
  analyze(history = []) {
    const improvements = [];

    // Build provider metrics from history
    this._buildMetrics(history);

    // 1. Slow providers
    for (const [provider, m] of Object.entries(this.metrics.providers)) {
      if (m.tasks > 0) {
        const avgMs = m.totalDurationMs / m.tasks;
        if (avgMs > this.thresholds.slowRoutingMs) {
          improvements.push({
            type: 'slow_provider',
            provider,
            avgDurationMs: Math.round(avgMs),
            threshold: this.thresholds.slowRoutingMs,
            priority: 'medium',
            suggestion: `${provider} avg ${Math.round(avgMs)}ms - consider reducing weight for latency-sensitive tasks`
          });
        }
      }
    }

    // 2. High error rate providers
    for (const [provider, m] of Object.entries(this.metrics.providers)) {
      if (m.tasks > 2) {
        const errorRate = m.errors / m.tasks;
        if (errorRate > this.thresholds.maxErrorRate) {
          improvements.push({
            type: 'high_error_rate',
            provider,
            errorRate: Math.round(errorRate * 100),
            tasks: m.tasks,
            errors: m.errors,
            priority: 'high',
            suggestion: `${provider} error rate ${Math.round(errorRate * 100)}% - needs investigation or weight reduction`
          });
        }
      }
    }

    // 3. Token efficiency
    for (const [provider, m] of Object.entries(this.metrics.providers)) {
      if (m.tasks > 0 && m.totalTokens > 0) {
        const avgTokens = m.totalTokens / m.tasks;
        if (avgTokens > this.thresholds.highTokenUsage) {
          improvements.push({
            type: 'token_inefficiency',
            provider,
            avgTokens: Math.round(avgTokens),
            threshold: this.thresholds.highTokenUsage,
            priority: 'low',
            suggestion: `${provider} avg ${Math.round(avgTokens)} tokens/task - context optimization may help`
          });
        }
      }
    }

    return improvements;
  }

  /**
   * Build metrics from event history
   */
  _buildMetrics(history) {
    // Reset
    this.metrics = {
      providers: {},
      totalTasks: 0,
      totalErrors: 0,
      totalDurationMs: 0,
      totalTokens: 0
    };

    for (const entry of history) {
      const provider = entry.data?.provider;
      if (!provider) continue;

      if (!this.metrics.providers[provider]) {
        this.metrics.providers[provider] = {
          tasks: 0, errors: 0, totalDurationMs: 0, totalTokens: 0
        };
      }

      const m = this.metrics.providers[provider];

      if (entry.event === 'task:completed') {
        m.tasks++;
        this.metrics.totalTasks++;
        const duration = entry.data?.durationMs || 0;
        m.totalDurationMs += duration;
        this.metrics.totalDurationMs += duration;
        const tokens = entry.data?.tokensUsed || 0;
        m.totalTokens += tokens;
        this.metrics.totalTokens += tokens;
      }

      if (entry.event === 'task:failed') {
        m.tasks++;
        m.errors++;
        this.metrics.totalTasks++;
        this.metrics.totalErrors++;
      }
    }
  }

  _recordSuccess(data) {
    const provider = data?.provider;
    if (!provider) return;

    if (!this.metrics.providers[provider]) {
      this.metrics.providers[provider] = {
        tasks: 0, errors: 0, totalDurationMs: 0, totalTokens: 0
      };
    }

    const m = this.metrics.providers[provider];
    m.tasks++;
    m.totalDurationMs += data?.durationMs || 0;
    m.totalTokens += data?.tokensUsed || 0;
    this.metrics.totalTasks++;
  }

  _recordFailure(data) {
    const provider = data?.provider;
    if (!provider) return;

    if (!this.metrics.providers[provider]) {
      this.metrics.providers[provider] = {
        tasks: 0, errors: 0, totalDurationMs: 0, totalTokens: 0
      };
    }

    this.metrics.providers[provider].tasks++;
    this.metrics.providers[provider].errors++;
    this.metrics.totalTasks++;
    this.metrics.totalErrors++;
  }

  /**
   * Get current metrics
   * @returns {Object}
   */
  getMetrics() {
    return { ...this.metrics };
  }
}

module.exports = { PerformanceOptimizer };
