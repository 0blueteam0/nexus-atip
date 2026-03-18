#!/usr/bin/env node
/**
 * Deep Research MCP Server
 * Multi-AI Orchestration System - Phase 1D.2
 * 
 * Exposes deep research workflow as MCP tools
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

const path = require('path');

// Import deep research workflow
const workflowPath = path.join(__dirname, '..', '..', 'multi-ai-orchestration', 'deep-research-workflow.js');
let workflow;

try {
  workflow = require(workflowPath);
  console.error('[+] Deep research workflow loaded');
} catch (e) {
  console.error('[-] Failed to load workflow:', e.message);
  workflow = null;
}

// Tool definitions
const TOOLS = [
  {
    name: 'deep_research',
    description: 'Run full 5-stage deep research on a topic. Stages: Discovery -> Scrape -> Deep Dive -> Verify -> Synthesize. Uses multiple crawlers (SearXNG, Crawl4AI, Firecrawl) and sub-agents for comprehensive research.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Research topic or question to investigate'
        },
        maxSources: {
          type: 'number',
          description: 'Maximum sources to discover (default: 20)',
          default: 20
        },
        maxPages: {
          type: 'number',
          description: 'Maximum pages to scrape (default: 10)',
          default: 10
        },
        deepPages: {
          type: 'number',
          description: 'Maximum deep dive pages (default: 5)',
          default: 5
        },
        useGemini: {
          type: 'boolean',
          description: 'Include Gemini collaboration in synthesis (default: true)',
          default: true
        }
      },
      required: ['query']
    }
  },
  {
    name: 'quick_research',
    description: 'Run quick research (discovery + scrape only, skips deep dive and verification). Faster but less thorough.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Research topic or question'
        },
        maxSources: {
          type: 'number',
          description: 'Maximum sources to discover (default: 10)',
          default: 10
        },
        maxPages: {
          type: 'number',
          description: 'Maximum pages to scrape (default: 5)',
          default: 5
        }
      },
      required: ['query']
    }
  },
  {
    name: 'research_status',
    description: 'Show deep research system status and configuration',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// Create server
const server = new Server(
  {
    name: 'deep-research-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (!workflow) {
    return {
      content: [
        {
          type: 'text',
          text: '[-] Deep research workflow not loaded. Check multi-ai-orchestration setup.'
        }
      ],
      isError: true
    };
  }

  try {
    switch (name) {
      case 'deep_research': {
        const options = {
          maxSources: args.maxSources || 20,
          maxPages: args.maxPages || 10,
          deepPages: args.deepPages || 5,
          useGemini: args.useGemini !== false
        };
        
        console.error(`[*] Starting deep research: ${args.query}`);
        const result = await workflow.deepResearch(args.query, options);
        
        return {
          content: [
            {
              type: 'text',
              text: formatDeepResearchResult(result)
            }
          ]
        };
      }
      
      case 'quick_research': {
        const options = {
          maxSources: args.maxSources || 10,
          maxPages: args.maxPages || 5
        };
        
        console.error(`[*] Starting quick research: ${args.query}`);
        const result = await workflow.quickResearch(args.query, options);
        
        return {
          content: [
            {
              type: 'text',
              text: formatQuickResearchResult(result)
            }
          ]
        };
      }
      
      case 'research_status': {
        const status = getSystemStatus();
        return {
          content: [
            {
              type: 'text',
              text: status
            }
          ]
        };
      }
      
      default:
        return {
          content: [
            {
              type: 'text',
              text: `[-] Unknown tool: ${name}`
            }
          ],
          isError: true
        };
    }
  } catch (error) {
    console.error(`[-] Tool error:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `[-] Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Format deep research result for output
function formatDeepResearchResult(result) {
  if (!result) {
    return '[-] No result returned from deep research';
  }

  const lines = [
    '# Deep Research Report',
    '',
    `**Query**: ${result.query || 'N/A'}`,
    `**Duration**: ${result.duration || 'N/A'}`,
    `**Stages Completed**: ${result.stagesCompleted || 0}/5`,
    ''
  ];

  // Discovery stats
  if (result.discovery) {
    lines.push('## Stage 1: Discovery');
    lines.push(`- Sources found: ${result.discovery.sourcesFound || 0}`);
    lines.push(`- Categories: ${Object.keys(result.discovery.byCategory || {}).join(', ') || 'N/A'}`);
    lines.push('');
  }

  // Scrape stats
  if (result.scrape) {
    lines.push('## Stage 2: Scrape');
    lines.push(`- Pages scraped: ${result.scrape.pagesScraped || 0}`);
    lines.push(`- Content extracted: ${result.scrape.contentExtracted || 0} items`);
    lines.push('');
  }

  // Deep dive stats
  if (result.deepDive) {
    lines.push('## Stage 3: Deep Dive');
    lines.push(`- Protected pages accessed: ${result.deepDive.pagesAccessed || 0}`);
    lines.push(`- Deep content items: ${result.deepDive.deepContentItems || 0}`);
    lines.push('');
  }

  // Verification stats
  if (result.verification) {
    lines.push('## Stage 4: Verification');
    lines.push(`- Claims verified: ${result.verification.claimsVerified || 0}`);
    lines.push(`- Confidence score: ${((result.verification.confidence || 0) * 100).toFixed(1)}%`);
    lines.push('');
  }

  // Synthesis
  if (result.synthesis) {
    lines.push('## Stage 5: Synthesis');
    lines.push('');
    lines.push('### Key Findings');
    if (result.synthesis.keyFindings && result.synthesis.keyFindings.length > 0) {
      result.synthesis.keyFindings.forEach((finding, i) => {
        lines.push(`${i + 1}. ${finding}`);
      });
    } else {
      lines.push('- No key findings extracted');
    }
    lines.push('');
    
    if (result.synthesis.summary) {
      lines.push('### Summary');
      lines.push(result.synthesis.summary);
      lines.push('');
    }
  }

  // Output file
  if (result.outputFile) {
    lines.push('---');
    lines.push(`**Full report saved to**: ${result.outputFile}`);
  }

  return lines.join('\n');
}

// Format quick research result
function formatQuickResearchResult(result) {
  if (!result) {
    return '[-] No result returned from quick research';
  }

  const lines = [
    '# Quick Research Report',
    '',
    `**Query**: ${result.query || 'N/A'}`,
    `**Duration**: ${result.duration || 'N/A'}`,
    ''
  ];

  if (result.discovery) {
    lines.push('## Discovery');
    lines.push(`- Sources: ${result.discovery.sourcesFound || 0}`);
  }

  if (result.scrape) {
    lines.push('## Scrape');
    lines.push(`- Pages: ${result.scrape.pagesScraped || 0}`);
    lines.push(`- Content items: ${result.scrape.contentExtracted || 0}`);
  }

  if (result.topSources && result.topSources.length > 0) {
    lines.push('');
    lines.push('## Top Sources');
    result.topSources.slice(0, 5).forEach((src, i) => {
      lines.push(`${i + 1}. ${src.title || src.url}`);
    });
  }

  return lines.join('\n');
}

// Get system status
function getSystemStatus() {
  const config = workflow ? workflow.CONFIG : null;
  
  const lines = [
    '# Deep Research System Status',
    '',
    `**Workflow Loaded**: ${workflow ? 'Yes' : 'No'}`,
    ''
  ];

  if (config) {
    lines.push('## Configuration');
    lines.push(`- Max Discovery Sources: ${config.discovery?.maxSources || 'N/A'}`);
    lines.push(`- Max Scrape Pages: ${config.scrape?.maxPages || 'N/A'}`);
    lines.push(`- Max Deep Dive Pages: ${config.deepDive?.maxPages || 'N/A'}`);
    lines.push(`- Gemini Enabled: ${config.synthesize?.includeGemini || false}`);
    lines.push('');
    
    lines.push('## Crawlers');
    if (config.crawlers) {
      Object.entries(config.crawlers).forEach(([name, cfg]) => {
        lines.push(`- ${name}: ${cfg.url || 'N/A'} (priority: ${cfg.priority || 'N/A'})`);
      });
    }
  }

  lines.push('');
  lines.push('## Available Tools');
  lines.push('- deep_research: Full 5-stage research');
  lines.push('- quick_research: Fast 2-stage research');
  lines.push('- research_status: This status report');

  return lines.join('\n');
}

// Main startup
async function main() {
  console.error('[*] Deep Research MCP Server starting...');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('[+] Deep Research MCP Server running');
}

main().catch((error) => {
  console.error('[-] Server error:', error);
  process.exit(1);
});
