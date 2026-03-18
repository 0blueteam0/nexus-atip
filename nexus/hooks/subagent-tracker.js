#!/usr/bin/env node
'use strict';

/**
 * NEXUS SubagentStart Hook Handler
 *
 * Triggered by Claude Code v2.1.71 SubagentStart hook event.
 * Tracks subagent spawning for NEXUS monitoring and Dashboard.
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'data', 'subagent-log.jsonl');
const DASHBOARD_URL = 'http://localhost:7847/api/hooks/subagent';

async function main() {
  const hookData = {
    timestamp: new Date().toISOString(),
    event: 'SubagentStart',
    agentId: process.env.AGENT_ID || 'unknown',
    agentType: process.env.AGENT_TYPE || 'unknown',
    sessionId: process.env.SESSION_ID || 'unknown',
    model: process.env.CLAUDE_CODE_SUBAGENT_MODEL || 'default'
  };

  // 1. Log to JSONL file
  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(hookData) + '\n');
  } catch (e) {
    // Silent fail - hook should never block
  }

  // 2. Notify Dashboard (non-blocking)
  try {
    const http = require('http');
    const postData = JSON.stringify(hookData);
    const req = http.request(DASHBOARD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
      timeout: 2000
    });
    req.on('error', () => {}); // Silent
    req.write(postData);
    req.end();
  } catch (e) {
    // Silent fail
  }

  // 3. Bridge to NEXUS HookServer -> EventBus (process boundary bridge)
  try {
    const http = require('http');
    const bridgeData = JSON.stringify({ event: 'SubagentStart', data: hookData });
    const req = http.request('http://127.0.0.1:7851/hook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bridgeData) },
      timeout: 1000
    });
    req.on('error', () => {}); // Silent - HookServer may not be running
    req.write(bridgeData);
    req.end();
  } catch (e) { /* silent */ }

  // 4. Print status for hook output
  const name = hookData.agentType !== 'unknown' ? hookData.agentType : hookData.agentId.slice(0, 8);
  console.log(`[NEXUS] Subagent tracked: ${name} (model: ${hookData.model})`);
}

main().catch(() => process.exit(0));
