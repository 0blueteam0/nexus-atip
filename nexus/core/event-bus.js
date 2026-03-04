/**
 * NEXUS Event Bus - Cross-Layer Event Communication
 *
 * Lightweight pub/sub event system for NEXUS layers.
 * Enables loose coupling between orchestrator, adapters,
 * workflows, evolution engine, and knowledge accumulator.
 *
 * Events:
 *   system:init          - NEXUS initialized
 *   system:shutdown      - NEXUS shutting down
 *   provider:health      - Provider health status change
 *   provider:down        - Provider became unavailable
 *   provider:recovered   - Provider recovered from failure
 *   task:received        - New task received
 *   task:routed          - Task routed to provider
 *   task:completed       - Task execution completed
 *   task:failed          - Task execution failed
 *   workflow:started     - Workflow execution started
 *   workflow:step        - Workflow step completed
 *   workflow:completed   - Workflow execution completed
 *   evolution:weight     - Weight adjustment occurred
 *   evolution:pattern    - New pattern discovered
 *   evolution:research   - Auto-research triggered
 *   knowledge:updated    - Knowledge base updated
 *
 * @module nexus/core/event-bus
 */

'use strict';

class EventBus {
  constructor() {
    this._listeners = new Map();
    this._onceListeners = new Map();
    this._history = [];
    this._maxHistory = 500;
    this._middlewares = [];
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name (supports wildcards: 'task:*')
   * @param {Function} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);

    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event (one-time)
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    if (!this._onceListeners.has(event)) {
      this._onceListeners.set(event, new Set());
    }
    this._onceListeners.get(event).add(callback);

    return () => {
      const set = this._onceListeners.get(event);
      if (set) set.delete(callback);
    };
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   */
  off(event, callback) {
    const set = this._listeners.get(event);
    if (set) set.delete(callback);
    const onceSet = this._onceListeners.get(event);
    if (onceSet) onceSet.delete(callback);
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data = {}) {
    const entry = {
      event,
      data,
      timestamp: Date.now()
    };

    // Run middlewares
    for (const mw of this._middlewares) {
      try {
        const result = mw(entry);
        if (result === false) return; // Middleware blocked the event
      } catch (e) {
        // Middleware errors don't block events
      }
    }

    // Record history
    this._history.push(entry);
    if (this._history.length > this._maxHistory) {
      this._history = this._history.slice(-this._maxHistory);
    }

    // Exact match listeners
    this._notifyListeners(event, data);

    // Wildcard match (e.g., 'task:*' matches 'task:routed')
    const namespace = event.split(':')[0];
    if (namespace !== event) {
      this._notifyListeners(`${namespace}:*`, data, event);
    }

    // Global wildcard
    this._notifyListeners('*', data, event);
  }

  /**
   * Notify listeners for a specific event key
   */
  _notifyListeners(key, data, originalEvent) {
    const payload = originalEvent ? { ...data, _event: originalEvent } : data;

    // Regular listeners
    const listeners = this._listeners.get(key);
    if (listeners) {
      for (const cb of listeners) {
        try {
          cb(payload);
        } catch (e) {
          // Listener errors don't propagate
        }
      }
    }

    // Once listeners
    const onceListeners = this._onceListeners.get(key);
    if (onceListeners && onceListeners.size > 0) {
      const callbacks = [...onceListeners];
      onceListeners.clear();
      for (const cb of callbacks) {
        try {
          cb(payload);
        } catch (e) {
          // Listener errors don't propagate
        }
      }
    }
  }

  /**
   * Add middleware (runs before every emit)
   * Return false from middleware to block the event.
   * @param {Function} middleware - (entry) => boolean|void
   */
  use(middleware) {
    this._middlewares.push(middleware);
  }

  /**
   * Wait for a specific event (Promise-based)
   * @param {string} event - Event to wait for
   * @param {number} timeoutMs - Timeout in ms (0 = no timeout)
   * @returns {Promise<*>} Event data
   */
  waitFor(event, timeoutMs = 0) {
    return new Promise((resolve, reject) => {
      let timer = null;

      const unsub = this.once(event, (data) => {
        if (timer) clearTimeout(timer);
        resolve(data);
      });

      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          unsub();
          reject(new Error(`Timeout waiting for event: ${event}`));
        }, timeoutMs);
      }
    });
  }

  /**
   * Get event history
   * @param {Object} filter - { event, since, limit }
   * @returns {Array} Filtered history entries
   */
  getHistory(filter = {}) {
    let results = [...this._history];

    if (filter.event) {
      results = results.filter(e => e.event === filter.event);
    }
    if (filter.since) {
      results = results.filter(e => e.timestamp >= filter.since);
    }
    if (filter.namespace) {
      results = results.filter(e => e.event.startsWith(filter.namespace + ':'));
    }
    if (filter.limit) {
      results = results.slice(-filter.limit);
    }

    return results;
  }

  /**
   * Get statistics about events
   */
  getStats() {
    const eventCounts = {};
    for (const entry of this._history) {
      eventCounts[entry.event] = (eventCounts[entry.event] || 0) + 1;
    }

    return {
      totalEvents: this._history.length,
      uniqueEvents: Object.keys(eventCounts).length,
      listenerCount: this._totalListenerCount(),
      eventCounts,
      oldestEvent: this._history[0]?.timestamp || null,
      newestEvent: this._history[this._history.length - 1]?.timestamp || null
    };
  }

  /**
   * Count total registered listeners
   */
  _totalListenerCount() {
    let count = 0;
    for (const set of this._listeners.values()) count += set.size;
    for (const set of this._onceListeners.values()) count += set.size;
    return count;
  }

  /**
   * Remove all listeners
   */
  removeAll() {
    this._listeners.clear();
    this._onceListeners.clear();
    this._middlewares = [];
  }

  /**
   * Reset everything (listeners + history)
   */
  reset() {
    this.removeAll();
    this._history = [];
  }
}

// Singleton instance
let instance = null;

function getEventBus() {
  if (!instance) {
    instance = new EventBus();
  }
  return instance;
}

function resetEventBus() {
  if (instance) {
    instance.reset();
    instance = null;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === 'test') {
    console.log('[*] EventBus Self-Test');
    console.log('========================\n');

    const bus = new EventBus();
    let received = 0;

    // Test basic emit/on
    bus.on('test:basic', () => received++);
    bus.emit('test:basic', { msg: 'hello' });
    console.log(`[${received === 1 ? '+' : '-'}] Basic emit/on: ${received === 1 ? 'PASS' : 'FAIL'}`);

    // Test once
    bus.once('test:once', () => received++);
    bus.emit('test:once');
    bus.emit('test:once');
    console.log(`[${received === 2 ? '+' : '-'}] Once listener: ${received === 2 ? 'PASS' : 'FAIL'}`);

    // Test wildcard
    bus.on('test:*', () => received++);
    bus.emit('test:wildcard');
    console.log(`[${received === 3 ? '+' : '-'}] Wildcard: ${received === 3 ? 'PASS' : 'FAIL'}`);

    // Test unsubscribe
    const unsub = bus.on('test:unsub', () => received++);
    unsub();
    bus.emit('test:unsub');
    // received stays 3 (no increment from unsub) but wildcard fires (+1 = 4)
    console.log(`[${received === 4 ? '+' : '-'}] Unsubscribe: ${received === 4 ? 'PASS' : 'FAIL'}`);

    // Test history
    const history = bus.getHistory({ namespace: 'test' });
    console.log(`[${history.length === 5 ? '+' : '-'}] History: ${history.length} events recorded`);

    // Test stats
    const stats = bus.getStats();
    console.log(`[+] Stats: ${stats.totalEvents} total, ${stats.uniqueEvents} unique`);

    console.log('\n[+] All tests complete');
  } else {
    console.log(`
NEXUS Event Bus
===============
Usage: node event-bus.js test

Events:
  system:*     - System lifecycle
  provider:*   - Provider status changes
  task:*       - Task routing/execution
  workflow:*   - Workflow execution
  evolution:*  - Learning/evolution
  knowledge:*  - Knowledge updates
`);
  }
}

module.exports = {
  EventBus,
  getEventBus,
  resetEventBus
};
