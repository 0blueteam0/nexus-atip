#!/usr/bin/env node
/**
 * NEXUS MCP Gateway - Tool Cache Builder
 *
 * Scans all MCP servers via mcp2cli and builds a local tool cache.
 * This cache enables fast offline tool discovery without live MCP queries.
 *
 * Usage: node build-cache.js [--server <name>] [--all] [--http-only]
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MCP2CLI = path.resolve(__dirname, '../../../.local/bin/mcp2cli.exe');
const CLAUDE_JSON = path.resolve(__dirname, '../../../.claude.json');
const CACHE_FILE = path.resolve(__dirname, 'tool-cache.json');

// HTTP-based servers we can scan immediately
const HTTP_SERVERS = {
  // Add known HTTP endpoints here
};

// Servers that support stdio scanning
const STDIO_SCANNABLE = new Set([
  // Servers whose stdio commands are safe to invoke for --list
]);

function loadMCPConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(CLAUDE_JSON, 'utf8'));
    return config.mcpServers || {};
  } catch (e) {
    console.error(`[-] Failed to load .claude.json: ${e.message}`);
    return {};
  }
}

function scanServer(name, serverConfig) {
  const args = [];

  if (serverConfig.url) {
    args.push('--mcp', serverConfig.url, '--list');
  } else if (serverConfig.command) {
    const cmd = serverConfig.args && serverConfig.args.length > 0
      ? `${serverConfig.command} ${serverConfig.args.join(' ')}`
      : serverConfig.command;
    args.push('--mcp-stdio', cmd, '--list');
  } else {
    return null;
  }

  try {
    const result = execFileSync(MCP2CLI, args, {
      encoding: 'utf8',
      timeout: 15000,
      maxBuffer: 1024 * 1024,
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    return parseToolList(result.trim());
  } catch (e) {
    const stdout = e.stdout ? e.stdout.trim() : '';
    if (stdout) return parseToolList(stdout);
    return null;
  }
}

function parseToolList(output) {
  if (!output) return [];
  const lines = output.split('\n');
  const tools = [];
  let currentGroup = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.endsWith(':') && !trimmed.includes(' ')) {
      currentGroup = trimmed.slice(0, -1);
      continue;
    }

    // Tool line: name    METHOD  description
    // or:        name    description
    const match = trimmed.match(/^(\S+)\s+(.*)$/);
    if (match) {
      tools.push({
        name: match[1],
        description: match[2].trim(),
        group: currentGroup || undefined
      });
    }
  }

  return tools;
}

function buildCache(options = {}) {
  const { serverFilter, httpOnly, verbose } = options;
  const mcpServers = loadMCPConfig();
  const cache = {
    version: '1.0.0',
    builtAt: new Date().toISOString(),
    servers: {}
  };

  // Also add known tool definitions from memory
  const knownTools = {
    'desktop-commander': [
      { name: 'read_file', description: 'Read file contents with offset/length support' },
      { name: 'write_file', description: 'Write content to file (rewrite or append mode)' },
      { name: 'edit_block', description: 'Precise text replacement (old_string -> new_string)' },
      { name: 'list_directory', description: 'List directory contents' },
      { name: 'search_files', description: 'Search for files by name pattern' },
      { name: 'search_code', description: 'Search code content (ripgrep)' },
      { name: 'get_file_info', description: 'Get file metadata (size, dates, permissions)' },
      { name: 'create_directory', description: 'Create directory recursively' },
      { name: 'move_file', description: 'Move or rename file/directory' },
      { name: 'start_process', description: 'Start a system process' },
      { name: 'list_processes', description: 'List running processes' },
      { name: 'kill_process', description: 'Kill a process by PID' },
      { name: 'read_multiple_files', description: 'Read multiple files at once' },
      { name: 'read_process_output', description: 'Read output from a running process' }
    ],
    'edit-file-lines': [
      { name: 'edit_file_lines', description: 'Line-based precise file editing' },
      { name: 'get_file_lines', description: 'Get specific lines with context' },
      { name: 'search_file', description: 'Search patterns within a file' },
      { name: 'approve_edit', description: 'Approve a dry-run edit' }
    ],
    'shrimp-task': [
      { name: 'plan_task', description: 'Create a task plan' },
      { name: 'split_tasks', description: 'Decompose task into subtasks' },
      { name: 'execute_task', description: 'Execute a planned task' },
      { name: 'verify_task', description: 'Verify task completion' },
      { name: 'list_tasks', description: 'List all tasks' },
      { name: 'get_task_detail', description: 'Get detailed task info' },
      { name: 'delete_task', description: 'Delete a task' },
      { name: 'analyze_task', description: 'Analyze task complexity' },
      { name: 'reflect_task', description: 'Reflect on task execution' },
      { name: 'research_mode', description: 'Enter research mode for a task' },
      { name: 'process_thought', description: 'Process a thinking step' },
      { name: 'query_task', description: 'Query tasks with filters' },
      { name: 'update_task', description: 'Update task status' }
    ],
    'github': [
      { name: 'create_pull_request', description: 'Create a GitHub PR' },
      { name: 'get_pull_request', description: 'Get PR details' },
      { name: 'list_pull_requests', description: 'List PRs' },
      { name: 'create_issue', description: 'Create a GitHub issue' },
      { name: 'list_issues', description: 'List issues' },
      { name: 'search_code', description: 'Search code on GitHub' },
      { name: 'search_repositories', description: 'Search repositories' },
      { name: 'get_file_contents', description: 'Get file from repo' },
      { name: 'create_or_update_file', description: 'Create/update file in repo' },
      { name: 'push_files', description: 'Push multiple files' },
      { name: 'create_branch', description: 'Create a branch' },
      { name: 'list_commits', description: 'List commits' }
    ],
    'firecrawl': [
      { name: 'firecrawl_scrape', description: 'Scrape a web page' },
      { name: 'firecrawl_crawl', description: 'Crawl a website recursively' },
      { name: 'firecrawl_map', description: 'Map website structure' },
      { name: 'firecrawl_search', description: 'Search and scrape' },
      { name: 'firecrawl_extract', description: 'Extract structured data' },
      { name: 'firecrawl_check_crawl_status', description: 'Check crawl job status' }
    ],
    'one-search': [
      { name: 'one_search', description: 'Meta search engine query' },
      { name: 'one_scrape', description: 'Scrape a URL' },
      { name: 'one_map', description: 'Map site structure' },
      { name: 'one_extract', description: 'Extract data from page' }
    ],
    'playwright': [
      { name: 'playwright_navigate', description: 'Navigate to URL' },
      { name: 'playwright_screenshot', description: 'Take screenshot' },
      { name: 'playwright_click', description: 'Click element' },
      { name: 'playwright_fill', description: 'Fill input field' },
      { name: 'playwright_get_visible_text', description: 'Get visible text' },
      { name: 'playwright_get_visible_html', description: 'Get visible HTML' },
      { name: 'playwright_evaluate', description: 'Execute JavaScript' }
    ],
    'n8n': [
      { name: 'list-workflows', description: 'List all n8n workflows' },
      { name: 'get-workflow', description: 'Get workflow details' },
      { name: 'create-workflow', description: 'Create new workflow' },
      { name: 'activate-workflow', description: 'Activate a workflow' },
      { name: 'list-executions', description: 'List workflow executions' }
    ],
    'memory': [
      { name: 'create_entities', description: 'Create knowledge graph entities' },
      { name: 'create_relations', description: 'Create entity relations' },
      { name: 'add_observations', description: 'Add observations to entities' },
      { name: 'search_nodes', description: 'Search knowledge graph' },
      { name: 'read_graph', description: 'Read full knowledge graph' },
      { name: 'open_nodes', description: 'Open specific nodes' },
      { name: 'delete_entities', description: 'Delete entities' },
      { name: 'delete_relations', description: 'Delete relations' }
    ],
    'sequential-thinking': [
      { name: 'sequentialthinking', description: 'Multi-step sequential reasoning process' }
    ],
    'deep-research-mcp': [
      { name: 'deep_research', description: 'Deep multi-source research on a topic' },
      { name: 'quick_research', description: 'Quick research summary' },
      { name: 'research_status', description: 'Check research job status' }
    ],
    'context7': [
      { name: 'resolve-library-id', description: 'Resolve library name to Context7 ID' },
      { name: 'query-docs', description: 'Query library documentation' }
    ],
    'sqlite-mcp': [
      { name: 'read_query', description: 'Execute SELECT query' },
      { name: 'write_query', description: 'Execute INSERT/UPDATE/DELETE' },
      { name: 'create_table', description: 'Create database table' },
      { name: 'list_tables', description: 'List all tables' },
      { name: 'describe_table', description: 'Describe table schema' }
    ],
    'supabase': [
      { name: 'execute_sql', description: 'Execute SQL on Supabase' },
      { name: 'list_tables', description: 'List Supabase tables' },
      { name: 'apply_migration', description: 'Apply database migration' },
      { name: 'deploy_edge_function', description: 'Deploy edge function' },
      { name: 'get_logs', description: 'Get Supabase logs' }
    ],
    'image-recognition': [
      { name: 'describe_image', description: 'Describe image from URL' },
      { name: 'describe_image_from_file', description: 'Describe image from file path' }
    ],
    'antv-chart': [
      { name: 'generate_line_chart', description: 'Generate line chart' },
      { name: 'generate_bar_chart', description: 'Generate bar chart' },
      { name: 'generate_pie_chart', description: 'Generate pie chart' },
      { name: 'generate_scatter_chart', description: 'Generate scatter plot' },
      { name: 'generate_area_chart', description: 'Generate area chart' },
      { name: 'generate_column_chart', description: 'Generate column chart' },
      { name: 'generate_mind_map', description: 'Generate mind map' },
      { name: 'generate_flow_diagram', description: 'Generate flow diagram' },
      { name: 'generate_network_graph', description: 'Generate network graph' }
    ],
    'notion': [
      { name: 'API-post-search', description: 'Search Notion' },
      { name: 'API-retrieve-a-page', description: 'Get Notion page' },
      { name: 'API-post-page', description: 'Create Notion page' },
      { name: 'API-patch-page', description: 'Update Notion page' },
      { name: 'API-query-data-source', description: 'Query Notion database' }
    ],
    'youtube-data': [
      { name: 'searchVideos', description: 'Search YouTube videos' },
      { name: 'getVideoDetails', description: 'Get video details' },
      { name: 'getTranscripts', description: 'Get video transcripts' },
      { name: 'getChannelStatistics', description: 'Get channel stats' },
      { name: 'getTrendingVideos', description: 'Get trending videos' }
    ]
  };

  let scanned = 0;
  let failed = 0;

  for (const [name, config] of Object.entries(mcpServers)) {
    if (name === 'nexus-gateway') continue; // Skip self
    if (serverFilter && name !== serverFilter) continue;

    // Use known tools first (faster, no subprocess needed)
    if (knownTools[name]) {
      cache.servers[name] = {
        tools: knownTools[name],
        source: 'known',
        scannedAt: new Date().toISOString()
      };
      scanned++;
      if (verbose) console.log(`[+] ${name}: ${knownTools[name].length} tools (known)`);
      continue;
    }

    // Try live scan for unknown servers
    if (!httpOnly || config.url) {
      if (verbose) console.log(`[*] Scanning ${name}...`);
      const tools = scanServer(name, config);
      if (tools && tools.length > 0) {
        cache.servers[name] = {
          tools,
          source: 'mcp2cli',
          scannedAt: new Date().toISOString()
        };
        scanned++;
        if (verbose) console.log(`[+] ${name}: ${tools.length} tools (live)`);
      } else {
        failed++;
        if (verbose) console.log(`[-] ${name}: scan failed`);
      }
    }
  }

  // Write cache
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

  const totalTools = Object.values(cache.servers)
    .reduce((sum, s) => sum + s.tools.length, 0);

  console.log(`\n[+] Cache built: ${scanned} servers, ${totalTools} tools`);
  if (failed > 0) console.log(`[-] Failed: ${failed} servers`);
  console.log(`[+] Saved to: ${CACHE_FILE}`);

  return cache;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    serverFilter: null,
    httpOnly: false,
    verbose: true
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--server' && args[i + 1]) options.serverFilter = args[++i];
    if (args[i] === '--http-only') options.httpOnly = true;
    if (args[i] === '--quiet') options.verbose = false;
  }

  buildCache(options);
}

module.exports = { buildCache };
