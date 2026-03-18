/**
 * NEXUS MCP Gateway - Proxy Engine
 *
 * Executes tool calls on remote MCP servers via mcp2cli.
 * Handles caching, retry logic, and result formatting.
 */

'use strict';

const { execSync, execFileSync } = require('child_process');
const path = require('path');

const MCP2CLI_PATH = path.resolve(__dirname, '../../../.local/bin/mcp2cli.exe');
const MCP2CLI_FALLBACK = 'mcp2cli'; // If in PATH

class MCPProxy {
  constructor(registry) {
    this.registry = registry;
    this._resultCache = new Map(); // key -> { result, timestamp }
    this._cacheTTL = 60000; // 1 minute cache
    this._mcp2cliPath = this._findMcp2cli();
  }

  /**
   * Find mcp2cli executable
   */
  _findMcp2cli() {
    try {
      const fs = require('fs');
      if (fs.existsSync(MCP2CLI_PATH)) return MCP2CLI_PATH;
    } catch {}
    return MCP2CLI_FALLBACK;
  }

  /**
   * List tools on a specific MCP server
   */
  async listTools(serverName) {
    // Check cache first
    const cacheKey = `list:${serverName}`;
    const cached = this._getCache(cacheKey);
    if (cached) return cached;

    const args = this.registry.getMcp2cliArgs(serverName);
    if (!args) {
      return { error: `Server not found or not configurable: ${serverName}` };
    }

    try {
      const result = this._execMcp2cli([...args, '--list']);
      const tools = this._parseToolList(result);
      this._setCache(cacheKey, tools);
      return tools;
    } catch (e) {
      return { error: `Failed to list tools on ${serverName}: ${e.message}` };
    }
  }

  /**
   * Call a tool on a specific MCP server
   */
  async callTool(serverName, toolName, toolArgs = {}) {
    const args = this.registry.getMcp2cliArgs(serverName);
    if (!args) {
      return { error: `Server not found: ${serverName}` };
    }

    const cliArgs = [...args, toolName];

    // Convert tool arguments to CLI flags
    for (const [key, value] of Object.entries(toolArgs)) {
      if (typeof value === 'boolean') {
        if (value) cliArgs.push(`--${key}`);
      } else {
        cliArgs.push(`--${key}`, String(value));
      }
    }

    try {
      const result = this._execMcp2cli(cliArgs);
      // Update last used timestamp
      this.registry.updateHealth(serverName, 'available');
      return { success: true, server: serverName, tool: toolName, result };
    } catch (e) {
      this.registry.updateHealth(serverName, 'error');
      return {
        success: false,
        server: serverName,
        tool: toolName,
        error: e.message
      };
    }
  }

  /**
   * Search tools across all servers
   */
  async searchToolsRemote(serverName, pattern) {
    const args = this.registry.getMcp2cliArgs(serverName);
    if (!args) return { error: `Server not found: ${serverName}` };

    try {
      const result = this._execMcp2cli([...args, '--search', pattern]);
      return { server: serverName, results: result };
    } catch (e) {
      return { error: e.message };
    }
  }

  /**
   * Execute mcp2cli command
   */
  _execMcp2cli(args, options = {}) {
    const timeout = options.timeout || 30000;
    try {
      const result = execFileSync(this._mcp2cliPath, args, {
        encoding: 'utf8',
        timeout,
        maxBuffer: 1024 * 1024 * 5, // 5MB
        windowsHide: true,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });
      return result.trim();
    } catch (e) {
      if (e.stdout) return e.stdout.trim();
      throw new Error(e.stderr || e.message);
    }
  }

  /**
   * Execute a direct CLI command (for CLI-Anything integration)
   */
  async execCLI(command, args = []) {
    try {
      const fullCmd = [command, ...args].join(' ');
      const result = execSync(fullCmd, {
        encoding: 'utf8',
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 5,
        windowsHide: true,
        cwd: path.resolve(__dirname, '../../..')
      });
      return { success: true, result: result.trim() };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Parse mcp2cli --list output into structured tool list
   */
  _parseToolList(output) {
    if (!output) return [];
    const lines = output.split('\n');
    const tools = [];
    let currentGroup = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Group header (e.g. "add:")
      if (trimmed.endsWith(':') && !trimmed.includes(' ')) {
        currentGroup = trimmed.slice(0, -1);
        continue;
      }

      // Tool line
      const match = trimmed.match(/^(\S+)\s+(.*)$/);
      if (match) {
        tools.push({
          name: match[1],
          description: match[2].trim(),
          group: currentGroup || null
        });
      }
    }

    return tools;
  }

  /**
   * Cache management
   */
  _getCache(key) {
    const entry = this._resultCache.get(key);
    if (entry && Date.now() - entry.timestamp < this._cacheTTL) {
      return entry.result;
    }
    this._resultCache.delete(key);
    return null;
  }

  _setCache(key, result) {
    this._resultCache.set(key, { result, timestamp: Date.now() });
    // Prune old entries
    if (this._resultCache.size > 100) {
      const oldest = [...this._resultCache.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 50);
      for (const [k] of oldest) this._resultCache.delete(k);
    }
  }
}

module.exports = { MCPProxy };
