/**
 * goal-viz.js - Goal vs Implementation 시각화 컴포넌트
 *
 * Phase 8F: 목표별 구현 진행률 시각화
 *
 * @version 1.0.0
 */

const GoalViz = {
    /**
     * 목표 진행률 렌더링 (상세 뷰)
     * @param {string} containerId - 컨테이너 ID
     * @param {Object} evaluation - 평가 결과
     */
    render(containerId, evaluation) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const statusColors = {
            'on_track': { bg: '#f0fdf4', border: '#059669', text: 'On Track' },
            'at_risk': { bg: '#fef3c7', border: '#d97706', text: 'At Risk' },
            'behind': { bg: '#fef2f2', border: '#dc2626', text: 'Behind' }
        };

        const status = statusColors[evaluation.status] || statusColors['on_track'];

        container.innerHTML = `
            <div class="goal-evaluation">
                <!-- Summary Header -->
                <div class="goal-summary" style="background: ${status.bg}; border: 1px solid ${status.border}; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-weight: 600; color: ${status.border};">${status.text}</span>
                            <span style="margin-left: 0.5rem; color: #64748b;">${evaluation.overallProgress}% Complete</span>
                        </div>
                        <div style="color: #64748b; font-size: 0.875rem;">
                            ${evaluation.completedGoals}/${evaluation.totalGoals} Goals Completed
                        </div>
                    </div>
                    ${evaluation.recommendations?.length > 0 ? `
                        <div style="margin-top: 0.5rem; font-size: 0.875rem; color: #64748b;">
                            ${evaluation.recommendations.map(r => `<div>[*] ${r}</div>`).join('')}
                        </div>
                    ` : ''}
                </div>

                <!-- Goals List -->
                <div class="goal-list">
                    ${evaluation.details?.map(goal => this.renderGoalItem(goal)).join('') || '<div class="no-goals">No goals defined</div>'}
                </div>
            </div>
        `;
    },

    /**
     * 개별 목표 아이템 렌더링
     * @param {Object} goal - 목표 데이터
     * @returns {string} HTML
     */
    renderGoalItem(goal) {
        const statusIcons = {
            'completed': '[+]',
            'in_progress': '[*]',
            'pending': '[ ]'
        };

        const statusColors = {
            'completed': '#059669',
            'in_progress': '#0f766e',
            'pending': '#64748b'
        };

        const progressColor = goal.progress >= 80 ? '#059669' :
                             goal.progress >= 50 ? '#0f766e' :
                             goal.progress >= 20 ? '#d97706' : '#dc2626';

        const gapIndicator = goal.gap > 20 ? `<span style="color: #dc2626; font-size: 0.75rem; margin-left: 0.5rem;">(-${goal.gap}%)</span>` :
                            goal.gap > 0 ? `<span style="color: #d97706; font-size: 0.75rem; margin-left: 0.5rem;">(-${goal.gap}%)</span>` : '';

        return `
            <div class="goal-item" style="display: flex; align-items: center; padding: 0.75rem; border-bottom: 1px solid #e5e7eb; gap: 1rem;">
                <span style="color: ${statusColors[goal.status]}; font-family: monospace;">${statusIcons[goal.status]}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${goal.title}${gapIndicator}</div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
                        <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${goal.progress}%; height: 100%; background: ${progressColor}; transition: width 0.3s;"></div>
                        </div>
                        <span style="font-size: 0.75rem; color: #64748b; min-width: 3rem; text-align: right;">${goal.progress}%</span>
                    </div>
                </div>
                <span style="font-size: 0.75rem; color: #94a3b8; padding: 0.125rem 0.5rem; background: #f1f5f9; border-radius: 4px;">
                    ${goal.priority}
                </span>
            </div>
        `;
    },

    /**
     * 인라인 목표 리스트 렌더링 (Plans 탭 내 컴팩트 뷰)
     * @param {string} containerId - 컨테이너 ID
     * @param {Array} goals - 목표 배열
     */
    renderInline(containerId, goals) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!goals || goals.length === 0) {
            container.innerHTML = '<div style="color: #94a3b8; font-size: 0.875rem; padding: 0.5rem 0;">No goals defined</div>';
            return;
        }

        const completed = goals.filter(g => g.status === 'completed').length;
        const total = goals.length;
        const overallProgress = Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / total);

        container.innerHTML = `
            <div class="goals-inline">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-weight: 500; font-size: 0.875rem;">Goals (${completed}/${total})</span>
                    <span style="font-size: 0.75rem; color: #64748b;">${overallProgress}%</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                    ${goals.slice(0, 5).map(g => this.renderInlineGoal(g)).join('')}
                    ${goals.length > 5 ? `<div style="color: #94a3b8; font-size: 0.75rem; padding: 0.25rem 0;">+${goals.length - 5} more...</div>` : ''}
                </div>
            </div>
        `;
    },

    /**
     * 인라인 목표 아이템
     * @param {Object} goal - 목표 데이터
     * @returns {string} HTML
     */
    renderInlineGoal(goal) {
        const icons = { 'completed': '[+]', 'in_progress': '[*]', 'pending': '[ ]' };
        const colors = { 'completed': '#059669', 'in_progress': '#0f766e', 'pending': '#94a3b8' };

        return `
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
                <span style="color: ${colors[goal.status]}; font-family: monospace;">${icons[goal.status]}</span>
                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${goal.title}</span>
                <span style="color: #64748b;">${goal.progress || 0}%</span>
            </div>
        `;
    },

    /**
     * 전체 플랜 요약 렌더링
     * @param {string} containerId - 컨테이너 ID
     * @param {Object} summary - 전체 요약 데이터
     */
    renderSummary(containerId, summary) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const overallProgress = summary.totalGoals > 0 ?
            Math.round((summary.completedGoals / summary.totalGoals) * 100) : 0;

        container.innerHTML = `
            <div class="goals-summary" style="background: #fff; border-radius: 8px; padding: 1rem; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600;">All Goals Overview</h3>

                <!-- Stats -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #1e293b;">${summary.totalGoals}</div>
                        <div style="font-size: 0.75rem; color: #64748b;">Total</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #059669;">${summary.completedGoals}</div>
                        <div style="font-size: 0.75rem; color: #64748b;">Completed</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #0f766e;">${summary.inProgressGoals}</div>
                        <div style="font-size: 0.75rem; color: #64748b;">In Progress</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #94a3b8;">${summary.pendingGoals}</div>
                        <div style="font-size: 0.75rem; color: #64748b;">Pending</div>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${overallProgress}%; height: 100%; background: linear-gradient(90deg, #059669 0%, #0f766e 100%);"></div>
                </div>
                <div style="text-align: center; margin-top: 0.5rem; font-size: 0.875rem; color: #64748b;">
                    ${overallProgress}% Overall Completion
                </div>

                <!-- Plan Details -->
                ${summary.planDetails?.length > 0 ? `
                    <div style="margin-top: 1rem; max-height: 200px; overflow-y: auto;">
                        ${summary.planDetails.map(p => this.renderPlanGoalSummary(p)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * 플랜별 목표 요약
     * @param {Object} plan - 플랜 요약 데이터
     * @returns {string} HTML
     */
    renderPlanGoalSummary(plan) {
        return `
            <div style="display: flex; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9;">
                <div style="flex: 1;">
                    <div style="font-size: 0.875rem; font-weight: 500;">${plan.planTitle || plan.planId}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">${plan.completedGoals}/${plan.totalGoals} goals</div>
                </div>
                <div style="width: 80px; margin: 0 0.5rem;">
                    <div style="height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                        <div style="width: ${plan.overallProgress}%; height: 100%; background: #0f766e;"></div>
                    </div>
                </div>
                <span style="font-size: 0.75rem; color: #64748b; min-width: 2.5rem; text-align: right;">${plan.overallProgress}%</span>
            </div>
        `;
    }
};

// 전역 노출
if (typeof window !== 'undefined') {
    window.GoalViz = GoalViz;
}
