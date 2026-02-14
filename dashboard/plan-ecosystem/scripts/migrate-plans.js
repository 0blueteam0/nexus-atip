#!/usr/bin/env node
/**
 * migrate-plans.js - 기존 플랜을 Lifecycle 레코드로 마이그레이션
 *
 * Phase 8A: 12개 기존 플랜에 대한 Lifecycle 자동 생성
 * Usage: node migrate-plans.js [--force] [--planId <id>]
 */

const fs = require('fs');
const path = require('path');
const {
    loadLifecycle,
    saveLifecycle,
    extractGoalsFromPlan,
    PHASES
} = require('../collectors/lifecycle-collector');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/genai';
const PLANS_DIR = path.join(BASE_PATH, 'plans');
const LIFECYCLE_DIR = path.join(BASE_PATH, 'planning-log/lifecycle');

// CLI 옵션 파싱
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const PLAN_ID_INDEX = args.indexOf('--planId');
const TARGET_PLAN = PLAN_ID_INDEX >= 0 ? args[PLAN_ID_INDEX + 1] : null;

/**
 * 플랜 파일에서 제목 추출
 */
function extractTitle(content) {
    const match = content.match(/^#\s+(.+)/m);
    return match ? match[1].trim() : null;
}

/**
 * 플랜 파일에서 상태 추출 (Status 라인)
 */
function extractStatus(content) {
    const statusMatch = content.match(/\*\*Status\*\*:\s*(.+)/i);
    if (statusMatch) {
        const status = statusMatch[1].toLowerCase();
        if (status.includes('complete') || status.includes('done')) {
            return 'completed';
        } else if (status.includes('progress') || status.includes('active')) {
            return 'in_progress';
        } else if (status.includes('planning') || status.includes('phase 1')) {
            return 'planning';
        }
    }
    return 'unknown';
}

/**
 * 체크박스 기반 진행률 계산
 */
function calculateProgressFromCheckboxes(content) {
    const completed = (content.match(/\[x\]/gi) || []).length;
    const pending = (content.match(/\[ \]/g) || []).length;
    const total = completed + pending;

    return {
        completed,
        pending,
        total,
        progress: total > 0 ? Math.round(completed / total * 100) : 0
    };
}

/**
 * 진행률 기반 Phase 상태 결정
 */
function determinePhaseStatus(progress) {
    const status = {
        prd: { status: 'pending', progress: 0 },
        mvp: { status: 'pending', progress: 0 },
        implementation: { status: 'pending', progress: 0 },
        release: { status: 'pending', progress: 0 }
    };

    if (progress < 20) {
        status.prd.status = 'in_progress';
        status.prd.progress = Math.min(100, progress * 5);
    } else if (progress < 50) {
        status.prd.status = 'completed';
        status.prd.progress = 100;
        status.mvp.status = 'in_progress';
        status.mvp.progress = Math.round((progress - 20) * 3.33);
    } else if (progress < 90) {
        status.prd.status = 'completed';
        status.prd.progress = 100;
        status.mvp.status = 'completed';
        status.mvp.progress = 100;
        status.implementation.status = 'in_progress';
        status.implementation.progress = Math.round((progress - 50) * 2.5);
    } else {
        status.prd.status = 'completed';
        status.prd.progress = 100;
        status.mvp.status = 'completed';
        status.mvp.progress = 100;
        status.implementation.status = 'completed';
        status.implementation.progress = 100;

        if (progress === 100) {
            status.release.status = 'completed';
            status.release.progress = 100;
        } else {
            status.release.status = 'in_progress';
            status.release.progress = (progress - 90) * 10;
        }
    }

    return status;
}

/**
 * 단일 플랜 마이그레이션
 */
function migratePlan(planFile, planPath) {
    const planId = planFile.replace('.md', '');
    const content = fs.readFileSync(planPath, 'utf8');

    // 제목 추출
    const title = extractTitle(content) || planId;

    // 기존 Lifecycle 확인
    const existingPath = path.join(LIFECYCLE_DIR, `${planId}-lifecycle.json`);
    if (fs.existsSync(existingPath) && !FORCE) {
        console.log(`  [*] Skip (exists): ${planId}`);
        return { planId, status: 'skipped', reason: 'already_exists' };
    }

    // Lifecycle 생성/로드
    const lifecycle = loadLifecycle(planId, title);

    // 목표 추출
    const goals = extractGoalsFromPlan(content);
    const existingGoalTitles = new Set(lifecycle.goalMapping.map(g => g.title));

    goals.forEach(g => {
        if (!existingGoalTitles.has(g.title)) {
            lifecycle.goalMapping.push({
                id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                title: g.title,
                description: '',
                phase: g.phase || PHASES.IMPLEMENTATION,
                source: g.source || 'migration',
                status: g.status || 'pending',
                progress: g.status === 'completed' ? 100 : 0,
                createdAt: new Date().toISOString()
            });
        }
    });

    // 진행률 계산
    const checkboxStats = calculateProgressFromCheckboxes(content);
    const phaseStatus = determinePhaseStatus(checkboxStats.progress);

    // Phase 상태 적용
    for (const [phase, data] of Object.entries(phaseStatus)) {
        lifecycle.phases[phase].status = data.status;
        lifecycle.phases[phase].progress = data.progress;

        if (data.status === 'completed' && !lifecycle.phases[phase].completedAt) {
            lifecycle.phases[phase].completedAt = new Date().toISOString();
        }
        if (data.status === 'in_progress' && !lifecycle.phases[phase].startedAt) {
            lifecycle.phases[phase].startedAt = new Date().toISOString();
        }
    }

    // 전체 진행률 계산
    const weights = { prd: 15, mvp: 25, implementation: 45, release: 15 };
    lifecycle.overallProgress = Math.round(
        Object.entries(weights).reduce((sum, [phase, weight]) => {
            return sum + (lifecycle.phases[phase].progress / 100) * weight;
        }, 0)
    );

    // 저장
    saveLifecycle(lifecycle);

    console.log(`  [+] Migrated: ${planId} (${checkboxStats.progress}% -> ${lifecycle.overallProgress}% overall, ${goals.length} goals)`);

    return {
        planId,
        title,
        status: 'migrated',
        checkboxProgress: checkboxStats.progress,
        overallProgress: lifecycle.overallProgress,
        goalsCount: goals.length,
        currentPhase: Object.entries(lifecycle.phases)
            .find(([_, p]) => p.status === 'in_progress')?.[0] || 'release'
    };
}

/**
 * 모든 플랜 마이그레이션
 */
function migrateAllPlans() {
    console.log('\n========================================');
    console.log('  Plan to Lifecycle Migration');
    console.log('========================================\n');

    // plans 폴더 확인
    if (!fs.existsSync(PLANS_DIR)) {
        console.error('[-] Plans directory not found:', PLANS_DIR);
        process.exit(1);
    }

    // lifecycle 디렉토리 생성
    if (!fs.existsSync(LIFECYCLE_DIR)) {
        fs.mkdirSync(LIFECYCLE_DIR, { recursive: true });
        console.log('[+] Created lifecycle directory:', LIFECYCLE_DIR);
    }

    // 플랜 파일 수집 (루트만, completed/archived 제외, ACTIVE-PLAN 제외)
    const planFiles = fs.readdirSync(PLANS_DIR)
        .filter(f => f.endsWith('.md') && f !== 'ACTIVE-PLAN.md' && f !== 'README.md');

    console.log(`[*] Found ${planFiles.length} plan files in root\n`);

    const results = {
        migrated: [],
        skipped: [],
        failed: []
    };

    for (const file of planFiles) {
        // 특정 플랜만 처리
        if (TARGET_PLAN && !file.includes(TARGET_PLAN)) {
            continue;
        }

        try {
            const result = migratePlan(file, path.join(PLANS_DIR, file));

            if (result.status === 'migrated') {
                results.migrated.push(result);
            } else {
                results.skipped.push(result);
            }
        } catch (e) {
            console.error(`  [-] Failed: ${file} - ${e.message}`);
            results.failed.push({ planId: file.replace('.md', ''), error: e.message });
        }
    }

    // completed 폴더 처리
    const completedDir = path.join(PLANS_DIR, 'completed');
    if (fs.existsSync(completedDir)) {
        const completedFiles = fs.readdirSync(completedDir)
            .filter(f => f.endsWith('.md') && f !== 'README.md');

        console.log(`\n[*] Processing ${completedFiles.length} completed plans\n`);

        for (const file of completedFiles) {
            if (TARGET_PLAN && !file.includes(TARGET_PLAN)) {
                continue;
            }

            try {
                const result = migratePlan(file, path.join(completedDir, file));

                // completed 폴더의 플랜은 release 단계 완료로 설정
                if (result.status === 'migrated') {
                    const lifecycle = loadLifecycle(result.planId);
                    lifecycle.phases.prd.status = 'completed';
                    lifecycle.phases.prd.progress = 100;
                    lifecycle.phases.mvp.status = 'completed';
                    lifecycle.phases.mvp.progress = 100;
                    lifecycle.phases.implementation.status = 'completed';
                    lifecycle.phases.implementation.progress = 100;
                    lifecycle.phases.release.status = 'completed';
                    lifecycle.phases.release.progress = 100;
                    lifecycle.overallProgress = 100;
                    saveLifecycle(lifecycle);

                    result.overallProgress = 100;
                    result.currentPhase = 'release (completed)';
                    results.migrated.push(result);
                } else {
                    results.skipped.push(result);
                }
            } catch (e) {
                console.error(`  [-] Failed: ${file} - ${e.message}`);
                results.failed.push({ planId: file.replace('.md', ''), error: e.message });
            }
        }
    }

    // 결과 요약
    console.log('\n========================================');
    console.log('  Migration Results');
    console.log('========================================\n');

    console.log(`[+] Migrated: ${results.migrated.length}`);
    console.log(`[*] Skipped:  ${results.skipped.length}`);
    console.log(`[-] Failed:   ${results.failed.length}`);

    if (results.migrated.length > 0) {
        console.log('\n--- Migrated Plans ---');
        results.migrated.forEach(r => {
            console.log(`  ${r.planId}: ${r.overallProgress}% (${r.currentPhase})`);
        });
    }

    if (results.failed.length > 0) {
        console.log('\n--- Failed Plans ---');
        results.failed.forEach(r => {
            console.log(`  ${r.planId}: ${r.error}`);
        });
    }

    console.log('\n[+] Migration complete\n');

    return results;
}

// CLI 실행
if (require.main === module) {
    if (FORCE) {
        console.log('[!] Force mode: Overwriting existing lifecycles\n');
    }
    if (TARGET_PLAN) {
        console.log(`[!] Targeting specific plan: ${TARGET_PLAN}\n`);
    }

    migrateAllPlans();
}

module.exports = { migrateAllPlans, migratePlan };
