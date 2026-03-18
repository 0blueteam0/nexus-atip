/**
 * NEXUS ATIP V2.0 - Event Bus
 * Inter-module communication via pub/sub pattern
 */

class EventBus {
  constructor() {
    this._listeners = new Map();
    this._history = [];
    this._maxHistory = 100;
  }

  static getInstance() {
    if (!EventBus._instance) {
      EventBus._instance = new EventBus();
    }
    return EventBus._instance;
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name (e.g. 'threat:new', 'ioc:detected')
   * @param {Function} callback - Handler function
   * @param {Object} options - { once: boolean, priority: number }
   * @returns {Function} Unsubscribe function
   */
  on(event, callback, options = {}) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }

    const listener = {
      callback,
      once: options.once || false,
      priority: options.priority || 0
    };

    const listeners = this._listeners.get(event);
    listeners.push(listener);
    listeners.sort((a, b) => b.priority - a.priority);

    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once
   */
  once(event, callback) {
    return this.on(event, callback, { once: true });
  }

  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    if (!this._listeners.has(event)) return;
    const listeners = this._listeners.get(event);
    const idx = listeners.findIndex(l => l.callback === callback);
    if (idx !== -1) listeners.splice(idx, 1);
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event payload
   */
  emit(event, data) {
    const entry = { event, data, timestamp: Date.now() };
    this._history.push(entry);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    if (!this._listeners.has(event)) return;

    const listeners = this._listeners.get(event);
    const toRemove = [];

    for (let i = 0; i < listeners.length; i++) {
      try {
        listeners[i].callback(data, entry);
        if (listeners[i].once) toRemove.push(i);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      listeners.splice(toRemove[i], 1);
    }
  }

  /**
   * Get event history
   */
  getHistory(event = null, limit = 20) {
    const filtered = event
      ? this._history.filter(h => h.event === event)
      : this._history;
    return filtered.slice(-limit);
  }

  /**
   * Clear all listeners
   */
  clear() {
    this._listeners.clear();
    this._history = [];
  }
}

// Predefined event names
export const EVENTS = {
  // Threat Intelligence
  THREAT_NEW:           'threat:new',
  THREAT_UPDATED:       'threat:updated',
  IOC_DETECTED:         'ioc:detected',
  IOC_ENRICHED:         'ioc:enriched',

  // Detection
  DETECTION_TRIGGERED:  'detection:triggered',
  RULE_DEPLOYED:        'detection:rule:deployed',
  RULE_UPDATED:         'detection:rule:updated',

  // SOAR
  PLAYBOOK_STARTED:     'soar:playbook:started',
  PLAYBOOK_COMPLETED:   'soar:playbook:completed',
  PLAYBOOK_FAILED:      'soar:playbook:failed',

  // Feed
  FEED_INGESTED:        'feed:ingested',
  FEED_ERROR:           'feed:error',

  // System
  MODULE_LOADED:        'system:module:loaded',
  MODULE_ERROR:         'system:module:error',
  DASHBOARD_REFRESH:    'system:dashboard:refresh',

  // Knowledge Graph
  GRAPH_UPDATED:        'knowledge:graph:updated',
  CORRELATION_FOUND:    'knowledge:correlation:found',

  // AI/Prediction
  PREDICTION_NEW:       'prediction:new',
  ANOMALY_DETECTED:     'prediction:anomaly'
};

export const eventBus = EventBus.getInstance();
export default eventBus;
