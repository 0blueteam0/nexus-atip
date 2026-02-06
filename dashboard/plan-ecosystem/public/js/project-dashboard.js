/**
 * Project Dashboard UI
 * 프로젝트 계층 관리 및 시각화
 */

const ProjectDashboard = {
    currentProject: null,
    projects: [],
    socket: null,

    /**
     * 초기화
     */
    init(socket) {
        this.socket = socket;
        this.setupEventListeners();
        this.loadProjects();
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // Socket.io 이벤트
        if (this.socket) {
            this.socket.on('project-created', (project) => this.onProjectCreated(project));
            this.socket.on('project-updated', (project) => this.onProjectUpdated(project));
            this.socket.on('project-deleted', (data) => this.onProjectDeleted(data.projectId));
            this.socket.on('project-plan-linked', (data) => this.onPlanLinked(data));
            this.socket.on('project-goal-added', (data) => this.onGoalAdded(data));
            this.socket.on('project-goal-updated', (data) => this.onGoalUpdated(data));
        }
    },

    /**
     * 프로젝트 목록 로드
     */
    async loadProjects() {
        try {
            const response = await fetch('/api/projects?sortBy=updatedAt');
            const data = await response.json();
            this.projects = data.projects || [];
            this.renderProjectList();
            this.renderOverview(data.stats);
        } catch (error) {
            console.error('[!] Failed to load projects:', error);
        }
    },

    /**
     * 프로젝트 개요 로드
     */
    async loadOverview() {
        try {
            const response = await fetch('/api/projects/overview');
            const data = await response.json();
            this.renderOverviewCards(data);
        } catch (error) {
            console.error('[!] Failed to load overview:', error);
        }
    },

    /**
     * 프로젝트 목록 렌더링
     */
    renderProjectList() {
        const container = document.getElementById('project-list');
        if (!container) return;

        if (this.projects.length === 0) {
            container.innerHTML = `
                <div class="soft-card text-center py-8">
                    <p class="soft-text-muted mb-4">No projects yet</p>
                    <button onclick="ProjectDashboard.showCreateModal()" class="soft-btn soft-btn-primary">
                        + Create Project
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.projects.map(project => this.renderProjectCard(project)).join('');
    },

    /**
     * 프로젝트 카드 렌더링
     */
    renderProjectCard(project) {
        const statusColor = {
            'active': 'success',
            'completed': 'primary',
            'on-hold': 'warning',
            'archived': 'muted'
        }[project.status] || 'muted';

        const priorityIcon = {
            'critical': '[!!]',
            'high': '[!]',
            'medium': '[*]',
            'low': '[-]'
        }[project.priority] || '[*]';

        return `
            <div class="soft-project-card soft-animate-fade" data-project-id="${project.id}">
                <div class="soft-project-header">
                    <div class="soft-flex soft-justify-between soft-items-center">
                        <div>
                            <h3 class="soft-project-title">${this.escapeHtml(project.name)}</h3>
                            <div class="soft-project-meta">
                                <span class="soft-status">
                                    <span class="soft-status-dot ${project.status}"></span>
                                    ${project.status}
                                </span>
                                <span>${priorityIcon} ${project.priority}</span>
                                <span>${project.plans?.length || 0} plans</span>
                            </div>
                        </div>
                        <div class="soft-badge soft-badge-${statusColor}">
                            ${project.metrics?.overallProgress || 0}%
                        </div>
                    </div>
                </div>
                <div class="soft-project-body">
                    <div class="soft-progress soft-mb-md">
                        <div class="soft-progress-bar" style="width: ${project.metrics?.overallProgress || 0}%"></div>
                    </div>
                    <div class="soft-project-stats">
                        <div class="soft-project-stat">
                            <div class="soft-project-stat-value">${project.metrics?.completedPlans || 0}</div>
                            <div class="soft-project-stat-label">Completed</div>
                        </div>
                        <div class="soft-project-stat">
                            <div class="soft-project-stat-value">${project.metrics?.activePlans || 0}</div>
                            <div class="soft-project-stat-label">Active</div>
                        </div>
                        <div class="soft-project-stat">
                            <div class="soft-project-stat-value">${project.goals?.length || 0}</div>
                            <div class="soft-project-stat-label">Goals</div>
                        </div>
                        <div class="soft-project-stat">
                            <div class="soft-project-stat-value">${project.metrics?.completedTasks || 0}</div>
                            <div class="soft-project-stat-label">Done</div>
                        </div>
                    </div>
                    <div class="soft-flex soft-gap-sm soft-mt-md">
                        <button onclick="ProjectDashboard.showDetail('${project.id}')" class="soft-btn soft-btn-secondary flex-1">
                            View Details
                        </button>
                        <button onclick="ProjectDashboard.showEditModal('${project.id}')" class="soft-btn soft-btn-ghost">
                            Edit
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 개요 카드 렌더링
     */
    renderOverviewCards(data) {
        const container = document.getElementById('project-overview');
        if (!container) return;

        container.innerHTML = `
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="soft-card">
                    <div class="soft-project-stat">
                        <div class="soft-project-stat-value">${data.totalProjects}</div>
                        <div class="soft-project-stat-label">Total Projects</div>
                    </div>
                </div>
                <div class="soft-card">
                    <div class="soft-project-stat">
                        <div class="soft-project-stat-value soft-text-success">${data.byStatus?.active || 0}</div>
                        <div class="soft-project-stat-label">Active</div>
                    </div>
                </div>
                <div class="soft-card">
                    <div class="soft-project-stat">
                        <div class="soft-project-stat-value soft-text-primary">${data.byStatus?.completed || 0}</div>
                        <div class="soft-project-stat-label">Completed</div>
                    </div>
                </div>
                <div class="soft-card">
                    <div class="soft-project-stat">
                        <div class="soft-project-stat-value">${data.avgProgress}%</div>
                        <div class="soft-project-stat-label">Avg Progress</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 프로젝트 상세 표시
     */
    async showDetail(projectId) {
        try {
            const [projectRes, plansRes, metricsRes] = await Promise.all([
                fetch(`/api/projects/${projectId}`),
                fetch(`/api/projects/${projectId}/plans`),
                fetch(`/api/projects/${projectId}/metrics`)
            ]);

            const project = await projectRes.json();
            const plansData = await plansRes.json();
            const metrics = await metricsRes.json();

            this.currentProject = project;
            this.renderDetailPanel(project, plansData.plans || [], metrics);
        } catch (error) {
            console.error('[!] Failed to load project detail:', error);
        }
    },

    /**
     * 상세 패널 렌더링
     */
    renderDetailPanel(project, plans, metrics) {
        const panel = document.getElementById('project-detail-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="soft-card">
                <div class="soft-card-header">
                    <div>
                        <h2 class="soft-card-title">${this.escapeHtml(project.name)}</h2>
                        <p class="soft-card-subtitle">${this.escapeHtml(project.description || '')}</p>
                    </div>
                    <button onclick="ProjectDashboard.closeDetail()" class="soft-btn soft-btn-ghost">X</button>
                </div>

                <!-- Lifecycle Progress -->
                <div class="soft-phase-tracker soft-mb-lg">
                    ${this.renderPhaseTracker(metrics)}
                </div>

                <!-- Plans -->
                <div class="soft-mb-lg">
                    <h3 class="text-lg font-semibold mb-3">Linked Plans (${plans.length})</h3>
                    <div class="soft-tree">
                        ${plans.map(plan => this.renderPlanNode(plan)).join('')}
                    </div>
                </div>

                <!-- Goals -->
                <div class="soft-mb-lg">
                    <h3 class="text-lg font-semibold mb-3">Project Goals (${project.goals?.length || 0})</h3>
                    <div class="soft-goal-list">
                        ${(project.goals || []).map(goal => this.renderGoalItem(goal)).join('')}
                    </div>
                    <button onclick="ProjectDashboard.showAddGoalModal('${project.id}')" class="soft-btn soft-btn-secondary soft-mt-md">
                        + Add Goal
                    </button>
                </div>
            </div>
        `;

        panel.classList.remove('hidden');
    },

    /**
     * Phase Tracker 렌더링
     */
    renderPhaseTracker(metrics) {
        const phases = ['planning', 'prd', 'mvp', 'implementation', 'release'];
        const activePhase = metrics.activePhase || 'planning';

        return phases.map(phase => {
            const isActive = phase === activePhase;
            const isCompleted = phases.indexOf(phase) < phases.indexOf(activePhase);

            return `
                <div class="soft-phase-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
                    <div class="soft-phase-name">${phase.toUpperCase()}</div>
                    <div class="soft-phase-progress">
                        ${isCompleted ? '100%' : isActive ? 'In Progress' : 'Pending'}
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * 플랜 노드 렌더링
     */
    renderPlanNode(plan) {
        return `
            <div class="soft-tree-item">
                <div class="soft-tree-node" onclick="ProjectDashboard.goToPlan('${plan.id}')">
                    <span class="soft-status-dot ${plan.status || 'pending'}"></span>
                    <span class="flex-1">${this.escapeHtml(plan.title || plan.id)}</span>
                    <span class="soft-text-muted">${plan.progress || 0}%</span>
                </div>
            </div>
        `;
    },

    /**
     * 목표 항목 렌더링
     */
    renderGoalItem(goal) {
        const isCompleted = goal.status === 'completed';

        return `
            <div class="soft-goal-item">
                <div class="soft-goal-checkbox ${isCompleted ? 'checked' : ''}">
                    ${isCompleted ? '&#10003;' : ''}
                </div>
                <span class="soft-goal-title ${isCompleted ? 'line-through opacity-50' : ''}">
                    ${this.escapeHtml(goal.title)}
                </span>
                <span class="soft-goal-progress">${goal.progress || 0}%</span>
            </div>
        `;
    },

    /**
     * 프로젝트 생성 모달 표시
     */
    showCreateModal() {
        const modal = document.getElementById('project-modal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div class="soft-card w-full max-w-md">
                    <div class="soft-card-header">
                        <h2 class="soft-card-title">Create Project</h2>
                        <button onclick="ProjectDashboard.closeModal()" class="soft-btn soft-btn-ghost">X</button>
                    </div>
                    <form onsubmit="ProjectDashboard.createProject(event)">
                        <div class="mb-4">
                            <label class="block text-sm mb-1">Project Name</label>
                            <input type="text" id="project-name" required
                                class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm mb-1">Description</label>
                            <textarea id="project-description" rows="3"
                                class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md"></textarea>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm mb-1">Priority</label>
                            <select id="project-priority"
                                class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div class="flex gap-2 justify-end">
                            <button type="button" onclick="ProjectDashboard.closeModal()" class="soft-btn soft-btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" class="soft-btn soft-btn-primary">
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    },

    /**
     * 프로젝트 생성
     */
    async createProject(event) {
        event.preventDefault();

        const name = document.getElementById('project-name').value;
        const description = document.getElementById('project-description').value;
        const priority = document.getElementById('project-priority').value;

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, priority })
            });

            if (response.ok) {
                this.closeModal();
                this.loadProjects();
            }
        } catch (error) {
            console.error('[!] Failed to create project:', error);
        }
    },

    /**
     * 모달 닫기
     */
    closeModal() {
        const modal = document.getElementById('project-modal');
        if (modal) modal.classList.add('hidden');
    },

    /**
     * 상세 패널 닫기
     */
    closeDetail() {
        const panel = document.getElementById('project-detail-panel');
        if (panel) panel.classList.add('hidden');
        this.currentProject = null;
    },

    /**
     * 플랜으로 이동
     */
    goToPlan(planId) {
        // Plans 탭으로 전환하고 해당 플랜 선택
        if (window.switchTab) {
            window.switchTab('plans');
        }
        // TODO: 플랜 상세 표시
    },

    /**
     * Socket.io 이벤트 핸들러
     */
    onProjectCreated(project) {
        this.projects.unshift(project);
        this.renderProjectList();
    },

    onProjectUpdated(project) {
        const index = this.projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
            this.projects[index] = project;
            this.renderProjectList();
        }
    },

    onProjectDeleted(projectId) {
        this.projects = this.projects.filter(p => p.id !== projectId);
        this.renderProjectList();
        if (this.currentProject?.id === projectId) {
            this.closeDetail();
        }
    },

    onPlanLinked(data) {
        if (this.currentProject?.id === data.projectId) {
            this.showDetail(data.projectId);
        }
    },

    onGoalAdded(data) {
        if (this.currentProject?.id === data.projectId) {
            this.showDetail(data.projectId);
        }
    },

    onGoalUpdated(data) {
        if (this.currentProject?.id === data.projectId) {
            this.showDetail(data.projectId);
        }
    },

    /**
     * HTML 이스케이프
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// 전역 노출
window.ProjectDashboard = ProjectDashboard;
