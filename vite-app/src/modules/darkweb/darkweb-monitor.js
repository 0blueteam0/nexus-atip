/**
 * NEXUS ATIP V2.0 - Dark Web Monitor
 * Monitors underground forums, marketplaces, and paste sites
 * Tracks credential leaks, data breaches, and threat actor activity
 */

import { eventBus, EVENTS } from '../../core/event-bus.js';
import { dataStore } from '../../core/data-store.js';

// Monitoring source categories
const MONITOR_SOURCES = {
  forums: {
    name: 'Underground Forums',
    count: 47,
    examples: ['XSS.is', 'Exploit.in', 'BreachForums', 'Ramp Forum'],
    type: 'forum'
  },
  marketplaces: {
    name: 'Dark Marketplaces',
    count: 23,
    examples: ['Russian Market', 'Genesis Market', '2easy Shop'],
    type: 'marketplace'
  },
  pasteSites: {
    name: 'Paste Sites',
    count: 12,
    examples: ['Pastebin', 'Ghostbin', 'PrivateBin'],
    type: 'paste'
  },
  telegram: {
    name: 'Telegram Channels',
    count: 89,
    examples: ['Ransomware leak channels', 'Data trading groups'],
    type: 'messaging'
  },
  ransomLeaks: {
    name: 'Ransomware Leak Sites',
    count: 34,
    examples: ['LockBit Blog', 'Cl0p Leak Site', 'ALPHV/BlackCat'],
    type: 'leak-site'
  }
};

// Alert types
const ALERT_TYPES = {
  'credential-leak': { severity: 'critical', description: 'Organization credentials found' },
  'data-breach': { severity: 'critical', description: 'Organization data exposed' },
  'brand-mention': { severity: 'high', description: 'Organization mentioned in threat context' },
  'executive-target': { severity: 'critical', description: 'Executive targeted or mentioned' },
  'domain-listing': { severity: 'high', description: 'Organization domain listed for sale' },
  'vulnerability-exploit': { severity: 'high', description: 'Active exploit for org vulnerability' },
  'ransomware-listing': { severity: 'critical', description: 'Listed on ransomware leak site' },
  'access-sale': { severity: 'critical', description: 'Network access for sale' }
};

class DarkwebMonitor {
  constructor() {
    this._monitors = new Map();
    this._alerts = [];
    this._watchlist = new Map();
    this._stats = {
      totalSources: 0,
      activeMonitors: 0,
      alertsGenerated: 0,
      credentialsFound: 0,
      breachesDetected: 0,
      lastScan: null,
      bySource: {}
    };
  }

  async init() {
    // Initialize monitor sources
    Object.entries(MONITOR_SOURCES).forEach(([id, config]) => {
      this._monitors.set(id, {
        ...config,
        id,
        status: 'active',
        lastCheck: null,
        findings: 0
      });
      this._stats.totalSources += config.count;
      this._stats.activeMonitors++;
      this._stats.bySource[id] = { findings: 0, alerts: 0 };
    });

    // Listen for relevant events
    eventBus.on(EVENTS.THREAT_NEW, (data) => this._checkThreatRelevance(data));
  }

  /**
   * Add organization/keyword to watchlist
   * @param {Object} entry - Watchlist entry { type, value, priority }
   */
  addToWatchlist(entry) {
    const id = `watch-${entry.type}-${Date.now()}`;
    const watchItem = {
      id,
      ...entry,
      addedAt: Date.now(),
      alertCount: 0,
      lastAlert: null
    };

    this._watchlist.set(id, watchItem);
    return watchItem;
  }

  /**
   * Process dark web finding
   * @param {Object} finding - Raw finding data
   */
  processFinding(finding) {
    const processed = {
      id: finding.id || `dw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: finding.source,
      sourceType: finding.sourceType || 'unknown',
      title: finding.title,
      content: finding.content,
      url: finding.url,
      author: finding.author,
      timestamp: finding.timestamp || Date.now(),
      processedAt: Date.now(),
      relevance: 0,
      alerts: []
    };

    // Check against watchlist
    this._watchlist.forEach((watchItem) => {
      const matchScore = this._calculateRelevance(processed, watchItem);
      if (matchScore > 0.5) {
        processed.relevance = Math.max(processed.relevance, matchScore);
        const alert = this._generateAlert(processed, watchItem, matchScore);
        processed.alerts.push(alert);
      }
    });

    // Update stats
    const sourceId = this._findSourceId(processed.sourceType);
    if (sourceId && this._stats.bySource[sourceId]) {
      this._stats.bySource[sourceId].findings++;
    }

    // Store if relevant
    if (processed.relevance > 0.3) {
      dataStore.add('feeds', {
        ...processed,
        _source: 'darkweb-monitor',
        _tlp: 'AMBER'
      });
    }

    return processed;
  }

  /**
   * Calculate relevance of finding against watchlist item
   */
  _calculateRelevance(finding, watchItem) {
    const text = `${finding.title || ''} ${finding.content || ''}`.toLowerCase();
    const searchValue = watchItem.value.toLowerCase();

    if (!text || !searchValue) return 0;

    // Direct match
    if (text.includes(searchValue)) {
      return watchItem.priority === 'critical' ? 1.0 : 0.8;
    }

    // Partial match (individual words)
    const words = searchValue.split(/\s+/);
    const matchedWords = words.filter(w => text.includes(w));
    const ratio = matchedWords.length / words.length;

    return ratio * (watchItem.priority === 'critical' ? 0.9 : 0.7);
  }

  /**
   * Generate alert from finding
   */
  _generateAlert(finding, watchItem, score) {
    const alertType = this._classifyAlertType(finding, watchItem);
    const alertConfig = ALERT_TYPES[alertType] || ALERT_TYPES['brand-mention'];

    const alert = {
      id: `alert-dw-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
      type: alertType,
      severity: alertConfig.severity,
      description: alertConfig.description,
      finding: {
        id: finding.id,
        source: finding.source,
        title: finding.title,
        url: finding.url
      },
      watchItem: {
        id: watchItem.id,
        type: watchItem.type,
        value: watchItem.value
      },
      relevanceScore: score,
      createdAt: Date.now(),
      status: 'new',
      acknowledged: false
    };

    this._alerts.push(alert);
    this._stats.alertsGenerated++;

    watchItem.alertCount++;
    watchItem.lastAlert = Date.now();

    // Update specific counters
    if (alertType === 'credential-leak') this._stats.credentialsFound++;
    if (alertType === 'data-breach') this._stats.breachesDetected++;

    const sourceId = this._findSourceId(finding.sourceType);
    if (sourceId && this._stats.bySource[sourceId]) {
      this._stats.bySource[sourceId].alerts++;
    }

    eventBus.emit(EVENTS.ANOMALY_DETECTED, {
      type: 'darkweb-alert',
      severity: alertConfig.severity,
      alert
    });

    return alert;
  }

  /**
   * Classify alert type based on finding content
   */
  _classifyAlertType(finding, watchItem) {
    const text = `${finding.title || ''} ${finding.content || ''}`.toLowerCase();

    if (text.includes('credential') || text.includes('password') || text.includes('login')) {
      return 'credential-leak';
    }
    if (text.includes('breach') || text.includes('dump') || text.includes('database')) {
      return 'data-breach';
    }
    if (text.includes('ransomware') || text.includes('leak site') || text.includes('encrypted')) {
      return 'ransomware-listing';
    }
    if (text.includes('access') && (text.includes('sale') || text.includes('sell') || text.includes('buy'))) {
      return 'access-sale';
    }
    if (text.includes('exploit') || text.includes('cve-') || text.includes('0day')) {
      return 'vulnerability-exploit';
    }
    if (text.includes('domain') && (text.includes('sale') || text.includes('available'))) {
      return 'domain-listing';
    }
    if (watchItem.type === 'executive') {
      return 'executive-target';
    }

    return 'brand-mention';
  }

  /**
   * Check if new threat data is relevant to dark web monitoring
   */
  _checkThreatRelevance(data) {
    if (data.collection === 'threat-actors' && data.item) {
      const actor = data.item;
      if (actor.dark_web_presence || actor.forums || actor.leak_site) {
        this._stats.lastScan = Date.now();
      }
    }
  }

  _findSourceId(sourceType) {
    for (const [id, monitor] of this._monitors) {
      if (monitor.type === sourceType) return id;
    }
    return null;
  }

  /**
   * Get active alerts
   */
  getAlerts(filter = {}) {
    let results = [...this._alerts];
    if (filter.severity) results = results.filter(a => a.severity === filter.severity);
    if (filter.type) results = results.filter(a => a.type === filter.type);
    if (filter.status) results = results.filter(a => a.status === filter.status);
    if (filter.limit) results = results.slice(-filter.limit);
    return results.reverse();
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this._alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.status = 'acknowledged';
      alert.acknowledgedAt = Date.now();
    }
    return alert;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this._stats,
      sources: MONITOR_SOURCES,
      alertTypes: ALERT_TYPES,
      watchlistSize: this._watchlist.size,
      pendingAlerts: this._alerts.filter(a => !a.acknowledged).length
    };
  }

  /**
   * Get watchlist
   */
  getWatchlist() {
    return Array.from(this._watchlist.values());
  }

  destroy() {
    this._monitors.clear();
    this._watchlist.clear();
    this._alerts = [];
  }
}

export const darkwebMonitor = new DarkwebMonitor();
export default darkwebMonitor;
