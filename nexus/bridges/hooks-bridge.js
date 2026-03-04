/**
 * NEXUS Hooks Bridge
 *
 * Integrates NEXUS with Claude Code hooks system.
 * Registers nexus-init, nexus-route, nexus-learn hooks
 * in .claude-hooks.json.
 *
 * @module nexus/bridges/hooks-bridge
 */

'use strict';

const fs = require('fs');
const path = require('path');

const HOOKS_PATH = path.resolve(__dirname, '../../.claude-hooks.json');
const NEXUS_ROOT = path.resolve(__dirname, '..');

class HooksBridge {
  constructor() {
    this.registered = false;
  }

  /**
   * Read current hooks configuration
   */
  readHooks() {
    try {
      if (fs.existsSync(HOOKS_PATH)) {
        return JSON.parse(fs.readFileSync(HOOKS_PATH, 'utf8'));
      }
    } catch (e) {}
    return {};
  }

  /**
   * Check if NEXUS hooks are already registered
   */
  isRegistered() {
    const hooks = this.readHooks();
    return !!(hooks.SessionStart?.some(h => h.id === 'nexus-init') ||
              hooks.PostToolUse?.some(h => h.id === 'nexus-route'));
  }

  /**
   * Get hook definitions (for reference - not auto-installing)
   */
  getHookDefinitions() {
    const node = 'K:/PortableApps/tools/nodejs/node.exe';
    return {
      SessionStart: {
        id: 'nexus-init',
        type: 'command',
        command: `${node} ${NEXUS_ROOT}/core/orchestrator.js init`,
        timeout: 10000
      },
      SessionEnd: {
        id: 'nexus-learn',
        type: 'command',
        command: `${node} ${NEXUS_ROOT}/core/orchestrator.js evolve`,
        timeout: 15000
      }
    };
  }

  getStatus() {
    return {
      hooksPath: HOOKS_PATH,
      hooksExist: fs.existsSync(HOOKS_PATH),
      nexusRegistered: this.isRegistered(),
      hookDefinitions: this.getHookDefinitions()
    };
  }
}

module.exports = { HooksBridge };
