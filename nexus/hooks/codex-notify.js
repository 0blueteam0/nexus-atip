#!/usr/bin/env node
'use strict';

/**
 * NEXUS Codex Notify Hook Handler
 *
 * Triggered by Codex CLI's single hook event: agent-turn-complete.
 * Extracts maximum info from the limited hook to feed NEXUS.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { runCompatHooks } = require('./codex-hook-bridge');

const LOG_DIR = path.join(__dirname, '..', 'data');
const LOG_FILE = path.join(LOG_DIR, 'codex-sessions.jsonl');
const HOOK_SERVER = 'http://127.0.0.1:7851/hook';
const DASHBOARD_URL = 'http://localhost:7850/api/event';

async function main() {
  // Codex passes data via stdin as JSON
  let input = {};
  try {
    const chunks = [];
    if (!process.stdin.isTTY) {
      for await (const chunk of process.stdin) chunks.push(chunk);
      if (chunks.length > 0) input = JSON.parse(Buffer.concat(chunks).toString());
    }
  } catch (e) { /* no stdin */ }

  const toolsUsed = Array.isArray(input.tools_used)
    ? input.tools_used
    : Array.isArray(input.toolsUsed)
      ? input.toolsUsed
      : [];
  const agentsSpawned = Array.isArray(input.agents_spawned)
    ? input.agents_spawned
    : Array.isArray(input.agentsSpawned)
      ? input.agentsSpawned
      : [];
  const responseDuration = input.response_duration || input.responseDuration || input.duration || 0;

  const hookData = {
    timestamp: new Date().toISOString(),
    event: 'agent-turn-complete',
    provider: 'codex-cli',
    turnId: input.turn_id || `codex-${Date.now()}`,
    model: input.model || process.env.OPENAI_MODEL || 'unknown',
    tokensUsed: input.tokens_used || 0,
    filesModified: input.files_modified || [],
    toolsUsed,
    agentsSpawned,
    responseDuration,
    success: input.success !== false
  };

  // 1. Log to JSONL
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(hookData) + '\n');
  } catch (e) { /* silent */ }

  // 2. Bridge to NEXUS HookServer -> EventBus
  try {
    const bridgeData = JSON.stringify({ event: 'codex:turn:complete', data: hookData });
    const req = http.request(HOOK_SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bridgeData) },
      timeout: 2000
    });
    req.on('error', () => {});
    req.write(bridgeData);
    req.end();
  } catch (e) { /* silent */ }

  // 3. Notify live Dashboard
  try {
    const dashData = JSON.stringify({ type: 'codex-turn', ...hookData });
    const req = http.request(DASHBOARD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dashData) },
      timeout: 1000
    });
    req.on('error', () => {});
    req.write(dashData);
    req.end();
  } catch (e) { /* silent */ }

  // 4. Bridge Claude-compatible after-response hooks
  try {
    await runCompatHooks('notify', hookData);
  } catch (e) { /* silent */ }

  const fileCount = hookData.filesModified.length;
  console.log(`[NEXUS] Codex turn tracked: ${hookData.turnId} (${fileCount} files, ${hookData.tokensUsed} tokens)`);
}

main().catch(() => process.exit(0));
