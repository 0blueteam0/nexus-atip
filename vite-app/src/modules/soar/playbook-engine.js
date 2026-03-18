/**
 * NEXUS ATIP V2.0 - SOAR Playbook Engine
 * Security Orchestration, Automation and Response
 * 127 playbooks across 5 categories
 */

import { eventBus, EVENTS } from '../../core/event-bus.js';
import { dataStore } from '../../core/data-store.js';

// Playbook categories
const PLAYBOOK_CATEGORIES = {
  'incident-response': {
    name: 'Incident Response',
    count: 42,
    description: 'Automated incident triage, containment, and remediation'
  },
  'threat-hunting': {
    name: 'Threat Hunting',
    count: 28,
    description: 'Proactive threat detection and hypothesis-driven hunting'
  },
  'enrichment': {
    name: 'IoC Enrichment',
    count: 31,
    description: 'Automated indicator enrichment from multiple sources'
  },
  'compliance': {
    name: 'Compliance & Audit',
    count: 15,
    description: 'Regulatory compliance checks and audit workflows'
  },
  'notification': {
    name: 'Notification & Escalation',
    count: 11,
    description: 'Alert routing, escalation, and stakeholder notification'
  }
};

// Playbook severity-action mapping
const AUTO_RESPONSE_MATRIX = {
  critical: ['isolate-host', 'block-ip', 'revoke-credentials', 'notify-soc', 'create-incident'],
  high: ['block-ip', 'quarantine-file', 'notify-soc', 'create-incident'],
  medium: ['enrich-ioc', 'log-event', 'notify-analyst'],
  low: ['log-event', 'add-watchlist']
};

class PlaybookEngine {
  constructor() {
    this._playbooks = new Map();
    this._executions = [];
    this._stats = {
      total: 0,
      active: 0,
      executed: 0,
      succeeded: 0,
      failed: 0,
      avgDuration: 0,
      byCategory: {}
    };
  }

  async init() {
    // Initialize category counters
    Object.entries(PLAYBOOK_CATEGORIES).forEach(([cat, config]) => {
      this._stats.byCategory[cat] = {
        total: config.count,
        executed: 0,
        succeeded: 0
      };
      this._stats.total += config.count;
    });

    // Auto-trigger playbooks on detection events
    eventBus.on(EVENTS.DETECTION_TRIGGERED, (data) => this._autoRespond(data));
    eventBus.on(EVENTS.IOC_DETECTED, (data) => this._enrichIoC(data));
    eventBus.on(EVENTS.ANOMALY_DETECTED, (data) => this._handleAnomaly(data));
  }

  /**
   * Register a playbook
   * @param {Object} playbook - Playbook definition
   */
  registerPlaybook(playbook) {
    const id = playbook.id || `pb-${playbook.category}-${Date.now()}`;
    const entry = {
      id,
      ...playbook,
      status: 'registered',
      executionCount: 0,
      lastRun: null,
      createdAt: Date.now()
    };

    this._playbooks.set(id, entry);
    dataStore.add('playbooks', entry);
    return entry;
  }

  /**
   * Execute a playbook
   * @param {string} playbookId - Playbook ID
   * @param {Object} context - Execution context (trigger data)
   */
  async executePlaybook(playbookId, context = {}) {
    const playbook = this._playbooks.get(playbookId);
    if (!playbook) return null;

    const execution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      playbookId,
      playbookName: playbook.name,
      category: playbook.category,
      context,
      status: 'running',
      steps: [],
      startedAt: Date.now(),
      completedAt: null
    };

    this._executions.push(execution);
    this._stats.executed++;
    this._stats.active++;
    playbook.executionCount++;
    playbook.lastRun = Date.now();

    eventBus.emit(EVENTS.PLAYBOOK_STARTED, {
      executionId: execution.id,
      playbookId,
      name: playbook.name
    });

    try {
      // Execute playbook steps sequentially
      if (playbook.steps && playbook.steps.length > 0) {
        for (const step of playbook.steps) {
          const stepResult = await this._executeStep(step, context, execution);
          execution.steps.push(stepResult);

          if (stepResult.status === 'failed' && !step.continueOnError) {
            throw new Error(`Step "${step.name}" failed: ${stepResult.error}`);
          }
        }
      }

      execution.status = 'completed';
      execution.completedAt = Date.now();
      this._stats.succeeded++;

      if (this._stats.byCategory[playbook.category]) {
        this._stats.byCategory[playbook.category].executed++;
        this._stats.byCategory[playbook.category].succeeded++;
      }

      eventBus.emit(EVENTS.PLAYBOOK_COMPLETED, {
        executionId: execution.id,
        playbookId,
        duration: execution.completedAt - execution.startedAt
      });

    } catch (err) {
      execution.status = 'failed';
      execution.error = err.message;
      execution.completedAt = Date.now();
      this._stats.failed++;

      eventBus.emit(EVENTS.PLAYBOOK_FAILED, {
        executionId: execution.id,
        playbookId,
        error: err.message
      });
    }

    this._stats.active--;
    this._updateAvgDuration();
    return execution;
  }

  /**
   * Execute a single playbook step
   */
  async _executeStep(step, context, execution) {
    const result = {
      name: step.name,
      action: step.action,
      status: 'running',
      startedAt: Date.now(),
      output: null,
      error: null
    };

    try {
      switch (step.action) {
        case 'enrich-ioc':
          result.output = this._actionEnrichIoC(context);
          break;
        case 'block-ip':
          result.output = this._actionBlockIP(context);
          break;
        case 'isolate-host':
          result.output = this._actionIsolateHost(context);
          break;
        case 'quarantine-file':
          result.output = this._actionQuarantineFile(context);
          break;
        case 'revoke-credentials':
          result.output = this._actionRevokeCredentials(context);
          break;
        case 'notify-soc':
          result.output = this._actionNotifySOC(context, execution);
          break;
        case 'create-incident':
          result.output = this._actionCreateIncident(context, execution);
          break;
        case 'log-event':
          result.output = this._actionLogEvent(context);
          break;
        case 'add-watchlist':
          result.output = this._actionAddWatchlist(context);
          break;
        default:
          if (step.handler && typeof step.handler === 'function') {
            result.output = await step.handler(context);
          } else {
            result.output = { action: step.action, status: 'simulated' };
          }
      }
      result.status = 'completed';
    } catch (err) {
      result.status = 'failed';
      result.error = err.message;
    }

    result.completedAt = Date.now();
    return result;
  }

  // Action implementations (simulated for modular system)
  _actionEnrichIoC(ctx) {
    const indicator = ctx.indicator || {};
    return {
      action: 'enrich-ioc',
      indicator: indicator.value,
      sources: ['VirusTotal', 'AbuseIPDB', 'Shodan', 'GreyNoise'],
      status: 'enrichment-queued'
    };
  }

  _actionBlockIP(ctx) {
    return {
      action: 'block-ip',
      target: ctx.indicator?.value || ctx.ip,
      firewall: 'perimeter',
      duration: '24h',
      status: 'blocked'
    };
  }

  _actionIsolateHost(ctx) {
    return {
      action: 'isolate-host',
      hostname: ctx.hostname || 'unknown',
      method: 'network-isolation',
      status: 'isolated'
    };
  }

  _actionQuarantineFile(ctx) {
    return {
      action: 'quarantine-file',
      hash: ctx.indicator?.hashes?.['SHA-256'] || ctx.hash,
      status: 'quarantined'
    };
  }

  _actionRevokeCredentials(ctx) {
    return {
      action: 'revoke-credentials',
      account: ctx.account || ctx.indicator?.value,
      status: 'credentials-revoked'
    };
  }

  _actionNotifySOC(ctx, execution) {
    return {
      action: 'notify-soc',
      channel: 'soc-alerts',
      severity: ctx.severity || 'medium',
      executionId: execution.id,
      status: 'notified'
    };
  }

  _actionCreateIncident(ctx, execution) {
    const incident = {
      id: `INC-${Date.now()}`,
      title: ctx.title || `Auto-generated from ${execution.playbookName}`,
      severity: ctx.severity || 'medium',
      status: 'open',
      createdAt: Date.now()
    };
    dataStore.add('incidents', incident);
    return { action: 'create-incident', incident };
  }

  _actionLogEvent(ctx) {
    return { action: 'log-event', logged: true, timestamp: Date.now() };
  }

  _actionAddWatchlist(ctx) {
    return {
      action: 'add-watchlist',
      indicator: ctx.indicator?.value,
      duration: '30d',
      status: 'added'
    };
  }

  /**
   * Auto-respond to detection events based on severity
   */
  _autoRespond(data) {
    const severity = data.rules?.[0]?.severity || 'medium';
    const actions = AUTO_RESPONSE_MATRIX[severity] || AUTO_RESPONSE_MATRIX.low;

    // Find matching playbook or create ad-hoc response
    const steps = actions.map(action => ({
      name: `Auto: ${action}`,
      action,
      continueOnError: true
    }));

    const adhocPlaybook = {
      id: `auto-${Date.now()}`,
      name: `Auto-Response (${severity})`,
      category: 'incident-response',
      trigger: 'detection',
      steps
    };

    this.registerPlaybook(adhocPlaybook);
    this.executePlaybook(adhocPlaybook.id, {
      ...data,
      severity,
      autoTriggered: true
    });
  }

  /**
   * Auto-enrich IoC on detection
   */
  _enrichIoC(data) {
    if (data.indicator) {
      eventBus.emit(EVENTS.IOC_ENRICHED, {
        indicator: data.indicator,
        enrichment: {
          sources: ['auto-enrich'],
          timestamp: Date.now()
        }
      });
    }
  }

  /**
   * Handle anomaly detection
   */
  _handleAnomaly(data) {
    if (data.severity === 'critical' || data.severity === 'high') {
      this._autoRespond({
        ...data,
        rules: [{ severity: data.severity }]
      });
    }
  }

  _updateAvgDuration() {
    const completed = this._executions.filter(e => e.completedAt);
    if (completed.length === 0) return;
    const total = completed.reduce((sum, e) => sum + (e.completedAt - e.startedAt), 0);
    this._stats.avgDuration = Math.round(total / completed.length);
  }

  /**
   * Get playbook execution history
   */
  getExecutions(limit = 50) {
    return this._executions.slice(-limit).reverse();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this._stats,
      categories: PLAYBOOK_CATEGORIES,
      autoResponseMatrix: AUTO_RESPONSE_MATRIX
    };
  }

  /**
   * Query playbooks
   */
  queryPlaybooks(filter = {}) {
    let results = Array.from(this._playbooks.values());
    if (filter.category) results = results.filter(p => p.category === filter.category);
    if (filter.status) results = results.filter(p => p.status === filter.status);
    return results;
  }

  destroy() {
    this._playbooks.clear();
    this._executions = [];
  }
}

export const playbookEngine = new PlaybookEngine();
export default playbookEngine;
