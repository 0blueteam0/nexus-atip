#!/usr/bin/env node
/**
 * sync-lifecycle.js - Lifecycle 동기화 스크립트
 *
 * Phase 8B: 플랜 완료/Phase 변경 시 Lifecycle 자동 동기화
 *
 * 사용법:
 *   node sync-lifecycle.js [--plan planId] [--all]
 */

const fs = require('fs');
const path = require('path');

// Collectors 로드
let lifecycleCollector;
try {
    lifecycleCollector = require('../collectors/lifecycle-collector');
} catch (e) {
    console.error('[-] Failed to load lifecycle collector:', e.message);
    process.exit(1);
}

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/Claude-Code';
const PLANS_DIR = path.join(BASE_PATH, 'plans');

// CLI 인자
const args = process.argv.slice(2);
const syncAll = args.includes('--all');
const planIdIndex = args.indexOf('--plan');
const targetPlan = planIdIndex >= 0 && args[planIdIndex + 1] ? args[planIdIndex + 1] : null;

/**
 * 플랜 진행률 계산
 */
function calculatePlanProgress(planPath) {
    if (!fs.existsSync(planPath)) return { progress: 0, completed: 0, total: 0 };

    const content = fs.readFileSync(planPath, 'utf8');
    const completed = (content.match(/\[x\]/gi) || []).length;
    const pending = (content.match(/\[ \]/g) || []).length;
    const total = completed + pending;

    return {
        progress: total > 0 ? Math.round(completed / total * 100) : 0,
        completed,
        total
    };
}

/**
 * Phase 상태 결정
 */
function determinePhaseStatus(progress) {
    if (progress < 20) {
        return { current: 'prd', prd: 'in_progress' };
    } else if (progress < 50) {
        return { current: 'mvp', prd: 'completed', mvp: 'in_progress' };
    } else if (progress < 90) {
        return { current: 'implementation', prd: 'completed', mvp: 'completed', implementation: 'in_progress' };
    } else {
        return {
            current: progress === 100 ? 'release' : 'release',
            prd: 'completed',
            mvp: 'completed',
            implementation: 'completed',
            release: progress === 100 ? 'completed' : 'in_progress'
        };
    }
}

/**
 * 단일 플랜 동기화
 */
function syncPlanLifecycle(planId) {
    const planPath = path.join(PLANS_DIR, `${planId}.md`);

    // completed 폴더 확인
    const completedPath = path.join(PLANS_DIR, 'completed', `${planId}.md`);
    const isCompleted = fs.existsSync(completedPath);
    const actualPath = isCompleted ? completedPath : planPath;

    if (!fs.existsSync(actualPath)) {
        console.log(`  [*] Plan not found: ${planId}`);
        return null;
    }

    // 진행률 계산
    const stats = calculatePlanProgress(actualPath);
    const phaseStatus = determinePhaseStatus(isCompleted ? 100 : stats.progress);

    // Lifecycle 로드/업데이트
    const lifecycle = lifecycleCollector.loadLifecycle(planId);

    // Phase 상태 업데이트
    for (const [phase, status] of Object.entries(phaseStatus)) {
        if (phase === 'current') continue;

        lifecycle.phases[phase].status = status;

        if (status === 'completed') {
            lifecycle.phases[phase].progress = 100;
            if (!lifecycle.phases[phase].completedAt) {
                lifecycle.phases[phase].completedAt = new Date().toISOString();
            }
        } else if (status === 'in_progress') {
            if (!lifecycle.phases[phase].startedAt) {
                lifecycle.phases[phase].startedAt = new Date().toISOString();
            }
            // Progress 추정
            const phaseProgress = {
                prd: stats.progress * 5,
                mvp: (stats.progress - 20) * 3.33,
                implementation: (stats.progress - 50) * 2.5,
                release: (stats.progress - 90) * 10
            };
            lifecycle.phases[phase].progress = Math.min(100, Math.max(0, phaseProgress[phase] || 0));
        }
    }

    // 전체 진행률 계산
    const weights = { prd: 15, mvp: 25, implementation: 45, release: 15 };
    lifecycle.overallProgress = Math.round(
        Object.entries(weights).reduce((sum, [phase, weight]) => {
            return sum + (lifecycle.phases[phase].progress / 100) * weight;
        }, 0)
    );

    lifecycleCollector.saveLifecycle(lifecycle);

    console.log(`  [+] Synced: ${planId} (${stats.progress}% plan -> ${lifecycle.overallProgress}% lifecycle)`);
    return lifecycle;
}

/**
 * 모든 플랜 동기화
 */
function syncAllPlans() {
    console.log('\n========================================');
    console.log('  Lifecycle Sync');
    console.log('========================================\n');

    const planFiles = fs.readdirSync(PLANS_DIR)
        .filter(f => f.endsWith('.md') && f !== 'ACTIVE-PLAN.md' && f !== 'README.md');

    console.log(`[*] Found ${planFiles.length} plans\n`);

    let synced = 0;
    for (const file of planFiles) {
        const planId = file.replace('.md', '');
        if (syncPlanLifecycle(planId)) {
            synced++;
        }
    }

    // completed 폴더도 처리
    const completedDir = path.join(PLANS_DIR, 'completed');
    if (fs.existsSync(completedDir)) {
        const completedFiles = fs.readdirSync(completedDir)
            .filter(f => f.endsWith('.md') && f !== 'README.md');

        console.log(`\n[*] Found ${completedFiles.length} completed plans\n`);

        for (const file of completedFiles) {
            const planId = file.replace('.md', '');
            if (syncPlanLifecycle(planId)) {
                synced++;
            }
        }
    }

    console.log(`\n[+] Synced ${synced} lifecycles\n`);
    return synced;
}

// 메인 실행
if (syncAll) {
    syncAllPlans();
} else if (targetPlan) {
    syncPlanLifecycle(targetPlan);
} else {
    // 기본: 활성 플랜만 동기화
    const workflowStatePath = path.join(BASE_PATH, 'planning-system/workflow-state.json');
    if (fs.existsSync(workflowStatePath)) {
        try {
            const state = JSON.parse(fs.readFileSync(workflowStatePath, 'utf8'));
            if (state.currentPlan) {
                syncPlanLifecycle(state.currentPlan);
            } else if (state.activePlans) {
                state.activePlans.forEach(p => syncPlanLifecycle(p.name));
            }
        } catch (e) {
            console.log('[*] No active plans found, running full sync');
            syncAllPlans();
        }
    } else {
        syncAllPlans();
    }
}
