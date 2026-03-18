/**
 * NEXUS ATIP V2.0 - Detection Rule Engine
 * Manages Sigma, YARA, Suricata/Snort rules with Detection-as-Code CI/CD
 */

import { eventBus, EVENTS } from '../../core/event-bus.js';
import { dataStore } from '../../core/data-store.js';

// Rule type definitions
const RULE_TYPES = {
  sigma: {
    name: 'Sigma',
    extension: '.yml',
    totalRules: 4827,
    description: 'Generic Signature Format for SIEM Systems'
  },
  yara: {
    name: 'YARA',
    extension: '.yar',
    totalRules: 2193,
    description: 'Malware Pattern Matching Rules'
  },
  suricata: {
    name: 'Suricata/Snort',
    extension: '.rules',
    totalRules: 7872,
    description: 'Network Intrusion Detection Rules'
  },
  kql: {
    name: 'KQL',
    extension: '.kql',
    totalRules: 1245,
    description: 'Kusto Query Language for Azure/Elastic'
  }
};

// MITRE ATT&CK technique to rule mapping
const TECHNIQUE_COVERAGE = {
  'T1566': { sigma: 12, yara: 5, suricata: 8, description: 'Phishing' },
  'T1059': { sigma: 28, yara: 15, suricata: 3, description: 'Command & Scripting Interpreter' },
  'T1053': { sigma: 8, yara: 2, suricata: 0, description: 'Scheduled Task/Job' },
  'T1078': { sigma: 15, yara: 0, suricata: 5, description: 'Valid Accounts' },
  'T1021': { sigma: 10, yara: 0, suricata: 12, description: 'Remote Services' },
  'T1055': { sigma: 18, yara: 22, suricata: 0, description: 'Process Injection' },
  'T1003': { sigma: 14, yara: 8, suricata: 0, description: 'OS Credential Dumping' },
  'T1486': { sigma: 6, yara: 35, suricata: 4, description: 'Data Encrypted for Impact' },
  'T1082': { sigma: 5, yara: 3, suricata: 2, description: 'System Information Discovery' },
  'T1071': { sigma: 7, yara: 0, suricata: 25, description: 'Application Layer Protocol' }
};

class RuleEngine {
  constructor() {
    this._rules = new Map();
    this._deployedRules = new Set();
    this._ruleStats = {
      total: 0,
      deployed: 0,
      triggered: 0,
      byType: {},
      lastUpdate: null
    };
  }

  async init() {
    // Initialize rule type counters
    Object.entries(RULE_TYPES).forEach(([type, config]) => {
      this._ruleStats.byType[type] = {
        total: config.totalRules,
        deployed: 0,
        triggered: 0
      };
      this._ruleStats.total += config.totalRules;
    });

    // Listen for detection events
    eventBus.on(EVENTS.IOC_DETECTED, (data) => this._handleIoCDetection(data));
  }

  /**
   * Add a detection rule
   * @param {Object} rule - Rule definition
   */
  addRule(rule) {
    const id = rule.id || `rule-${rule.type}-${Date.now()}`;
    const entry = {
      id,
      ...rule,
      status: 'pending',
      createdAt: Date.now(),
      matches: 0
    };

    this._rules.set(id, entry);
    dataStore.add('detection-rules', entry);
    return entry;
  }

  /**
   * Deploy a rule (activate for matching)
   * @param {string} ruleId - Rule ID
   */
  deployRule(ruleId) {
    const rule = this._rules.get(ruleId);
    if (!rule) return null;

    rule.status = 'deployed';
    rule.deployedAt = Date.now();
    this._deployedRules.add(ruleId);
    this._ruleStats.deployed++;

    if (this._ruleStats.byType[rule.type]) {
      this._ruleStats.byType[rule.type].deployed++;
    }

    eventBus.emit(EVENTS.RULE_DEPLOYED, { ruleId, type: rule.type, name: rule.name });
    return rule;
  }

  /**
   * Match indicators against deployed rules
   * @param {Object} indicator - IoC to match
   * @returns {Array} Matching rules
   */
  matchIndicator(indicator) {
    const matches = [];

    this._deployedRules.forEach(ruleId => {
      const rule = this._rules.get(ruleId);
      if (!rule) return;

      if (this._evaluateRule(rule, indicator)) {
        rule.matches++;
        this._ruleStats.triggered++;
        if (this._ruleStats.byType[rule.type]) {
          this._ruleStats.byType[rule.type].triggered++;
        }
        matches.push(rule);
      }
    });

    if (matches.length > 0) {
      eventBus.emit(EVENTS.DETECTION_TRIGGERED, {
        indicator,
        matchCount: matches.length,
        rules: matches.map(r => ({ id: r.id, name: r.name, type: r.type, severity: r.severity }))
      });
    }

    return matches;
  }

  /**
   * Evaluate a rule against an indicator
   */
  _evaluateRule(rule, indicator) {
    if (!rule.conditions) return false;

    return rule.conditions.some(condition => {
      switch (condition.type) {
        case 'ip':
          return indicator.type === 'ipv4-addr' && condition.values.includes(indicator.value);
        case 'domain':
          return indicator.type === 'domain-name' && condition.values.includes(indicator.value);
        case 'hash':
          return indicator.type === 'file' && condition.values.includes(indicator.hashes?.['SHA-256']);
        case 'pattern':
          return new RegExp(condition.regex, 'i').test(JSON.stringify(indicator));
        case 'mitre':
          return indicator.mitre_techniques?.some(t => condition.techniques.includes(t));
        default:
          return false;
      }
    });
  }

  /**
   * Handle IoC detection from other modules
   */
  _handleIoCDetection(data) {
    if (data.indicator) {
      this.matchIndicator(data.indicator);
    }
  }

  /**
   * Get MITRE ATT&CK technique coverage
   */
  getTechniqueCoverage() {
    return TECHNIQUE_COVERAGE;
  }

  /**
   * Get rule statistics
   */
  getStats() {
    return {
      ...this._ruleStats,
      ruleTypes: RULE_TYPES,
      techniqueCoverage: Object.keys(TECHNIQUE_COVERAGE).length
    };
  }

  /**
   * Query rules
   */
  queryRules(filter = {}) {
    let results = Array.from(this._rules.values());

    if (filter.type) results = results.filter(r => r.type === filter.type);
    if (filter.status) results = results.filter(r => r.status === filter.status);
    if (filter.severity) results = results.filter(r => r.severity === filter.severity);
    if (filter.mitre) results = results.filter(r => r.mitreTechniques?.includes(filter.mitre));

    return results;
  }

  destroy() {
    this._rules.clear();
    this._deployedRules.clear();
  }
}

export const ruleEngine = new RuleEngine();
export default ruleEngine;
