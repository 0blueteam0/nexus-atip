/**
 * NEXUS Rate Governor
 *
 * Enforces rate limits for token usage, API costs, and call frequency.
 * Based on declarative rules in policy-rules.json.
 *
 * @module nexus/policy/rate-governor
 */

'use strict';

const fs = require('fs');
const path = require('path');

const RULES_PATH = path.join(__dirname, 'policy-rules.json');

class RateGovernor {
  constructor(options = {}) {
    this.rules = this._loadRules();
    this.state = {
      calls: [],        // { timestamp, provider }
      tokensUsed: 0,
      costAccumulated: 0
    };
  }

  /**
   * Check if a call is within rate limits
   * @param {Object} context - { provider, estimatedTokens, estimatedCost }
   * @returns {{ allowed: boolean, reason: string, remaining: Object }}
   */
  check(context = {}) {
    const limits = this.rules.rateLimits || {};
    const now = Date.now();

    // Clean old calls (older than 1 minute)
    this.state.calls = this.state.calls.filter(c => now - c.timestamp < 60000);

    // Global rate limit
    const globalLimit = limits.global?.maxCallsPerMinute || 60;
    if (this.state.calls.length >= globalLimit) {
      return {
        allowed: false,
        reason: `Global rate limit exceeded: ${this.state.calls.length}/${globalLimit} calls/min`,
        remaining: { callsPerMinute: 0 }
      };
    }

    // Per-provider rate limit
    if (context.provider) {
      const providerLimits = limits.perProvider?.[context.provider];
      if (providerLimits) {
        const providerCalls = this.state.calls.filter(c => c.provider === context.provider);
        if (providerCalls.length >= (providerLimits.maxCallsPerMinute || 30)) {
          return {
            allowed: false,
            reason: `Provider rate limit exceeded for ${context.provider}`,
            remaining: { callsPerMinute: 0 }
          };
        }
      }
    }

    // Token budget
    const maxTokens = limits.global?.maxTokensPerSession || 500000;
    if (this.state.tokensUsed + (context.estimatedTokens || 0) > maxTokens) {
      return {
        allowed: false,
        reason: `Token budget exceeded: ${this.state.tokensUsed}/${maxTokens}`,
        remaining: { tokens: maxTokens - this.state.tokensUsed }
      };
    }

    // Cost budget
    const maxCost = limits.global?.maxCostPerSession || 10.0;
    if (this.state.costAccumulated + (context.estimatedCost || 0) > maxCost) {
      return {
        allowed: false,
        reason: `Cost budget exceeded: $${this.state.costAccumulated.toFixed(2)}/$${maxCost.toFixed(2)}`,
        remaining: { cost: maxCost - this.state.costAccumulated }
      };
    }

    return {
      allowed: true,
      reason: 'Within rate limits',
      remaining: {
        callsPerMinute: globalLimit - this.state.calls.length,
        tokens: maxTokens - this.state.tokensUsed,
        cost: maxCost - this.state.costAccumulated
      }
    };
  }

  /**
   * Record a call (after execution)
   * @param {Object} usage - { provider, tokens, cost }
   */
  record(usage = {}) {
    this.state.calls.push({
      timestamp: Date.now(),
      provider: usage.provider || 'unknown'
    });
    this.state.tokensUsed += usage.tokens || 0;
    this.state.costAccumulated += usage.cost || 0;
  }

  /**
   * Get current usage stats
   */
  getUsage() {
    const limits = this.rules.rateLimits?.global || {};
    return {
      callsLastMinute: this.state.calls.filter(c => Date.now() - c.timestamp < 60000).length,
      tokensUsed: this.state.tokensUsed,
      costAccumulated: this.state.costAccumulated,
      limits: {
        maxCallsPerMinute: limits.maxCallsPerMinute || 60,
        maxTokensPerSession: limits.maxTokensPerSession || 500000,
        maxCostPerSession: limits.maxCostPerSession || 10.0
      }
    };
  }

  /**
   * Reset session usage
   */
  reset() {
    this.state = { calls: [], tokensUsed: 0, costAccumulated: 0 };
  }

  _loadRules() {
    try {
      if (fs.existsSync(RULES_PATH)) {
        return JSON.parse(fs.readFileSync(RULES_PATH, 'utf-8'));
      }
    } catch (e) { /* skip */ }
    return { rateLimits: {} };
  }
}

module.exports = { RateGovernor };
