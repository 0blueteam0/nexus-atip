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
  ports             Validate port interfaces (v2.0)

Version: 2.0.0
`);
  }
}

main().catch(err => {
  console.error('[-] Error:', err.message);
  process.exit(1);
});
