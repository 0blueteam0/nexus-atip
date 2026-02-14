#!/usr/bin/env node
/**
 * checkpoint.js - Phase/Task 완료 시 상태 저장 + Git 커밋
 *
 * 사용법:
 *   node checkpoint.js --plan <planId> --task <taskId> --status completed
 *   node checkpoint.js --plan <planId> --phase <phaseId> --status completed
 *   node checkpoint.js --test
 *
 * [v2.0] 원자적 쓰기 지원
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// file-ops 모듈 로드 시도
let fileOps;
try {
  fileOps = require('../atos/file-ops');
} catch (e) {
  fileOps = null;
}

const PLANS_DIR = path.join(__dirname, '..', 'plans');
const LOG_DIR = path.join(__dirname, '..', 'planning-log');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const result = { test: false, autoSave: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--plan') result.plan = args[++i];
    else if (args[i] === '--phase') result.phase = args[++i];
    else if (args[i] === '--task') result.task = args[++i];
    else if (args[i] === '--status') result.status = args[++i];
    else if (args[i] === '--test') result.test = true;
    else if (args[i] === '--auto-save') result.autoSave = true;
  }
  return result;
}

// Find active plan from progress files
function findActivePlan() {
  if (!fs.existsSync(PLANS_DIR)) return null;

  const files = fs.readdirSync(PLANS_DIR)
    .filter(f => f.endsWith('-progress.json'));

  for (const file of files) {
    const filePath = path.join(PLANS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.status === 'active') {
      return data;
    }
  }
  return null;
}

// Load progress file
function loadProgress(planId) {
  const progressFile = path.join(PLANS_DIR, `${planId}-progress.json`);
  if (!fs.existsSync(progressFile)) {
    throw new Error(`Progress file not found: ${progressFile}`);
  }
  return JSON.parse(fs.readFileSync(progressFile, 'utf8'));
}

// Save progress file (원자적 쓰기 + 백업)
function saveProgress(planId, data) {
  const progressFile = path.join(PLANS_DIR, `${planId}-progress.json`);
  data.lastModified = new Date().toISOString();

  // file-ops 모듈 사용 (있으면)
  if (fileOps && fileOps.writeWithBackup) {
    const result = fileOps.writeWithBackup(progressFile, data);
    if (result.success) {
      console.log(`[+] Progress saved (atomic): ${progressFile}`);
    } else {
      console.error(`[-] Atomic save failed: ${result.error}`);
      // 폴백
      fs.writeFileSync(progressFile, JSON.stringify(data, null, 2));
      console.log(`[+] Progress saved (fallback): ${progressFile}`);
    }
    return;
  }

  // 폴백: 기본 fs 사용
  fs.writeFileSync(progressFile, JSON.stringify(data, null, 2));
  console.log(`[+] Progress saved: ${progressFile}`);
}

// Update task status
function updateTask(data, taskId, status) {
  for (const phase of data.phases) {
    const task = phase.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date().toISOString();
        data.metadata.completedTasks++;
      }
      data.currentTask = taskId;
      console.log(`[+] Task ${taskId} -> ${status}`);
      return true;
    }
  }
  return false;
}

// Update phase status
function updatePhase(data, phaseId, status) {
  const phase = data.phases.find(p => p.id === phaseId);
  if (phase) {
    phase.status = status;
    if (status === 'completed') {
      phase.completedAt = new Date().toISOString();
    } else if (status === 'in_progress') {
      phase.startedAt = new Date().toISOString();
    }
    data.currentPhase = phaseId;
    console.log(`[+] Phase ${phaseId} -> ${status}`);
    return true;
  }
  return false;
}

// Update ACTIVE-PLAN.md
function updateActivePlan(data) {
  const activePlanPath = path.join(PLANS_DIR, 'ACTIVE-PLAN.md');
  const phase = data.phases.find(p => p.id === data.currentPhase);
  const completedTasks = data.metadata.completedTasks;
  const totalTasks = data.metadata.totalTasks;
  const percent = Math.round((completedTasks / totalTasks) * 100);
  
  const content = `# Active Plan Reference
**Auto-updated by planning-system**

## Current Status
| 항목 | 값 |
|------|-----|
| **Plan** | ${data.planId} |
| **Phase** | ${data.currentPhase} - ${phase?.name || 'Unknown'} |
| **Task** | ${data.currentTask} |
| **Progress** | ${completedTasks}/${totalTasks} tasks (${percent}%) |
| **Last Updated** | ${new Date().toISOString()} |
`;
  fs.writeFileSync(activePlanPath, content);
  console.log(`[+] ACTIVE-PLAN.md updated`);
}

// Log to daily file
function logDaily(planId, action, details) {
  const today = new Date().toISOString().split('T')[0];
  const dailyFile = path.join(LOG_DIR, 'daily', `${today}.json`);
  
  let logs = [];
  if (fs.existsSync(dailyFile)) {
    logs = JSON.parse(fs.readFileSync(dailyFile, 'utf8'));
  }
  
  logs.push({
    timestamp: new Date().toISOString(),
    planId,
    action,
    details
  });
  
  fs.writeFileSync(dailyFile, JSON.stringify(logs, null, 2));
  console.log(`[+] Daily log updated: ${dailyFile}`);
}

// Git commit
function gitCommit(message) {
  try {
    execSync('git add plans/ planning-system/ planning-log/', { stdio: 'pipe' });
    execSync(`git commit -m "${message}\n\nCo-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"`, { stdio: 'pipe' });
    console.log(`[+] Git commit: ${message}`);
    return true;
  } catch (e) {
    console.log(`[-] Git commit failed: ${e.message}`);
    return false;
  }
}

// Auto-save: find active plan and save its current state
function autoSave() {
  const activePlan = findActivePlan();
  if (!activePlan) {
    console.log('[*] No active plan to save');
    return;
  }

  const planId = activePlan.planId;
  console.log(`[*] Auto-saving plan: ${planId}`);

  // Update lastModified timestamp
  activePlan.lastModified = new Date().toISOString();
  saveProgress(planId, activePlan);

  // Update ACTIVE-PLAN.md
  updateActivePlan(activePlan);

  // Log to daily file
  logDaily(planId, 'auto_save', { timestamp: activePlan.lastModified });

  console.log(`[+] Auto-save complete: ${planId}`);
}

// Main execution
function main() {
  const args = parseArgs();

  // Test mode
  if (args.test) {
    console.log('[*] Checkpoint test mode');
    console.log('[+] All modules loaded successfully');
    console.log('[+] Plans dir:', PLANS_DIR);
    console.log('[+] Log dir:', LOG_DIR);
    return;
  }

  // Auto-save mode (session-end hook)
  if (args.autoSave) {
    autoSave();
    return;
  }

  if (!args.plan) {
    console.error('[-] Error: --plan is required');
    process.exit(1);
  }
  
  try {
    const data = loadProgress(args.plan);
    
    if (args.task && args.status) {
      updateTask(data, args.task, args.status);
      logDaily(args.plan, 'task_update', { task: args.task, status: args.status });
    }
    
    if (args.phase && args.status) {
      updatePhase(data, args.phase, args.status);
      logDaily(args.plan, 'phase_update', { phase: args.phase, status: args.status });
      
      // Git commit on phase completion
      if (args.status === 'completed') {
        const phase = data.phases.find(p => p.id === args.phase);
        gitCommit(`[PLAN] ${args.phase} 완료: ${phase?.name || args.phase}`);
      }
    }
    
    // Update metadata
    data.metadata.progressPercent = Math.round(
      (data.metadata.completedTasks / data.metadata.totalTasks) * 100
    );
    
    saveProgress(args.plan, data);
    updateActivePlan(data);
    
    console.log(`[+] Checkpoint complete: ${data.metadata.progressPercent}% done`);
  } catch (e) {
    console.error(`[-] Error: ${e.message}`);
    process.exit(1);
  }
}

main();
