#!/usr/bin/env node
/**
 * NEXUS Session Start Hook
 *
 * Runs at every Claude Code session start:
 * 1. Initialize orchestrator (load config, providers, evolution state)
 * 2. Health check all providers
 * 3. Check if auto-research is due
 * 4. Display compact status
 *
 * @module nexus/core/session-start
 */

'use strict';

const { Orchestrator } = require('./orchestrator');
const { AutoResearcher } = require('../self-evolution/auto-researcher');

async function sessionStart() {
  console.log('==================================================');
  console.log('[NEXUS] Session Start - Multi-AI Orchestration');
  console.log('==================================================');

  try {
    // 1. Initialize
    const orch = new Orchestrator();
    const ok = await orch.init();

    if (!ok) {
      console.log('[-] NEXUS initialization failed');
      console.log('==================================================');
      process.exit(0); // Don't block session start
    }

    const status = orch.getStatus();

    // 2. Provider status
    const providers = Object.entries(status.providers);
    const available = providers.filter(([, p]) => p.status === 'available').length;
    console.log(`[+] Providers: ${available}/${providers.length} available`);
    providers.forEach(([id, p]) => {
      const icon = p.status === 'available' ? '+' : '-';
      console.log(`    [${icon}] ${id}: ${p.role} (${p.costTier})`);
    });

    // 3. Evolution state
    console.log(`[+] Evolution: ${status.evolutionSessions} sessions, ${status.patternCount} patterns`);

    // 4. Auto-research check
    const researcher = new AutoResearcher();
    if (researcher.isResearchDue()) {
      console.log('[!] Auto-Research is DUE (every 5 sessions)');
      console.log('    Run: node nexus/core/cli.js research');
    }

    // 5. Knowledge summary
    try {
      const { KnowledgeIndex } = require('../knowledge/knowledge-index');
      const ki = new KnowledgeIndex();
      const stats = ki.getStats();
      console.log(`[+] Knowledge: ${stats.bestPractices} practices, ${stats.patterns} patterns`);
    } catch (e) {}

    console.log(`[+] Session: ${status.sessionId}`);
    console.log('==================================================');

  } catch (err) {
    console.log(`[-] NEXUS start error: ${err.message}`);
    console.log('==================================================');
    // Don't exit with error - session should continue
  }
}

sessionStart();
