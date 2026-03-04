/**
 * NEXUS Auto-Researcher
 *
 * Automatically searches for new tools, patterns, and improvements.
 * Triggered every 5 sessions or on-demand.
 *
 * Research targets:
 * - GitHub trending: MCP servers, AI CLI tools
 * - npm registry: @google/gemini-cli, @openai/codex updates
 * - Anthropic docs: Claude Code new features
 * - Community: Multi-agent patterns
 *
 * @module nexus/self-evolution/auto-researcher
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { getEventBus } = require('../core/event-bus');

const FINDINGS_DIR = path.join(__dirname, 'research-findings');
const STATE_PATH = path.join(path.resolve(__dirname, '..'), 'evolution', 'evolution-state.json');

class AutoResearcher {
  constructor() {
    this.bus = getEventBus();
  }

  /**
   * Check if research is due (every 5 sessions)
   */
  isResearchDue() {
    try {
      if (fs.existsSync(STATE_PATH)) {
        const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
        const sessions = state.sessions || 0;
        return sessions > 0 && sessions % 5 === 0;
      }
    } catch (e) {}
    return false;
  }

  /**
   * Generate research queries
   * These are designed to be executed via MCP tools
   * (firecrawl_search, one_search, paper-search-mcp)
   */
  getResearchQueries() {
    return [
      {
        id: 'github_mcp',
        source: 'github',
        query: 'MCP server 2026 stars:>100',
        tool: 'firecrawl_search',
        purpose: 'Discover new MCP servers'
      },
      {
        id: 'npm_gemini',
        source: 'npm',
        query: '@google/gemini-cli latest version changelog',
        tool: 'one_search',
        purpose: 'Check Gemini CLI updates'
      },
      {
        id: 'npm_codex',
        source: 'npm',
        query: '@openai/codex latest version features',
        tool: 'one_search',
        purpose: 'Check Codex CLI updates'
      },
      {
        id: 'anthropic_features',
        source: 'anthropic',
        query: 'Claude Code new features 2026',
        tool: 'firecrawl_search',
        purpose: 'Check Claude Code updates'
      },
      {
        id: 'multi_agent_patterns',
        source: 'community',
        query: 'multi-agent orchestration pattern 2026 best practices',
        tool: 'one_search',
        purpose: 'Discover new orchestration patterns'
      }
    ];
  }

  /**
   * Save research findings
   */
  saveFindings(findings) {
    if (!fs.existsSync(FINDINGS_DIR)) {
      fs.mkdirSync(FINDINGS_DIR, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}.md`;
    const filepath = path.join(FINDINGS_DIR, filename);

    const lines = [
      `# NEXUS Auto-Research Findings - ${date}`,
      '',
      `> Generated at: ${new Date().toISOString()}`,
      ''
    ];

    for (const finding of findings) {
      lines.push(`## ${finding.source}: ${finding.purpose}`);
      lines.push(`- Query: \`${finding.query}\``);
      lines.push(`- Tool: ${finding.tool}`);
      if (finding.result) {
        lines.push(`- Result: ${finding.result}`);
      }
      if (finding.recommendation) {
        lines.push(`- Recommendation: ${finding.recommendation}`);
      }
      lines.push('');
    }

    fs.writeFileSync(filepath, lines.join('\n'));
    this.bus.emit('evolution:research', { date, findingCount: findings.length });
    return filepath;
  }

  /**
   * Get past research findings
   */
  getPastFindings(limit = 5) {
    if (!fs.existsSync(FINDINGS_DIR)) return [];
    const files = fs.readdirSync(FINDINGS_DIR)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, limit);
    return files.map(f => ({
      date: f.replace('.md', ''),
      path: path.join(FINDINGS_DIR, f)
    }));
  }
}

module.exports = { AutoResearcher };
