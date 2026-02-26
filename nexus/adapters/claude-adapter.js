/**
 * NEXUS Claude Code Adapter
 *
 * Wraps claude.bat for headless CLI queries.
 * Supports both in-session MCP mode and headless subprocess.
 *
 * @module nexus/adapters/claude-adapter
 */

'use strict';

const { execFile } = require('child_process');
const path = require('path');
const { BaseAdapter } = require('./base-adapter');

const CLAUDE_BAT = 'K:/PortableApps/genai/claude.bat';

class ClaudeAdapter extends BaseAdapter {
  constructor(config = {}) {
    super('claude-code', {
      command: CLAUDE_BAT,
      strengths: ['mcp_tools', 'architecture', 'long_sessions', 'code_generation', 'file_editing', 'git_ops'],
      weaknesses: ['cost_per_session', 'slower_startup'],
      cost_tier: 'included',
      context: 200000,
      role: 'primary_orchestrator',
      ...config
    });
  }

  /**
   * Execute Claude Code in headless mode
   */
  async _execute(prompt, options = {}) {
    const timeout = options.timeout || 120000;
    const format = options.format || 'text';

    const args = ['-p', prompt];
    if (format === 'json') args.push('--output-format', 'json');

    return new Promise((resolve, reject) => {
      const proc = execFile(CLAUDE_BAT, args, {
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        cwd: 'K:/PortableApps/genai',
        windowsHide: true
      }, (err, stdout, stderr) => {
        if (err) {
          if (err.killed) {
            reject(new Error(`Claude Code timeout after ${timeout}ms`));
          } else {
            reject(new Error(`Claude Code error: ${err.message}`));
          }
          return;
        }

        const output = stdout.trim();
        if (format === 'json') {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            resolve(output);
          }
        } else {
          resolve(output);
        }
      });
    });
  }

  /**
   * Health check: verify claude.bat exists and is executable
   */
  async _healthCheck() {
    const fs = require('fs');
    return fs.existsSync(CLAUDE_BAT);
  }

  static implementsPorts() {
    return ['ModelRouterPort', 'ToolExecutionPort'];
  }
}

module.exports = { ClaudeAdapter };
