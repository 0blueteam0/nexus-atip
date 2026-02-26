/**
 * NEXUS Base Adapter - Provider Interface
 *
 * All provider adapters extend this base class.
 * Provides unified interface for query, health check,
 * capabilities, cost estimation, and metrics.
 *
 * @module nexus/adapters/base-adapter
 */

'use strict';

class BaseAdapter {
  constructor(id, config = {}) {
    this.id = id;
    this.config = config;
    this.metrics = {
      calls: 0,
      successes: 0,
      failures: 0,
      totalLatency: 0,
      avgLatency: 0,
      lastCall: null,
      lastSuccess: null,
      lastFailure: null
    };
    this.status = 'unknown'; // available | degraded | unavailable | unknown
  }

  /**
   * Send a prompt/task to this provider and get response
   * @param {string} prompt - The prompt to send
   * @param {Object} options - { timeout, format, context }
   * @returns {Promise<Object>} { success, output, latency, error }
   */
  async query(prompt, options = {}) {
    const start = Date.now();
    this.metrics.calls++;
    this.metrics.lastCall = start;

    try {
      const result = await this._execute(prompt, options);
      const latency = Date.now() - start;

      this.metrics.successes++;
      this.metrics.lastSuccess = Date.now();
      this.metrics.totalLatency += latency;
      this.metrics.avgLatency = this.metrics.totalLatency / this.metrics.calls;
      this.status = 'available';

      return {
        success: true,
        output: result,
        provider: this.id,
        latency
      };
    } catch (err) {
      const latency = Date.now() - start;
      this.metrics.failures++;
      this.metrics.lastFailure = Date.now();
      this.metrics.totalLatency += latency;
      this.metrics.avgLatency = this.metrics.totalLatency / this.metrics.calls;

      if (this.metrics.failures >= 3 &&
          this.metrics.failures > this.metrics.successes) {
        this.status = 'unavailable';
      } else {
        this.status = 'degraded';
      }

      return {
        success: false,
        error: err.message,
        provider: this.id,
        latency
      };
    }
  }

  /**
   * Execute the actual query (override in subclass)
   * @abstract
   */
  async _execute(prompt, options) {
    throw new Error(`${this.id}: _execute() not implemented`);
  }

  /**
   * Check if this provider is healthy
   * @returns {Promise<Object>} { status, latency, details }
   */
  async healthCheck() {
    const start = Date.now();
    try {
      const ok = await this._healthCheck();
      const latency = Date.now() - start;
      this.status = ok ? 'available' : 'degraded';
      return { status: this.status, latency, healthy: ok };
    } catch (e) {
      this.status = 'unavailable';
      return { status: 'unavailable', latency: Date.now() - start, healthy: false, error: e.message };
    }
  }

  /**
   * Internal health check (override in subclass)
   * @abstract
   */
  async _healthCheck() {
    return true;
  }

  /**
   * Get this provider's capabilities
   * @returns {Object} { strengths, weaknesses, context, costTier }
   */
  getCapabilities() {
    return {
      id: this.id,
      strengths: this.config.strengths || [],
      weaknesses: this.config.weaknesses || [],
      context: this.config.context || 0,
      costTier: this.config.cost_tier || 'unknown',
      role: this.config.role || 'unknown',
      enabled: this.config.enabled !== false
    };
  }

  /**
   * Estimate cost for a given prompt
   * @param {string} prompt - The prompt text
   * @returns {Object} { estimatedCost, unit, tier }
   */
  estimateCost(prompt) {
    const tier = this.config.cost_tier || 'unknown';
    if (tier === 'free' || tier === 'included') {
      return { estimatedCost: 0, unit: 'USD', tier };
    }
    // Rough estimate: ~4 chars per token, $0.01 per 1K tokens
    const tokens = Math.ceil((prompt?.length || 0) / 4);
    const cost = (tokens / 1000) * 0.01;
    return { estimatedCost: cost, unit: 'USD', tier };
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.calls > 0
        ? (this.metrics.successes / this.metrics.calls * 100).toFixed(1) + '%'
        : 'N/A',
      status: this.status
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      calls: 0, successes: 0, failures: 0,
      totalLatency: 0, avgLatency: 0,
      lastCall: null, lastSuccess: null, lastFailure: null
    };
  }

  /**
   * Declare which ports this adapter implements
   * Override in subclass to declare port compatibility.
   * @returns {string[]} Array of port names (e.g., ['ModelRouterPort'])
   */
  static implementsPorts() {
    return [];
  }

  /**
   * Check if this adapter implements a specific port
   * @param {string} portName
   * @returns {boolean}
   */
  implements(portName) {
    return this.constructor.implementsPorts().includes(portName);
  }
}

module.exports = { BaseAdapter };
