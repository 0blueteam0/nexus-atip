/**
 * multi-plan-overview.js - 다중 플랜 개요 시각화 컴포넌트
 *
 * Phase 8H: 여러 플랜의 동시 관리 및 개요 표시
 *
 * @version 1.0.0
 */

const MultiPlanOverview = {
    /**
     * 개요 섹션 렌더링
     * @param {string} containerId - 컨테이너 ID
     * @param {Array} lifecycles - Lifecycle 배열
     */
    render(containerId, lifecycles) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 통계 계산
        const stats = this.calculateStats(lifecycles);

        container.innerHTML = `
            <div class="multi-plan-overview" style="background: var(--bg-secondary); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">
                        Planning Lifecycle Overview
                    </h3>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">
                        ${stats.totalPlans} Active Plans
                    </span>
                </div>

                <!-- Phase Summary Cards -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1rem;">
                    ${this.renderPhaseCard('PRD', stats.prd, '#0f766e')}
                    ${this.renderPhaseCard('MVP', stats.mvp, '#0284c7')}
                    ${this.renderPhaseCard('Implementation', stats.implementation, '#d97706')}
                    ${this.renderPhaseCard('Release', stats.release, '#059669')}
                </div>

                <!-- Overall Progress -->
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">Overall Progress</span>
                        <span style="font-size: 0.75rem; color: var(--text-primary); font-weight: 600;">${stats.overallProgress}%</span>
                    </div>
                    <div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                        <div style="width: ${stats.overallProgress}%; height: 100%; background: linear-gradient(90deg, #0f766e 0%, #059669 100%); transition: width 0.3s;"></div>
                    </div>
                </div>

                <!-- Quick Status Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem; max-height: 200px; overflow-y: auto;">
                    ${lifecycles.slice(0, 12).map(lc => this.renderMiniPlanCard(lc)).join('')}
                    ${lifecycles.length > 12 ? `
                        <div style="display: flex; align-items: center; justify-content: center; padding: 0.5rem; color: var(--text-muted); font-size: 0.75rem;">
                            +${lifecycles.length - 12} more...
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * 통계 계산
     * @param {Array} lifecycles - Lifecycle 배열
     * @returns {Object} 통계 데이터
     */
    calculateStats(lifecycles) {
        const stats = {
            totalPlans: lifecycles.length,
            prd: { count: 0, completed: 0 },
            mvp: { count: 0, completed: 0 },
            implementation: { count: 0, completed: 0 },
            release: { count: 0, completed: 0 },
            overallProgress: 0
        };

        let totalProgress = 0;

        for (const lc of lifecycles) {
            const phases = lc.phases || {};

            // 현재 Phase 카운트
            const currentPhase = this.getCurrentPhase(phases);
            if (stats[currentPhase]) {
                stats[currentPhase].count++;
            }

            // 완료된 Phase 카운트
            for (const phase of ['prd', 'mvp', 'implementation', 'release']) {
                if (phases[phase]?.status === 'completed') {
                    stats[phase].completed++;
                }
            }

            totalProgress += lc.overallProgress || 0;
        }

        stats.overallProgress = lifecycles.length > 0 ?
            Math.round(totalProgress / lifecycles.length) : 0;

        return stats;
    },

    /**
     * 현재 Phase 판단
     * @param {Object} phases - Phase 상태
     * @returns {string} 현재 Phase
     */
    getCurrentPhase(phases) {
        if (phases.release?.status === 'in_progress' || phases.release?.status === 'completed') return 'release';
        if (phases.implementation?.status === 'in_progress') return 'implementation';
        if (phases.mvp?.status === 'in_progress') return 'mvp';
        return 'prd';
    },

    /**
     * Phase 카드 렌더링
     * @param {string} name - Phase 이름
     * @param {Object} data - Phase 데이터
     * @param {string} color - 색상
     * @returns {string} HTML
     */
    renderPhaseCard(name, data, color) {
        return `
            <div style="background: var(--bg-tertiary); border-radius: 6px; padding: 0.75rem; text-align: center; border-left: 3px solid ${color};">
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${data.count}</div>
                <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 0.125rem;">${name}</div>
                <div style="font-size: 0.65rem; color: ${color}; margin-top: 0.125rem;">${data.completed} done</div>
            </div>
        `;
    },

    /**
     * 미니 플랜 카드 렌더링
     * @param {Object} lifecycle - Lifecycle 데이터
     * @returns {string} HTML
     */
    renderMiniPlanCard(lifecycle) {
        const progress = lifecycle.overallProgress || 0;
        const phase = this.getCurrentPhase(lifecycle.phases || {});
        const phaseColors = {
            prd: '#0f766e',
            mvp: '#0284c7',
            implementation: '#d97706',
            release: '#059669'
        };
        const color = phaseColors[phase] || '#64748b';

        const title = lifecycle.planTitle || lifecycle.planId || 'Unknown';
        const shortTitle = title.length > 20 ? title.substring(0, 17) + '...' : title;

        return `
            <div class="mini-plan-card" style="background: var(--bg-tertiary); border-radius: 4px; padding: 0.5rem; cursor: pointer; transition: transform 0.15s;"
                 onclick="showPlanDetail && showPlanDetail('${lifecycle.planId}')"
                 onmouseover="this.style.transform='translateY(-1px)'"
                 onmouseout="this.style.transform='none'">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                    <span style="font-size: 0.7rem; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                          title="${title}">
                        ${shortTitle}
                    </span>
                    <span style="font-size: 0.65rem; color: ${color}; text-transform: uppercase;">${phase.slice(0, 4)}</span>
                </div>
                <div style="height: 4px; background: var(--bg-primary); border-radius: 2px; overflow: hidden;">
                    <div style="width: ${progress}%; height: 100%; background: ${color};"></div>
                </div>
                <div style="font-size: 0.6rem; color: var(--text-muted); margin-top: 0.125rem; text-align: right;">
                    ${progress}%
                </div>
            </div>
        `;
    },

    /**
     * 개요 API에서 데이터 로드 및 렌더링
     * @param {string} containerId - 컨테이너 ID
     */
    async loadAndRender(containerId) {
        try {
            const res = await fetch('/api/lifecycle');
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            const lifecycles = data.lifecycles || data || [];
            this.render(containerId, lifecycles);
        } catch (error) {
            console.error('[!] Failed to load lifecycles for overview:', error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div style="color: var(--text-muted); padding: 1rem; text-align: center;">
                        Failed to load lifecycle overview
                    </div>
                `;
            }
        }
    }
};

// 전역 노출
if (typeof window !== 'undefined') {
    window.MultiPlanOverview = MultiPlanOverview;
}
