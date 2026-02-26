/**
 * NEXUS Codex CLI Adapter
 *
 * Wraps codex.bat for autonomous coding tasks.
 * Supports full-auto approval mode for sandboxed execution.
 *
 * @module nexus/adapters/codex-adapter
 */

'use strict';

const { execFile } = require('child_process');
const path = require('path');
const { BaseAdapter } = require('./base-adapter');

const CODEX_BAT = 'K:/PortableApps/genai/codex.bat';

class CodexAdapter extends BaseAdapter {
  constructor(config = {}) {
    super('codex-cli', {
      command: CODEX_BAT,
      strengths: ['autonomous_coding', 'sandboxed_execution', 'fast_iteration', 'full_auto_mode'],
      weaknesses: ['api_cost', 'limited_context'],
      cost_tier: 'api_usage',
      context: 128000,
      role: 'specialist',
      ...config
    });
  }

  /**
   * Execute Codex CLI
   */
  async _execute(prompt, options = {}) {
    const timeout = options.timeout || 120000;
    const approvalMode = options.approvalMode || 'suggest';

    const args = ['--approval-mode', approvalMode, prompt];

    return new Promise((resolve, reject) => {
      const proc = execFile(CODEX_BAT, args, {
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        cwd: options.cwd || 'K:/PortableApps/genai',
        windowsHide: true
      }, (err, stdout, stderr) => {
        if (err) {
          if (err.killed) {
            reject(new Error(`Codex CLI timeout after ${timeout}ms`));
          } else {
            reject(new Error(`Codex CLI error: ${err.message}`));
          }
          return;
        }
        resolve(stdout.trim());
      });
    });
  }

  /**
   * Health check
   */
  async _healthCheck() {
    const fs = require('fs');
    return fs.existsSync(CODEX_BAT);
  }

  /**
   * Override cost estimation for API-based pricing
   */
  estimateCost(prompt) {
    const tokens = Math.ceil((prompt?.length || 0) / 4);
    // OpenAI API: ~$0.03/1K input tokens (GPT-4o)
    const cost = (tokens / 1000) * 0.03;
    return { estimatedCost: cost, unit: 'USD', tier: 'api_usage' };
  }

  static implementsPorts() {
    return ['ToolExecutionPort'];
  }
}

module.exports = { CodexAdapter };
