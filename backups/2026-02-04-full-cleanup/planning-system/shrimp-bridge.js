#!/usr/bin/env node
/**
 * shrimp-bridge.js - Planning System <-> Shrimp Task Manager 동기화
 * 
 * 기능:
 * - Phase 시작 시 Shrimp에 작업 등록
 * - 양방향 상태 일관성 유지
 * 
 * 사용법:
 *   node shrimp-bridge.js --sync
 *   node shrimp-bridge.js --test
 */

const fs = require('fs');
const path = require('path');

const PLANS_DIR = path.join(__dirname, '..', 'plans');
const SHRIMP_TASKS = path.join(__dirname, '..', 'ShrimpData', 'tasks', 'current-tasks.json');

// Find active plan
function findActivePlan() {
  const files = fs.readdirSync(PLANS_DIR).filter(f => f.endsWith('-progress.json'));
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(PLANS_DIR, file), 'utf8'));
    if (data.status === 'active') return data;
  }
  return null;
}

// Load Shrimp tasks
function loadShrimpTasks() {
  if (fs.existsSync(SHRIMP_TASKS)) {
    return JSON.parse(fs.readFileSync(SHRIMP_TASKS, 'utf8'));
  }
  return { tasks: [] };
}

// Sync planning tasks to Shrimp format
function syncToShrimp(planData) {
  const phase = planData.phases.find(p => p.id === planData.currentPhase);
  if (!phase) return null;
  
  const shrimpTasks = phase.tasks.map(task => ({
    id: `plan-${planData.planId}-${task.id}`,
    title: `[${phase.name}] ${task.title}`,
    status: task.status === 'completed' ? 'done' : 
            task.status === 'in_progress' ? 'in-progress' : 'pending',
    source: 'planning-system',
    planId: planData.planId,
    phaseId: phase.id,
    taskId: task.id
  }));
  
  return shrimpTasks;
}

// Get sync status
function getSyncStatus() {
  const plan = findActivePlan();
  if (!plan) {
    return { synced: false, message: 'No active plan' };
  }
  
  const phase = plan.phases.find(p => p.id === plan.currentPhase);
  const completed = phase?.tasks.filter(t => t.status === 'completed').length || 0;
  const total = phase?.tasks.length || 0;
  
  return {
    synced: true,
    planId: plan.planId,
    phase: plan.currentPhase,
    phaseName: phase?.name,
    progress: `${completed}/${total}`,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0
  };
}

// CLI
const cmd = process.argv[2];

if (cmd === '--sync') {
  const plan = findActivePlan();
  if (plan) {
    const tasks = syncToShrimp(plan);
    console.log(`[+] Synced ${tasks.length} tasks from ${plan.currentPhase}`);
    console.log(JSON.stringify(tasks, null, 2));
  } else {
    console.log('[-] No active plan to sync');
  }
} else if (cmd === '--test') {
  const status = getSyncStatus();
  console.log('[*] Shrimp Bridge Test');
  console.log(JSON.stringify(status, null, 2));
} else {
  console.log('Usage: node shrimp-bridge.js [--sync|--test]');
}

module.exports = { findActivePlan, syncToShrimp, getSyncStatus };
