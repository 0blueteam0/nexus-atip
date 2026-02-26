/**
 * NEXUS Policy Mesh - PolicyPort Implementation
 *
 * AOP-style cross-cutting concern interceptor.
 * Wraps all Port calls with permission, rate limiting, and audit.
 *
 * Implements PolicyPort interface:
 *   - check(action, context) -> PolicyDecision
 *   - audit(entry) -> void
 *   - getRules() -> PolicyRule[]
 *
 * @module nexus/policy/mesh
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { PermissionPolicy } = require('./permission-policy');
const { RateGovernor } = require('./rate-governor');
const { AuditTrail } = require('./audit-trail');

const RULES_PATH = path.join(__dirname, 'policy-rules.json');

class PolicyMesh {
  constructor(options = {}) {
    this.permissions = options.permissions || new PermissionPolicy(options);
    this.rateGovernor = options.rateGovernor || new RateGovernor(options);
    this.auditTrail = options.auditTrail || new AuditTrail(options);
    this.rules = this._loadRules();
    this.enabled = options.enabled !== false;
  }

  /**
   * Check if an action is allowed (PolicyPort.check)
   * Combines permission check + rate limit check
   *
   * @param {string} action - Method name being called
   * @param {Object} context - { port, provider, estimatedTokens, estimatedCost }
   * @returns {Promise<Object>} PolicyDecision
   */
  async check(action, context = {}) {
    if (!this.enabled) {
      return { allowed: true, reason: 'Policy mesh disabled' };
    }

    // 1. Permission check
    const permResult = this.permissions.check(action, context);
    if (!permResult.allowed) {
      this.auditTrail.log({
        port: context.port,
        method: action,
        level: 'denied',
        provider: context.provider,
        success: false,
        error: permResult.reason
      });
      return {
        allowed: false,
        reason: permResult.reason,
        level: permResult.level,
        policyType: 'permission'
      };
    }

    // 2. Rate limit check
    const rateResult = this.rateGovernor.check(context);
    if (!rateResult.allowed) {
      this.auditTrail.log({
        port: context.port,
        method: action,
        level: 'rate_limited',
        provider: context.provider,
        success: false,
        error: rateResult.reason
      });
      return {
        allowed: false,
        reason: rateResult.reason,
        remaining: rateResult.remaining,
        policyType: 'rate_limit'
      };
    }

    return {
      allowed: true,
      reason: 'Policy check passed',
      permissionLevel: permResult.level,
      remaining: rateResult.remaining
    };
  }

  /**
   * Record an audit entry (PolicyPort.audit)
   * @param {Object} entry
   */
  async audit(entry) {
    this.auditTrail.log(entry);

    // Record usage for rate governor
    if (entry.success !== false) {
      this.rateGovernor.record({
        provider: entry.provider,
        tokens: entry.tokens || 0,
        cost: entry.cost || 0
      });
    }
  }

  /**
   * Get all policy rules (PolicyPort.getRules)
   * @returns {Array}
   */
  getRules() {
    const rules = [];

    // Permission rules
    if (this.rules.permissions) {
      for (const [name, config] of Object.entries(this.rules.permissions)) {
        rules.push({
          type: 'permission',
          name,
          level: config.level,
          actions: config.actions,
          description: config.description
        });
      }
    }

    // Rate limit rules
    if (this.rules.rateLimits) {
      rules.push({
        type: 'rate_limit',
        name: 'global',
        ...this.rules.rateLimits.global
      });
    }

    return rules;
  }

  /**
   * Get mesh status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      auditStats: this.auditTrail.getStats(),
      rateUsage: this.rateGovernor.getUsage(),
      rulesCount: this.getRules().length
    };
  }

  /**
   * Flush audit trail to disk
   */
  flush() {
    this.auditTrail.flush();
  }

  _loadRules() {
    try {
      if (fs.existsSync(RULES_PATH)) {
        return JSON.parse(fs.readFileSync(RULES_PATH, 'utf-8'));
      }
    } catch (e) { /* skip */ }
    return {};
  }

  static implementsPorts() {
    return ['PolicyPort'];
  }
}

module.exports = { PolicyMesh };
