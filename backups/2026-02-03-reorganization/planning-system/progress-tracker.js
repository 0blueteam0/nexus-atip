#!/usr/bin/env node
/**
 * progress-tracker.js - Progress JSON CRUD API
 * 
 * 사용법:
 *   node progress-tracker.js --validate             # 유효성 검사
 *   node progress-tracker.js --get-task <taskId>    # 태스크 조회
 *   node progress-tracker.js --list-pending         # 대기 태스크 목록
 */

const fs = require('fs');
const path = require('path');

const PLANS_DIR = path.join(__dirname, '..', 'plans');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--validate') result.validate = true;
    else if (args[i] === '--get-task') result.getTask = args[++i];
    else if (args[i] === '--list-pending') result.listPending = true;
    else if (args[i] === '--plan') result.plan = args[++i];
  }
  return result;
}

function loadProgress(planId) {
  const files = fs.readdirSync(PLANS_DIR).filter(f => f.endsWith('-progress.json'));
  
  if (planId) {
    const file = path.join(PLANS_DIR, `${planId}-progress.json`);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  
  // Find active plan
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(PLANS_DIR, file), 'utf8'));
    if (data.status === 'active') return data;
  }
  return null;
}

function validate(data) {
  const errors = [];
  
  if (!data.planId) errors.push('Missing planId');
  if (!data.version) errors.push('Missing version');
  if (!data.phases || !Array.isArray(data.phases)) errors.push('Invalid phases');
  if (!data.metadata) errors.push('Missing metadata');
  
  // Check phases
  for (const phase of data.phases || []) {
    if (!phase.id) errors.push(`Phase missing id`);
    if (!phase.tasks || !Array.isArray(phase.tasks)) {
      errors.push(`Phase ${phase.id} missing tasks`);
    }
  }
  
  return errors;
}

function getTask(data, taskId) {
  for (const phase of data.phases) {
    const task = phase.tasks.find(t => t.id === taskId);
    if (task) return { phase: phase.id, ...task };
  }
  return null;
}

function listPending(data) {
  const pending = [];
  for (const phase of data.phases) {
    for (const task of phase.tasks) {
      if (task.status === 'pending' || task.status === 'in_progress') {
        pending.push({ phase: phase.id, ...task });
      }
    }
  }
  return pending;
}

function main() {
  const args = parseArgs();
  const data = loadProgress(args.plan);
  
  if (!data) {
    console.log('[-] No progress file found');
    return;
  }
  
  if (args.validate) {
    const errors = validate(data);
    if (errors.length === 0) {
      console.log('[+] Progress file is valid');
    } else {
      console.log('[-] Validation errors:');
      errors.forEach(e => console.log(`  - ${e}`));
    }
  }
  
  if (args.getTask) {
    const task = getTask(data, args.getTask);
    console.log(task ? JSON.stringify(task, null, 2) : '[-] Task not found');
  }
  
  if (args.listPending) {
    const pending = listPending(data);
    console.log(`[*] Pending tasks (${pending.length}):`);
    pending.forEach(t => console.log(`  [${t.phase}] ${t.id}: ${t.title}`));
  }
}

main();
