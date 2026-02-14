#!/usr/bin/env node
/**
 * Planning Workflow Orchestrator
 *
 * 일관된 플래닝 워크플로우 강제 실행
 *
 * 워크플로우:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  SESSION START                                              │
 * │  ├── 1. plan-guard snapshot (플랜 보호)                     │
 * │  ├── 2. load active plans (활성 플랜 로드)                  │
 * │  └── 3. output workflow state (상태 출력)                   │
 * ├─────────────────────────────────────────────────────────────┤
 * │  PLAN MODE ENTER                                            │
 * │  ├── 1. check existing plans (기존 플랜 확인)               │
 * │  ├── 2. generate new plan name (새 파일명 생성)             │
 * │  └── 3. lock protection (보호 잠금 활성화)                  │
 * ├─────────────────────────────────────────────────────────────┤
 * │  PLAN MODE EXIT                                             │
 * │  ├── 1. verify integrity (무결성 검증)                      │
 * │  ├── 2. update progress (진행 상황 업데이트)                │
 * │  └── 3. unlock protection (보호 잠금 해제)                  │
 * ├─────────────────────────────────────────────────────────────┤
 * │  SESSION END                                                │
 * │  ├── 1. final verification (최종 검증)                      │
 * │  ├── 2. auto-restore if violated (위반 시 복원)             │
 * │  └── 3. persist state (상태 저장)                           │
 * └─────────────────────────────────────────────────────────────┘
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Log Writer for hybrid logging (MD + JSON)
let logWriter;
try {
  logWriter = require('./log-writer');
} catch (e) {
  logWriter = null;
}

// Lifecycle Collector for Planning Lifecycle Integration (Phase 8B)
let lifecycleCollector;
try {
  lifecycleCollector = require('../dashboard/plan-ecosystem/collectors/lifecycle-collector');
} catch (e) {
  lifecycleCollector = null;
}

const PLANS_DIR = 'K:/PortableApps/genai/plans';
const PLANNING_SYSTEM_DIR = 'K:/PortableApps/genai/planning-system';
const WORKFLOW_STATE_FILE = path.join(PLANNING_SYSTEM_DIR, 'workflow-state.json');
const ACTIVE_PLAN_FILE = path.join(PLANS_DIR, 'ACTIVE-PLAN.md');

class PlanningWorkflow {
  constructor() {
    this.state = this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(WORKFLOW_STATE_FILE)) {
        return JSON.parse(fs.readFileSync(WORKFLOW_STATE_FILE, 'utf8'));
      }
    } catch (e) {
      // Ignore
    }
    return {
      sessionId: null,
      phase: 'idle',  // idle, planning, executing
      activePlans: [],
      currentPlan: null,
      protectionLocked: false,
      lastWorkflow: null,
      history: []
    };
  }

  saveState() {
    fs.writeFileSync(WORKFLOW_STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  // ============================================
  // SESSION START WORKFLOW
  // ============================================
  sessionStart() {
    console.log('========================================');
    console.log('  Planning Workflow - Session Start');
    console.log('========================================');

    // 1. Generate session ID
    this.state.sessionId = `session-${Date.now()}`;
    this.state.phase = 'idle';
    console.log(`[+] Session: ${this.state.sessionId}`);

    // 2. Create plan snapshots
    console.log('\n[1/3] Creating plan snapshots...');
    try {
      execSync('node K:/PortableApps/genai/planning-system/plan-guard.js snapshot', {
        stdio: 'inherit'
      });
    } catch (e) {
      console.log('[-] Snapshot failed:', e.message);
    }

    // 3. Load active plans
    console.log('\n[2/3] Loading active plans...');
    this.state.activePlans = this.getActivePlans();
    this.state.activePlans.forEach(plan => {
      console.log(`  [+] ${plan.name} (${plan.progress}%)`);
    });

    // [Phase 8B] Ensure Lifecycle records exist for all active plans
    if (lifecycleCollector) {
      this.ensureLifecyclesExist();
    }

    // 4. Determine current plan
    if (fs.existsSync(ACTIVE_PLAN_FILE)) {
      const activeContent = fs.readFileSync(ACTIVE_PLAN_FILE, 'utf8');
      const match = activeContent.match(/\*\*Plan\*\*\s*\|\s*([a-z-]+)/);
      if (match) {
        this.state.currentPlan = match[1];
      }
    }

    // 5. Output workflow state
    console.log('\n[3/3] Workflow State');
    console.log('----------------------------------------');
    console.log(`Phase: ${this.state.phase}`);
    console.log(`Active Plans: ${this.state.activePlans.length}`);
    console.log(`Current Plan: ${this.state.currentPlan || 'None'}`);
    console.log(`Protection: ${this.state.protectionLocked ? 'LOCKED' : 'Ready'}`);
    console.log('----------------------------------------');

    // 6. Output rules reminder
    console.log('\n[!] PLAN PROTECTION RULES:');
    console.log('    - Never overwrite existing plan files');
    console.log('    - New plan = New file (use: plan-guard new-name)');
    console.log('    - Completed plans -> plans/completed/');
    console.log('========================================\n');

    this.state.lastWorkflow = 'session-start';
    this.saveState();

    // [NEW] JSON logging - session start
    if (logWriter) {
      const dateStr = logWriter.getDateString();
      logWriter.startSession(dateStr, this.state.sessionId, this.state.currentPlan);
      console.log(`[+] JSON log initialized: planning-log/daily/${dateStr}.json`);
    }

    return this.state;
  }

  // ============================================
  // PLAN MODE ENTER
  // ============================================
  planModeEnter(planName = null) {
    console.log('========================================');
    console.log('  Planning Workflow - Plan Mode Enter');
    console.log('========================================');

    // 1. Lock protection
    this.state.protectionLocked = true;
    this.state.phase = 'planning';
    console.log('[+] Protection locked');

    // 2. Check if continuing existing plan or new plan
    if (planName && this.planExists(planName)) {
      console.log(`[*] Continuing existing plan: ${planName}`);
      this.state.currentPlan = planName;
    } else {
      // Generate new unique name
      const newName = this.generateUniqueName();
      console.log(`[+] New plan file: plans/${newName}.md`);
      this.state.currentPlan = newName;
    }

    // 3. List protected plans (read-only)
    console.log('\n[!] Protected Plans (READ-ONLY):');
    this.state.activePlans.forEach(plan => {
      if (plan.name !== this.state.currentPlan) {
        console.log(`    [PROTECTED] ${plan.name}`);
      } else {
        console.log(`    [EDITABLE]  ${plan.name} <-- Current`);
      }
    });

    // [Phase 8B] Update Lifecycle PRD phase when entering plan mode
    if (lifecycleCollector && this.state.currentPlan) {
      try {
        const lifecycle = lifecycleCollector.loadLifecycle(this.state.currentPlan);
        if (lifecycle.phases.prd.status === 'pending') {
          lifecycle.phases.prd.status = 'in_progress';
          lifecycle.phases.prd.startedAt = new Date().toISOString();
          lifecycleCollector.saveLifecycle(lifecycle);
          console.log(`\n  [+] Lifecycle PRD phase started: ${this.state.currentPlan}`);
        }
      } catch (e) {
        console.log(`  [*] Lifecycle update skipped: ${e.message}`);
      }
    }

    console.log('========================================\n');

    this.state.lastWorkflow = 'plan-mode-enter';
    this.saveState();

    return {
      currentPlan: this.state.currentPlan,
      planFile: `plans/${this.state.currentPlan}.md`,
      protectedPlans: this.state.activePlans.filter(p => p.name !== this.state.currentPlan)
    };
  }

  // ============================================
  // PLAN MODE EXIT
  // ============================================
  planModeExit() {
    console.log('========================================');
    console.log('  Planning Workflow - Plan Mode Exit');
    console.log('========================================');

    // 1. Verify integrity
    console.log('[1/3] Verifying plan integrity...');
    try {
      execSync('node K:/PortableApps/genai/planning-system/plan-guard.js verify', {
        stdio: 'inherit'
      });
    } catch (e) {
      console.log('[-] Verification error');
    }

    // 2. Update progress if applicable
    if (this.state.currentPlan) {
      console.log(`\n[2/3] Updating progress for: ${this.state.currentPlan}`);
      this.updatePlanProgress(this.state.currentPlan);

      // [Phase 8B] Update Lifecycle progress
      this.updateLifecycleProgress(this.state.currentPlan);
    }

    // 3. Unlock protection
    this.state.protectionLocked = false;
    this.state.phase = 'idle';
    console.log('\n[3/3] Protection unlocked');
    console.log('========================================\n');

    this.state.lastWorkflow = 'plan-mode-exit';
    this.saveState();

    return { success: true };
  }

  // ============================================
  // SESSION END WORKFLOW
  // ============================================
  sessionEnd() {
    console.log('========================================');
    console.log('  Planning Workflow - Session End');
    console.log('========================================');

    // 1. Final verification
    console.log('[1/3] Final verification...');
    const violations = this.verifyAllPlans();

    // 2. Auto-restore if violated
    if (violations.length > 0) {
      console.log(`\n[2/3] Found ${violations.length} violation(s), restoring...`);
      violations.forEach(v => {
        console.log(`  [!] Restoring: ${v.file}`);
        try {
          execSync(`node K:/PortableApps/genai/planning-system/plan-guard.js restore "${v.file}"`, {
            stdio: 'inherit'
          });
        } catch (e) {
          console.log(`  [-] Restore failed: ${e.message}`);
        }
      });
    } else {
      console.log('\n[2/3] All plans intact');
    }

    // 3. Persist state
    console.log('\n[3/3] Persisting workflow state...');
    this.state.history.push({
      sessionId: this.state.sessionId,
      endTime: new Date().toISOString(),
      violations: violations.length,
      activePlans: this.state.activePlans.length
    });

    // Keep only last 10 sessions
    if (this.state.history.length > 10) {
      this.state.history = this.state.history.slice(-10);
    }

    this.state.lastWorkflow = 'session-end';
    this.saveState();

    // [NEW] JSON logging - session end
    if (logWriter) {
      const dateStr = logWriter.getDateString();
      logWriter.endSession(dateStr);
      const log = logWriter.getLog(dateStr);
      console.log(`[+] JSON log saved: ${log.summary.totalActions} actions, ${log.summary.totalSessions} sessions`);
    }

    console.log('========================================\n');
    return { violations };
  }

  // ============================================
  // HELPER METHODS
  // ============================================
  getActivePlans() {
    const plans = [];
    if (!fs.existsSync(PLANS_DIR)) return plans;

    fs.readdirSync(PLANS_DIR).forEach(file => {
      if (file.endsWith('.md') &&
          file !== 'ACTIVE-PLAN.md' &&
          file !== 'README.md' &&
          !file.includes('.corrupted.')) {

        const name = file.replace('.md', '');
        const progressFile = path.join(PLANS_DIR, `${name}-progress.json`);
        let progress = 0;

        if (fs.existsSync(progressFile)) {
          try {
            const progressData = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
            const completed = progressData.tasks?.filter(t => t.status === 'completed').length || 0;
            const total = progressData.tasks?.length || 1;
            progress = Math.round((completed / total) * 100);
          } catch (e) {
            // Ignore
          }
        }

        plans.push({ name, progress, file });
      }
    });

    return plans;
  }

  planExists(name) {
    return fs.existsSync(path.join(PLANS_DIR, `${name}.md`));
  }

  generateUniqueName() {
    const adjectives = ['agile', 'bright', 'calm', 'deft', 'eager', 'fair', 'grand', 'humble'];
    const verbs = ['building', 'crafting', 'designing', 'evolving', 'forging', 'growing', 'honing'];
    const nouns = ['anchor', 'beacon', 'crystal', 'diamond', 'ember', 'falcon', 'glacier', 'horizon'];

    for (let i = 0; i < 100; i++) {
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const verb = verbs[Math.floor(Math.random() * verbs.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const name = `${adj}-${verb}-${noun}`;

      if (!this.planExists(name)) {
        return name;
      }
    }

    return `plan-${Date.now()}`;
  }

  updatePlanProgress(planName) {
    const planFile = path.join(PLANS_DIR, `${planName}.md`);
    const progressFile = path.join(PLANS_DIR, `${planName}-progress.json`);

    if (!fs.existsSync(planFile)) return;

    const content = fs.readFileSync(planFile, 'utf8');

    // Count completed tasks from checkboxes
    const completed = (content.match(/\[x\]/gi) || []).length;
    const pending = (content.match(/\[ \]/g) || []).length;
    const total = completed + pending;

    // Update ACTIVE-PLAN.md
    const activeContent = `# Active Plan Reference
**Auto-updated by planning-system**

## Current Status
| 항목 | 값 |
|------|-----|
| **Plan** | ${planName} |
| **Progress** | ${completed}/${total} tasks (${total > 0 ? Math.round(completed/total*100) : 0}%) |
| **Last Updated** | ${new Date().toISOString()} |
`;

    fs.writeFileSync(ACTIVE_PLAN_FILE, activeContent);
    console.log(`  [+] ACTIVE-PLAN.md updated`);
  }

  verifyAllPlans() {
    const violations = [];
    const guardStateFile = path.join(PLANNING_SYSTEM_DIR, 'guard-state.json');

    if (!fs.existsSync(guardStateFile)) return violations;

    try {
      const guardState = JSON.parse(fs.readFileSync(guardStateFile, 'utf8'));

      for (const [relativePath, snapshot] of Object.entries(guardState.snapshots)) {
        const fullPath = path.join(PLANS_DIR, relativePath);

        if (!fs.existsSync(fullPath)) {
          violations.push({ file: relativePath, type: 'deleted' });
          continue;
        }

        const currentContent = fs.readFileSync(fullPath, 'utf8');
        const crypto = require('crypto');
        const currentHash = crypto.createHash('md5').update(currentContent).digest('hex');

        if (currentHash !== snapshot.hash) {
          // Check if it's a valid progress update (checkboxes changed)
          const snapshotContent = fs.existsSync(snapshot.snapshotPath)
            ? fs.readFileSync(snapshot.snapshotPath, 'utf8')
            : '';

          if (!this.isValidProgressUpdate(snapshotContent, currentContent)) {
            violations.push({ file: relativePath, type: 'modified' });
          }
        }
      }
    } catch (e) {
      console.log('[-] Verification error:', e.message);
    }

    return violations;
  }

  isValidProgressUpdate(original, current) {
    // Remove checkbox states and compare structure
    const normalizeContent = (content) => {
      return content
        .replace(/\[[ x\*]\]/gi, '[ ]')  // Normalize checkboxes
        .replace(/현재 Phase:.*/g, '')    // Remove progress lines
        .replace(/진행률:.*/g, '')
        .replace(/Last Updated:.*/g, '')
        .trim();
    };

    return normalizeContent(original) === normalizeContent(current);
  }

  // ============================================
  // [Phase 8B] LIFECYCLE INTEGRATION
  // ============================================

  /**
   * Ensure Lifecycle records exist for all active plans
   */
  ensureLifecyclesExist() {
    if (!lifecycleCollector) return;

    console.log('\n[+] Checking Lifecycle records...');
    let created = 0;
    let existing = 0;

    for (const plan of this.state.activePlans) {
      try {
        const planPath = path.join(PLANS_DIR, `${plan.name}.md`);
        if (!fs.existsSync(planPath)) continue;

        const content = fs.readFileSync(planPath, 'utf8');
        const titleMatch = content.match(/^#\s+(.+)/m);
        const title = titleMatch ? titleMatch[1].trim() : plan.name;

        const lifecycle = lifecycleCollector.loadLifecycle(plan.name, title);

        // Check if newly created (no goals yet)
        if (lifecycle.goalMapping.length === 0) {
          const goals = lifecycleCollector.extractGoalsFromPlan(content);
          goals.forEach(g => {
            lifecycle.goalMapping.push({
              id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              title: g.title,
              phase: g.phase || lifecycleCollector.PHASES.IMPLEMENTATION,
              status: g.status || 'pending',
              progress: g.status === 'completed' ? 100 : 0,
              createdAt: new Date().toISOString()
            });
          });

          if (goals.length > 0) {
            lifecycleCollector.saveLifecycle(lifecycle);
            created++;
          }
        } else {
          existing++;
        }
      } catch (e) {
        // Ignore individual plan errors
      }
    }

    if (created > 0) {
      console.log(`  [+] Created ${created} new Lifecycle records`);
    }
    if (existing > 0) {
      console.log(`  [*] ${existing} Lifecycle records already exist`);
    }
  }

  /**
   * Update Lifecycle phase progress after plan update
   */
  updateLifecycleProgress(planName) {
    if (!lifecycleCollector) return;

    try {
      const planPath = path.join(PLANS_DIR, `${planName}.md`);
      if (!fs.existsSync(planPath)) return;

      const content = fs.readFileSync(planPath, 'utf8');

      // Calculate progress from checkboxes
      const completed = (content.match(/\[x\]/gi) || []).length;
      const pending = (content.match(/\[ \]/g) || []).length;
      const total = completed + pending;
      const progress = total > 0 ? Math.round(completed / total * 100) : 0;

      const lifecycle = lifecycleCollector.loadLifecycle(planName);

      // Determine current phase based on progress
      if (progress < 20) {
        lifecycle.phases.prd.status = 'in_progress';
        lifecycle.phases.prd.progress = Math.min(100, progress * 5);
      } else if (progress < 50) {
        lifecycle.phases.prd.status = 'completed';
        lifecycle.phases.prd.progress = 100;
        lifecycle.phases.mvp.status = 'in_progress';
        lifecycle.phases.mvp.progress = Math.round((progress - 20) * 3.33);
      } else if (progress < 90) {
        lifecycle.phases.prd.status = 'completed';
        lifecycle.phases.prd.progress = 100;
        lifecycle.phases.mvp.status = 'completed';
        lifecycle.phases.mvp.progress = 100;
        lifecycle.phases.implementation.status = 'in_progress';
        lifecycle.phases.implementation.progress = Math.round((progress - 50) * 2.5);
      } else {
        lifecycle.phases.prd.status = 'completed';
        lifecycle.phases.prd.progress = 100;
        lifecycle.phases.mvp.status = 'completed';
        lifecycle.phases.mvp.progress = 100;
        lifecycle.phases.implementation.status = 'completed';
        lifecycle.phases.implementation.progress = 100;
        lifecycle.phases.release.status = progress === 100 ? 'completed' : 'in_progress';
        lifecycle.phases.release.progress = progress === 100 ? 100 : (progress - 90) * 10;
      }

      // Calculate overall progress
      const weights = { prd: 15, mvp: 25, implementation: 45, release: 15 };
      lifecycle.overallProgress = Math.round(
        Object.entries(weights).reduce((sum, [phase, weight]) => {
          return sum + (lifecycle.phases[phase].progress / 100) * weight;
        }, 0)
      );

      lifecycleCollector.saveLifecycle(lifecycle);
      console.log(`  [+] Lifecycle updated: ${planName} (${lifecycle.overallProgress}% overall)`);
    } catch (e) {
      console.log(`  [*] Lifecycle update failed: ${e.message}`);
    }
  }

  // ============================================
  // STATUS
  // ============================================
  status() {
    console.log('========================================');
    console.log('  Planning Workflow Status');
    console.log('========================================');
    console.log(`Session: ${this.state.sessionId || 'None'}`);
    console.log(`Phase: ${this.state.phase}`);
    console.log(`Protection: ${this.state.protectionLocked ? 'LOCKED' : 'Unlocked'}`);
    console.log(`Current Plan: ${this.state.currentPlan || 'None'}`);
    console.log(`Active Plans: ${this.state.activePlans?.length || 0}`);
    console.log(`Last Workflow: ${this.state.lastWorkflow || 'None'}`);
    console.log(`History: ${this.state.history?.length || 0} sessions`);
    console.log('========================================');
  }
}

// CLI
const workflow = new PlanningWorkflow();
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'start':
  case 'session-start':
    workflow.sessionStart();
    break;

  case 'plan-enter':
  case 'enter':
    workflow.planModeEnter(arg);
    break;

  case 'plan-exit':
  case 'exit':
    workflow.planModeExit();
    break;

  case 'end':
  case 'session-end':
    workflow.sessionEnd();
    break;

  case 'status':
  default:
    workflow.status();
    break;
}

module.exports = { PlanningWorkflow };
