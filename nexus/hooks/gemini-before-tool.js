#!/usr/bin/env node
'use strict';

/**
 * NEXUS Gemini BeforeTool Hook Handler
 *
 * Triggered by Gemini CLI BeforeTool hook event.
 * Tracks tool usage for NEXUS monitoring and ATOS integration.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const LOG_DIR = path.join(__dirname, '..', 'data');
const LOG_FILE = path.join(LOG_DIR, 'gemini-tools.jsonl');
const HOOK_SERVER = 'http://127.0.0.1:7851/hook';

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
    event: 'BeforeTool',
    provider: 'gemini-cli',
    tool: input.toolName || process.env.TOOL_NAME || 'unknown',
    phase: 'before'
  };

  // 1. Log to JSONL
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(hookData) + '\n');
  } catch (e) { /* silent */ }

  // 2. Bridge to NEXUS HookServer
  try {
    const bridgeData = JSON.stringify({ event: 'gemini:tool:before', data: hookData });
    const req = http.request(HOOK_SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bridgeData) },
      timeout: 1000
    });
    req.on('error', () => {});
    req.write(bridgeData);
    req.end();
  } catch (e) { /* silent */ }
}

main().catch(() => process.exit(0));
