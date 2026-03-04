/**
 * NEXUS Multi-AI Bridge
 *
 * Connects to existing multi-ai-orchestration system:
 * - external-router.js (SERVICE_IDS, TASK_SERVICE_MAP)
 * - consensus-engine.js (cross-verification)
 * - gemini-bridge.js (Gemini subprocess)
 *
 * @module nexus/bridges/multi-ai-bridge
 */

'use strict';

const path = require('path');

const MAO_DIR = path.resolve(__dirname, '../../multi-ai-orchestration');

function tryRequire(modulePath) {
  try { return require(modulePath); } catch (e) { return null; }
}

class MultiAiBridge {
  constructor() {
    this.externalRouter = null;
    this.consensusEngine = null;
    this.geminiBridge = null;
    this.loaded = false;
  }

  init() {
    this.externalRouter = tryRequire(path.join(MAO_DIR, 'external-router'));
    this.consensusEngine = tryRequire(path.join(MAO_DIR, 'consensus-engine'));
    this.geminiBridge = tryRequire(path.join(MAO_DIR, 'gemini-bridge'));
    this.loaded = !!(this.externalRouter || this.consensusEngine || this.geminiBridge);
    return this.loaded;
  }

  /**
   * Get service IDs from external router
   */
  getServiceIds() {
    return this.externalRouter?.SERVICE_IDS || {};
  }

  /**
   * Get task-service mapping
   */
  getTaskServiceMap() {
    return this.externalRouter?.TASK_SERVICE_MAP || {};
  }

  /**
   * Get fallback chains
   */
  getFallbackChains() {
    return this.externalRouter?.FALLBACK_CHAINS || {};
  }

  /**
   * Route via external router
   */
  async routeExternal(request) {
    if (!this.externalRouter?.getRouter) return null;
    const router = this.externalRouter.getRouter();
    return router.route(request);
  }

  /**
   * Run consensus via multi-AI deliberation
   */
  async runConsensus(topic, options = {}) {
    if (!this.consensusEngine?.runConsensus) return null;
    return this.consensusEngine.runConsensus(topic, options);
  }

  /**
   * Query Gemini via existing bridge
   */
  async queryGemini(prompt) {
    if (!this.geminiBridge?.queryGemini) return null;
    const result = await this.geminiBridge.queryGemini(prompt);
    return this.geminiBridge.parseGeminiResponse
      ? this.geminiBridge.parseGeminiResponse(result)
      : result;
  }

  getStatus() {
    return {
      loaded: this.loaded,
      modules: {
        externalRouter: !!this.externalRouter,
        consensusEngine: !!this.consensusEngine,
        geminiBridge: !!this.geminiBridge
      }
    };
  }
}

module.exports = { MultiAiBridge };
