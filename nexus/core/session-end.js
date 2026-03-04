#!/usr/bin/env node
/**
 * NEXUS Session End Hook
 *
 * Runs at every Claude Code session end:
 * 1. Run improvement checklist
 * 2. Save evolution state
 * 3. Log session summary
 *
 * @module nexus/core/session-end
 */

'use strict';

const { Orchestrator } = require('./orchestrator');
const { ImprovementChecklist } = require('../self-evolution/improvement-checklist');

async function sessionEnd() {
  console.log('==================================================');
  console.log('[NEXUS] Session End - Learning & Evolution');
  console.log('==================================================');

  try {
    // 1. Initialize orchestrator to get session data
    const orch = new Orchestrator();
    await orch.init();
    const status = orch.getStatus();

    // 2. Run learning cycle
    try {
      await orch.learn();
      console.log(`[+] Learning cycle completed (${status.taskCount} tasks analyzed)`);
    } catch (e) {
      console.log(`[*] Learning: no routing data to learn from`);
    }

    // 3. Run improvement checklist
    const checklist = new ImprovementChecklist();
    const results = await checklist.run({
      taskCount: status.taskCount,
      successCount: status.successCount || 0,
      failureCount: status.failureCount || 0
    });

    results.checks.forEach(c => {
      const icon = c.status === 'done' ? '+' : c.status === 'error' ? '-' : '*';
      console.log(`  [${icon}] ${c.name}: ${c.detail}`);
    });

    // 4. Shutdown
    await orch.shutdown();

    console.log('[+] NEXUS session data saved');
    console.log('==================================================');

  } catch (err) {
    console.log(`[-] NEXUS end error: ${err.message}`);
    console.log('==================================================');
  }
}

sessionEnd();
