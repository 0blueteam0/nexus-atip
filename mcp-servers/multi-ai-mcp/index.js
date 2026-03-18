/**
 * Multi-AI Orchestration MCP Server
 * Exposes Claude + Gemini collaborative tools via MCP
 * 
 * Tools exposed:
 * - query_gemini: Query Gemini CLI
 * - deliberate: Claude-Gemini consensus engine
 * - dispatch_crawl: Multi-crawler orchestration
 * - generate_image: Image generation via Nano Banana
 * - generate_diagram: Diagram generation
 * - research: Search results analysis
 * - verify: Multi-source verification
 * - get_status: System status
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');
const path = require('path');

// Load orchestration modules
const ORCHESTRATION_PATH = path.join(__dirname, '../../multi-ai-orchestration');

let geminiBridge, consensusEngine, crawlerDispatcher, nanoBanana, researchAgent, verifyAgent;

try {
  geminiBridge = require(path.join(ORCHESTRATION_PATH, 'gemini-bridge.js'));
  consensusEngine = require(path.join(ORCHESTRATION_PATH, 'consensus-engine.js'));
  crawlerDispatcher = require(path.join(ORCHESTRATION_PATH, 'crawler-dispatcher.js'));
  nanoBanana = require(path.join(ORCHESTRATION_PATH, 'nano-banana.js'));
  researchAgent = require(path.join(ORCHESTRATION_PATH, 'subagent-pool/research-agent.js'));
  verifyAgent = require(path.join(ORCHESTRATION_PATH, 'subagent-pool/verify-agent.js'));
} catch (e) {
  console.error('[!] Module load error:', e.message);
}

// Tool definitions
const TOOLS = [
  {
    name: 'query_gemini',
    description: 'Query Gemini CLI for AI responses. Use for collaborative thinking with Claude.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The prompt to send to Gemini' },
        timeout: { type: 'number', description: 'Timeout in ms (default: 30000)' }
      },
      required: ['prompt']
    }
  },
  {
    name: 'deliberate',
    description: 'Run Claude-Gemini consensus deliberation. Returns agreed-upon plan after multi-round discussion.',
    inputSchema: {
      type: 'object',
      properties: {
        request: { type: 'string', description: 'User request to deliberate on' },
        claudePlan: { 
          type: 'object', 
          description: 'Initial Claude plan (optional)',
          properties: {
            approach: { type: 'string' },
            steps: { type: 'array', items: { type: 'string' } },
            risks: { type: 'array', items: { type: 'string' } }
          }
        },
        maxRounds: { type: 'number', description: 'Max deliberation rounds (default: 3)' }
      },
      required: ['request']
    }
  },
  {
    name: 'dispatch_crawl',
    description: 'Dispatch crawl request to appropriate crawler based on depth. Crawlers: SearXNG (search), Crawl4AI (extract), Firecrawl (deep-scrape).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query or URL to crawl' },
        depth: { 
          type: 'string', 
          enum: ['shallow', 'standard', 'deep', 'multi'],
          description: 'Crawl depth: shallow=SearXNG, standard=Crawl4AI, deep=Firecrawl, multi=all'
        },
        limit: { type: 'number', description: 'Max results for search (default: 20)' }
      },
      required: ['query']
    }
  },
  {
    name: 'generate_image',
    description: 'Generate image using Gemini API via Nano Banana.',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Image description' },
        type: { 
          type: 'string',
          enum: ['photo', 'illustration', 'diagram', 'chart', 'icon', 'logo'],
          description: 'Image type (default: illustration)'
        },
        size: { type: 'string', description: 'Image size (default: 1024x1024)' },
        filename: { type: 'string', description: 'Output filename (optional)' }
      },
      required: ['description']
    }
  },
  {
    name: 'generate_diagram',
    description: 'Generate technical diagram using Gemini API.',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Diagram description' },
        diagramType: {
          type: 'string',
          enum: ['flowchart', 'sequence', 'architecture', 'mindmap', 'er-diagram', 'class-diagram'],
          description: 'Diagram type (default: flowchart)'
        },
        filename: { type: 'string', description: 'Output filename (optional)' }
      },
      required: ['description']
    }
  },
  {
    name: 'research',
    description: 'Analyze search results for relevance, categorize sources, and generate research summary.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Original search query' },
        results: {
          type: 'array',
          description: 'Raw search results to analyze',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              url: { type: 'string' },
              description: { type: 'string' },
              content: { type: 'string' }
            }
          }
        }
      },
      required: ['query', 'results']
    }
  },
  {
    name: 'verify',
    description: 'Cross-verify claims across multiple sources. Returns verification status and confidence.',
    inputSchema: {
      type: 'object',
      properties: {
        sources: {
          type: 'array',
          description: 'Sources to cross-verify',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              title: { type: 'string' },
              content: { type: 'string' }
            }
          }
        }
      },
      required: ['sources']
    }
  },
  {
    name: 'get_crawler_status',
    description: 'Get availability status of all crawlers (SearXNG, Crawl4AI, Firecrawl).',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_system_status',
    description: 'Get full Multi-AI Orchestration system status including Gemini CLI and all services.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Tool handlers
async function handleToolCall(name, args) {
  console.error(`[*] MCP Tool: ${name}`);
  
  try {
    switch (name) {
      case 'query_gemini':
        if (!geminiBridge) throw new Error('Gemini bridge not loaded');
        return await geminiBridge.queryGemini(args.prompt, { timeout: args.timeout });

      case 'deliberate':
        if (!consensusEngine) throw new Error('Consensus engine not loaded');
        return await consensusEngine.deliberate(args.request, args.claudePlan, {
          maxRounds: args.maxRounds
        });

      case 'dispatch_crawl':
        if (!crawlerDispatcher) throw new Error('Crawler dispatcher not loaded');
        return await crawlerDispatcher.dispatchCrawl(args.query, {
          depth: args.depth || 'standard',
          limit: args.limit || 20
        });

      case 'generate_image':
        if (!nanoBanana) throw new Error('Nano Banana not loaded');
        return await nanoBanana.generateImage(args.description, {
          type: args.type,
          size: args.size,
          filename: args.filename
        });

      case 'generate_diagram':
        if (!nanoBanana) throw new Error('Nano Banana not loaded');
        return await nanoBanana.generateDiagram(args.description, args.diagramType, {
          filename: args.filename
        });

      case 'research':
        if (!researchAgent) throw new Error('Research agent not loaded');
        return await researchAgent.research(args.query, args.results);

      case 'verify':
        if (!verifyAgent) throw new Error('Verify agent not loaded');
        return await verifyAgent.verify(args.sources);

      case 'get_crawler_status':
        if (!crawlerDispatcher) throw new Error('Crawler dispatcher not loaded');
        return await crawlerDispatcher.getCrawlerStatus();

      case 'get_system_status':
        const status = {
          service: 'Multi-AI Orchestration',
          version: '1.0.0',
          modules: {
            geminiBridge: !!geminiBridge,
            consensusEngine: !!consensusEngine,
            crawlerDispatcher: !!crawlerDispatcher,
            nanoBanana: !!nanoBanana,
            researchAgent: !!researchAgent,
            verifyAgent: !!verifyAgent
          },
          timestamp: new Date().toISOString()
        };
        
        if (crawlerDispatcher) {
          status.crawlers = await crawlerDispatcher.getCrawlerStatus();
        }
        if (nanoBanana) {
          status.nanoBanana = await nanoBanana.getStatus();
        }
        
        return status;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (e) {
    console.error(`[-] Tool error: ${e.message}`);
    return { error: e.message, success: false };
  }
}

// Create and run MCP server
async function main() {
  const server = new Server(
    { name: 'multi-ai-orchestration', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS
  }));

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const result = await handleToolCall(name, args || {});
    
    return {
      content: [{
        type: 'text',
        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      }]
    };
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[+] Multi-AI Orchestration MCP Server running');
}

// CLI test mode
if (process.argv.includes('--test')) {
  console.log('[*] Multi-AI MCP Server - Test Mode');
  console.log('[*] Tools available:', TOOLS.map(t => t.name).join(', '));
  console.log('[*] Modules loaded:');
  console.log('  - geminiBridge:', !!geminiBridge);
  console.log('  - consensusEngine:', !!consensusEngine);
  console.log('  - crawlerDispatcher:', !!crawlerDispatcher);
  console.log('  - nanoBanana:', !!nanoBanana);
  console.log('  - researchAgent:', !!researchAgent);
  console.log('  - verifyAgent:', !!verifyAgent);
  process.exit(0);
}

main().catch(e => {
  console.error('[-] Server error:', e);
  process.exit(1);
});
