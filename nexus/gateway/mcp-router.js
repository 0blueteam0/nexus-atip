/**
 * NEXUS MCP Router - MCP Server Central Management
 *
 * Routes and manages all MCP servers from .claude.json.
 * Provides health checking, categorization, and usage tracking.
 *
 * @module nexus/gateway/mcp-router
 */

'use strict';

const path = require('path');
const fs = require('fs');

const CLAUDE_JSON_PATH = path.resolve(__dirname, '../../.claude.json');

class MCPRouter {
  constructor() {
    this._servers = new Map();
    this._categories = new Map();
    this._loadFromConfig();
  }

  /**
   * Get all registered MCP servers
   * @returns {Array<{name, category, command, enabled}>}
   */
  listServers() {
    return [...this._servers.values()].map(s => ({
      name: s.name,
      category: s.category,
      type: s.type,
      toolCount: s.toolCount || 0
    }));
  }

  /**
   * Get servers by category
   * @param {string} category
   * @returns {Array}
   */
  getByCategory(category) {
    return this.listServers().filter(s => s.category === category);
  }

  /**
   * Get all categories with counts
   * @returns {Object} { category: count }
   */
  getCategories() {
    const cats = {};
    for (const s of this._servers.values()) {
      cats[s.category] = (cats[s.category] || 0) + 1;
    }
    return cats;
  }

  /**
   * Find best server for a task type
   * @param {string} taskHint - e.g., 'web_search', 'file_edit', 'code_search'
   * @returns {string|null} Server name
   */
  findServer(taskHint) {
    const mapping = {
      'web_search': ['one-search', 'websearch', 'firecrawl'],
      'web_scrape': ['firecrawl', 'crawl4ai-lite', 'one-search'],
      'file_edit': ['desktop-commander', 'edit-file-lines', 'filesystem'],
      'file_read': ['desktop-commander', 'filesystem'],
      'code_search': ['desktop-commander', 'serena'],
      'task_manage': ['shrimp-task', 'vibekanban', 'task-master-ai'],
      'research': ['deep-research-mcp', 'paper-search-mcp'],
      'memory': ['memory', 'kiro-memory'],
      'database': ['sqlite-mcp', 'supabase'],
      'image': ['image-recognition', 'paddleocr-mcp'],
      'chart': ['antv-chart'],
      'ai_query': ['multi-ai-orchestration', 'llm-council'],
      'git': ['git-mcp', 'github'],
      'automation': ['n8n', 'playwright'],
      'docs': ['context7', 'marker-mcp']
    };

    const candidates = mapping[taskHint];
    if (!candidates) return null;

    for (const name of candidates) {
      if (this._servers.has(name)) return name;
    }
    return null;
  }

  /**
   * Get gateway status summary
   * @returns {Object}
   */
  getStatus() {
    return {
      totalServers: this._servers.size,
      categories: this.getCategories(),
      configPath: CLAUDE_JSON_PATH
    };
  }

  _loadFromConfig() {
    try {
      const config = JSON.parse(fs.readFileSync(CLAUDE_JSON_PATH, 'utf8'));
      const mcpServers = config.mcpServers || {};

      for (const [name, serverConfig] of Object.entries(mcpServers)) {
        this._servers.set(name, {
          name,
          category: this._categorize(name),
          type: serverConfig.type || 'stdio',
          command: serverConfig.command,
          toolCount: 0
        });
      }
    } catch {
      // Config not available
    }
  }

  _categorize(name) {
    const categories = {
      'file_code': ['desktop-commander', 'edit-file-lines', 'filesystem', 'git-mcp', 'github', 'serena'],
      'web_crawl': ['firecrawl', 'one-search', 'crawl4ai-lite', 'playwright', 'websearch'],
      'research': ['deep-research-mcp', 'paper-search-mcp', 'context7'],
      'ai_llm': ['multi-ai-orchestration', 'llm-council', 'sequential-thinking', 'pal'],
      'database': ['sqlite-mcp', 'supabase'],
      'memory': ['memory', 'kiro-memory'],
      'task_mgmt': ['shrimp-task', 'vibekanban', 'task-master-ai'],
      'media': ['image-recognition', 'paddleocr-mcp', 'marker-mcp', 'antv-chart', 'hfspace'],
      'automation': ['n8n', 'e2b'],
      'other': ['mcp-installer', 'youtube-data', 'notion']
    };

    for (const [cat, names] of Object.entries(categories)) {
      if (names.some(n => name.includes(n))) return cat;
    }
    return 'other';
  }
}

module.exports = { MCPRouter };
