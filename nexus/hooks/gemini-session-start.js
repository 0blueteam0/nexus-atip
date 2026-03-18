#!/usr/bin/env node
'use strict';

/**
 * NEXUS Gemini SessionStart Hook Handler
 *
 * Triggered by Gemini CLI SessionStart hook event.
 * Initializes NEXUS tracking for Gemini sessions.
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
    event: 'SessionStart',
    provider: 'gemini-cli',
    sessionId: `gemini-${Date.now()}`,
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

  // 2. Bridge to NEXUS HookServer -> EventBus
  try {
    const bridgeData = JSON.stringify({ event: 'gemini:session:start', data: hookData });
    const req = http.request(HOOK_SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bridgeData) },
      timeout: 2000
    });
    req.on('error', () => {});
    req.write(bridgeData);
    req.end();
  } catch (e) { /* silent */ }

  console.log(`[NEXUS] Gemini session started: ${hookData.sessionId}`);
}

main().catch(() => process.exit(0));
