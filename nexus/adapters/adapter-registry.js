/**
 * NEXUS Adapter Registry
 *
 * Dynamic registration, lookup, and lifecycle management
 * for all provider adapters.
 *
 * @module nexus/adapters/adapter-registry
 */

'use strict';

const { getEventBus } = require('../core/event-bus');
const { ClaudeAdapter } = require('./claude-adapter');
const { GeminiAdapter } = require('./gemini-adapter');
const { CodexAdapter } = require('./codex-adapter');

class AdapterRegistry {
  constructor() {
    this._adapters = new Map();
    this.bus = getEventBus();
  }

  /**
   * Register a built-in adapter by ID
   */
  registerBuiltIn(id, config = {}) {
    let adapter;
    switch (id) {
      case 'claude-code':
        adapter = new ClaudeAdapter(config);
        break;
      case 'gemini-cli':
        adapter = new GeminiAdapter(config);
        break;
      case 'codex-cli':
        adapter = new CodexAdapter(config);
        break;
      default:
        throw new Error(`Unknown built-in adapter: ${id}`);
    }

    this._adapters.set(id, adapter);
    this.bus.emit('provider:registered', { id, role: adapter.config.role });
    return adapter;
  }

  /**
   * Register a custom adapter instance
   */
  register(adapter) {
    if (!adapter.id) throw new Error('Adapter must have an id');
    this._adapters.set(adapter.id, adapter);
    this.bus.emit('provider:registered', { id: adapter.id });
    return adapter;
  }

  /**
   * Unregister an adapter
   */
  unregister(id) {
    this._adapters.delete(id);
    this.bus.emit('provider:unregistered', { id });
  }

  /**
   * Get adapter by ID
   */
  get(id) {
    return this._adapters.get(id) || null;
  }

  /**
   * Get all registered adapters
   */
  getAll() {
    return [...this._adapters.values()];
  }

  /**
   * Get all available (healthy) adapters
   */
  getAvailable() {
    return this.getAll().filter(a => a.status !== 'unavailable');
  }

  /**
   * Initialize all built-in adapters from config
   */
  initFromConfig(config) {
    if (!config?.providers) return;

    for (const [id, providerConfig] of Object.entries(config.providers)) {
      if (providerConfig.enabled === false) continue;
      try {
        this.registerBuiltIn(id, providerConfig);
      } catch (e) {
        console.error(`[!] Failed to register adapter ${id}: ${e.message}`);
      }
    }
  }

  /**
   * Run health checks on all adapters
   */
  async healthCheckAll() {
    const results = {};
    for (const [id, adapter] of this._adapters) {
      results[id] = await adapter.healthCheck();
      this.bus.emit('provider:health', {
        provider: id,
        ...results[id]
      });
    }
    return results;
  }

  /**
   * Get metrics for all adapters
   */
  getAllMetrics() {
    const metrics = {};
    for (const [id, adapter] of this._adapters) {
      metrics[id] = adapter.getMetrics();
    }
    return metrics;
  }

  /**
   * Find best adapter for given capability
   */
  findByStrength(strength) {
    return this.getAvailable()
      .filter(a => {
        const caps = a.getCapabilities();
        return caps.strengths?.includes(strength);
      })
      .sort((a, b) => {
        // Prefer higher success rate
        const rateA = a.metrics.calls > 0 ? a.metrics.successes / a.metrics.calls : 0.5;
        const rateB = b.metrics.calls > 0 ? b.metrics.successes / b.metrics.calls : 0.5;
        return rateB - rateA;
      });
  }

  /**
   * Get adapter count
   */
  get size() {
    return this._adapters.size;
  }

  /**
   * Clear all adapters
   */
  clear() {
    this._adapters.clear();
  }
}

// Singleton
let instance = null;

function getRegistry() {
  if (!instance) {
    instance = new AdapterRegistry();
  }
  return instance;
}

function resetRegistry() {
  if (instance) {
    instance.clear();
    instance = null;
  }
}

module.exports = {
  AdapterRegistry,
  getRegistry,
  resetRegistry
};
