/**
 * NEXUS Health Monitor
 *
 * Periodic health checking for all registered adapters.
 * Detects failures, triggers fallbacks, emits events.
 *
 * @module nexus/adapters/health-monitor
 */

'use strict';

const { getEventBus } = require('../core/event-bus');
const { getRegistry } = require('./adapter-registry');

class HealthMonitor {
  constructor(options = {}) {
    this.interval = options.interval || 60000; // 1 min
    this.maxConsecutiveFailures = options.maxConsecutiveFailures || 3;
    this.bus = getEventBus();
    this.registry = getRegistry();
    this._timer = null;
    this._failureCounts = {};
    this._lastResults = {};
  }

  /**
   * Start periodic health checking
   */
  start() {
    if (this._timer) return;
    this._timer = setInterval(() => this.checkAll(), this.interval);
    // Run immediately once
    this.checkAll();
  }

  /**
   * Stop periodic health checking
   */
  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  /**
   * Check all registered adapters
   */
  async checkAll() {
    const adapters = this.registry.getAll();
    const results = {};

    for (const adapter of adapters) {
      const result = await adapter.healthCheck();
      results[adapter.id] = result;

      const prevStatus = this._lastResults[adapter.id]?.status;

      if (!result.healthy) {
        this._failureCounts[adapter.id] = (this._failureCounts[adapter.id] || 0) + 1;

        if (this._failureCounts[adapter.id] >= this.maxConsecutiveFailures) {
          adapter.status = 'unavailable';
          this.bus.emit('provider:down', {
            provider: adapter.id,
            consecutiveFailures: this._failureCounts[adapter.id],
            lastError: result.error
          });
        }
      } else {
        // Recovered?
        if (this._failureCounts[adapter.id] >= this.maxConsecutiveFailures) {
          this.bus.emit('provider:recovered', {
            provider: adapter.id,
            previousFailures: this._failureCounts[adapter.id]
          });
        }
        this._failureCounts[adapter.id] = 0;
      }
    }

    this._lastResults = results;
    return results;
  }

  /**
   * Get latest health results
   */
  getResults() {
    return { ...this._lastResults };
  }

  /**
   * Get failure counts
   */
  getFailureCounts() {
    return { ...this._failureCounts };
  }

  /**
   * Check if a specific provider is available
   */
  isAvailable(adapterId) {
    const adapter = this.registry.get(adapterId);
    return adapter && adapter.status !== 'unavailable';
  }
}

// Singleton
let instance = null;

function getHealthMonitor(options) {
  if (!instance) {
    instance = new HealthMonitor(options);
  }
  return instance;
}

function resetHealthMonitor() {
  if (instance) {
    instance.stop();
    instance = null;
  }
}

module.exports = {
  HealthMonitor,
  getHealthMonitor,
  resetHealthMonitor
};
