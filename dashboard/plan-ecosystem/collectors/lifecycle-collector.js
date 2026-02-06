/**
 * Lifecycle Collector - 플래닝 라이프사이클 추적
 * 
 * PRD → MVP → Implementation → Release 단계 추적
 * 목표-구현 매핑, 프롬프트 연결 지원
 */
const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/Claude-Code';
const LIFECYCLE_DIR = path.join(BASE_PATH, 'planning-log/lifecycle');
const PLANS_DIR = path.join(BASE_PATH, 'plans');

// 라이프사이클 단계 정의
const PHASES = {
    PRD: 'prd',
    MVP: 'mvp',
    IMPLEMENTATION: 'implementation',
    RELEASE: 'release'
};

const PHASE_ORDER = [PHASES.PRD, PHASES.MVP, PHASES.IMPLEMENTATION, PHASES.RELEASE];


/**
 * 디렉토리 안전하게 생성
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * 라이프사이클 파일 경로 생성
 */
function getLifecycleFilePath(planId) {
    ensureDir(LIFECYCLE_DIR);
    return path.join(LIFECYCLE_DIR, `${planId}-lifecycle.json`);
}

/**
 * 기본 라이프사이클 레코드 생성
 */
function createDefaultLifecycle(planId, planTitle) {
    return {
        lifecycleId: `lc-${planId}-${Date.now()}`,
        planId,
        planTitle: planTitle || planId,
        phases: {
            prd: {
                status: 'pending',
                startedAt: null,
                completedAt: null,
                goals: [],
                prompts: [],
                progress: 0
            },
            mvp: {
                status: 'pending',
                startedAt: null,
                completedAt: null,
                goals: [],
                implementedGoals: [],
                prompts: [],
                progress: 0
            },
            implementation: {
                status: 'pending',
                startedAt: null,
                completedAt: null,
                goals: [],
                implementedGoals: [],
                prompts: [],
                progress: 0
            },
            release: {
                status: 'pending',
                startedAt: null,
                completedAt: null,
                progress: 0
            }
        },
        overallProgress: 0,
        goalMapping: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

/**
 * 라이프사이클 로드 (없으면 생성)
 */
function loadLifecycle(planId, planTitle = null) {
    const filePath = getLifecycleFilePath(planId);
    
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`Error loading lifecycle for ${planId}:`, e.message);
        }
    }
    
    return createDefaultLifecycle(planId, planTitle);
}


/**
 * 라이프사이클 저장
 */
function saveLifecycle(lifecycle) {
    const filePath = getLifecycleFilePath(lifecycle.planId);
    lifecycle.updatedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(lifecycle, null, 2), 'utf8');
    return lifecycle;
}

/**
 * 전체 진행률 계산
 */
function calculateOverallProgress(lifecycle) {
    const weights = { prd: 15, mvp: 25, implementation: 45, release: 15 };
    let total = 0;
    
    for (const [phase, weight] of Object.entries(weights)) {
        if (lifecycle.phases[phase]) {
            total += (lifecycle.phases[phase].progress / 100) * weight;
        }
    }
    
    return Math.round(total);
}

/**
 * Phase 시작
 */
function startPhase(planId, phase, goals = []) {
    const lifecycle = loadLifecycle(planId);
    
    if (!PHASE_ORDER.includes(phase)) {
        throw new Error(`Invalid phase: ${phase}`);
    }
    
    lifecycle.phases[phase].status = 'in_progress';
    lifecycle.phases[phase].startedAt = new Date().toISOString();
    lifecycle.phases[phase].goals = goals;
    lifecycle.overallProgress = calculateOverallProgress(lifecycle);
    
    return saveLifecycle(lifecycle);
}

/**
 * Phase 완료
 */
function completePhase(planId, phase) {
    const lifecycle = loadLifecycle(planId);
    
    lifecycle.phases[phase].status = 'completed';
    lifecycle.phases[phase].completedAt = new Date().toISOString();
    lifecycle.phases[phase].progress = 100;
    lifecycle.overallProgress = calculateOverallProgress(lifecycle);
    
    return saveLifecycle(lifecycle);
}

/**
 * Phase 진행률 업데이트
 */
function updatePhaseProgress(planId, phase, progress, implementedGoals = null) {
    const lifecycle = loadLifecycle(planId);
    
    lifecycle.phases[phase].progress = Math.min(100, Math.max(0, progress));
    
    if (implementedGoals) {
        lifecycle.phases[phase].implementedGoals = implementedGoals;
    }
    
    lifecycle.overallProgress = calculateOverallProgress(lifecycle);
    
    return saveLifecycle(lifecycle);
}

/**
 * 프롬프트를 라이프사이클 Phase에 연결
 */
function linkPromptToPhase(planId, phase, promptId) {
    const lifecycle = loadLifecycle(planId);
    
    if (!lifecycle.phases[phase].prompts.includes(promptId)) {
        lifecycle.phases[phase].prompts.push(promptId);
    }
    
    return saveLifecycle(lifecycle);
}

/**
 * 목표 추가
 */
function addGoal(planId, goal) {
    const lifecycle = loadLifecycle(planId);
    
    const goalRecord = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: goal.title,
        description: goal.description || '',
        status: 'pending',
        progress: 0,
        phase: goal.phase || PHASES.IMPLEMENTATION,
        createdAt: new Date().toISOString()
    };
    
    lifecycle.goalMapping.push(goalRecord);
    
    return saveLifecycle(lifecycle);
}

/**
 * 목표 진행률 업데이트
 */
function updateGoalProgress(planId, goalId, progress, status = null) {
    const lifecycle = loadLifecycle(planId);
    
    const goal = lifecycle.goalMapping.find(g => g.id === goalId);
    if (goal) {
        goal.progress = Math.min(100, Math.max(0, progress));
        if (status) goal.status = status;
        if (progress >= 100) goal.status = 'completed';
    }

    
    return saveLifecycle(lifecycle);
}

/**
 * 플랜 파일에서 목표 자동 추출
 */
function extractGoalsFromPlan(planContent) {
    const goals = [];
    
    // Executive Summary에서 목표 추출
    const summaryMatch = planContent.match(/##\s*Executive Summary[\s\S]*?(?=##|$)/i);
    if (summaryMatch) {
        const summaryGoals = summaryMatch[0].match(/[-*]\s+(.+)/g);
        if (summaryGoals) {
            summaryGoals.slice(0, 5).forEach((g, i) => {
                goals.push({
                    title: g.replace(/^[-*]\s+/, '').trim(),
                    phase: PHASES.PRD,
                    source: 'executive_summary'
                });
            });
        }
    }
    
    // Phase별 목표 추출
    const phaseMatches = planContent.matchAll(/##\s*Phase\s*(\d+)[:\s]*([^\n]+)[\s\S]*?(?=##\s*Phase|##\s*\d+\.|$)/gi);
    for (const match of phaseMatches) {
        const phaseName = match[2].trim();
        const taskMatches = match[0].match(/- \[[ x]\]\s+(.+)/g);
        if (taskMatches) {
            taskMatches.forEach(t => {
                const isCompleted = /- \[x\]/i.test(t);
                goals.push({
                    title: t.replace(/- \[[ x]\]\s+/i, '').trim(),
                    phase: PHASES.IMPLEMENTATION,
                    source: `phase_${match[1]}`,
                    status: isCompleted ? 'completed' : 'pending'
                });
            });
        }
    }
    
    return goals;
}

/**
 * 모든 라이프사이클 조회
 */
function collectAllLifecycles() {
    ensureDir(LIFECYCLE_DIR);
    
    const files = fs.readdirSync(LIFECYCLE_DIR)
        .filter(f => f.endsWith('-lifecycle.json'));
    
    const lifecycles = [];
    for (const file of files) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(LIFECYCLE_DIR, file), 'utf8'));
            lifecycles.push(data);
        } catch (e) {
            console.error(`Error loading ${file}:`, e.message);
        }
    }
    
    return {
        lifecycles,
        stats: {
            total: lifecycles.length,
            byPhase: {
                prd: lifecycles.filter(l => l.phases.prd.status === 'in_progress').length,
                mvp: lifecycles.filter(l => l.phases.mvp.status === 'in_progress').length,
                implementation: lifecycles.filter(l => l.phases.implementation.status === 'in_progress').length,
                release: lifecycles.filter(l => l.phases.release.status === 'in_progress').length
            },
            completed: lifecycles.filter(l => l.phases.release.status === 'completed').length
        },
        collectedAt: new Date().toISOString()
    };
}

/**
 * 특정 플랜의 라이프사이클 상세 조회
 */
function getLifecycleDetail(planId) {
    return loadLifecycle(planId);
}

/**
 * 현재 Phase 판단
 */
function getCurrentPhase(lifecycle) {
    for (const phase of PHASE_ORDER) {
        if (lifecycle.phases[phase].status === 'in_progress') {
            return phase;
        }
    }
    
    // 완료된 Phase 중 마지막 반환
    for (let i = PHASE_ORDER.length - 1; i >= 0; i--) {
        if (lifecycle.phases[PHASE_ORDER[i]].status === 'completed') {
            return PHASE_ORDER[i];
        }
    }
    
    return PHASES.PRD;
}

/**
 * Mermaid 다이어그램 생성 (라이프사이클용)
 */
function generateLifecycleMermaid(lifecycle) {
    const currentPhase = getCurrentPhase(lifecycle);
    
    let mermaid = `stateDiagram-v2\n`;
    mermaid += `    [*] --> PRD\n`;
    
    for (let i = 0; i < PHASE_ORDER.length - 1; i++) {
        const from = PHASE_ORDER[i].toUpperCase();
        const to = PHASE_ORDER[i + 1].toUpperCase();
        mermaid += `    ${from} --> ${to}\n`;
    }
    
    mermaid += `    RELEASE --> [*]\n\n`;
    
    // 현재 단계 강조
    for (const phase of PHASE_ORDER) {
        const status = lifecycle.phases[phase].status;
        const progress = lifecycle.phases[phase].progress;
        const phaseUpper = phase.toUpperCase();
        
        if (status === 'completed') {
            mermaid += `    ${phaseUpper}: ${phaseUpper} [DONE]\n`;
        } else if (status === 'in_progress') {
            mermaid += `    ${phaseUpper}: ${phaseUpper} [${progress}%]\n`;
        }
    }
    
    return mermaid;
}

module.exports = {
    PHASES,
    PHASE_ORDER,
    loadLifecycle,
    saveLifecycle,
    startPhase,
    completePhase,
    updatePhaseProgress,
    linkPromptToPhase,
    addGoal,
    updateGoalProgress,
    extractGoalsFromPlan,
    collectAllLifecycles,
    getLifecycleDetail,
    getCurrentPhase,
    generateLifecycleMermaid
};
