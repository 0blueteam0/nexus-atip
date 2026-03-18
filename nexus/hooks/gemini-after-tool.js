#!/usr/bin/env node
'use strict';

/**
 * NEXUS Gemini AfterTool Hook Handler
 *
 * Triggered by Gemini CLI AfterTool hook event.
 * Records tool results for NEXUS monitoring and Dashboard POST.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const LOG_DIR = path.join(__dirname, '..', 'data');
const LOG_FILE = path.join(LOG_DIR, 'gemini-tools.jsonl');
const HOOK_SERVER = 'http://127.0.0.1:7851/hook';
const DASHBOARD_URL = 'http://localhost:7850/api/event';

async function main() {
  // Read hook input from stdin if available
  let input = {};
  try {
    const chunks = [];
    if (!process.stdin.isTTY) {
      for await (const chunk of process.stdin) chunks.push(chunk);
      if (chunks.length > 0) input = JSON.parse(Buffer.concat(chunks).toString());
    }
  } catch (e) { /* no stdin */ }

  const hookData = {
    timestamp: new Date().toISOString(),
    event: 'AfterTool',
    provider: 'gemini-cli',
    tool: input.toolName || process.env.TOOL_NAME || 'unknown',
    phase: 'after',
    success: input.success !== false
  };

  // 1. Log to JSONL
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(hookData) + '\n');
  } catch (e) { /* silent */ }

  // 2. Bridge to NEXUS HookServer
  try {
    const bridgeData = JSON.stringify({ event: 'gemini:tool:after', data: hookData });
    const req = http.request(HOOK_SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bridgeData) },
      timeout: 1000
    });
    req.on('error', () => {});
    req.write(bridgeData);
    req.end();
  } catch (e) { /* silent */ }

  // 3. Notify live Dashboard (non-blocking)
  try {
    const dashData = JSON.stringify({ type: 'gemini-tool', ...hookData });
    const req = http.request(DASHBOARD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dashData) },
      timeout: 1000
    });
    req.on('error', () => {});
    req.write(dashData);
    req.end();
  } catch (e) { /* silent */ }
}

main().catch(() => process.exit(0));
