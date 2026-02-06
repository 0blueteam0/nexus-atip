#!/usr/bin/env node
/**
 * goal-evaluator.js - Goal vs Implementation 평가 시스템
 *
 * Phase 8F: 목표 대비 구현 진행률 실시간 평가
 *
 * @module collectors/goal-evaluator
 * @version 1.0.0
 */

const lifecycleCollector = require('./lifecycle-collector');

/**
 * 목표 대비 구현 진행률 평가
 * @param {string} planId - 플랜 ID
 * @returns {Object} 평가 결과
 */
function evaluateGoalProgress(planId) {
    const lifecycle = lifecycleCollector.loadLifecycle(planId);
    const goals = lifecycle.goalMapping || [];

    const evaluation = {
        planId,
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        inProgressGoals: goals.filter(g => g.status === 'in_progress').length,
        pendingGoals: goals.filter(g => g.status === 'pending').length,
        overallProgress: 0,
        status: 'on_track', // on_track | at_risk | behind
        details: [],
        recommendations: []
    };

    // 전체 진행률 계산
    if (goals.length > 0) {
        const totalProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0);
        evaluation.overallProgress = Math.round(totalProgress / goals.length);
    }

    // 상태 판단
    const implPhase = lifecycle.phases?.implementation;
    if (implPhase && implPhase.status === 'in_progress') {
        const expectedProgress = implPhase.progress || 0;
        const actualProgress = evaluation.overallProgress;

        if (actualProgress >= expectedProgress - 10) {
            evaluation.status = 'on_track';
        } else if (actualProgress >= expectedProgress - 25) {
            evaluation.status = 'at_risk';
            evaluation.recommendations.push('일부 목표가 지연되고 있습니다. 우선순위 검토를 권장합니다.');
        } else {
            evaluation.status = 'behind';
            evaluation.recommendations.push('목표 진행이 크게 지연되고 있습니다. 범위 조정이 필요할 수 있습니다.');
        }
    }

    // 목표별 상세
    evaluation.details = goals.map(g => ({
        id: g.id,
        title: g.title,
        progress: g.progress || 0,
        status: g.status || 'pending',
        gap: (implPhase?.progress || 0) - (g.progress || 0),
        priority: g.priority || 'medium'
    }));

    // 지연된 목표 식별
    const delayedGoals = evaluation.details.filter(d => d.gap > 20);
    if (delayedGoals.length > 0) {
        evaluation.recommendations.push(`${delayedGoals.length}개 목표가 20% 이상 지연됨: ${delayedGoals.map(g => g.title).join(', ')}`);
    }

    return evaluation;
}

/**
 * 목표 진행률 업데이트 (코드 변경 기반)
 * @param {string} planId - 플랜 ID
 * @param {string} goalId - 목표 ID
 * @param {Array} codeChanges - 코드 변경 정보
 * @returns {Object} 업데이트된 평가 결과
 */
function updateGoalFromCodeChange(planId, goalId, codeChanges = []) {
    const lifecycle = lifecycleCollector.loadLifecycle(planId);
    const goal = lifecycle.goalMapping?.find(g => g.id === goalId);

    if (goal) {
        // 코드 변경량 기반 진행률 증가
        const linesChanged = codeChanges.reduce((sum, c) => sum + (c.linesChanged || 0), 0);
        const progressIncrease = Math.min(10, Math.ceil(linesChanged / 50));

        goal.progress = Math.min(100, (goal.progress || 0) + progressIncrease);
        goal.lastUpdated = new Date().toISOString();

        if (goal.progress >= 100) {
            goal.status = 'completed';
            goal.completedAt = new Date().toISOString();
        } else if (goal.progress > 0) {
            goal.status = 'in_progress';
        }

        lifecycleCollector.saveLifecycle(lifecycle);
    }

    return evaluateGoalProgress(planId);
}

/**
 * 목표 수동 업데이트
 * @param {string} planId - 플랜 ID
 * @param {string} goalId - 목표 ID
 * @param {number} progress - 진행률 (0-100)
 * @param {string} status - 상태 (pending|in_progress|completed)
 * @returns {Object} 업데이트된 lifecycle
 */
function updateGoalManually(planId, goalId, progress, status = null) {
    const lifecycle = lifecycleCollector.loadLifecycle(planId);
    const goal = lifecycle.goalMapping?.find(g => g.id === goalId);

    if (goal) {
        goal.progress = Math.min(100, Math.max(0, progress));
        goal.lastUpdated = new Date().toISOString();

        if (status) {
            goal.status = status;
        } else if (goal.progress >= 100) {
            goal.status = 'completed';
            goal.completedAt = new Date().toISOString();
        } else if (goal.progress > 0) {
            goal.status = 'in_progress';
        }

        lifecycleCollector.saveLifecycle(lifecycle);
    }

    return lifecycle;
}

/**
 * 새 목표 추가
 * @param {string} planId - 플랜 ID
 * @param {Object} goalData - 목표 데이터
 * @returns {Object} 추가된 목표
 */
function addGoal(planId, goalData) {
    const lifecycle = lifecycleCollector.loadLifecycle(planId);

    if (!lifecycle.goalMapping) {
        lifecycle.goalMapping = [];
    }

    const newGoal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: goalData.title,
        description: goalData.description || '',
        status: 'pending',
        progress: 0,
        priority: goalData.priority || 'medium',
        phase: goalData.phase || 'implementation',
        createdAt: new Date().toISOString()
    };

    lifecycle.goalMapping.push(newGoal);
    lifecycleCollector.saveLifecycle(lifecycle);

    return newGoal;
}

/**
 * 목표 삭제
 * @param {string} planId - 플랜 ID
 * @param {string} goalId - 목표 ID
 * @returns {boolean} 삭제 성공 여부
 */
function removeGoal(planId, goalId) {
    const lifecycle = lifecycleCollector.loadLifecycle(planId);

    if (!lifecycle.goalMapping) {
        return false;
    }

    const index = lifecycle.goalMapping.findIndex(g => g.id === goalId);
    if (index === -1) {
        return false;
    }

    lifecycle.goalMapping.splice(index, 1);
    lifecycleCollector.saveLifecycle(lifecycle);

    return true;
}

/**
 * 전체 플랜 목표 요약
 * @returns {Object} 전체 요약
 */
function getAllGoalsSummary() {
    const result = lifecycleCollector.collectAllLifecycles();
    const lifecycles = result.lifecycles || [];

    const summary = {
        totalPlans: lifecycles.length,
        totalGoals: 0,
        completedGoals: 0,
        inProgressGoals: 0,
        pendingGoals: 0,
        planDetails: []
    };

    for (const lc of lifecycles) {
        const goals = lc.goalMapping || [];
        const planSummary = {
            planId: lc.planId,
            planTitle: lc.planTitle,
            totalGoals: goals.length,
            completedGoals: goals.filter(g => g.status === 'completed').length,
            inProgressGoals: goals.filter(g => g.status === 'in_progress').length,
            pendingGoals: goals.filter(g => g.status === 'pending').length,
            overallProgress: 0
        };

        if (goals.length > 0) {
            planSummary.overallProgress = Math.round(
                goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length
            );
        }

        summary.totalGoals += planSummary.totalGoals;
        summary.completedGoals += planSummary.completedGoals;
        summary.inProgressGoals += planSummary.inProgressGoals;
        summary.pendingGoals += planSummary.pendingGoals;
        summary.planDetails.push(planSummary);
    }

    return summary;
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
    evaluateGoalProgress,
    updateGoalFromCodeChange,
    updateGoalManually,
    addGoal,
    removeGoal,
    getAllGoalsSummary
};

// CLI 실행
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    const planId = args[1];

    console.log('\n========================================');
    console.log('  Goal Evaluator');
    console.log('========================================\n');

    if (command === 'evaluate' && planId) {
        const result = evaluateGoalProgress(planId);
        console.log(JSON.stringify(result, null, 2));
    } else if (command === 'summary') {
        const summary = getAllGoalsSummary();
        console.log(JSON.stringify(summary, null, 2));
    } else {
        console.log('Usage:');
        console.log('  node goal-evaluator.js evaluate <planId>');
        console.log('  node goal-evaluator.js summary');
    }
}
