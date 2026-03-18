/**
 * NEXUS Plugin Manifest - Claude Code Plugin Integration
 *
 * Generates and manages the manifest for registering NEXUS
 * as a Claude Code plugin. Handles hooks.json auto-configuration
 * and settings.json plugin registration.
 *
 * @module nexus/claude-features/plugin-manifest
 */

'use strict';

const path = require('path');
const fs = require('fs');

const NEXUS_ROOT = path.join(__dirname, '..');
const PROJECT_ROOT = path.join(NEXUS_ROOT, '..');

class PluginManifest {
  constructor() {
    this._manifest = null;
  }

  /**
   * Generate the NEXUS plugin manifest
   * @returns {Object} Plugin manifest
   */
  generate() {
    this._manifest = {
      name: 'nexus',
      version: '3.0.0',
      description: 'NEXUS - Network of Evolving eXtensible Unified Services',
      author: 'NEXUS System',
      entry: 'nexus/core/cli.js',
      hooks: {
        SessionStart: {
          command: 'node nexus/core/session-start.js',
          description: 'Initialize NEXUS session, load evolution state'
        },
        SessionEnd: {
          command: 'node nexus/core/session-end.js',
          description: 'Save evolution state, record session metrics'
        },
        PreToolUse: {
          command: 'node nexus/core/cli.js route',
          description: 'Route tasks through NEXUS orchestrator'
        }
      },
      commands: [
        { name: 'nexus init', description: 'Initialize NEXUS session' },
        { name: 'nexus status', description: 'Full system status' },
        { name: 'nexus route', description: 'Route a task to optimal provider' },
        { name: 'nexus evolve', description: 'Show evolution state' },
        { name: 'nexus ecosystem', description: '7-Layer ecosystem overview' },
        { name: 'nexus monitor', description: 'Start monitoring dashboard' },
        { name: 'nexus checkpoint', description: 'Manage checkpoints' },
        { name: 'nexus team', description: 'Agent Teams management' }
      ],
      capabilities: [
        'task_routing',
        'multi_provider',
        'evolution_learning',
        'graph_execution',
        'checkpointing',
        'agent_teams',
        'monitoring'
      ],
      settings: {
        preferLangGraph: false,
        autoApproveHITL: true,
        monitorPort: 7850,
        maxTeamSize: 8
      }
    };

    return this._manifest;
  }

  /**
   * Write manifest to disk
   * @param {string} [outputPath]
   */
  write(outputPath) {
    const manifest = this._manifest || this.generate();
    const filePath = outputPath || path.join(NEXUS_ROOT, 'plugin-manifest.json');
    fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2));
    return filePath;
  }

  /**
   * Get generated manifest
   */
  getManifest() {
    return this._manifest || this.generate();
  }
}

module.exports = { PluginManifest };
