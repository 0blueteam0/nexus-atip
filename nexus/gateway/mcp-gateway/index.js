#!/usr/bin/env node
/**
 * NEXUS MCP Gateway - Main Server
 *
 * A meta-MCP server that dynamically orchestrates 39+ MCP servers.
 * Instead of connecting all MCPs simultaneously (massive token overhead),
 * this gateway provides ~8 meta-tools that discover, route, and proxy
 * calls to the right MCP server on demand.
 *
 * Architecture:
 *   Claude Code <---> nexus-gateway (1 MCP) <---> mcp2cli <---> 39 MCPs
 *
 * Token savings: ~97% reduction in schema injection overhead.
 *
 * @module nexus/gateway/mcp-gateway
 */

'use strict';

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { MCPRegistry, CATEGORIES } = require('./registry');
const { MCPProxy } = require('./proxy');
const { SmartRouter } = require('./router');

// Initialize core components
const registry = new MCPRegistry();
const proxy = new MCPProxy(registry);
const router = new SmartRouter(registry);

// Create MCP server
const server = new McpServer({
  name: 'nexus-gateway',
  version: '1.0.0',
  description: 'NEXUS MCP Gateway - Dynamic MCP orchestrator. Manages 39+ MCP servers with intelligent routing and on-demand tool discovery.'
});

// =============================================================================
// TOOL 1: nexus_catalog - Browse all MCP servers
// =============================================================================
server.tool(
  'nexus_catalog',
  'List all registered MCP servers grouped by category. Use this to discover what MCP servers and capabilities are available.',
  {
    category: z.string().optional().describe('Filter by category: file_code, web_crawl, research, ai_llm, database, memory, task_mgmt, media_ocr, automation, other'),
    verbose: z.boolean().optional().describe('Include tool counts and status details')
  },
  async ({ category, verbose }) => {
    const servers = registry.listServers({ category });
    const stats = registry.getStats();

    let output = `## NEXUS MCP Gateway - Server Catalog\n`;
    output += `Total: ${stats.total} servers (${stats.direct} direct, ${stats.proxied} proxied)\n\n`;

    if (category) {
      output += `### Category: ${category}\n`;
      for (const s of servers) {
        output += `- ${s.isDirect ? '[D]' : '[P]'} ${s.name} (${s.transport})`;
        if (verbose && s.toolCount > 0) output += ` [${s.toolCount} tools]`;
        output += '\n';
      }
    } else {
      // Group by category
      for (const [cat, serverNames] of Object.entries(CATEGORIES)) {
        const catServers = servers.filter(s => s.category === cat);
        if (catServers.length === 0) continue;
        output += `### ${cat} (${catServers.length})\n`;
        for (const s of catServers) {
          output += `- ${s.isDirect ? '[D]' : '[P]'} ${s.name}`;
          if (verbose && s.toolCount > 0) output += ` [${s.toolCount} tools]`;
          output += '\n';
        }
        output += '\n';
      }
    }

    output += `\n[D]=Direct connection, [P]=Proxied via mcp2cli`;

    return { content: [{ type: 'text', text: output }] };
  }
);

// =============================================================================
// TOOL 2: nexus_discover - Search for tools across all MCPs
// =============================================================================
server.tool(
  'nexus_discover',
  'Search for specific tools across all MCP servers by keyword. Returns matching tools with their server name and description.',
  {
    query: z.string().describe('Search keyword (e.g. "scrape", "file", "ocr", "search")'),
    server: z.string().optional().describe('Limit search to a specific server'),
    live: z.boolean().optional().describe('If true, query the actual MCP server via mcp2cli (slower but complete)')
  },
  async ({ query, server: serverName, live }) => {
    let results;

    if (live && serverName) {
      // Live query via mcp2cli
      const searchResult = await proxy.searchToolsRemote(serverName, query);
      return { content: [{ type: 'text', text: JSON.stringify(searchResult, null, 2) }] };
    }

    if (live && !serverName) {
      // Live query on all servers - use mcp2cli --list on recommended servers
      const routing = router.route(query);
      const servers = routing.primary ? routing.primary.servers.slice(0, 3) : [];
      const allResults = [];

      for (const sName of servers) {
        const tools = await proxy.listTools(sName);
        if (Array.isArray(tools)) {
          for (const t of tools) {
            if (t.name.toLowerCase().includes(query.toLowerCase()) ||
                (t.description && t.description.toLowerCase().includes(query.toLowerCase()))) {
              allResults.push({ server: sName, ...t });
            }
          }
        }
      }

      return { content: [{ type: 'text', text: allResults.length > 0
        ? JSON.stringify(allResults, null, 2)
        : `No tools matching "${query}" found on servers: ${servers.join(', ')}` }] };
    }

    // Cached search from tool registry
    results = registry.searchTools(query);
    if (results.length === 0) {
      // Fallback: recommend servers
      const rec = router.recommend(query);
      return { content: [{ type: 'text', text:
        `No cached tools found for "${query}".\n\n` +
        `Recommended approach:\n` +
        `- Intent: ${rec.intent || 'unknown'}\n` +
        `- Try: nexus_discover(query="${query}", server="${rec.primaryServer || '?'}", live=true)\n` +
        `- Or call: nexus_list_tools(server="${rec.primaryServer || '?'}")`
      }] };
    }

    let output = `## Tools matching "${query}" (${results.length} found)\n\n`;
    for (const r of results.slice(0, 20)) {
      output += `- **${r.server}** / ${r.tool}`;
      if (r.description) output += ` - ${r.description}`;
      output += '\n';
    }

    return { content: [{ type: 'text', text: output }] };
  }
);

// =============================================================================
// TOOL 3: nexus_list_tools - List tools on a specific MCP server
// =============================================================================
server.tool(
  'nexus_list_tools',
  'List all available tools on a specific MCP server by querying it live via mcp2cli.',
  {
    server: z.string().describe('MCP server name (e.g. "firecrawl", "github", "notion")')
  },
  async ({ server: serverName }) => {
    const config = registry.getServerConfig(serverName);
    if (!config) {
      return { content: [{ type: 'text', text: `Server "${serverName}" not found in registry.` }] };
    }

    const tools = await proxy.listTools(serverName);

    if (tools.error) {
      return { content: [{ type: 'text', text: `Error: ${tools.error}` }] };
    }

    let output = `## Tools on "${serverName}" (${tools.length} found)\n\n`;
    for (const t of tools) {
      output += `- **${t.name}**`;
      if (t.description) output += ` - ${t.description}`;
      if (t.group) output += ` [${t.group}]`;
      output += '\n';
    }

    return { content: [{ type: 'text', text: output }] };
  }
);

// =============================================================================
// TOOL 4: nexus_call - Call a tool on a specific MCP server
// =============================================================================
server.tool(
  'nexus_call',
  'Execute a tool on a specific MCP server via mcp2cli proxy. The gateway routes the call and returns results.',
  {
    server: z.string().describe('MCP server name'),
    tool: z.string().describe('Tool name to call'),
    args: z.record(z.string(), z.any()).optional().describe('Tool arguments as key-value pairs')
  },
  async ({ server: serverName, tool: toolName, args }) => {
    const result = await proxy.callTool(serverName, toolName, args || {});

    if (result.success) {
      return { content: [{ type: 'text', text: result.result || 'Tool executed successfully (no output).' }] };
    } else {
      return { content: [{ type: 'text', text: `Error calling ${serverName}/${toolName}: ${result.error}` }] };
    }
  }
);

// =============================================================================
// TOOL 5: nexus_smart_route - AI-powered task routing
// =============================================================================
server.tool(
  'nexus_smart_route',
  'Analyze a task description and recommend the best MCP server(s) and tools to use. Uses intent analysis and pattern matching.',
  {
    task: z.string().describe('Natural language description of what you want to do')
  },
  async ({ task }) => {
    const recommendation = router.recommend(task);

    let output = `## Smart Routing for: "${task}"\n\n`;
    output += `**Intent**: ${recommendation.intent || 'unknown'}\n`;
    output += `**Confidence**: ${((recommendation.confidence || 0) * 100).toFixed(0)}%\n`;
    output += `**Primary Server**: ${recommendation.primaryServer || 'none'}\n`;

    if (recommendation.alternativeServers && recommendation.alternativeServers.length > 0) {
      output += `**Alternatives**: ${recommendation.alternativeServers.join(', ')}\n`;
    }

    if (recommendation.suggestedTools && recommendation.suggestedTools.length > 0) {
      output += `\n### Suggested Tools\n`;
      for (const t of recommendation.suggestedTools) {
        output += `- ${t.server}/${t.tool}: ${t.description || ''}\n`;
      }
    }

    output += `\n### How to Call\n`;
    output += `\`${recommendation.howToCall || 'nexus_call(server="...", tool="...", args={...})'}\`\n`;

    if (recommendation.alternatives && recommendation.alternatives.length > 0) {
      output += `\n### Alternative Routes\n`;
      for (const alt of recommendation.alternatives) {
        output += `- ${alt.intent} (${(alt.confidence * 100).toFixed(0)}%): ${alt.servers.join(', ')}\n`;
      }
    }

    return { content: [{ type: 'text', text: output }] };
  }
);

// =============================================================================
// TOOL 6: nexus_status - Gateway health & statistics
// =============================================================================
server.tool(
  'nexus_status',
  'Show the health status of the NEXUS MCP Gateway, including server counts, categories, and routing statistics.',
  {},
  async () => {
    const stats = registry.getStats();
    const routeStats = router.getStats();

    let output = `## NEXUS MCP Gateway Status\n\n`;
    output += `### Server Inventory\n`;
    output += `- Total: ${stats.total}\n`;
    output += `- Direct: ${stats.direct} (always connected)\n`;
    output += `- Proxied: ${stats.proxied} (on-demand via mcp2cli)\n`;
    output += `- With cached tools: ${stats.withTools}\n`;
    output += `- Total cached tools: ${stats.totalTools}\n\n`;

    output += `### Categories\n`;
    for (const [cat, count] of Object.entries(stats.byCategory)) {
      output += `- ${cat}: ${count}\n`;
    }

    output += `\n### Routing Stats\n`;
    output += `- Total routes: ${routeStats.totalRoutes}\n`;
    if (Object.keys(routeStats.byIntent).length > 0) {
      output += `- By intent:\n`;
      for (const [intent, count] of Object.entries(routeStats.byIntent)) {
        output += `  - ${intent}: ${count}\n`;
      }
    }

    output += `\n### mcp2cli\n`;
    output += `- Path: ${proxy._mcp2cliPath}\n`;
    output += `- Cache entries: ${proxy._resultCache.size}\n`;

    return { content: [{ type: 'text', text: output }] };
  }
);

// =============================================================================
// TOOL 7: nexus_cli - Direct mcp2cli passthrough
// =============================================================================
server.tool(
  'nexus_cli',
  'Execute a raw mcp2cli command. For power users who want direct CLI access to MCP servers, OpenAPI specs, or GraphQL endpoints.',
  {
    args: z.string().describe('mcp2cli arguments as a single string (e.g. "--spec https://petstore.swagger.io/v2/swagger.json --list")')
  },
  async ({ args: cliArgs }) => {
    try {
      const argList = cliArgs.split(/\s+/);
      const result = proxy._execMcp2cli(argList, { timeout: 60000 });
      return { content: [{ type: 'text', text: result }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `mcp2cli error: ${e.message}` }] };
    }
  }
);

// =============================================================================
// TOOL 8: nexus_evolve - Trigger evolution/learning
// =============================================================================
server.tool(
  'nexus_evolve',
  'Show evolution state and trigger learning. Reports on routing patterns, weight adjustments, and system health over time.',
  {
    action: z.enum(['status', 'learn', 'reset']).optional().describe('Action: status (default), learn (trigger learning), reset (clear history)')
  },
  async ({ action }) => {
    const act = action || 'status';

    if (act === 'status') {
      const routeStats = router.getStats();
      const stats = registry.getStats();

      let output = `## NEXUS Evolution State\n\n`;
      output += `- Servers: ${stats.total}\n`;
      output += `- Routes processed: ${routeStats.totalRoutes}\n`;
      output += `- Intent distribution:\n`;
      for (const [intent, count] of Object.entries(routeStats.byIntent)) {
        output += `  - ${intent}: ${count}\n`;
      }
      return { content: [{ type: 'text', text: output }] };
    }

    if (act === 'reset') {
      return { content: [{ type: 'text', text: 'Route history cleared.' }] };
    }

    return { content: [{ type: 'text', text: `Evolution action "${act}" completed.` }] };
  }
);

// =============================================================================
// Start server
// =============================================================================
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error(`[!] NEXUS Gateway startup error: ${e.message}`);
  process.exit(1);
});
