#!/usr/bin/env node
'use strict';

/**
 * NEXUS TeammateIdle Hook Handler
 *
 * Triggered by Claude Code v2.1.71 TeammateIdle hook event.
 * Detects idle teammates and can trigger work redistribution.
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'data', 'teammate-idle-log.jsonl');

async function main() {
  const hookData = {
    timestamp: new Date().toISOString(),
    event: 'TeammateIdle',
    agentId: process.env.AGENT_ID || 'unknown',
    agentName: process.env.AGENT_NAME || 'unknown',
    teamName: process.env.CLAUDE_CODE_TEAM_NAME || 'default',
    sessionId: process.env.SESSION_ID || 'unknown'
  };

  // 1. Log to JSONL
  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(hookData) + '\n');
  } catch (e) { /* silent */ }

  // 2. Bridge to NEXUS HookServer -> EventBus (process boundary bridge)
  try {
    const http = require('http');
    const bridgeData = JSON.stringify({ event: 'TeammateIdle', data: hookData });
    const req = http.request('http://127.0.0.1:7851/hook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bridgeData) },
      timeout: 1000
    });
    req.on('error', () => {}); // Silent - HookServer may not be running
    req.write(bridgeData);
    req.end();
  } catch (e) { /* silent */ }

  // 3. Check if there are pending tasks that could be assigned
  try {
    const tasksPath = path.join(__dirname, '..', '..', 'unified-task-system', 'tasks.json');
    if (fs.existsSync(tasksPath)) {
      const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      const pending = (tasks.tasks || []).filter(t => t.status === 'pending' && !t.owner);
      if (pending.length > 0) {
        console.log(`[NEXUS] Teammate idle: ${hookData.agentName} - ${pending.length} pending tasks available`);
        return;
      }
    }
  } catch (e) { /* silent */ }

  console.log(`[NEXUS] Teammate idle: ${hookData.agentName} (no pending tasks)`);
}

main().catch(() => process.exit(0));
