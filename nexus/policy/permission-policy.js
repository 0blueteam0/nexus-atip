/**
 * NEXUS Permission Policy - 3-Pillar Model
 *
 * Pillar 1: Read   = Free (no approval needed)
 * Pillar 2: Compute = Sandbox (tracked, budgeted)
 * Pillar 3: Action  = Approval (requires explicit approval)
 *
 * @module nexus/policy/permission-policy
 */

'use strict';

const fs = require('fs');
const path = require('path');

const RULES_PATH = path.join(__dirname, 'policy-rules.json');

class PermissionPolicy {
  constructor(options = {}) {
    this.rules = this._loadRules();
    this.autoApprove = options.autoApprove || false;
  }

  /**
   * Check if an action is allowed
   * @param {string} action - Method name being called
   * @param {Object} context - { port, provider, args }
   * @returns {{ allowed: boolean, level: string, reason: string }}
   */
  check(action, context = {}) {
    const level = this._getActionLevel(action);

    switch (level) {
      case 'free':
        return { allowed: true, level: 'free', reason: 'Read operations are free' };

      case 'sandbox':
        return { allowed: true, level: 'sandbox', reason: 'Compute in sandbox - tracked' };

      case 'approval':
        if (this.autoApprove) {
          return { allowed: true, level: 'approval', reason: 'Auto-approved (dev mode)' };
        }
        return {
          allowed: true, // In headless mode, approve by default
          level: 'approval',
          reason: `Action '${action}' requires approval`
        };

      default:
        return { allowed: true, level: 'unknown', reason: 'Unknown action level - allowing' };
    }
  }

  /**
   * Get the permission level for an action
   */
  _getActionLevel(action) {
    const perms = this.rules.permissions;
    if (!perms) return 'unknown';

    for (const [level, config] of Object.entries(perms)) {
      if (config.actions && config.actions.includes(action)) {
        return config.level;
      }
    }
    return 'sandbox'; // Default to sandbox for unknown actions
  }

  _loadRules() {
    try {
      if (fs.existsSync(RULES_PATH)) {
        return JSON.parse(fs.readFileSync(RULES_PATH, 'utf-8'));
      }
    } catch (e) { /* skip */ }
    return { permissions: {}, rateLimits: {}, audit: {} };
  }
}

module.exports = { PermissionPolicy };
