/**
 * NEXUS ATIP V2.0 - Dashboard Module
 * Main orchestrator for threat intelligence dashboard
 * Aggregates data from all modules for unified display
 */

import { eventBus, EVENTS } from '../../core/event-bus.js';
import { dataStore } from '../../core/data-store.js';
import ATIP_CONFIG from '../../core/config.js';

// Dashboard widget definitions
const WIDGETS = {
  'threat-overview': {
    name: 'Threat Overview',
    position: 'top-left',
    refreshInterval: 30000,
    priority: 1
  },
  'live-feed': {
    name: 'Live Intelligence Feed',
    position: 'top-right',
    refreshInterval: 10000,
    priority: 1
  },
  'mitre-heatmap': {
    name: 'MITRE ATT&CK Heatmap',
    position: 'center',
    refreshInterval: 60000,
    priority: 2
  },
  'detection-status': {
    name: 'Detection Status',
    position: 'mid-left',
    refreshInterval: 15000,
    priority: 2
  },
  'soar-activity': {
    name: 'SOAR Activity',
    position: 'mid-right',
    refreshInterval: 15000,
    priority: 2
  },
  'ioc-stats': {
    name: 'IoC Statistics',
    position: 'bottom-left',
    refreshInterval: 30000,
    priority: 3
  },
  'threat-graph': {
    name: 'Threat Relationship Graph',
    position: 'bottom-center',
    refreshInterval: 60000,
    priority: 3
  },
  'risk-score': {
    name: 'Organization Risk Score',
    position: 'bottom-right',
    refreshInterval: 60000,
    priority: 3
  }
};

class Dashboard {
  constructor() {
    this._widgets = new Map();
    this._timers = new Map();
    this._state = {
      initialized: false,
      lastRefresh: null,
      riskScore: 0,
      alertCount: { critical: 0, high: 0, medium: 0, low: 0 },
      activeThreatActors: 0,
      recentIncidents: [],
      systemHealth: 'healthy'
    };
  }

  async init() {
    // Register all widgets
    Object.entries(WIDGETS).forEach(([id, config]) => {
      this._widgets.set(id, { ...config, id, data: null, lastUpdate: null });
    });

    // Listen for data change events
    eventBus.on(EVENTS.THREAT_NEW, () => this._scheduleRefresh());
    eventBus.on(EVENTS.DETECTION_TRIGGERED, (data) => this._onDetection(data));
    eventBus.on(EVENTS.PLAYBOOK_COMPLETED, () => this._scheduleRefresh());
    eventBus.on(EVENTS.FEED_INGESTED, () => this._scheduleRefresh());
    eventBus.on(EVENTS.CORRELATION_FOUND, () => this._scheduleRefresh());
    eventBus.on(EVENTS.ANOMALY_DETECTED, (data) => this._onAnomaly(data));

    this._state.initialized = true;
    await this.refresh();
  }

  /**
   * Full dashboard refresh - aggregates all module data
   */
  async refresh() {
    const snapshot = {
      timestamp: Date.now(),
      collections: dataStore.stats(),
      alerts: { ...this._state.alertCount },
      riskScore: this._calculateRiskScore(),
      widgets: {}
    };

    // Populate widget data
    snapshot.widgets['threat-overview'] = this._buildThreatOverview();
    snapshot.widgets['live-feed'] = this._buildLiveFeed();
    snapshot.widgets['detection-status'] = this._buildDetectionStatus();
    snapshot.widgets['ioc-stats'] = this._buildIoCStats();
    snapshot.widgets['risk-score'] = { score: snapshot.riskScore };

    // Update widget data
    Object.entries(snapshot.widgets).forEach(([id, data]) => {
      const widget = this._widgets.get(id);
      if (widget) {
        widget.data = data;
        widget.lastUpdate = Date.now();
      }
    });

    this._state.lastRefresh = Date.now();
    this._state.riskScore = snapshot.riskScore;

    eventBus.emit(EVENTS.DASHBOARD_REFRESH, {
      type: 'full-refresh',
      snapshot
    });

    return snapshot;
  }

  /**
   * Build threat overview widget data
   */
  _buildThreatOverview() {
    const actors = dataStore.query('threat-actors');
    const malware = dataStore.query('malware');
    const campaigns = dataStore.query('campaigns');
    const vulnerabilities = dataStore.query('vulnerabilities');

    return {
      threatActors: {
        total: actors.length,
        byOrigin: this._groupBy(actors, 'origin'),
        byMotivation: this._groupBy(actors, 'motivation')
      },
      malware: {
        total: malware.length,
        byType: this._groupBy(malware, 'type')
      },
      campaigns: {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length
      },
      vulnerabilities: {
        total: vulnerabilities.length,
        critical: vulnerabilities.filter(v =>
          v.cvss_score >= 9.0 || v.severity === 'critical'
        ).length
      }
    };
  }

  /**
   * Build live feed widget data
   */
  _buildLiveFeed() {
    // Get most recent items across all collections
    const recentItems = [];
    const collections = ['threat-actors', 'indicators', 'malware', 'vulnerabilities', 'incidents'];

    collections.forEach(col => {
      const items = dataStore.query(col, {}, { sort: '_added:desc', limit: 5 });
      items.forEach(item => {
        recentItems.push({
          collection: col,
          id: item._id,
          name: item.name || item.value || item._id,
          type: item.type,
          addedAt: item._added,
          severity: item.severity || item.cvss_score ? this._cvssToSeverity(item.cvss_score) : 'info',
          tlp: item._tlp || 'WHITE'
        });
      });
    });

    return recentItems
      .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
      .slice(0, 20);
  }

  /**
   * Build detection status widget data
   */
  _buildDetectionStatus() {
    const rules = dataStore.query('detection-rules');
    return {
      totalRules: rules.length,
      deployed: rules.filter(r => r.status === 'deployed').length,
      triggered: rules.filter(r => r.matches > 0).length,
      byType: this._groupBy(rules, 'type'),
      recentDetections: rules
        .filter(r => r.matches > 0)
        .sort((a, b) => b.matches - a.matches)
        .slice(0, 10)
        .map(r => ({ id: r.id, name: r.name, type: r.type, matches: r.matches }))
    };
  }

  /**
   * Build IoC statistics widget data
   */
  _buildIoCStats() {
    const indicators = dataStore.query('indicators');
    return {
      total: indicators.length,
      byType: this._groupBy(indicators, 'type'),
      byTLP: this._groupBy(indicators, '_tlp'),
      bySource: this._groupBy(indicators, '_source'),
      recentCount: indicators.filter(i =>
        i._added && (Date.now() - i._added) < 86400000
      ).length
    };
  }

  /**
   * Calculate organizational risk score (0-100)
   */
  _calculateRiskScore() {
    const weights = {
      criticalAlerts: 30,
      highAlerts: 20,
      activeThreatActors: 15,
      unmitigatedVulns: 20,
      detectionGaps: 15
    };

    const alerts = this._state.alertCount;
    const vulns = dataStore.query('vulnerabilities', v =>
      v.severity === 'critical' && v.status !== 'mitigated'
    );

    let score = 0;
    score += Math.min(alerts.critical * 10, weights.criticalAlerts);
    score += Math.min(alerts.high * 5, weights.highAlerts);
    score += Math.min(this._state.activeThreatActors * 3, weights.activeThreatActors);
    score += Math.min(vulns.length * 4, weights.unmitigatedVulns);

    return Math.min(Math.round(score), 100);
  }

  /**
   * Handle detection event - update alert counters
   */
  _onDetection(data) {
    if (data.rules) {
      data.rules.forEach(rule => {
        const severity = rule.severity || 'medium';
        if (this._state.alertCount[severity] !== undefined) {
          this._state.alertCount[severity]++;
        }
      });
    }
  }

  /**
   * Handle anomaly event
   */
  _onAnomaly(data) {
    if (data.severity === 'critical') {
      this._state.systemHealth = 'degraded';
    }
  }

  /**
   * Schedule a debounced refresh
   */
  _scheduleRefresh() {
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
    this._refreshTimer = setTimeout(() => this.refresh(), 2000);
  }

  /**
   * Get widget data
   */
  getWidgetData(widgetId) {
    const widget = this._widgets.get(widgetId);
    return widget ? widget.data : null;
  }

  /**
   * Get dashboard state
   */
  getState() {
    return {
      ...this._state,
      widgets: Object.fromEntries(this._widgets),
      widgetCount: this._widgets.size
    };
  }

  // Utility helpers
  _groupBy(items, field) {
    const groups = {};
    items.forEach(item => {
      const key = item[field] || 'unknown';
      groups[key] = (groups[key] || 0) + 1;
    });
    return groups;
  }

  _cvssToSeverity(score) {
    if (!score) return 'info';
    if (score >= 9.0) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    return 'low';
  }

  destroy() {
    this._timers.forEach(timer => clearInterval(timer));
    this._timers.clear();
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
  }
}

export const dashboard = new Dashboard();
export default dashboard;
