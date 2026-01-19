#!/usr/bin/env node
/**
 * restore.js - 세션 시작 시 마지막 플랜 상태 복원
 * 
 * 사용법:
 *   node restore.js          # 전체 상태 출력
 *   node restore.js --quiet  # 간략 출력
 *   node restore.js --json   # JSON 출력
 */

const fs = require('fs');
const path = require('path');

const PLANS_DIR = path.join(__dirname, '..', 'plans');
const ACTIVE_PLAN = path.join(PLANS_DIR, 'ACTIVE-PLAN.md');

// Parse arguments
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    quiet: args.includes('--quiet'),
    json: args.includes('--json')
  };
}

// Find active plan from progress files
function findActivePlan() {
  const files = fs.readdirSync(PLANS_DIR)
    .filter(f => f.endsWith('-progress.json'));
  
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(PLANS_DIR, file), 'utf8'));
    if (data.status === 'active') {
      return data;
    }
  }
  return null;
}

// Get current phase info
function getCurrentPhaseInfo(data) {
  const phase = data.phases.find(p => p.id === data.currentPhase);
  if (!phase) return null;
  
  const completedTasks = phase.tasks.filter(t => t.status === 'completed').length;
  const totalTasks = phase.tasks.length;
  const nextTask = phase.tasks.find(t => t.status === 'pending' || t.status === 'in_progress');
  
  return {
    id: phase.id,
    name: phase.name,
    status: phase.status,
    completedTasks,
    totalTasks,
    percent: Math.round((completedTasks / totalTasks) * 100),
    nextTask
  };
}

// Check for alerts
function checkAlerts(data) {
  const alerts = [];
  const now = new Date();
  const lastMod = new Date(data.lastModified);
  const daysSinceUpdate = (now - lastMod) / (1000 * 60 * 60 * 24);
  
  if (daysSinceUpdate > 3) {
    alerts.push(`[!] ALERT: 플랜 정체 (${Math.floor(daysSinceUpdate)}일)`);
  }
  
  const phase = data.phases.find(p => p.id === data.currentPhase);
  if (phase && phase.startedAt) {
    const phaseStart = new Date(phase.startedAt);
    const minutesElapsed = (now - phaseStart) / (1000 * 60);
    if (minutesElapsed > phase.estimatedMinutes * 2) {
      alerts.push(`[!] ALERT: Phase 예상 시간 초과 (${phase.estimatedMinutes}분 → ${Math.floor(minutesElapsed)}분)`);
    }
  }
  
  return alerts;
}

// Main execution
function main() {
  const args = parseArgs();
  
  const data = findActivePlan();
  if (!data) {
    console.log('[*] No active plan found');
    return;
  }
  
  const phaseInfo = getCurrentPhaseInfo(data);
  const alerts = checkAlerts(data);
  
  // JSON output
  if (args.json) {
    console.log(JSON.stringify({ data, phaseInfo, alerts }, null, 2));
    return;
  }
  
  // Quiet mode
  if (args.quiet) {
    console.log(`[PLAN] ${data.planId} | Phase ${data.currentPhase} | ${data.metadata.progressPercent}%`);
    return;
  }
  
  // Full output
  console.log('========================================');
  console.log('  Planning System - Session Restore');
  console.log('========================================\n');
  
  console.log(`[PLAN] 활성 플랜: ${data.planId}`);
  console.log(`[PLAN] 버전: ${data.version}`);
  console.log(`[PLAN] 전체 진행률: ${data.metadata.completedTasks}/${data.metadata.totalTasks} (${data.metadata.progressPercent}%)\n`);
  
  if (phaseInfo) {
    console.log(`[PHASE] 현재: ${phaseInfo.id} - ${phaseInfo.name}`);
    console.log(`[PHASE] 진행: ${phaseInfo.completedTasks}/${phaseInfo.totalTasks} (${phaseInfo.percent}%)`);
    if (phaseInfo.nextTask) {
      console.log(`[NEXT] 다음 작업: ${phaseInfo.nextTask.id} - ${phaseInfo.nextTask.title}`);
    }
  }
  
  if (alerts.length > 0) {
    console.log('\n--- Alerts ---');
    alerts.forEach(a => console.log(a));
  }
  
  console.log('\n========================================\n');
}

main();
