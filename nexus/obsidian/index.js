/**
 * NEXUS Obsidian Integration - Main Entry Point
 *
 * Provides unified access to Obsidian bridge, event writer, and memory bridge.
 * Handles initialization and configuration from nexus.config.json.
 *
 * @module nexus/obsidian
 */

'use strict';

const path = require('path');
const { ObsidianBridge } = require('./bridge');
const { EventWriter } = require('./event-writer');
const { MemoryBridge } = require('./memory-bridge');
const { templates } = require('./templates');
const { getEventBus } = require('../core/event-bus');

let _instance = null;

class ObsidianIntegration {
  /**
   * @param {Object} config - Obsidian config section from nexus.config.json
   */
  constructor(config = {}) {
    this._config = config;
    this._bridge = null;
    this._eventWriter = null;
    this._memoryBridge = null;
    this._initialized = false;
    this._bus = getEventBus();
  }

  /**
   * Initialize all Obsidian components
   * @returns {Promise<{ok: boolean, available: boolean}>}
   */
  async init() {
    if (this._initialized) return { ok: true, available: this._bridge._available };

    // Create bridge
    this._bridge = new ObsidianBridge({
      port: this._config.port || 27124,
      host: this._config.host || '127.0.0.1',
      apiKey: this._config.apiKey || '',
      vaultPath: this._config.vaultPath || '',
      basePath: this._config.basePath || 'NEXUS',
      insecure: this._config.insecure !== false
    });

    // Check availability
    const available = await this._bridge.isAvailable();

    // Set sync mode
    const mode = this._config.syncMode || 'batch';
    this._bridge.setBatchMode(mode !== 'realtime');

    // Create event writer
    const autoSubscribe = available && mode !== 'manual';
    this._eventWriter = new EventWriter(this._bridge, {
      basePath: this._config.basePath || 'NEXUS',
      autoSubscribe
    });

    // If realtime mode, also register as middleware
    if (available && mode === 'realtime') {
      this._bus.use(this._eventWriter.asMiddleware());
    }

    // Create memory bridge
    this._memoryBridge = new MemoryBridge(this._bridge, {
      basePath: this._config.basePath || 'NEXUS'
    });

    this._initialized = true;

    this._bus.emit('obsidian:initialized', { available, mode });

    return { ok: true, available };
  }

  /**
   * Initialize vault folder structure and create initial notes
   * @param {Object} providers - Provider config from nexus.config.json
   * @returns {Promise<{ok: boolean}>}
   */
  async initVault(providers = {}) {
    if (!this._bridge) await this.init();

    // Create folder structure
    const folderResult = await this._bridge.initVault();

    // Create Dashboard MOC
    const dashboard = templates.dashboard();
    await this._bridge.putNote('NEXUS/Dashboard.md', dashboard);

    // Create README
    const readme = [
      '# NEXUS Obsidian Vault',
      '',
      'This vault is auto-populated by the NEXUS AI orchestration system.',
      '',
      '## Folders',
      '- **Sessions/**: AI session records',
      '- **Tasks/**: Individual task tracking',
      '- **Knowledge/**: Learned patterns and insights',
      '- **Checkpoints/**: Graph savepoints',
      '- **Providers/**: Provider status and stats',
      '- **Costs/**: Daily cost reports',
      '- **Events/**: Raw event logs',
      '',
      '## Required Plugins',
      '- Dataview (for Dashboard queries)',
      '- Local REST API (for NEXUS sync)',
      '',
      '## Links',
      '- [[NEXUS/Dashboard|Dashboard]]',
      ''
    ].join('\n');
    await this._bridge.putNote('README.md', readme);

    // Write provider notes
    if (Object.keys(providers).length > 0) {
      await this._eventWriter.writeProviderNotes(providers);
    }

    // Flush all
    await this._bridge.flush();

    return { ok: true, folders: folderResult.folders };
  }

  /**
   * Manual sync (for batch/manual mode)
   * @param {Object} options - { session, evolution, providers }
   */
  async sync(options = {}) {
    if (!this._initialized) await this.init();
    if (!this._bridge._available && !this._bridge._vaultPath) {
      return { ok: false, reason: 'Obsidian not available and no vault path' };
    }

    const results = { session: null, evolution: null, memory: null };

    // Sync session data
    if (options.session) {
      results.session = await this._eventWriter.writeSessionNote(options.session);
    }

    // Sync evolution state
    if (options.evolution) {
      results.evolution = await this._memoryBridge.syncEvolution(options.evolution);
    }

    // Sync providers
    if (options.providers) {
      await this._eventWriter.writeProviderNotes(options.providers);
    }

    // Full memory sync
    results.memory = await this._memoryBridge.fullSync();

    // Write daily cost report
    await this._eventWriter._writeDailyCostReport();

    // Flush
    await this._bridge.flush();

    return { ok: true, ...results };
  }

  /**
   * Regenerate Dashboard.md
   */
  async regenerateDashboard() {
    if (!this._initialized) await this.init();
    const dashboard = templates.dashboard();
    await this._bridge.putNote('NEXUS/Dashboard.md', dashboard);
    await this._bridge.flush();
    return { ok: true };
  }

  /**
   * Get overall status
   */
  getStatus() {
    return {
      initialized: this._initialized,
      bridge: this._bridge ? this._bridge.getStatus() : null,
      eventWriter: this._eventWriter ? this._eventWriter.getStats() : null,
      memoryBridge: this._memoryBridge ? this._memoryBridge.getStatus() : null,
      config: {
        syncMode: this._config.syncMode || 'batch',
        basePath: this._config.basePath || 'NEXUS'
      }
    };
  }

  /**
   * Cleanup
   */
  async destroy() {
    if (this._eventWriter) this._eventWriter.unsubscribe();
    if (this._bridge) await this._bridge.destroy();
    this._initialized = false;
  }
}

/**
 * Get or create singleton ObsidianIntegration
 * @param {Object} config - Config from nexus.config.json
 * @returns {ObsidianIntegration}
 */
function getObsidianIntegration(config) {
  if (!_instance) {
    _instance = new ObsidianIntegration(config);
  }
  return _instance;
}

function resetObsidianIntegration() {
  if (_instance) {
    _instance.destroy().catch(() => {});
    _instance = null;
  }
}

module.exports = {
  ObsidianIntegration,
  getObsidianIntegration,
  resetObsidianIntegration
};
