/**
 * NEXUS ATIP V2.0 - Unified Data Store
 * Central data access layer with STIX 2.1 support
 */

import { eventBus, EVENTS } from './event-bus.js';
import ATIP_CONFIG from './config.js';

class DataStore {
  constructor() {
    this._collections = new Map();
    this._indexes = new Map();
    this._init();
  }

  static getInstance() {
    if (!DataStore._instance) {
      DataStore._instance = new DataStore();
    }
    return DataStore._instance;
  }

  _init() {
    // Initialize core collections
    const collections = [
      'threat-actors', 'malware', 'indicators', 'vulnerabilities',
      'campaigns', 'attack-patterns', 'detection-rules',
      'playbooks', 'feeds', 'incidents'
    ];
    collections.forEach(name => {
      this._collections.set(name, []);
      this._indexes.set(name, new Map());
    });
  }

  /**
   * Add items to a collection
   * @param {string} collection - Collection name
   * @param {Object|Array} items - STIX objects or data items
   */
  add(collection, items) {
    if (!this._collections.has(collection)) {
      this._collections.set(collection, []);
      this._indexes.set(collection, new Map());
    }

    const arr = Array.isArray(items) ? items : [items];
    const col = this._collections.get(collection);
    const idx = this._indexes.get(collection);

    arr.forEach(item => {
      const id = item.id || item.stix_id || `${collection}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      item._id = id;
      item._added = Date.now();

      // Check for existing (update)
      if (idx.has(id)) {
        const existingIdx = col.findIndex(i => i._id === id);
        if (existingIdx !== -1) {
          col[existingIdx] = { ...col[existingIdx], ...item, _updated: Date.now() };
          eventBus.emit(EVENTS.THREAT_UPDATED, { collection, item: col[existingIdx] });
          return;
        }
      }

      col.push(item);
      idx.set(id, col.length - 1);
    });

    eventBus.emit(EVENTS.THREAT_NEW, { collection, count: arr.length });
    return arr;
  }

  /**
   * Query a collection
   * @param {string} collection - Collection name
   * @param {Object} filter - Query filter { field: value } or function
   * @param {Object} options - { limit, offset, sort }
   */
  query(collection, filter = {}, options = {}) {
    const col = this._collections.get(collection);
    if (!col) return [];

    let results = col;

    // Apply filter
    if (typeof filter === 'function') {
      results = results.filter(filter);
    } else if (Object.keys(filter).length > 0) {
      results = results.filter(item => {
        return Object.entries(filter).every(([key, value]) => {
          if (typeof value === 'string' && value.startsWith('~')) {
            // Fuzzy match
            return String(item[key] || '').toLowerCase().includes(value.slice(1).toLowerCase());
          }
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          return item[key] === value;
        });
      });
    }

    // Sort
    if (options.sort) {
      const [field, dir] = options.sort.split(':');
      results.sort((a, b) => {
        const cmp = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
        return dir === 'desc' ? -cmp : cmp;
      });
    }

    // Pagination
    const offset = options.offset || 0;
    const limit = options.limit || results.length;
    return results.slice(offset, offset + limit);
  }

  /**
   * Get by ID
   */
  get(collection, id) {
    const col = this._collections.get(collection);
    if (!col) return null;
    return col.find(item => item._id === id || item.id === id) || null;
  }

  /**
   * Get collection stats
   */
  stats() {
    const result = {};
    this._collections.forEach((col, name) => {
      result[name] = { count: col.length };
    });
    return result;
  }

  /**
   * Export collection as STIX 2.1 bundle
   */
  exportSTIX(collection) {
    const col = this._collections.get(collection);
    if (!col) return null;

    return {
      type: 'bundle',
      id: `bundle--${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
      spec_version: '2.1',
      created: new Date().toISOString(),
      objects: col.map(item => {
        const { _id, _added, _updated, ...stixObj } = item;
        return stixObj;
      })
    };
  }

  /**
   * Import STIX 2.1 bundle
   */
  importSTIX(bundle, targetCollection = null) {
    if (bundle.type !== 'bundle' || !bundle.objects) {
      throw new Error('Invalid STIX 2.1 bundle');
    }

    const imported = { total: 0, byType: {} };

    bundle.objects.forEach(obj => {
      const collection = targetCollection || obj.type || 'unknown';
      this.add(collection, obj);
      imported.total++;
      imported.byType[collection] = (imported.byType[collection] || 0) + 1;
    });

    eventBus.emit(EVENTS.FEED_INGESTED, imported);
    return imported;
  }

  /**
   * Clear a collection
   */
  clear(collection) {
    if (collection) {
      this._collections.set(collection, []);
      this._indexes.set(collection, new Map());
    } else {
      this._init();
    }
  }
}

export const dataStore = DataStore.getInstance();
export default dataStore;
