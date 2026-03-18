/**
 * NEXUS ATIP V2.0 - Feed Ingestion Engine
 * Processes STIX 2.1, CSV, JSON feeds from 100+ TI sources
 */

import { eventBus, EVENTS } from '../../core/event-bus.js';
import { dataStore } from '../../core/data-store.js';
import ATIP_CONFIG from '../../core/config.js';

// Feed source templates (from original ATIP system)
const FEED_SOURCES = {
  'alienvault-otx': {
    name: 'AlienVault OTX',
    type: 'stix',
    category: 'threat-intel',
    refreshInterval: 3600000,
    tlp: 'WHITE',
    reliability: 'B',
    confidence: 75
  },
  'abuseipdb': {
    name: 'AbuseIPDB',
    type: 'json',
    category: 'ip-reputation',
    refreshInterval: 1800000,
    tlp: 'GREEN',
    reliability: 'B',
    confidence: 70
  },
  'urlhaus': {
    name: 'URLhaus (abuse.ch)',
    type: 'csv',
    category: 'malware-url',
    refreshInterval: 900000,
    tlp: 'WHITE',
    reliability: 'A',
    confidence: 85
  },
  'mitre-attack': {
    name: 'MITRE ATT&CK',
    type: 'stix',
    category: 'framework',
    refreshInterval: 86400000,
    tlp: 'WHITE',
    reliability: 'A',
    confidence: 95
  },
  'cisa-alerts': {
    name: 'CISA Advisories',
    type: 'json',
    category: 'advisory',
    refreshInterval: 3600000,
    tlp: 'WHITE',
    reliability: 'A',
    confidence: 90
  },
  'nvd-cve': {
    name: 'NVD CVE Database',
    type: 'json',
    category: 'vulnerability',
    refreshInterval: 1800000,
    tlp: 'WHITE',
    reliability: 'A',
    confidence: 95
  },
  'malwarebazaar': {
    name: 'MalwareBazaar',
    type: 'json',
    category: 'malware-sample',
    refreshInterval: 900000,
    tlp: 'WHITE',
    reliability: 'A',
    confidence: 85
  },
  'threatfox': {
    name: 'ThreatFox',
    type: 'json',
    category: 'ioc',
    refreshInterval: 900000,
    tlp: 'GREEN',
    reliability: 'A',
    confidence: 80
  }
};

class FeedEngine {
  constructor() {
    this._feeds = new Map();
    this._timers = new Map();
    this._stats = {
      totalIngested: 0,
      lastIngestion: null,
      bySource: {},
      errors: []
    };
  }

  async init() {
    // Register all feed sources
    Object.entries(FEED_SOURCES).forEach(([id, config]) => {
      this._feeds.set(id, { ...config, id, status: 'idle', lastFetch: null });
    });

    // Listen for manual feed triggers
    eventBus.on('feed:trigger', ({ feedId }) => {
      if (feedId) this.fetchFeed(feedId);
    });
  }

  /**
   * Ingest data from a feed source
   * @param {string} feedId - Feed source identifier
   * @param {Object|Array} rawData - Raw feed data
   */
  async ingest(feedId, rawData) {
    const feed = this._feeds.get(feedId);
    if (!feed) {
      console.warn(`[FeedEngine] Unknown feed: ${feedId}`);
      return;
    }

    try {
      let processed;

      switch (feed.type) {
        case 'stix':
          processed = this._processSTIX(rawData, feed);
          break;
        case 'json':
          processed = this._processJSON(rawData, feed);
          break;
        case 'csv':
          processed = this._processCSV(rawData, feed);
          break;
        default:
          processed = this._processGeneric(rawData, feed);
      }

      // Store processed data
      if (processed.length > 0) {
        const collection = this._mapCategoryToCollection(feed.category);
        dataStore.add(collection, processed);

        this._stats.totalIngested += processed.length;
        this._stats.lastIngestion = Date.now();
        this._stats.bySource[feedId] = (this._stats.bySource[feedId] || 0) + processed.length;

        feed.lastFetch = Date.now();
        feed.status = 'success';

        eventBus.emit(EVENTS.FEED_INGESTED, {
          feedId,
          count: processed.length,
          collection,
          timestamp: Date.now()
        });
      }

      return processed;
    } catch (err) {
      feed.status = 'error';
      this._stats.errors.push({
        feedId,
        error: err.message,
        timestamp: Date.now()
      });

      eventBus.emit(EVENTS.FEED_ERROR, {
        feedId,
        error: err.message
      });

      throw err;
    }
  }

  /**
   * Process STIX 2.1 bundle
   */
  _processSTIX(data, feed) {
    if (data.type === 'bundle' && data.objects) {
      return data.objects.map(obj => ({
        ...obj,
        _source: feed.id,
        _tlp: feed.tlp,
        _confidence: feed.confidence,
        _ingested: Date.now()
      }));
    }
    return Array.isArray(data) ? data : [data];
  }

  /**
   * Process JSON feed data
   */
  _processJSON(data, feed) {
    const items = Array.isArray(data) ? data : data.data || data.results || data.items || [data];
    return items.map(item => ({
      ...item,
      _source: feed.id,
      _tlp: feed.tlp,
      _confidence: feed.confidence,
      _ingested: Date.now()
    }));
  }

  /**
   * Process CSV feed data (pre-parsed as array of objects)
   */
  _processCSV(data, feed) {
    if (!Array.isArray(data)) return [];
    return data.map(row => ({
      ...row,
      _source: feed.id,
      _tlp: feed.tlp,
      _confidence: feed.confidence,
      _ingested: Date.now()
    }));
  }

  /**
   * Process generic feed data
   */
  _processGeneric(data, feed) {
    const items = Array.isArray(data) ? data : [data];
    return items.map(item => ({
      ...item,
      _source: feed.id,
      _tlp: feed.tlp,
      _ingested: Date.now()
    }));
  }

  /**
   * Map feed category to data store collection
   */
  _mapCategoryToCollection(category) {
    const mapping = {
      'threat-intel': 'threat-actors',
      'ip-reputation': 'indicators',
      'malware-url': 'indicators',
      'framework': 'attack-patterns',
      'advisory': 'vulnerabilities',
      'vulnerability': 'vulnerabilities',
      'malware-sample': 'malware',
      'ioc': 'indicators'
    };
    return mapping[category] || 'feeds';
  }

  /**
   * Simulate a feed fetch (for demo/offline mode)
   */
  async fetchFeed(feedId) {
    const feed = this._feeds.get(feedId);
    if (!feed) return null;

    feed.status = 'fetching';
    // In production, this would make HTTP requests to actual TI APIs
    // For now, emit event for UI update
    eventBus.emit('feed:fetching', { feedId, name: feed.name });
    return feed;
  }

  /**
   * Get feed statistics
   */
  getStats() {
    return {
      ...this._stats,
      feeds: Object.fromEntries(this._feeds),
      activeFeedCount: this._feeds.size
    };
  }

  /**
   * Get all registered feeds
   */
  getFeeds() {
    return Array.from(this._feeds.values());
  }

  destroy() {
    this._timers.forEach(timer => clearInterval(timer));
    this._timers.clear();
  }
}

export const feedEngine = new FeedEngine();
export default feedEngine;
