/**
 * NEXUS DI Container - Dependency Injection
 *
 * Lightweight IoC container that manages port-adapter bindings.
 * Core domain code resolves ports through this container,
 * never through direct require().
 *
 * Features:
 * - Port-based registration/resolution
 * - Null adapter fallback for graceful degradation
 * - Singleton and factory patterns
 * - Runtime contract validation
 *
 * @module nexus/core/container
 */

'use strict';

const { PORTS, getPortNames, checkPort } = require('../ports');
const { createNullAdapter } = require('../ports/null-adapters');

class Container {
  constructor() {
    this._bindings = new Map();     // portName -> { adapter, type }
    this._singletons = new Map();   // portName -> instance
    this._factories = new Map();    // portName -> factoryFn
    this._initialized = false;
  }

  /**
   * Register an adapter for a port
   * @param {string} portName - Port interface name (e.g., 'ModelRouterPort')
   * @param {Object|Function} adapterOrFactory - Adapter instance or factory function
   * @param {Object} options - { singleton: true, validate: true }
   * @returns {Container} this (for chaining)
   */
  register(portName, adapterOrFactory, options = {}) {
    const { singleton = true, validate = true } = options;

    if (!PORTS[portName]) {
      throw new Error(`[Container] Unknown port: ${portName}. Valid: ${getPortNames().join(', ')}`);
    }

    if (typeof adapterOrFactory === 'function') {
      this._factories.set(portName, adapterOrFactory);
      this._bindings.set(portName, { type: 'factory' });
    } else {
      if (validate) {
        const result = checkPort(adapterOrFactory, portName);
        if (!result.valid) {
          throw new Error(
            `[Container] Adapter for ${portName} missing methods: ${result.missing.join(', ')}`
          );
        }
      }

      if (singleton) {
        this._singletons.set(portName, adapterOrFactory);
      }
      this._bindings.set(portName, { adapter: adapterOrFactory, type: 'instance' });
    }

    return this;
  }

  /**
   * Resolve a port to its adapter
   * Falls back to null adapter if not registered.
   * @param {string} portName - Port interface name
   * @returns {Object} Adapter instance
   */
  resolve(portName) {
    // Check singleton cache
    if (this._singletons.has(portName)) {
      return this._singletons.get(portName);
    }

    // Check factory
    if (this._factories.has(portName)) {
      const factory = this._factories.get(portName);
      const instance = factory(this);
      this._singletons.set(portName, instance);
      return instance;
    }

    // Check direct binding
    const binding = this._bindings.get(portName);
    if (binding?.adapter) {
      return binding.adapter;
    }

    // Fallback: null adapter
    const nullAdapter = createNullAdapter(portName);
    if (nullAdapter) {
      this._singletons.set(portName, nullAdapter);
      return nullAdapter;
    }

    throw new Error(`[Container] Cannot resolve port: ${portName}`);
  }

  /**
   * Check if a port has a real (non-null) adapter registered
   * @param {string} portName
   * @returns {boolean}
   */
  has(portName) {
    return this._bindings.has(portName);
  }

  /**
   * Check if a port is using a null adapter
   * @param {string} portName
   * @returns {boolean}
   */
  isNull(portName) {
    return !this._bindings.has(portName);
  }

  /**
   * Get all registered port names (non-null only)
   * @returns {string[]}
   */
  getRegistered() {
    return [...this._bindings.keys()];
  }

  /**
   * Get status of all ports
   * @returns {Object} { portName: { registered, type, nullFallback } }
   */
  getStatus() {
    const status = {};
    for (const portName of getPortNames()) {
      const binding = this._bindings.get(portName);
      status[portName] = {
        registered: !!binding,
        type: binding?.type || 'null',
        nullFallback: !binding
      };
    }
    return status;
  }

  /**
   * Validate all registered adapters against their port contracts
   * @returns {{ valid: boolean, errors: Array<{ port: string, issues: string[] }> }}
   */
  validateAll() {
    const errors = [];
    for (const [portName] of this._bindings) {
      const adapter = this.resolve(portName);
      const result = checkPort(adapter, portName);
      if (!result.valid) {
        errors.push({ port: portName, issues: result.missing });
      }
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Reset container (for testing)
   */
  reset() {
    this._bindings.clear();
    this._singletons.clear();
    this._factories.clear();
    this._initialized = false;
  }
}

// Singleton container
let instance = null;

function getContainer() {
  if (!instance) {
    instance = new Container();
  }
  return instance;
}

function resetContainer() {
  if (instance) {
    instance.reset();
    instance = null;
  }
}

module.exports = {
  Container,
  getContainer,
  resetContainer
};
