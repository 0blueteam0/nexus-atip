/**
 * Project Manager - 프로젝트 계층 관리
 *
 * 프로젝트 > 플랜 계층 구조 관리
 * CRUD 작업 및 집계 메트릭 제공
 */
const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/genai';
const PROJECTS_FILE = path.join(BASE_PATH, 'planning-log/projects.json');
const PROJECTS_DIR = path.join(BASE_PATH, 'planning-log/projects');

// 프로젝트 디렉토리 확인
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * 모든 프로젝트 로드
 */
function loadProjects() {
    ensureDir(path.dirname(PROJECTS_FILE));

    if (!fs.existsSync(PROJECTS_FILE)) {
        const defaultData = { projects: [], updatedAt: new Date().toISOString() };
        fs.writeFileSync(PROJECTS_FILE, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }

    try {
        return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    } catch (e) {
        console.error('[!] Failed to load projects:', e.message);
        return { projects: [], updatedAt: new Date().toISOString() };
    }
}

/**
 * 프로젝트 저장
 */
function saveProjects(data) {
    ensureDir(path.dirname(PROJECTS_FILE));
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return data;
}

/**
 * 프로젝트 생성
 */
function createProject(projectData) {
    const data = loadProjects();

    const project = {
        id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: projectData.name || 'Untitled Project',
        description: projectData.description || '',
        plans: projectData.plans || [],
        goals: projectData.goals || [],
        metrics: {
            overallProgress: 0,
            completedPlans: 0,
            activePlans: 0,
            totalTasks: 0,
            completedTasks: 0,
            activePhase: 'planning'
        },
        cycles: projectData.cycles || [],
        tags: projectData.tags || [],
        status: 'active', // active, on-hold, completed, archived
        priority: projectData.priority || 'medium', // low, medium, high, critical
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    data.projects.push(project);
    saveProjects(data);

    return project;
}

/**
 * 프로젝트 조회
 */
function getProject(projectId) {
    const data = loadProjects();
    return data.projects.find(p => p.id === projectId) || null;
}

/**
 * 프로젝트 업데이트
 */
function updateProject(projectId, updates) {
    const data = loadProjects();
    const index = data.projects.findIndex(p => p.id === projectId);

    if (index === -1) {
        return null;
    }

    // 업데이트 적용 (metrics는 별도 관리)
    const project = data.projects[index];
    Object.assign(project, {
        ...updates,
        id: project.id, // ID는 변경 불가
        createdAt: project.createdAt, // 생성일 변경 불가
        updatedAt: new Date().toISOString()
    });

    saveProjects(data);
    return project;
}

/**
 * 프로젝트 삭제
 */
function deleteProject(projectId) {
    const data = loadProjects();
    const index = data.projects.findIndex(p => p.id === projectId);

    if (index === -1) {
        return false;
    }

    data.projects.splice(index, 1);
    saveProjects(data);

    return true;
}

/**
 * 프로젝트에 플랜 연결
 */
function linkPlanToProject(projectId, planId) {
    const data = loadProjects();
    const project = data.projects.find(p => p.id === projectId);

    if (!project) {
        return null;
    }

    if (!project.plans.includes(planId)) {
        project.plans.push(planId);
        project.updatedAt = new Date().toISOString();
        saveProjects(data);
    }

    return project;
}

/**
 * 프로젝트에서 플랜 연결 해제
 */
function unlinkPlanFromProject(projectId, planId) {
    const data = loadProjects();
    const project = data.projects.find(p => p.id === projectId);

    if (!project) {
        return null;
    }

    const index = project.plans.indexOf(planId);
    if (index > -1) {
        project.plans.splice(index, 1);
        project.updatedAt = new Date().toISOString();
        saveProjects(data);
    }

    return project;
}

/**
 * 프로젝트에 목표 추가
 */
function addProjectGoal(projectId, goal) {
    const data = loadProjects();
    const project = data.projects.find(p => p.id === projectId);

    if (!project) {
        return null;
    }

    const goalRecord = {
        id: `pgoal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: goal.title,
        description: goal.description || '',
        status: 'pending', // pending, in_progress, completed
        progress: 0,
        linkedPlans: goal.linkedPlans || [],
        createdAt: new Date().toISOString()
    };

    project.goals.push(goalRecord);
    project.updatedAt = new Date().toISOString();
    saveProjects(data);

    return goalRecord;
}

/**
 * 프로젝트 목표 업데이트
 */
function updateProjectGoal(projectId, goalId, updates) {
    const data = loadProjects();
    const project = data.projects.find(p => p.id === projectId);

    if (!project) {
        return null;
    }

    const goal = project.goals.find(g => g.id === goalId);
    if (!goal) {
        return null;
    }

    Object.assign(goal, {
        ...updates,
        id: goal.id,
        createdAt: goal.createdAt
    });

    // 진행률 100%면 자동 완료
    if (goal.progress >= 100) {
        goal.status = 'completed';
    } else if (goal.progress > 0) {
        goal.status = 'in_progress';
    }

    project.updatedAt = new Date().toISOString();
    saveProjects(data);

    return goal;
}

/**
 * 프로젝트 메트릭 계산 (lifecycle-collector와 연동)
 */
function calculateProjectMetrics(projectId) {
    const data = loadProjects();
    const project = data.projects.find(p => p.id === projectId);

    if (!project) {
        return null;
    }

    // lifecycle-collector 로드 시도
    let lifecycleCollector;
    try {
        lifecycleCollector = require('./lifecycle-collector');
    } catch (e) {
        console.log('[*] Lifecycle collector not available for metrics');
    }

    let completedPlans = 0;
    let activePlans = 0;
    let totalProgress = 0;
    let activePhase = 'planning';

    for (const planId of project.plans) {
        if (lifecycleCollector) {
            try {
                const lifecycle = lifecycleCollector.loadLifecycle(planId);

                // Phase 완료 여부 체크
                if (lifecycle.phases.release && lifecycle.phases.release.status === 'completed') {
                    completedPlans++;
                } else {
                    activePlans++;

                    // 현재 Phase 판단
                    const currentPhase = lifecycleCollector.getCurrentPhase(lifecycle);
                    if (currentPhase) {
                        activePhase = currentPhase;
                    }
                }

                totalProgress += lifecycle.overallProgress || 0;
            } catch (e) {
                console.log(`[*] Could not get lifecycle for ${planId}`);
            }
        }
    }

    // 목표 기반 진행률 계산
    const goalProgress = project.goals.length > 0
        ? project.goals.reduce((sum, g) => sum + (g.progress || 0), 0) / project.goals.length
        : 0;

    // 플랜 기반 진행률과 목표 기반 진행률 가중 평균
    const planCount = project.plans.length;
    const planProgress = planCount > 0 ? totalProgress / planCount : 0;

    project.metrics = {
        overallProgress: Math.round((planProgress * 0.7) + (goalProgress * 0.3)),
        completedPlans,
        activePlans,
        totalTasks: project.goals.length,
        completedTasks: project.goals.filter(g => g.status === 'completed').length,
        activePhase
    };

    project.updatedAt = new Date().toISOString();
    saveProjects(data);

    return project.metrics;
}

/**
 * 모든 프로젝트 목록 조회 (메트릭 포함)
 */
function listProjects(options = {}) {
    const data = loadProjects();
    let projects = data.projects;

    // 상태 필터
    if (options.status) {
        projects = projects.filter(p => p.status === options.status);
    }

    // 우선순위 필터
    if (options.priority) {
        projects = projects.filter(p => p.priority === options.priority);
    }

    // 정렬
    if (options.sortBy) {
        projects.sort((a, b) => {
            if (options.sortBy === 'updatedAt') {
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            } else if (options.sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (options.sortBy === 'progress') {
                return (b.metrics?.overallProgress || 0) - (a.metrics?.overallProgress || 0);
            }
            return 0;
        });
    }

    return {
        projects,
        stats: {
            total: data.projects.length,
            active: data.projects.filter(p => p.status === 'active').length,
            completed: data.projects.filter(p => p.status === 'completed').length,
            onHold: data.projects.filter(p => p.status === 'on-hold').length
        },
        updatedAt: data.updatedAt
    };
}

/**
 * 프로젝트별 플랜 목록 조회
 */
function getProjectPlans(projectId) {
    const project = getProject(projectId);

    if (!project) {
        return null;
    }

    // plan-collector 로드 시도
    let planCollector;
    try {
        planCollector = require('./plan-collector');
    } catch (e) {
        console.log('[*] Plan collector not available');
    }

    const plans = [];

    if (planCollector) {
        for (const planId of project.plans) {
            try {
                const plan = planCollector.getPlanDetail(planId);
                if (plan) {
                    plans.push(plan);
                }
            } catch (e) {
                plans.push({ id: planId, error: 'Could not load plan' });
            }
        }
    } else {
        // planCollector 없으면 ID만 반환
        for (const planId of project.plans) {
            plans.push({ id: planId });
        }
    }

    return plans;
}

/**
 * 프로젝트 개요 (대시보드용)
 */
function getProjectsOverview() {
    const data = loadProjects();

    // 모든 프로젝트 메트릭 재계산
    for (const project of data.projects) {
        calculateProjectMetrics(project.id);
    }

    // 다시 로드 (메트릭 업데이트 반영)
    const updatedData = loadProjects();

    const overview = {
        totalProjects: updatedData.projects.length,
        byStatus: {
            active: updatedData.projects.filter(p => p.status === 'active').length,
            completed: updatedData.projects.filter(p => p.status === 'completed').length,
            onHold: updatedData.projects.filter(p => p.status === 'on-hold').length,
            archived: updatedData.projects.filter(p => p.status === 'archived').length
        },
        byPriority: {
            critical: updatedData.projects.filter(p => p.priority === 'critical').length,
            high: updatedData.projects.filter(p => p.priority === 'high').length,
            medium: updatedData.projects.filter(p => p.priority === 'medium').length,
            low: updatedData.projects.filter(p => p.priority === 'low').length
        },
        avgProgress: updatedData.projects.length > 0
            ? Math.round(updatedData.projects.reduce((sum, p) => sum + (p.metrics?.overallProgress || 0), 0) / updatedData.projects.length)
            : 0,
        recentProjects: updatedData.projects
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5)
            .map(p => ({
                id: p.id,
                name: p.name,
                status: p.status,
                progress: p.metrics?.overallProgress || 0,
                updatedAt: p.updatedAt
            })),
        updatedAt: new Date().toISOString()
    };

    return overview;
}

module.exports = {
    loadProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    linkPlanToProject,
    unlinkPlanFromProject,
    addProjectGoal,
    updateProjectGoal,
    calculateProjectMetrics,
    listProjects,
    getProjectPlans,
    getProjectsOverview
};
