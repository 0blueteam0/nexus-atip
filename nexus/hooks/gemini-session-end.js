#!/usr/bin/env node
'use strict';

/**
 * NEXUS Gemini SessionEnd Hook Handler
 *
 * Triggered by Gemini CLI SessionEnd hook event.
 * Records session summary and triggers NEXUS learning.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const LOG_DIR = path.join(__dirname, '..', 'data');
const LOG_FILE = path.join(LOG_DIR, 'gemini-sessions.jsonl');
const HOOK_SERVER = 'http://127.0.0.1:7851/hook';

async function main() {
  const hookData = {
    timestamp: new Date().toISOString(),
    event: 'SessionEnd',
    provider: 'gemini-cli',
    env: {
      model: process.env.GEMINI_MODEL || 'default',
      cwd: process.cwd()
    }
  };

  // 1. Log to JSONL
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(hookData) + '\n');
  } catch (e) { /* silent */ }

  // 2. Bridge to NEXUS HookServer -> EventBus (triggers learning)
  try {
    const bridgeData = JSON.stringify({ event: 'gemini:session:end', data: hookData });
    const req = http.request(HOOK_SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bridgeData) },
      timeout: 2000
    });
    req.on('error', () => {});
    req.write(bridgeData);
    req.end();
  } catch (e) { /* silent */ }

  console.log(`[NEXUS] Gemini session ended`);
}

main().catch(() => process.exit(0));
