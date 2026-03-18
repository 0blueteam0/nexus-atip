/**
 * NEXUS MCP Gateway - Server Registry
 *
 * Manages catalog of all MCP servers, their configs, tools, and health status.
 * Single source of truth for MCP server discovery.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CLAUDE_JSON = path.resolve(__dirname, '../../../.claude.json');
const TOOL_REGISTRY = path.resolve(__dirname, '../../../atos/tool-registry.json');
const TOOL_CACHE = path.resolve(__dirname, 'tool-cache.json');
const GENAI_ROOT = path.resolve(__dirname, '../../..');

// MCP server categories for intelligent routing
const CATEGORIES = {
  'file_code': ['desktop-commander', 'edit-file-lines', 'filesystem', 'git-mcp', 'github', 'serena'],
  'web_crawl': ['firecrawl', 'one-search', 'crawl4ai-lite', 'scrapegraph-local', 'playwright'],
  'research': ['deep-research-mcp', 'paper-search-mcp', 'context7', 'websearch'],
  'ai_llm': ['multi-ai-orchestration', 'llm-council', 'sequential-thinking', 'pal'],
  'database': ['sqlite-mcp', 'supabase'],
  'memory': ['memory', 'kiro-memory'],
  'task_mgmt': ['shrimp-task', 'vibekanban', 'task-master-ai'],
  'media_ocr': ['image-recognition', 'paddleocr-mcp', 'marker-mcp', 'ocr-mcp', 'antv-chart', 'hfspace'],
  'automation': ['n8n', 'e2b', 'runpod-jupyter'],
  'other': ['mcp-installer', 'notion', 'youtube-data']
};

// Servers that should ALWAYS stay directly connected (high frequency, low latency needed)
const ALWAYS_DIRECT = new Set([
  'desktop-commander',  // P1 file ops
  'edit-file-lines',    // P2 precise editing
  'shrimp-task',        // P3 task management
  'sequential-thinking' // Deep thinking
]);

// Servers that support HTTP (can be proxied via mcp2cli --mcp)
const HTTP_SERVERS = new Map([
  ['firecrawl', 'http://localhost:3002'],
  ['n8n', 'http://localhost:5678'],
  ['supabase', null], // Cloud
]);

class MCPRegistry {
  constructor() {
    this._servers = new Map();
    this._toolCache = new Map(); // server -> [tools]
    this._healthCache = new Map(); // server -> { status, checkedAt }
    this._loadFromConfig();
  }

  /**
   * Load MCP server definitions from .claude.json
   */
  _loadFromConfig() {
    try {
      const config = JSON.parse(fs.readFileSync(CLAUDE_JSON, 'utf8'));
      const mcpServers = config.mcpServers || {};

      for (const [name, serverConfig] of Object.entries(mcpServers)) {
        const category = this._findCategory(name);
        this._servers.set(name, {
          name,
          category,
          transport: serverConfig.url ? 'http' : 'stdio',
          command: serverConfig.command || null,
          args: serverConfig.args || [],
          url: serverConfig.url || HTTP_SERVERS.get(name) || null,
          env: serverConfig.env || {},
          isDirect: ALWAYS_DIRECT.has(name),
          status: 'unknown',
          toolCount: 0,
          lastUsed: null
        });
      }
    } catch (e) {
      console.error(`[!] Failed to load .claude.json: ${e.message}`);
    }

    // Enrich with tool cache (built by build-cache.js)
    this._loadToolCache();

    // Enrich with ATOS tool registry if available
    this._enrichFromToolRegistry();
  }

  /**
   * Load pre-built tool cache (from build-cache.js)
   */
  _loadToolCache() {
    try {
      if (!fs.existsSync(TOOL_CACHE)) return;
      const cache = JSON.parse(fs.readFileSync(TOOL_CACHE, 'utf8'));
      const servers = cache.servers || {};

      for (const [name, info] of Object.entries(servers)) {
        if (info.tools && Array.isArray(info.tools)) {
          this._toolCache.set(name, info.tools);
          const server = this._servers.get(name);
          if (server) {
            server.toolCount = info.tools.length;
          }
        }
      }
    } catch (e) {
      // Tool cache is optional
    }
  }

  /**
   * Enrich with tool info from ATOS tool-registry.json
   */
  _enrichFromToolRegistry() {
    try {
      if (!fs.existsSync(TOOL_REGISTRY)) return;
      const registry = JSON.parse(fs.readFileSync(TOOL_REGISTRY, 'utf8'));
      const servers = registry.servers || registry.mcpServers || {};

      for (const [name, info] of Object.entries(servers)) {
        if (this._servers.has(name) && info.tools) {
          const server = this._servers.get(name);
          server.toolCount = Array.isArray(info.tools) ? info.tools.length : 0;
          if (Array.isArray(info.tools)) {
            this._toolCache.set(name, info.tools);
          }
        }
      }
    } catch (e) {
      // Tool registry is optional enrichment
    }
  }

  /**
   * Find category for a server
   */
  _findCategory(serverName) {
    for (const [category, servers] of Object.entries(CATEGORIES)) {
      if (servers.includes(serverName)) return category;
    }
    return 'other';
  }

  /**
   * Get all registered servers
   */
  listServers(options = {}) {
    const { category, status, directOnly } = options;
    let servers = [...this._servers.values()];

    if (category) servers = servers.filter(s => s.category === category);
    if (status) servers = servers.filter(s => s.status === status);
    if (directOnly) servers = servers.filter(s => s.isDirect);

    return servers.map(s => ({
      name: s.name,
      category: s.category,
      transport: s.transport,
      isDirect: s.isDirect,
      status: s.status,
      toolCount: s.toolCount
    }));
  }

  /**
   * Get server config for mcp2cli invocation
   */
  getServerConfig(name) {
    return this._servers.get(name) || null;
  }

  /**
   * Search tools across all servers
   */
  searchTools(query) {
    const results = [];
    const queryLower = query.toLowerCase();

    for (const [serverName, tools] of this._toolCache) {
      for (const tool of tools) {
        const toolName = typeof tool === 'string' ? tool : tool.name || '';
        const toolDesc = typeof tool === 'object' ? (tool.description || '') : '';

        if (toolName.toLowerCase().includes(queryLower) ||
            toolDesc.toLowerCase().includes(queryLower)) {
          results.push({
            server: serverName,
            tool: toolName,
            description: toolDesc,
            category: this._findCategory(serverName)
          });
        }
      }
    }

    return results;
  }

  /**
   * Get mcp2cli command args for a server
   */
  getMcp2cliArgs(serverName) {
    const server = this._servers.get(serverName);
    if (!server) return null;

    if (server.url) {
      return ['--mcp', server.url];
    }

    if (server.command) {
      const cmd = server.args && server.args.length > 0
        ? `${server.command} ${server.args.join(' ')}`
        : server.command;
      return ['--mcp-stdio', cmd];
    }

    return null;
  }

  /**
   * Recommend servers for a task description
   */
  recommendServers(taskDescription) {
    const desc = taskDescription.toLowerCase();
    const scores = new Map();

    // Keyword-based scoring
    const keywordMap = {
      'file_code': ['file', 'read', 'write', 'edit', 'code', 'git', 'commit', 'diff', 'search', 'directory'],
      'web_crawl': ['web', 'scrape', 'crawl', 'url', 'http', 'page', 'site', 'browser', 'navigate'],
      'research': ['research', 'paper', 'arxiv', 'docs', 'documentation', 'library', 'learn'],
      'ai_llm': ['ai', 'model', 'think', 'analyze', 'deliberate', 'consensus', 'verify'],
      'database': ['database', 'sql', 'query', 'table', 'schema', 'migrate', 'supabase'],
      'memory': ['remember', 'memory', 'context', 'entity', 'relation', 'graph'],
      'task_mgmt': ['task', 'plan', 'todo', 'project', 'kanban', 'ticket'],
      'media_ocr': ['image', 'ocr', 'pdf', 'chart', 'photo', 'recognize', 'scan', 'document'],
      'automation': ['automate', 'workflow', 'n8n', 'jupyter', 'notebook', 'runpod', 'gpu']
    };

    for (const [category, keywords] of Object.entries(keywordMap)) {
      let score = 0;
      for (const kw of keywords) {
        if (desc.includes(kw)) score += 1;
      }
      if (score > 0) scores.set(category, score);
    }

    // Sort by score and return recommended servers
    const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
    const recommendations = [];

    for (const [category, score] of sorted.slice(0, 3)) {
      const servers = CATEGORIES[category] || [];
      for (const serverName of servers) {
        if (this._servers.has(serverName)) {
          recommendations.push({
            server: serverName,
            category,
            score,
            isDirect: ALWAYS_DIRECT.has(serverName)
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Update health status
   */
  updateHealth(serverName, status) {
    const server = this._servers.get(serverName);
    if (server) {
      server.status = status;
      this._healthCache.set(serverName, { status, checkedAt: Date.now() });
    }
  }

  /**
   * Get summary statistics
   */
  getStats() {
    const servers = [...this._servers.values()];
    const byCat = {};
    for (const s of servers) {
      byCat[s.category] = (byCat[s.category] || 0) + 1;
    }
    return {
      total: servers.length,
      direct: servers.filter(s => s.isDirect).length,
      proxied: servers.filter(s => !s.isDirect).length,
      byCategory: byCat,
      withTools: this._toolCache.size,
      totalTools: [...this._toolCache.values()].reduce((sum, tools) => sum + tools.length, 0)
    };
  }
}

module.exports = { MCPRegistry, CATEGORIES, ALWAYS_DIRECT };
