/**
 * Lifecycle Visualization Component
 * PRD -> MVP -> Implementation -> Release 라이프사이클 시각화
 */

const LifecycleViz = {
    currentPlanId: null,
    currentLifecycle: null,
    
    // Phase 색상 및 아이콘 (Anti-AI-Slop: NO purple/indigo)
    PHASE_CONFIG: {
        prd: { color: '#0284c7', icon: '[DOC]', label: 'PRD' },         // sky-600
        mvp: { color: '#d97706', icon: '[MVP]', label: 'MVP' },         // amber-600
        implementation: { color: '#059669', icon: '[DEV]', label: 'Implementation' },  // emerald-600
        release: { color: '#0f766e', icon: '[REL]', label: 'Release' }  // teal-700 (NO purple)
    },
    
    PHASE_ORDER: ['prd', 'mvp', 'implementation', 'release'],
    
    /**
     * 라이프사이클 뷰 초기화
     */
    init(containerId = 'lifecycle-view') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn('[LifecycleViz] Container not found:', containerId);
            return;
        }
        this.setupSocketListeners();
        console.log('[LifecycleViz] Initialized');
    },
    
    /**
     * Socket.io 리스너 설정
     */
    setupSocketListeners() {
        if (typeof socket !== 'undefined') {
            socket.on('lifecycle-phase-started', (data) => {
                if (this.currentPlanId === data.planId) {
                    this.render(data.lifecycle);
                }
            });
            
            socket.on('lifecycle-progress-updated', (data) => {
                if (this.currentPlanId === data.planId) {
                    this.render(data.lifecycle);
                }
            });
            
            socket.on('goal-progress-updated', (data) => {
                if (this.currentPlanId === data.planId) {
                    this.loadLifecycle(data.planId);
                }
            });
        }
    },
    
    /**
     * 플랜 ID로 라이프사이클 로드
     */
    async loadLifecycle(planId) {
        try {
            this.currentPlanId = planId;
            const response = await fetch(`/api/lifecycle/${planId}`);
            const lifecycle = await response.json();
            this.currentLifecycle = lifecycle;
            this.render(lifecycle);
        } catch (error) {
            console.error('[LifecycleViz] Load error:', error);
            this.renderError('Failed to load lifecycle');
        }
    },
    
    /**
     * 메인 렌더링
     */
    render(lifecycle) {
        if (!this.container) return;
        
        this.currentLifecycle = lifecycle;
        
        this.container.innerHTML = `
            <div class="lifecycle-wrapper p-4 bg-slate-800 rounded-lg">
                ${this.renderPhaseProgress(lifecycle)}
                ${this.renderGoalTracker(lifecycle)}
                ${this.renderPromptTimeline(lifecycle)}
            </div>
        `;
    },
    
    /**
     * Phase Progress 렌더링
     */
    renderPhaseProgress(lifecycle) {
        const phases = this.PHASE_ORDER.map(phase => {
            const config = this.PHASE_CONFIG[phase];
            const data = lifecycle.phases[phase];
            const isActive = data.status === 'in_progress';
            const isCompleted = data.status === 'completed';
            
            let statusClass = 'bg-slate-700';
            let statusText = 'Pending';
            
            if (isCompleted) {
                statusClass = 'bg-emerald-500';
                statusText = 'Done';
            } else if (isActive) {
                statusClass = 'bg-amber-500 animate-pulse';
                statusText = `${data.progress}%`;
            }
            
            return `
                <div class="phase-card flex-1 p-3 rounded-lg ${isActive ? 'ring-2 ring-teal-400' : ''}"
                     style="background: ${isActive ? config.color + '20' : 'var(--bg-tertiary)'}">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-semibold text-sm">${config.icon} ${config.label}</span>
                        <span class="text-xs px-2 py-0.5 rounded ${statusClass}">${statusText}</span>
                    </div>
                    <div class="w-full bg-slate-600 rounded-full h-2">
                        <div class="h-2 rounded-full transition-all duration-500"
                             style="width: ${data.progress}%; background: ${config.color}"></div>
                    </div>
                    <div class="text-xs text-slate-400 mt-1">
                        ${data.goals?.length || 0} goals | ${data.prompts?.length || 0} prompts
                    </div>
                </div>
            `;
        }).join('<div class="text-slate-500 flex items-center">-></div>');
        
        return `
            <div class="phase-progress mb-6">
                <h3 class="text-lg font-semibold mb-3 text-teal-400">Lifecycle Progress</h3>
                <div class="flex gap-2 items-stretch">${phases}</div>
                <div class="mt-3 text-center">
                    <span class="text-2xl font-bold text-teal-400">${lifecycle.overallProgress}%</span>
                    <span class="text-slate-400 ml-2">Overall Progress</span>
                </div>
            </div>
        `;
    },
    
    /**
     * Goal Tracker 렌더링
     */
    renderGoalTracker(lifecycle) {
        const goals = lifecycle.goalMapping || [];
        
        if (goals.length === 0) {
            return `
                <div class="goal-tracker mb-6">
                    <h3 class="text-lg font-semibold mb-3 text-teal-400">Goals vs Implementation</h3>
                    <div class="text-slate-500 text-sm p-4 bg-slate-700 rounded">
                        No goals defined yet. Goals will appear as they are extracted from the plan.
                    </div>
                </div>
            `;
        }
        
        const goalItems = goals.map(goal => {
            const statusColors = {
                pending: 'bg-slate-500',
                in_progress: 'bg-amber-500',
                completed: 'bg-emerald-500'
            };
            
            return `
                <div class="goal-item flex items-center gap-3 p-2 hover:bg-slate-700 rounded">
                    <span class="w-20 text-xs px-2 py-0.5 rounded ${statusColors[goal.status] || statusColors.pending}">
                        ${goal.status}
                    </span>
                    <div class="flex-1">
                        <div class="text-sm font-medium">${goal.title}</div>
                        <div class="w-full bg-slate-600 rounded-full h-1.5 mt-1">
                            <div class="h-1.5 rounded-full bg-teal-500 transition-all"
                                 style="width: ${goal.progress}%"></div>
                        </div>
                    </div>
                    <span class="text-xs text-slate-400">${goal.progress}%</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="goal-tracker mb-6">
                <h3 class="text-lg font-semibold mb-3 text-teal-400">Goals vs Implementation</h3>
                <div class="space-y-1 max-h-48 overflow-y-auto">${goalItems}</div>
            </div>
        `;
    },
    
    /**
     * Prompt Timeline 렌더링
     */
    renderPromptTimeline(lifecycle) {
        // 모든 phase의 프롬프트 수집
        let allPrompts = [];
        for (const phase of this.PHASE_ORDER) {
            const prompts = lifecycle.phases[phase].prompts || [];
            prompts.forEach(p => allPrompts.push({ phase, promptId: p }));
        }
        
        if (allPrompts.length === 0) {
            return `
                <div class="prompt-timeline">
                    <h3 class="text-lg font-semibold mb-3 text-teal-400">Related Prompts</h3>
                    <div class="text-slate-500 text-sm p-4 bg-slate-700 rounded">
                        No prompts linked to this lifecycle yet.
                    </div>
                </div>
            `;
        }
        
        const promptItems = allPrompts.slice(-10).map(item => {
            const config = this.PHASE_CONFIG[item.phase];
            return `
                <div class="prompt-item flex items-center gap-2 p-2 text-sm border-l-2"
                     style="border-color: ${config.color}">
                    <span class="text-xs px-1.5 py-0.5 rounded" style="background: ${config.color}20; color: ${config.color}">
                        ${config.label}
                    </span>
                    <span class="text-slate-400 truncate">${item.promptId}</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="prompt-timeline">
                <h3 class="text-lg font-semibold mb-3 text-teal-400">Related Prompts</h3>
                <div class="space-y-1 max-h-48 overflow-y-auto">${promptItems}</div>
            </div>
        `;
    },
    
    /**
     * 에러 렌더링
     */
    renderError(message) {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400">
                [!] ${message}
            </div>
        `;
    },
    
    /**
     * 라이프사이클 목록 렌더링 (Plans 탭용)
     */
    async renderList(containerId = 'lifecycle-list') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        try {
            const response = await fetch('/api/lifecycle');
            const data = await response.json();
            
            if (data.lifecycles.length === 0) {
                container.innerHTML = `
                    <div class="text-slate-500 text-sm p-4">
                        No lifecycles tracked yet. Lifecycles are created when plans are started.
                    </div>
                `;
                return;
            }
            
            const items = data.lifecycles.map(lc => `
                <div class="lifecycle-card p-3 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
                     onclick="LifecycleViz.loadLifecycle('${lc.planId}')">
                    <div class="flex justify-between items-center">
                        <span class="font-medium">${lc.planTitle || lc.planId}</span>
                        <span class="text-teal-400 font-bold">${lc.overallProgress}%</span>
                    </div>
                    <div class="flex gap-1 mt-2">
                        ${this.PHASE_ORDER.map(phase => {
                            const status = lc.phases[phase].status;
                            const bgColor = status === 'completed' ? 'bg-emerald-500' : 
                                           status === 'in_progress' ? 'bg-amber-500' : 'bg-slate-600';
                            return `<div class="flex-1 h-1 rounded ${bgColor}"></div>`;
                        }).join('')}
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = `
                <h4 class="text-sm font-semibold text-slate-400 mb-2">Tracked Lifecycles (${data.lifecycles.length})</h4>
                <div class="space-y-2">${items}</div>
            `;
        } catch (error) {
            console.error('[LifecycleViz] List error:', error);
            container.innerHTML = `<div class="text-red-400 text-sm">Failed to load lifecycles</div>`;
        }
    }
};

    /**
     * 인라인 렌더링 (Plans 탭 내 플랜 상세 패널용) - Phase 8C
     */
    renderInline(containerId, lifecycle) {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.currentLifecycle = lifecycle;
        this.currentPlanId = lifecycle.planId;

        // Compact inline view
        const phases = this.PHASE_ORDER.map(phase => {
            const config = this.PHASE_CONFIG[phase];
            const data = lifecycle.phases[phase];
            const isActive = data.status === 'in_progress';
            const isCompleted = data.status === 'completed';

            let statusIcon = '[ ]';
            let borderColor = 'border-slate-600';

            if (isCompleted) {
                statusIcon = '[+]';
                borderColor = 'border-emerald-500';
            } else if (isActive) {
                statusIcon = '[*]';
                borderColor = 'border-amber-500';
            }

            return `
                <div class="inline-phase p-2 rounded border ${borderColor} bg-slate-800/50 flex-1 text-center"
                     style="${isActive ? `border-color: ${config.color}; background: ${config.color}10` : ''}">
                    <div class="text-xs font-mono text-slate-400">${statusIcon}</div>
                    <div class="text-xs font-semibold" style="color: ${config.color}">${config.label}</div>
                    <div class="text-xs text-slate-500">${data.progress}%</div>
                </div>
            `;
        }).join('<span class="text-slate-600">-></span>');

        container.innerHTML = `
            <div class="inline-lifecycle flex items-center gap-1 text-sm">
                ${phases}
            </div>
            <div class="text-center mt-2">
                <span class="text-lg font-bold" style="color: #0f766e">${lifecycle.overallProgress}%</span>
                <span class="text-xs text-slate-400 ml-1">Overall</span>
            </div>
        `;
    },

    /**
     * 플랜 상세 패널 렌더링 (Plan 클릭 시) - Phase 8C
     */
    async showPlanDetail(planId, plan) {
        // 기존 상세 패널이 있으면 사용, 없으면 생성
        let panel = document.getElementById('plan-detail-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'plan-detail-panel';
            panel.className = 'fixed right-0 top-0 h-full w-96 bg-slate-900 shadow-xl p-4 overflow-y-auto transform translate-x-full transition-transform z-50';
            document.body.appendChild(panel);
        }

        // 로딩 상태
        panel.innerHTML = '<div class="text-slate-400 animate-pulse">Loading...</div>';
        panel.classList.remove('translate-x-full');

        try {
            // Lifecycle 로드
            const response = await fetch(`/api/lifecycle/${planId}`);
            const lifecycle = await response.json();

            // 렌더링
            panel.innerHTML = `
                <div class="plan-detail">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-bold text-teal-400">${plan?.title || lifecycle.planTitle || planId}</h2>
                        <button onclick="LifecycleViz.closeDetailPanel()" class="text-slate-400 hover:text-white">[X]</button>
                    </div>

                    <!-- Lifecycle Progress -->
                    <div id="inline-lifecycle-${planId}" class="mb-6"></div>

                    <!-- Goals -->
                    <div class="goals-section mb-6">
                        <h3 class="text-sm font-semibold text-teal-400 mb-2">Goals vs Implementation</h3>
                        <div id="goals-list-${planId}"></div>
                    </div>

                    <!-- Actions -->
                    <div class="actions border-t border-slate-700 pt-4">
                        <button onclick="LifecycleViz.openPlanFile('${planId}')"
                                class="w-full py-2 bg-teal-600 hover:bg-teal-500 rounded text-sm">
                            Open Plan File
                        </button>
                    </div>
                </div>
            `;

            // Inline lifecycle 렌더링
            this.renderInline(`inline-lifecycle-${planId}`, lifecycle);

            // Goals 렌더링
            const goalsContainer = document.getElementById(`goals-list-${planId}`);
            if (goalsContainer) {
                this.renderGoalsInline(goalsContainer, lifecycle.goalMapping || []);
            }

        } catch (error) {
            console.error('[LifecycleViz] Detail error:', error);
            panel.innerHTML = `
                <div class="text-red-400">
                    Failed to load plan details: ${error.message}
                    <button onclick="LifecycleViz.closeDetailPanel()" class="block mt-4 text-slate-400">Close</button>
                </div>
            `;
        }
    },

    /**
     * Goals 인라인 렌더링
     */
    renderGoalsInline(container, goals) {
        if (goals.length === 0) {
            container.innerHTML = '<div class="text-slate-500 text-sm">No goals defined</div>';
            return;
        }

        container.innerHTML = goals.slice(0, 10).map(goal => {
            const statusColor = goal.status === 'completed' ? '#059669' :
                               goal.status === 'in_progress' ? '#d97706' : '#64748b';
            return `
                <div class="goal-item flex items-center gap-2 py-1 text-sm">
                    <span class="w-16 text-xs px-1 py-0.5 rounded text-center" style="background: ${statusColor}20; color: ${statusColor}">
                        ${goal.status === 'completed' ? '[+]' : goal.status === 'in_progress' ? '[*]' : '[ ]'}
                    </span>
                    <div class="flex-1 truncate" title="${goal.title}">${goal.title}</div>
                    <span class="text-xs text-slate-500">${goal.progress}%</span>
                </div>
            `;
        }).join('');

        if (goals.length > 10) {
            container.innerHTML += `<div class="text-xs text-slate-500 mt-2">+${goals.length - 10} more goals...</div>`;
        }
    },

    /**
     * 상세 패널 닫기
     */
    closeDetailPanel() {
        const panel = document.getElementById('plan-detail-panel');
        if (panel) {
            panel.classList.add('translate-x-full');
        }
    },

    /**
     * 플랜 파일 열기 (Dashboard에서)
     */
    openPlanFile(planId) {
        // 플랜 탭으로 이동하고 해당 플랜 강조
        if (typeof showTab === 'function') {
            showTab('plans');
        }
        // 외부 에디터로 열기는 보안상 불가, 경로만 표시
        alert(`Plan file: K:/PortableApps/genai/plans/${planId}.md`);
    }
};

// 전역 접근 가능하도록 설정
window.LifecycleViz = LifecycleViz;
