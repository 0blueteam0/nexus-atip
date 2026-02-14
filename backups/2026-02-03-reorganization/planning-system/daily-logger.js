#!/usr/bin/env node
/**
 * daily-logger.js - 일일 작업 로그 기록
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'planning-log', 'daily');

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function loadDailyLog(date = getToday()) {
  const file = path.join(LOG_DIR, `${date}.json`);
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  return [];
}

function saveDailyLog(logs, date = getToday()) {
  const file = path.join(LOG_DIR, `${date}.json`);
  fs.writeFileSync(file, JSON.stringify(logs, null, 2));
}

function addEntry(planId, action, details) {
  const logs = loadDailyLog();
  logs.push({
    timestamp: new Date().toISOString(),
    planId,
    action,
    details
  });
  saveDailyLog(logs);
  console.log(`[+] Log entry added: ${action}`);
}

function showToday() {
  const logs = loadDailyLog();
  console.log(`[*] Today's log (${logs.length} entries):`);
  logs.forEach(l => {
    console.log(`  [${l.timestamp.split('T')[1].slice(0,8)}] ${l.action}: ${JSON.stringify(l.details)}`);
  });
}

// CLI
const cmd = process.argv[2];
if (cmd === 'show') {
  showToday();
} else if (cmd === 'add') {
  const [, , , planId, action, ...details] = process.argv;
  addEntry(planId, action, details.join(' '));
} else {
  console.log('Usage: node daily-logger.js [show|add <planId> <action> <details>]');
}

module.exports = { addEntry, loadDailyLog, saveDailyLog };
