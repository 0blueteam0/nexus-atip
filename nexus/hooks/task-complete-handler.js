#!/usr/bin/env node
'use strict';

/**
 * NEXUS TaskCompleted Hook Handler
 *
 * Triggered by Claude Code v2.1.71 TaskCompleted hook event.
 * Updates NEXUS tracking, triggers Obsidian sync, and notifies Dashboard.
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'data', 'task-complete-log.jsonl');
const DASHBOARD_URL = 'http://localhost:7847/api/hooks/task-complete';

async function main() {
  const hookData = {
    timestamp: new Date().toISOString(),
    event: 'TaskCompleted',
    taskId: process.env.TASK_ID || 'unknown',
    agentId: process.env.AGENT_ID || 'unknown',
    agentType: process.env.AGENT_TYPE || 'unknown',
    sessionId: process.env.SESSION_ID || 'unknown',
    success: process.env.TASK_SUCCESS !== 'false'
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
    const bridgeData = JSON.stringify({ event: 'TaskCompleted', data: hookData });
    const req = http.request('http://127.0.0.1:7851/hook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bridgeData) },
      timeout: 1000
    });
    req.on('error', () => {}); // Silent - HookServer may not be running
    req.write(bridgeData);
    req.end();
  } catch (e) { /* silent */ }

  // 3. Trigger Obsidian sync (if available)
  try {
    const obsidianIndex = path.join(__dirname, '..', 'obsidian', 'index.js');
    if (fs.existsSync(obsidianIndex)) {
      const { getObsidianIntegration } = require(obsidianIndex);
      const configPath = path.join(__dirname, '..', 'nexus.config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.obsidian?.enabled) {
          const obsidian = getObsidianIntegration(config.obsidian);
          // Async - don't await, just fire
          obsidian.init().then(() => {
            // Event writer will pick up via EventBus
          }).catch(() => {});
        }
      }
    }
  } catch (e) { /* silent */ }

  // 3. Notify Dashboard
  try {
    const http = require('http');
    const postData = JSON.stringify(hookData);
    const req = http.request(DASHBOARD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
      timeout: 2000
    });
    req.on('error', () => {});
    req.write(postData);
    req.end();
  } catch (e) { /* silent */ }

  // 4. Update NEXUS evolution (task success/failure pattern)
  try {
    const evolutionPath = path.join(__dirname, '..', 'evolution', 'evolution-state.json');
    if (fs.existsSync(evolutionPath)) {
      const state = JSON.parse(fs.readFileSync(evolutionPath, 'utf8'));
      if (!state.taskStats) state.taskStats = { completed: 0, failed: 0 };
      if (hookData.success) state.taskStats.completed++;
      else state.taskStats.failed++;
      state.lastTaskCompleted = hookData.timestamp;
      fs.writeFileSync(evolutionPath, JSON.stringify(state, null, 2));
    }
  } catch (e) { /* silent */ }

  const status = hookData.success ? '[+]' : '[-]';
  console.log(`[NEXUS] Task ${status} ${hookData.taskId} (agent: ${hookData.agentType})`);
}

main().catch(() => process.exit(0));
