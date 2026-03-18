/**
 * NEXUS ATIP V2.0 - Module Loader
 * Dynamic module loading with lifecycle management
 */

import { eventBus, EVENTS } from './event-bus.js';
import ATIP_CONFIG from './config.js';

class ModuleLoader {
  constructor() {
    this._modules = new Map();
    this._loadOrder = [];
  }

  static getInstance() {
    if (!ModuleLoader._instance) {
      ModuleLoader._instance = new ModuleLoader();
    }
    return ModuleLoader._instance;
  }

  /**
   * Register a module
   * @param {string} name - Module name
   * @param {Object} module - Module object with init(), render(), destroy()
   */
  register(name, module) {
    if (this._modules.has(name)) {
      console.warn(`[ModuleLoader] Module "${name}" already registered`);
      return;
    }

    this._modules.set(name, {
      instance: module,
      status: 'registered',
      loadedAt: null,
      error: null
    });
    this._loadOrder.push(name);
  }

  /**
   * Initialize all registered modules
   */
  async initAll() {
    const results = { success: [], failed: [] };

    for (const name of this._loadOrder) {
      try {
        await this.init(name);
        results.success.push(name);
      } catch (err) {
        results.failed.push({ name, error: err.message });
      }
    }

    eventBus.emit(EVENTS.DASHBOARD_REFRESH, {
      type: 'modules-loaded',
      results
    });

    return results;
  }

  /**
   * Initialize a single module
   */
  async init(name) {
    const entry = this._modules.get(name);
    if (!entry) throw new Error(`Module "${name}" not registered`);

    if (entry.status === 'loaded') return entry.instance;

    try {
      entry.status = 'loading';
      if (typeof entry.instance.init === 'function') {
        await entry.instance.init();
      }
      entry.status = 'loaded';
      entry.loadedAt = Date.now();

      eventBus.emit(EVENTS.MODULE_LOADED, { module: name });
      return entry.instance;
    } catch (err) {
      entry.status = 'error';
      entry.error = err.message;
      eventBus.emit(EVENTS.MODULE_ERROR, { module: name, error: err.message });
      throw err;
    }
  }

  /**
   * Get a loaded module
   */
  get(name) {
    const entry = this._modules.get(name);
    return entry ? entry.instance : null;
  }

  /**
   * Get status of all modules
   */
  status() {
    const result = {};
    this._modules.forEach((entry, name) => {
      result[name] = {
        status: entry.status,
        loadedAt: entry.loadedAt,
        error: entry.error
      };
    });
    return result;
  }

  /**
   * Destroy all modules
   */
  async destroyAll() {
    for (const name of [...this._loadOrder].reverse()) {
      const entry = this._modules.get(name);
      if (entry && typeof entry.instance.destroy === 'function') {
        try {
          await entry.instance.destroy();
        } catch (err) {
          console.error(`[ModuleLoader] Error destroying "${name}":`, err);
        }
      }
    }
    this._modules.clear();
    this._loadOrder = [];
  }
}

export const moduleLoader = ModuleLoader.getInstance();
export default moduleLoader;
