/**
 * Task Collector - 계층적 작업 관리 통합
 *
 * 통합 대상:
 * - Shrimp Task Manager (ShrimpData/tasks/)
 * - Unified Task System (unified-task-system/)
 * - Task Master AI (data/tasks.json)
 */
const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/genai';
const SHRIMP_TASKS_PATH = path.join(BASE_PATH, 'ShrimpData/tasks/current-tasks.json');
const UNIFIED_TASKS_PATH = path.join(BASE_PATH, 'unified-task-system/tasks.json');
const TASK_MASTER_PATH = path.join(BASE_PATH, 'data/tasks.json');

/**
 * JSON 파일 안전하게 읽기
 */
function safeReadJSON(filePath, defaultValue = {}) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error(`Error reading ${filePath}: ${e.message}`);
    }
    return defaultValue;
}

/**
 * Shrimp 작업 로드
 */
function loadShrimpTasks() {
    const data = safeReadJSON(SHRIMP_TASKS_PATH, { tasks: [] });
    const tasks = data.tasks || [];

    return tasks.map(task => ({
        id: task.id || task.taskId,
        name: task.name || task.title,
        description: task.description,
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        source: 'shrimp',
        parentId: task.parentId || null,
        dependencies: task.dependencies || [],
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        tags: task.tags || []
    }));
}

/**
 * Unified Task System 작업 로드
 */
function loadUnifiedTasks() {
    const data = safeReadJSON(UNIFIED_TASKS_PATH, { tasks: [] });
    const tasks = data.tasks || [];

    return tasks.map(task => ({
        id: task.id,
        name: task.subject || task.name,
        description: task.description,
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        source: 'unified',
        parentId: task.parentId || null,
        dependencies: task.blockedBy || [],
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        tags: task.tags || []
    }));
}

/**
 * Task Master AI 작업 로드
 */
function loadTaskMasterTasks() {
    const data = safeReadJSON(TASK_MASTER_PATH, { tasks: [] });
    const tasks = data.tasks || (Array.isArray(data) ? data : []);

    return tasks.map(task => ({
        id: task.id || task.taskId,
        name: task.name || task.title || task.subject,
        description: task.description,
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        source: 'task-master',
        parentId: task.parentId || null,
        dependencies: task.dependencies || [],
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        tags: task.tags || []
    }));
}

/**
 * 모든 작업 통합 로드
 */
function collectAllTasks() {
    const shrimpTasks = loadShrimpTasks();
    const unifiedTasks = loadUnifiedTasks();
    const taskMasterTasks = loadTaskMasterTasks();

    // 중복 제거 (ID 기반)
    const taskMap = new Map();

    // 우선순위: Shrimp > Unified > Task Master
    for (const task of taskMasterTasks) {
        taskMap.set(task.id, task);
    }
    for (const task of unifiedTasks) {
        taskMap.set(task.id, task);
    }
    for (const task of shrimpTasks) {
        taskMap.set(task.id, task);
    }

    const allTasks = Array.from(taskMap.values());

    // 통계 계산
    const stats = {
        total: allTasks.length,
        byStatus: {
            pending: allTasks.filter(t => t.status === 'pending').length,
            'in-progress': allTasks.filter(t => t.status === 'in-progress' || t.status === 'in_progress').length,
            completed: allTasks.filter(t => t.status === 'completed' || t.status === 'done').length
        },
        bySource: {
            shrimp: shrimpTasks.length,
            unified: unifiedTasks.length,
            'task-master': taskMasterTasks.length
        },
        byPriority: {
            high: allTasks.filter(t => t.priority === 'high').length,
            medium: allTasks.filter(t => t.priority === 'medium').length,
            low: allTasks.filter(t => t.priority === 'low').length
        }
    };

    return {
        tasks: allTasks,
        stats,
        collectedAt: new Date().toISOString()
    };
}

/**
 * 작업 계층 구조 빌드
 */
function buildTaskHierarchy() {
    const { tasks } = collectAllTasks();

    // 부모-자식 관계 빌드
    const taskMap = new Map(tasks.map(t => [t.id, { ...t, children: [] }]));

    const roots = [];
    for (const task of taskMap.values()) {
        if (task.parentId && taskMap.has(task.parentId)) {
            taskMap.get(task.parentId).children.push(task);
        } else {
            roots.push(task);
        }
    }

    return roots;
}

/**
 * 작업 의존성 그래프 빌드
 */
function buildDependencyGraph() {
    const { tasks } = collectAllTasks();

    const nodes = tasks.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        source: t.source
    }));

    const edges = [];
    for (const task of tasks) {
        for (const depId of task.dependencies || []) {
            edges.push({
                from: depId,
                to: task.id
            });
        }
    }

    return { nodes, edges };
}

/**
 * 상태별 작업 필터
 */
function getTasksByStatus(status) {
    const { tasks } = collectAllTasks();
    return tasks.filter(t => t.status === status);
}

/**
 * 소스별 작업 필터
 */
function getTasksBySource(source) {
    const { tasks } = collectAllTasks();
    return tasks.filter(t => t.source === source);
}

/**
 * 작업 상세 조회
 */
function getTaskDetail(taskId) {
    const { tasks } = collectAllTasks();
    const task = tasks.find(t => t.id === taskId);

    if (!task) return null;

    // 의존성 작업 정보 추가
    const dependencyTasks = tasks.filter(t => (task.dependencies || []).includes(t.id));
    const blockedTasks = tasks.filter(t => (t.dependencies || []).includes(taskId));

    return {
        ...task,
        dependencyDetails: dependencyTasks,
        blockedBy: dependencyTasks.map(t => t.name),
        blocking: blockedTasks.map(t => t.name)
    };
}

/**
 * 작업 통계 요약
 */
function getTaskSummary() {
    const { stats } = collectAllTasks();

    const completionRate = stats.total > 0
        ? Math.round((stats.byStatus.completed / stats.total) * 100)
        : 0;

    return {
        ...stats,
        completionRate
    };
}

module.exports = {
    collectAllTasks,
    buildTaskHierarchy,
    buildDependencyGraph,
    getTasksByStatus,
    getTasksBySource,
    getTaskDetail,
    getTaskSummary
};
