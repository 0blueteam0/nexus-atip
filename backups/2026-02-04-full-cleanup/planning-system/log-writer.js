#!/usr/bin/env node
/**
 * log-writer.js - Hybrid Logging System (MD + JSON)
 *
 * 사용법:
 *   node log-writer.js --action session_start --session <id>
 *   node log-writer.js --action task_update --task <id> --status completed
 *   node log-writer.js --action phase_update --phase <id> --status completed
 *   node log-writer.js --write-both --date 2026-02-04
 *
 * API:
 *   const { writeMarkdown, writeJson, writeBoth, addAction } = require('./log-writer');
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'planning-log', 'daily');

// KST (UTC+9) offset in milliseconds
const KST_OFFSET = 9 * 60 * 60 * 1000;

// Get KST Date
function getKSTDate(date = new Date()) {
  return new Date(date.getTime() + KST_OFFSET);
}

// Get KST ISO string (YYYY-MM-DDTHH:mm:ss+09:00)
function getKSTISOString(date = new Date()) {
  const kst = getKSTDate(date);
  const iso = kst.toISOString();
  // Replace Z with +09:00 and adjust time
  return iso.replace('Z', '+09:00');
}

// Ensure log directory exists
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

// Get current date in YYYY-MM-DD format (KST)
function getDateString(date = new Date()) {
  const kst = getKSTDate(date);
  return kst.toISOString().split('T')[0];
}

// Get file paths for a date
function getFilePaths(dateStr) {
  return {
    md: path.join(LOG_DIR, `${dateStr}.md`),
    json: path.join(LOG_DIR, `${dateStr}.json`)
  };
}

// Initialize or load JSON log for a date
function loadJsonLog(dateStr) {
  const { json } = getFilePaths(dateStr);
  if (fs.existsSync(json)) {
    try {
      return JSON.parse(fs.readFileSync(json, 'utf-8'));
    } catch (e) {
      console.error('[!] Failed to parse existing JSON log:', e.message);
    }
  }
  // Return new structure
  return {
    date: dateStr,
    sessions: [],
    summary: {
      totalSessions: 0,
      totalActions: 0,
      plansWorkedOn: [],
      completedTasks: 0,
      completedPhases: 0
    }
  };
}

// Save JSON log
function saveJsonLog(dateStr, data) {
  ensureLogDir();
  const { json } = getFilePaths(dateStr);
  fs.writeFileSync(json, JSON.stringify(data, null, 2), 'utf-8');
  return json;
}

// Add action to JSON log
function addAction(dateStr, action) {
  const log = loadJsonLog(dateStr);
  const now = getKSTISOString();

  // Find or create current session
  let currentSession = log.sessions.find(s => !s.end);
  if (!currentSession) {
    currentSession = {
      id: `session-${Date.now()}`,
      start: now,
      actions: []
    };
    log.sessions.push(currentSession);
    log.summary.totalSessions++;
  }

  // Add action with timestamp
  const fullAction = {
    timestamp: now,
    ...action
  };
  currentSession.actions.push(fullAction);
  log.summary.totalActions++;

  // Update summary based on action type
  if (action.type === 'task_update' && action.status === 'completed') {
    log.summary.completedTasks++;
  }
  if (action.type === 'phase_update' && action.status === 'completed') {
    log.summary.completedPhases++;
  }
  if (action.plan && !log.summary.plansWorkedOn.includes(action.plan)) {
    log.summary.plansWorkedOn.push(action.plan);
  }

  // Update session plan/phase if provided
  if (action.plan) currentSession.plan = action.plan;
  if (action.phase) currentSession.phase = action.phase;

  saveJsonLog(dateStr, log);
  return fullAction;
}

// Start a new session
function startSession(dateStr, sessionId, planId) {
  const log = loadJsonLog(dateStr);
  const now = getKSTISOString();

  // Close any open session
  log.sessions.forEach(s => {
    if (!s.end) s.end = now;
  });

  // Create new session
  const session = {
    id: sessionId || `session-${Date.now()}`,
    start: now,
    plan: planId || null,
    actions: []
  };
  log.sessions.push(session);
  log.summary.totalSessions++;

  saveJsonLog(dateStr, log);
  return session;
}

// End current session
function endSession(dateStr) {
  const log = loadJsonLog(dateStr);
  const now = getKSTISOString();

  const currentSession = log.sessions.find(s => !s.end);
  if (currentSession) {
    currentSession.end = now;
    saveJsonLog(dateStr, log);
    return currentSession;
  }
  return null;
}

// Write/append to Markdown log
function writeMarkdown(dateStr, content, append = true) {
  ensureLogDir();
  const { md } = getFilePaths(dateStr);

  if (append && fs.existsSync(md)) {
    fs.appendFileSync(md, '\n' + content, 'utf-8');
  } else {
    const header = `# Planning Log - ${dateStr}\n\n`;
    fs.writeFileSync(md, header + content, 'utf-8');
  }
  return md;
}

// Write both MD and JSON
function writeBoth(dateStr, action, mdContent) {
  const jsonResult = addAction(dateStr, action);

  if (mdContent) {
    writeMarkdown(dateStr, mdContent);
  }

  return { json: jsonResult, mdPath: getFilePaths(dateStr).md };
}

// Get log data for a date
function getLog(dateStr) {
  return loadJsonLog(dateStr);
}

// CLI handling
function main() {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      params[key] = args[i + 1] || true;
      i++;
    }
  }

  const dateStr = params.date || getDateString();

  if (params.action === 'session_start') {
    const session = startSession(dateStr, params.session, params.plan);
    console.log(`[+] Session started: ${session.id}`);
  } else if (params.action === 'session_end') {
    const session = endSession(dateStr);
    if (session) {
      console.log(`[+] Session ended: ${session.id}`);
    } else {
      console.log('[*] No active session to end');
    }
  } else if (params.action) {
    const result = addAction(dateStr, {
      type: params.action,
      target: params.task || params.phase || params.target,
      status: params.status,
      plan: params.plan
    });
    console.log(`[+] Action logged: ${params.action}`);
  } else if (params['write-both']) {
    console.log(`[*] Log files for ${dateStr}:`);
    console.log(`    MD:   ${getFilePaths(dateStr).md}`);
    console.log(`    JSON: ${getFilePaths(dateStr).json}`);
  } else {
    console.log('Usage:');
    console.log('  node log-writer.js --action session_start --session <id> [--plan <planId>]');
    console.log('  node log-writer.js --action session_end');
    console.log('  node log-writer.js --action task_update --task <id> --status completed');
    console.log('  node log-writer.js --action phase_update --phase <id> --status completed');
    console.log('  node log-writer.js --write-both --date 2026-02-04');
  }
}

// Module exports
module.exports = {
  writeMarkdown,
  writeJson: saveJsonLog,
  writeBoth,
  addAction,
  startSession,
  endSession,
  getLog,
  getDateString,
  getFilePaths
};

// Run CLI if called directly
if (require.main === module) {
  main();
}
