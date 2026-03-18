#!/usr/bin/env node
/**
 * NEXUS CLI - Command Line Interface
 *
 * Usage:
 *   node nexus/core/cli.js init          # Initialize NEXUS
 *   node nexus/core/cli.js status        # Show status
 *   node nexus/core/cli.js route "task"  # Route a task
 *   node nexus/core/cli.js evolve        # Show evolution state
 *   node nexus/core/cli.js workflows     # List workflows
 *   node nexus/core/cli.js knowledge     # Show knowledge stats
 *   node nexus/core/cli.js research      # Show research status
 *   node nexus/core/cli.js check         # Run improvement checklist
 *
 * @module nexus/core/cli
 */

'use strict';

const path = require('path');
const { Orchestrator } = require('./orchestrator');
const { loadConfig, getEnabledProviders } = require('./config-parser');
const { getContainer } = require('./container');
const { validateContainer, validateNullAdapters } = require('./port-validator');
const { WorkflowEngine } = require('../workflows/workflow-engine');
const { KnowledgeIndex } = require('../knowledge/knowledge-index');
const { AutoResearcher } = require('../self-evolution/auto-researcher');
const { ImprovementChecklist } = require('../self-evolution/improvement-checklist');
const { AtosBridge } = require('../bridges/atos-bridge');
const { MultiAiBridge } = require('../bridges/multi-ai-bridge');
const { MCPRouter } = require('../gateway/mcp-router');
const { A2AHub } = require('../gateway/a2a-hub');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init': {
      const orch = new Orchestrator();
      const ok = await orch.init();
      if (ok) {
        const status = orch.getStatus();
        console.log('[+] NEXUS initialized');
        console.log(`    Session: ${status.sessionId}`);
        console.log(`    Providers: ${Object.keys(status.providers).length}`);
        Object.entries(status.providers).forEach(([id, p]) => {
          console.log(`      [${p.status === 'available' ? '+' : '-'}] ${id}: ${p.role} (ctx: ${p.context}, cost: ${p.costTier})`);
        });
        console.log(`    Evolution sessions: ${status.evolutionSessions}`);
        console.log(`    Patterns: ${status.patternCount}`);
      } else {
        console.error('[-] Initialization failed');
        process.exit(1);
      }
      break;
    }

    case 'status': {
      const orch = new Orchestrator();
      await orch.init();
      const s = orch.getStatus();
      console.log('========================================');
      console.log('  NEXUS Status');
      console.log('========================================');
      console.log(`  Session: ${s.sessionId}`);
      console.log(`  Uptime: ${(s.uptime / 1000).toFixed(0)}s`);
      console.log(`  Tasks: ${s.taskCount} (success: ${s.successRate})`);
      console.log('');
      console.log('  Providers:');
      Object.entries(s.providers).forEach(([id, p]) => {
        console.log(`    [${p.status === 'available' ? '+' : '-'}] ${id}`);
        console.log(`        Role: ${p.role} | Context: ${p.context} | Cost: ${p.costTier}`);
      });
      console.log('');
      console.log(`  Evolution: ${s.evolutionSessions} sessions, ${s.patternCount} patterns`);

      // Bridges
      const atos = new AtosBridge();
      atos.init();
      const mai = new MultiAiBridge();
      mai.init();
      console.log('');
      console.log('  Bridges:');
      console.log(`    ATOS: ${JSON.stringify(atos.getStatus().modules)}`);
      console.log(`    Multi-AI: ${JSON.stringify(mai.getStatus().modules)}`);
      console.log('========================================');
      break;
    }

    case 'route': {
      const task = args.slice(1).join(' ');
      if (!task) {
        console.error('Usage: nexus route "task description"');
        process.exit(1);
      }
      const orch = new Orchestrator();
      await orch.init();
      const decision = await orch.route({ type: 'general', prompt: task });
      console.log('[*] Routing: ' + task);
      console.log(`    -> Provider: ${decision.provider}`);
      console.log(`    -> Fallbacks: ${decision.fallbacks.join(' -> ') || 'none'}`);
      console.log(`    -> Reason: ${decision.reason}`);
      console.log(`    -> Strategy: ${decision.strategy}`);
      break;
    }

    case 'evolve': {
      const orch = new Orchestrator();
      await orch.init();
      console.log('========================================');
      console.log('  NEXUS Evolution State');
      console.log('========================================');
      const es = orch.evolutionState;
      console.log(`  Sessions: ${es?.sessions || 0}`);
      console.log(`  Patterns: ${es?.patterns?.length || 0}`);
      if (es?.weights && Object.keys(es.weights).length > 0) {
        console.log('  Weights:');
        for (const [t, ps] of Object.entries(es.weights)) {
          for (const [p, w] of Object.entries(ps)) {
            console.log(`    ${t}/${p}: ${w.toFixed(3)}`);
          }
        }
      }
      if (es?.lastUpdated) {
        console.log(`  Last updated: ${new Date(es.lastUpdated).toISOString()}`);
      }
      console.log('========================================');
      break;
    }

    case 'workflows':
    case 'workflow': {
      const engine = new WorkflowEngine();
      const wfs = engine.listWorkflows();
      console.log(`[*] ${wfs.length} Workflows registered:`);
      wfs.forEach(w => {
        console.log(`  ${w.id}: ${w.name}`);
        console.log(`      Triggers: ${w.triggers.join(', ')}`);
        console.log(`      Template: ${w.template}`);
      });
      break;
    }

    case 'knowledge': {
      const ki = new KnowledgeIndex();
      const stats = ki.getStats();
      console.log('[*] Knowledge Base:');
      console.log(`    Patterns: ${stats.patterns}`);
      console.log(`    Anti-patterns: ${stats.antiPatterns}`);
      console.log(`    Best practices: ${stats.bestPractices}`);
      console.log(`    Session summaries: ${stats.sessionSummaries}`);

      const bp = ki.getBestPractices();
      if (bp.length > 0) {
        console.log('\n    Best Practices:');
        bp.forEach(p => {
          console.log(`      [${(p.confidence * 100).toFixed(0)}%] ${p.taskType}: ${p.practice}`);
        });
      }
      break;
    }

    case 'research': {
      const researcher = new AutoResearcher();
      const due = researcher.isResearchDue();
      console.log(`[*] Auto-Research: ${due ? 'DUE' : 'Not due'}`);
      console.log('    Queries:');
      researcher.getResearchQueries().forEach(q => {
        console.log(`      [${q.source}] ${q.purpose}`);
        console.log(`        Query: ${q.query}`);
        console.log(`        Tool: ${q.tool}`);
      });
      const past = researcher.getPastFindings();
      if (past.length > 0) {
        console.log(`\n    Past findings: ${past.length}`);
        past.forEach(f => console.log(`      ${f.date}`));
      }
      break;
    }

    case 'check': {
      const checklist = new ImprovementChecklist();
      const results = await checklist.run({ taskCount: 0 });
      console.log('[*] Improvement Checklist:');
      results.checks.forEach(c => {
        const icon = c.status === 'done' ? '+' : c.status === 'error' ? '-' : '*';
        console.log(`  [${icon}] ${c.name}: ${c.detail}`);
      });
      break;
    }

    case 'infra': {
      const container = getContainer();
      const infra = container.resolve('InfraPort');
      console.log('========================================');
      console.log('  NEXUS Infrastructure Status (L1)');
      console.log('========================================');
      try {
        const services = await infra.listServices();
        services.forEach(s => {
          const icon = s.status === 'running' ? '+' : s.status === 'stopped' ? '-' : '?';
          console.log(`  [${icon}] ${s.name} (${s.type}) [${s.layer}]: ${s.status}`);
        });
      } catch (e) {
        console.log('  [*] InfraPort using null adapter (services not checked)');
      }
      console.log('========================================');
      break;
    }

    case 'ecosystem': {
      const container = getContainer();
      console.log('========================================');
      console.log('  NEXUS v3.0 - 7-Layer Ecosystem');
      console.log('========================================');
      const portStatus = container.getStatus();
      const layers = [
        { id: 'L1', name: 'Infrastructure', ports: ['InfraPort'] },
        { id: 'L2', name: 'AI Models/Providers', ports: ['ModelRouterPort', 'LocalLLMPort'] },
        { id: 'L3', name: 'Agent Frameworks', ports: ['AgentFrameworkPort', 'AgentLoopPort'] },
        { id: 'L4', name: 'Orchestration/Workflow', ports: ['WorkflowPort'] },
        { id: 'L5', name: 'Data/RAG', ports: ['RAGPort', 'MemoryPort'] },
        { id: 'L6', name: 'Observability', ports: ['ObservabilityPort', 'EvolutionPort'] },
        { id: 'L7', name: 'Protocols', ports: ['ToolExecutionPort', 'ContextEnginePort', 'PolicyPort', 'SkillRegistryPort'] }
      ];
      layers.forEach(layer => {
        console.log(`\n  [${layer.id}] ${layer.name}`);
        layer.ports.forEach(p => {
          const s = portStatus[p];
          if (s) {
            const icon = s.registered ? '+' : '*';
            const tag = s.nullFallback ? 'null' : s.type;
            console.log(`    [${icon}] ${p}: ${tag}`);
          }
        });
      });
      console.log('\n========================================');
      break;
    }

    case 'gateway': {
      const mcpRouter = new MCPRouter();
      const a2aHub = new A2AHub();
      console.log('========================================');
      console.log('  NEXUS Gateway (L7)');
      console.log('========================================');
      console.log('');
      const mcpStatus = mcpRouter.getStatus();
      console.log(`  MCP Servers: ${mcpStatus.totalServers}`);
      console.log('  Categories:');
      Object.entries(mcpStatus.categories).forEach(([cat, count]) => {
        console.log(`    ${cat}: ${count}`);
      });
      console.log('');
      const a2aStatus = a2aHub.getStatus();
      console.log(`  A2A Agents: ${a2aStatus.agents}`);
      a2aHub.listAgents().forEach(a => {
        console.log(`    [+] ${a.id}: ${a.capabilities.join(', ')}`);
      });
      console.log('========================================');
      break;
    }

    case 'dashboard': {
      const container = getContainer();
      const obs = container.resolve('ObservabilityPort');
      const dashboard = await obs.getDashboard();
      console.log('========================================');
      console.log('  NEXUS Observability Dashboard');
      console.log('========================================');
      console.log(`  Total cost: $${dashboard.costs.total}`);
      console.log(`  Total tokens: ${dashboard.costs.totalTokens}`);
      console.log(`  Total entries: ${dashboard.costs.count}`);
      console.log('');
      console.log('  Today:');
      console.log(`    Cost: $${dashboard.today.total} | Tokens: ${dashboard.today.totalTokens} | Tasks: ${dashboard.today.count}`);
      console.log('');
      if (Object.keys(dashboard.costs.byProvider).length > 0) {
        console.log('  Cost by Provider:');
        Object.entries(dashboard.costs.byProvider).forEach(([p, d]) => {
          console.log(`    ${p}: $${d.cost.toFixed(4)} (${d.tokens} tokens, ${d.count} calls)`);
        });
      }
      console.log('');
      if (Object.keys(dashboard.quality).length > 0) {
        console.log('  Quality by Provider:');
        Object.entries(dashboard.quality).forEach(([p, d]) => {
          console.log(`    ${p}: score ${d.avgScore} | success ${d.successRate} (${d.count} tasks)`);
        });
      }
      console.log('========================================');
      break;
    }

    case 'ports': {
      console.log('========================================');
      console.log('  NEXUS Port Validation');
      console.log('========================================');

      // Null adapter validation
      console.log('\n  Null Adapters:');
      const nullResults = validateNullAdapters();
      nullResults.forEach(r => {
        console.log(`    [${r.valid ? '+' : '-'}] ${r.port}: ${r.valid ? 'PASS' : 'FAIL'}`);
      });

      // Container validation
      console.log('\n  Container:');
      const container = getContainer();
      const status = container.getStatus();
      Object.entries(status).forEach(([port, s]) => {
        const icon = s.registered ? '+' : '*';
        const tag = s.nullFallback ? '(null fallback)' : `(${s.type})`;
        console.log(`    [${icon}] ${port}: ${tag}`);
      });

      console.log('========================================');
      break;
    }

    case 'monitor': {
      console.log('[*] Starting NEXUS Monitor...');
      try {
        const { MonitorServer } = require('../monitor/server');
        const server = new MonitorServer();
        const result = await server.start();
        if (result.started) {
          console.log(`[+] Monitor started: ${result.url}`);
          console.log('    Press Ctrl+C to stop');
          process.on('SIGINT', () => { server.stop(); process.exit(0); });
        } else {
          console.error(`[-] Monitor failed: ${result.error}`);
        }
      } catch (e) {
        console.error(`[-] Monitor error: ${e.message}`);
      }
      break;
    }

    case 'checkpoint': {
      const subCmd = args[1];
      try {
        const { CheckpointStore } = require('../agent-framework/checkpoint-store');
        const store = new CheckpointStore();

        if (subCmd === 'list') {
          const stats = store.getStats();
          console.log('[*] Checkpoint Stats:');
          console.log(`    Backend: ${stats.backend}`);
          console.log(`    Total: ${stats.totalCheckpoints}`);
          console.log(`    Runs: ${stats.runs}`);
          if (stats.latestCheckpoint) {
            console.log(`    Latest: ${new Date(stats.latestCheckpoint).toISOString()}`);
          }
        } else if (subCmd === 'restore' && args[2]) {
          const cp = store.load(args[2]);
          if (cp) {
            console.log(`[+] Checkpoint loaded: ${args[2]}`);
            console.log(`    Run: ${cp.runId}`);
            console.log(`    Node: ${cp.node}`);
            console.log(`    State keys: ${Object.keys(cp.state || {}).join(', ')}`);
          } else {
            console.log(`[-] Checkpoint not found: ${args[2]}`);
          }
        } else {
          console.log('Usage: nexus checkpoint list | nexus checkpoint restore <id>');
        }
      } catch (e) {
        console.error(`[-] Checkpoint error: ${e.message}`);
      }
      break;
    }

    case 'obsidian': {
      const subCmd = args[1];
      try {
        const { ObsidianIntegration } = require('../obsidian');
        const config = loadConfig();
        const obsConfig = config.obsidian || {};
        const obs = new ObsidianIntegration(obsConfig);

        if (subCmd === 'status') {
          await obs.init();
          const s = obs.getStatus();
          console.log('========================================');
          console.log('  NEXUS Obsidian Integration');
          console.log('========================================');
          console.log('  Initialized: ' + s.initialized);
          if (s.bridge) {
            console.log('  Available: ' + s.bridge.available);
            console.log('  Host: ' + s.bridge.host + ':' + s.bridge.port);
            console.log('  Base path: ' + s.bridge.basePath);
            console.log('  Sync mode: ' + s.config.syncMode);
            console.log('  Queue: ' + s.bridge.queueSize + ' pending');
            console.log('  Stats: ' + s.bridge.stats.written + ' written, ' + s.bridge.stats.failed + ' failed');
          }
          if (s.eventWriter) {
            console.log('  Notes created: ' + s.eventWriter.notesCreated);
            console.log('  Tracked tasks: ' + s.eventWriter.trackedTasks);
          }
          console.log('========================================');

        } else if (subCmd === 'sync') {
          await obs.init();
          const orch = new Orchestrator();
          await orch.init();
          const status = orch.getStatus();
          const result = await obs.sync({
            session: {
              sessionId: status.sessionId,
              providers: Object.keys(status.providers),
              taskCount: status.taskCount,
              successRate: parseFloat(status.successRate) || 0,
              startTime: Date.now()
            },
            providers: Object.fromEntries(
              Object.entries(status.providers).map(([id, p]) => [id, {
                role: p.role, status: p.status, context: p.context,
                costTier: p.costTier, strengths: p.strengths || [], weaknesses: p.weaknesses || []
              }])
            ),
            evolution: orch.evolutionState
          });
          console.log('[+] Obsidian sync complete');
          if (result.session) console.log('  Session note: ' + (result.session.ok ? 'written' : 'skipped'));
          if (result.evolution) console.log('  Evolution: ' + result.evolution.synced + ' synced');
          if (result.memory) {
            console.log('  Memory -> Obsidian: ' + result.memory.memoryToObsidian);
            console.log('  Obsidian hints: ' + result.memory.obsidianHints);
          }

        } else if (subCmd === 'init') {
          await obs.init();
          const config2 = loadConfig();
          const result = await obs.initVault(config2.providers || {});
          console.log('[+] Obsidian vault initialized');
          console.log('  Folders: ' + (result.folders || []).join(', '));

        } else if (subCmd === 'dashboard') {
          await obs.init();
          await obs.regenerateDashboard();
          console.log('[+] Dashboard.md regenerated');

        } else {
          console.log('Usage: nexus obsidian <status|sync|init|dashboard>');
          console.log('  status     Check REST API connection');
          console.log('  sync       Sync session/evolution/memory to vault');
          console.log('  init       Initialize vault folder structure');
          console.log('  dashboard  Regenerate Dashboard.md');
        }

        await obs.destroy();
      } catch (e) {
        console.error('[-] Obsidian error: ' + e.message);
      }
      break;
    }

    case 'sync': {
      const subCmd = args[1];
      if (subCmd === 'configs') {
        try {
          const { ConfigSync } = require('../sync/config-sync');
          const dryRun = args.includes('--dry-run');
          const sync = new ConfigSync({ dryRun });
          const result = sync.sync();

          if (!result.synced) {
            console.log(`[-] Sync failed: ${result.reason}`);
            process.exit(1);
          }

          console.log('[+] Config sync complete');
          if (result.gemini) {
            console.log(`    Gemini: ${result.gemini.status || 'preview'} (${result.gemini.servers.length} servers)`);
          }
          if (result.codex) {
            console.log(`    Codex: ${result.codex.status || 'preview'} (${result.codex.servers.length} servers)`);
          }
          if (result.skillLinks) {
            result.skillLinks.forEach(l => {
              console.log(`    Skill link: ${path.basename(path.dirname(l.link))}/${path.basename(l.link)} [${l.status}]`);
            });
          }
          console.log(`    Skipped: ${result.skipped.length} servers`);
        } catch (e) {
          console.error(`[-] Config sync error: ${e.message}`);
        }
      } else if (subCmd === 'gemini') {
        try {
          const { GeminiSync } = require('../sync/gemini-sync');
          const sync = new GeminiSync();
          const result = sync.sync();
          if (result.synced) {
            console.log('[+] Gemini sync complete');
            console.log(`    Settings: ${result.settings.path}`);
            console.log(`    GEMINI.md: ${result.geminiMd.path}`);
          } else {
            console.log(`[-] Sync skipped: ${result.reason}`);
          }
        } catch (e) {
          console.error(`[-] Gemini sync error: ${e.message}`);
        }
      } else {
        console.log('Usage: nexus sync <configs|gemini> [--dry-run]');
        console.log('  configs    Sync MCP servers from .claude.json to Gemini/Codex');
        console.log('  gemini     Sync Architect.md to GEMINI.md and .gemini/settings.json');
      }
      break;
    }

    case 'team': {
      const subCmd = args[1];
      const hub = new A2AHub();

      // Load TeamOrchestrator with config
      let teamOrch = null;
      try {
        const { TeamOrchestrator } = require('../claude-features/team-orchestrator');
        const cfg = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'nexus.config.json'), 'utf8'));
        const at = cfg.claude_features?.agent_teams || {};
        teamOrch = new TeamOrchestrator({ enabled: at.enabled, maxTeamSize: at.max_members, timeoutMs: at.timeout_ms });
        teamOrch.connectA2AHub(hub);
      } catch { /* fallback to hub only */ }

      if (subCmd === 'spawn') {
        const goal = args.slice(2).join(' ') || 'general task';
        if (teamOrch) {
          // Use TeamOrchestrator + A2AHub bridge
          const team = teamOrch.startTeam({
            name: `cli-team-${Date.now()}`,
            task: goal,
            members: [
              { role: 'lead', agentType: 'claude-code', subtask: goal },
              { role: 'reviewer', agentType: 'gemini-cli', subtask: `Review: ${goal}` }
            ]
          });
          if (team.started) {
            const delegation = teamOrch.delegateViaA2AHub(team.teamId);
            console.log('[+] Team spawned (Orchestrator + A2AHub):');
            console.log(`    Team ID: ${team.teamId}`);
            console.log(`    A2A delegated: ${delegation.delegated}`);
            const status = teamOrch.getTeamStatus(team.teamId);
            status.members.forEach(m => console.log(`    [${m.status}] ${m.role}: ${m.agentType}`));
          } else {
            console.log(`[-] Team start failed: ${team.reason}`);
          }
        } else {
          // Fallback: A2AHub only
          const result = hub.delegateToTeam({ goal });
          console.log('[*] Team spawned (A2AHub):');
          console.log(`    Team ID: ${result.teamId}`);
          console.log(`    Members: ${result.members.join(', ')}`);
          console.log(`    Status: ${result.status}`);
        }
      } else if (subCmd === 'status') {
        // Combined status from both systems
        const hubStatus = hub.getStatus();
        console.log('[*] A2AHub Status:');
        console.log(`    Agents: ${hubStatus.agents}`);
        console.log(`    Queued tasks: ${hubStatus.queuedTasks}`);
        console.log(`    Active teams: ${hubStatus.activeTeams}`);
        hubStatus.agentList.forEach(a => console.log(`      ${a}`));

        if (teamOrch) {
          const orchStatus = teamOrch.getStatus();
          console.log('[*] TeamOrchestrator Status:');
          console.log(`    Enabled: ${orchStatus.enabled}`);
          console.log(`    Total teams: ${orchStatus.totalTeams}`);
          console.log(`    Active: ${orchStatus.activeTeams}`);
          console.log(`    Max size: ${orchStatus.maxTeamSize}`);
          console.log(`    A2AHub: ${orchStatus.a2aHubConnected ? 'connected' : 'disconnected'}`);
          console.log(`    Hook events: ${orchStatus.hookListeners.join(', ')}`);
        }
      } else {
        console.log('Usage: nexus team spawn "goal" | nexus team status');
      }
      break;
    }

    default:
      console.log(`
NEXUS - Network of Evolving eXtensible Unified Services
========================================================
Usage: node nexus/core/cli.js <command> [args]

Commands:
  init              Initialize NEXUS session
  status            Full system status
  route "task"      Route a task to optimal provider
  evolve            Show evolution state and weights
  workflows         List registered workflows
  knowledge         Show knowledge base stats
  research          Show auto-research status
  check             Run improvement checklist
  ports             Validate port interfaces
  infra             Infrastructure services status (L1)
  ecosystem         7-Layer ecosystem overview
  dashboard         Cost/quality observability dashboard
  gateway           MCP/A2A gateway status (L7)
  monitor           Start live monitoring dashboard (port 7850)
  checkpoint        Checkpoint management (list/restore)
  team              Agent team management (spawn/status)
  obsidian          Obsidian vault integration (status/sync/init/dashboard)
  sync              Config sync across CLIs (configs/gemini)

Version: 3.0.0 (Phase 13)
`);
  }
}

main().catch(err => {
  console.error('[-] Error:', err.message);
  process.exit(1);
});
