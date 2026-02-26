/**
 * NEXUS Gemini CLI Adapter
 *
 * Wraps gemini.bat for headless CLI queries.
 * Also bridges to existing multi-ai-orchestration/gemini-bridge.js.
 *
 * @module nexus/adapters/gemini-adapter
 */

'use strict';

const { execFile } = require('child_process');
const path = require('path');
const { BaseAdapter } = require('./base-adapter');

const GEMINI_BAT = 'K:/PortableApps/genai/gemini.bat';

// Try to load existing bridge for MCP-mode queries
let geminiBridge = null;
try {
  geminiBridge = require('../../multi-ai-orchestration/gemini-bridge');
} catch (e) {
  // Bridge not available, CLI-only mode
}

class GeminiAdapter extends BaseAdapter {
  constructor(config = {}) {
    super('gemini-cli', {
      command: GEMINI_BAT,
      strengths: ['web_search', '1M_context', 'fast_response', 'multimodal', 'large_file_analysis'],
      weaknesses: ['occasional_hallucination', 'limited_tool_use'],
      cost_tier: 'free',
      context: 1000000,
      role: 'collaborator',
      ...config
    });
    this.bridge = geminiBridge;
  }

  /**
   * Execute Gemini CLI in headless mode
   */
  async _execute(prompt, options = {}) {
    const timeout = options.timeout || 60000;

    // If bridge available and preferred, use it
    if (options.useBridge && this.bridge) {
      return this._executeBridge(prompt, options);
    }

    return new Promise((resolve, reject) => {
      const proc = execFile(GEMINI_BAT, [prompt], {
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        cwd: 'K:/PortableApps/genai',
        windowsHide: true
      }, (err, stdout, stderr) => {
        if (err) {
          if (err.killed) {
            reject(new Error(`Gemini CLI timeout after ${timeout}ms`));
          } else {
            reject(new Error(`Gemini CLI error: ${err.message}`));
          }
          return;
        }
        resolve(stdout.trim());
      });
    });
  }

  /**
   * Execute via existing gemini-bridge.js
   */
  async _executeBridge(prompt, options) {
    if (!this.bridge) {
      throw new Error('Gemini bridge not available');
    }

    const result = await this.bridge.queryGemini(prompt);
    return this.bridge.parseGeminiResponse
      ? this.bridge.parseGeminiResponse(result)
      : result;
  }

  /**
   * Health check
   */
  async _healthCheck() {
    const fs = require('fs');
    return fs.existsSync(GEMINI_BAT);
  }

  static implementsPorts() {
    return ['ModelRouterPort'];
  }
}

module.exports = { GeminiAdapter };
