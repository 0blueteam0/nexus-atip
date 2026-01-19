#!/usr/bin/env node
/**
 * checkpoint.js - Phase/Task 완료 시 상태 저장 + Git 커밋
 * 
 * 사용법:
 *   node checkpoint.js --plan <planId> --task <taskId> --status completed
 *   node checkpoint.js --plan <planId> --phase <phaseId> --status completed
 *   node checkpoint.js --test
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PLANS_DIR = path.join(__dirname, '..', 'plans');
const LOG_DIR = path.join(__dirname, '..', 'planning-log');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const result = { test: false };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--plan') result.plan = args[++i];
    else if (args[i] === '--phase') result.phase = args[++i];
    else if (args[i] === '--task') result.task = args[++i];
    else if (args[i] === '--status') result.status = args[++i];
    else if (args[i] === '--test') result.test = true;
  }
  return result;
}

// Load progress file
function loadProgress(planId) {
  const progressFile = path.join(PLANS_DIR, `${planId}-progress.json`);
  if (!fs.existsSync(progressFile)) {
    throw new Error(`Progress file not found: ${progressFile}`);
  }
  return JSON.parse(fs.readFileSync(progressFile, 'utf8'));
}

// Save progress file
function saveProgress(planId, data) {
  const progressFile = path.join(PLANS_DIR, `${planId}-progress.json`);
  data.lastModified = new Date().toISOString();
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
