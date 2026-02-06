/**
 * Plan Ecosystem Dashboard - Frontend App
 */

// State
let allPlans = [];
let currentFilter = 'all';
let progressChart = null;
let activityChart = null;
// v2.0 State
let toolsData = { tools: [], globalStats: {}, chainingPatterns: [] };
let agentsData = { agents: [], dailyStats: [] };
let promptsData = { prompts: [], dailyStats: [] };
let skillsData = { skills: [], registeredCount: 0, totalActivations: 0 };
let tasksData = { tasks: [], stats: {} };
let toolsCategoryChart = null;
let agentsTypeChart = null;
let promptsHourlyChart = null;
let skillsUsageChart = null;
let tasksSourceChart = null;
let costTrendChart = null;
let systemGraphData = null;
let currentTab = 'plans';
let currentTaskFilter = 'all';
let currentTaskSourceFilter = 'all';

// Socket.io connection
const socket = io();

socket.on('connect', () => {
    document.getElementById('connection-status').textContent = 'Connected';
    document.getElementById('connection-status').className = 'px-3 py-1 rounded text-sm bg-teal-600';

    // v4.0: Initialize Project Dashboard
    if (window.ProjectDashboard) {
        ProjectDashboard.init(socket);
    }

    // v4.0: Initialize Workflow Visualization
    if (window.WorkflowViz) {
        WorkflowViz.init(socket);
    }

    // v4.0 Phase 9 Week 4: Initialize MCP Dashboard
    if (window.MCPDashboard) {
        MCPDashboard.init(socket);
    }
});

socket.on('disconnect', () => {
    document.getElementById('connection-status').textContent = 'Disconnected';
    document.getElementById('connection-status').className = 'px-3 py-1 rounded text-sm bg-red-600';
});

socket.on('init', (data) => {
    console.log('[+] Initial data received');
    updatePlans(data.plans);
    updateStats(data.plans.stats, data.tasks);
    // v2.0 data
    if (data.tools) updateToolsData(data.tools);
    if (data.agents) updateAgentsData(data.agents);
    if (data.prompts) updatePromptsData(data.prompts);
    if (data.skills) updateSkillsData(data.skills);
    if (data.tasks) updateTasksData(data.tasks);
});

socket.on('skills-updated', (data) => {
    console.log('[*] Skills updated');
    updateSkillsData(data);
    addActivity('Skills updated', 'skill');
});

socket.on('tasks-updated', (data) => {
    console.log('[*] Tasks updated');
    updateTasksData(data);
    addActivity('Tasks updated', 'task');
});

socket.on('plans-updated', (data) => {
    console.log('[*] Plans updated');
    updatePlans(data);
    addActivity('Plans updated', 'refresh');
});

socket.on('tasks-updated', (data) => {
    console.log('[*] Tasks updated');
    addActivity('Tasks updated', 'task');
});

socket.on('file-change', (data) => {
    addActivity(`File ${data.event}: ${data.path.split('/').pop()}`, 'file');
    updateLastUpdate();
});

// v2.0 Socket events
socket.on('tools-updated', (data) => {
    console.log('[*] Tools updated');
    updateToolsData(data);
    addActivity('Tool stats updated', 'tool');
});

socket.on('agents-updated', (data) => {
    console.log('[*] Agents updated');
    updateAgentsData(data);
    addActivity('Agent activity updated', 'agent');
});

socket.on('prompts-updated', (data) => {
    console.log('[*] Prompts updated');
    updatePromptsData(data);
    addActivity('Prompts updated', 'prompt');
});

socket.on('tool-called', (data) => {
    addActivity(`Tool: ${data.tool} (${data.success ? 'OK' : 'FAIL'})`, 'tool');
});

socket.on('agent-started', (data) => {
    addActivity(`Agent started: ${data.type}`, 'agent');
    loadRunningAgents();
});

socket.on('agent-completed', (data) => {
    addActivity(`Agent completed: ${data.type}`, 'agent');
    loadRunningAgents();
});

socket.on('prompt-recorded', (data) => {
    addActivity('New prompt recorded', 'prompt');
});

// Phase 8G: Lifecycle & Goal 실시간 업데이트
socket.on('lifecycles-updated', (data) => {
    console.log('[*] Lifecycles updated');
    addActivity('Lifecycles updated', 'lifecycle');
    // Plans 탭 열려있으면 리렌더링
    if (currentTab === 'plans') {
        renderPlans();
    }
});

socket.on('goals-updated', (data) => {
    console.log('[*] Goals updated');
    addActivity('Goals updated', 'goal');
    // Goal Summary 컴포넌트 업데이트
    if (typeof GoalViz !== 'undefined' && document.getElementById('goals-summary')) {
        GoalViz.renderSummary('goals-summary', data);
    }
});

socket.on('goal-added', (data) => {
    addActivity(`Goal added: ${data.goal?.title || 'New goal'}`, 'goal');
});

socket.on('goal-updated', (data) => {
    addActivity(`Goal updated: ${data.goalId}`, 'goal');
});

socket.on('lifecycle-phase-changed', (data) => {
    addActivity(`Phase changed: ${data.planId} -> ${data.phase}`, 'lifecycle');
});

socket.on('lifecycle-prompt-added', (data) => {
    addActivity(`Prompt linked: ${data.planId}/${data.phase}`, 'lifecycle');
});

// Update functions
function updatePlans(data) {
    allPlans = data.plans || [];
    renderPlans();
    updateChart();
}

function updateStats(planStats, taskData) {
    document.getElementById('stat-active').textContent = planStats?.active || 0;
    document.getElementById('stat-completed').textContent = planStats?.completed || 0;
    document.getElementById('stat-archived').textContent = planStats?.archived || 0;
    document.getElementById('stat-tasks').textContent = taskData?.count || 0;
}

function updateLastUpdate() {
    const now = new Date().toLocaleTimeString('ko-KR');
    document.getElementById('last-update').textContent = `Last: ${now}`;
}

// 정렬 상태
let currentSort = 'updatedAt'; // 기본: 최근 수정순
let sortAsc = false;

// Render plans list
function renderPlans() {
    const container = document.getElementById('plans-list');
    let filtered = allPlans;

    if (currentFilter !== 'all') {
        filtered = allPlans.filter(p => p.status === currentFilter);
    }

    // 정렬 적용
    filtered = [...filtered].sort((a, b) => {
        let aVal = a[currentSort];
        let bVal = b[currentSort];
        if (currentSort === 'updatedAt' || currentSort === 'createdAt') {
            aVal = new Date(aVal || 0);
            bVal = new Date(bVal || 0);
        }
        if (sortAsc) return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<div class="text-slate-500">No plans found</div>';
        return;
    }

    container.innerHTML = filtered.map(plan => `
        <div class="card bg-slate-700/50 rounded-lg p-4 cursor-pointer" onclick="showPlanDetail('${plan.id}')">
            <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                    <div class="flex items-center">
                        <h3 class="font-semibold text-white">${escapeHtml(plan.title)}</h3>
                        ${getQualityBadge(plan)}
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs text-slate-400">${plan.id}</span>
                        <span class="text-xs text-slate-500">|</span>
                        <span class="text-xs text-slate-500" title="${plan.updatedAt}">${timeAgo(plan.updatedAt)}</span>
                    </div>
                </div>
                <span class="status-${plan.status} px-2 py-1 rounded text-xs text-white">${plan.status}</span>
            </div>
            ${plan.qualityWarnings && plan.qualityWarnings.length > 0 ? `
                <div class="mt-2 text-xs text-amber-400">
                    [!] ${plan.qualityWarnings.join(', ')}
                </div>
            ` : ''}
            <div class="mt-3">
                <div class="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>${plan.completedTasks}/${plan.totalTasks} tasks (${plan.progress}%)</span>
                </div>
                <div class="w-full bg-slate-600 rounded-full h-2">
                    <div class="progress-bar ${plan.qualityStatus === 'empty' ? 'bg-red-500' : 'bg-teal-500'} h-2 rounded-full" style="width: ${plan.progress}%"></div>
                </div>
            </div>
            ${plan.phases.length > 0 ? `
                <div class="mt-2 text-xs text-slate-400">
                    Phases: ${plan.phases.map(p => p.name).join(' -> ')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// 정렬 변경
function sortPlans(field) {
    if (currentSort === field) {
        sortAsc = !sortAsc;
    } else {
        currentSort = field;
        sortAsc = false;
    }
    renderPlans();
}

// Filter plans
function filterPlans(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-teal-600');
        btn.classList.add('bg-slate-700');
    });
    event.target.classList.remove('bg-slate-700');
    event.target.classList.add('bg-teal-600');
    renderPlans();
}

// Show plan detail modal
async function showPlanDetail(planId) {
    try {
        const res = await fetch(`/api/plans/${planId}`);
        const plan = await res.json();
        
        document.getElementById('modal-title').textContent = plan.title;
        document.getElementById('modal-content').innerHTML = `
            <div class="space-y-4">
                <!-- 품질 경고 -->
                ${plan.qualityWarnings && plan.qualityWarnings.length > 0 ? `
                    <div class="bg-amber-900/50 border border-amber-600 rounded p-3">
                        <div class="text-amber-400 text-sm font-semibold">[!] Quality Warnings</div>
                        <ul class="text-amber-300 text-sm mt-1">
                            ${plan.qualityWarnings.map(w => `<li>- ${escapeHtml(w)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- 통계 카드 -->
                <div class="grid grid-cols-4 gap-4">
                    <div class="bg-slate-700 p-3 rounded">
                        <div class="text-slate-400 text-sm">Status</div>
                        <div class="text-lg font-bold">${plan.status}</div>
                    </div>
                    <div class="bg-slate-700 p-3 rounded">
                        <div class="text-slate-400 text-sm">Progress</div>
                        <div class="text-lg font-bold">${plan.progress}%</div>
                    </div>
                    <div class="bg-slate-700 p-3 rounded">
                        <div class="text-slate-400 text-sm">Tasks</div>
                        <div class="text-lg font-bold">${plan.completedTasks}/${plan.totalTasks}</div>
                    </div>
                    <div class="bg-slate-700 p-3 rounded">
                        <div class="text-slate-400 text-sm">Quality</div>
                        <div class="text-lg font-bold ${plan.qualityStatus === 'empty' ? 'text-red-400' : plan.qualityStatus === 'draft' ? 'text-amber-400' : 'text-teal-400'}">${plan.qualityStatus || 'active'}</div>
                    </div>
                </div>

                <!-- 날짜 정보 -->
                <div class="bg-slate-700/50 p-3 rounded">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-slate-400">Created:</span>
                            <span class="text-white ml-2">${plan.createdAt ? new Date(plan.createdAt).toLocaleString('ko-KR') : 'N/A'}</span>
                            <span class="text-slate-500 ml-2">(${plan.createdAt ? timeAgo(plan.createdAt) : ''})</span>
                        </div>
                        <div>
                            <span class="text-slate-400">Updated:</span>
                            <span class="text-white ml-2">${plan.updatedAt ? new Date(plan.updatedAt).toLocaleString('ko-KR') : 'N/A'}</span>
                            <span class="text-slate-500 ml-2">(${plan.updatedAt ? timeAgo(plan.updatedAt) : ''})</span>
                        </div>
                    </div>
                </div>

                <!-- Lifecycle Progress (Phase 8C) -->
                <div id="lifecycle-section-${planId}" class="bg-slate-700/30 p-3 rounded border border-slate-600">
                    <h4 class="font-semibold mb-2 text-teal-400">Lifecycle Progress</h4>
                    <div id="lifecycle-inline-${planId}" class="text-slate-400 text-sm">Loading...</div>
                </div>

                <!-- Phases -->
                <div>
                    <h4 class="font-semibold mb-2">Phases</h4>
                    <div class="space-y-1">
                        ${plan.phases.map(p => `
                            <div class="bg-slate-700 p-2 rounded text-sm">
                                Phase ${p.number}: ${escapeHtml(p.name)}
                            </div>
                        `).join('') || '<div class="text-slate-500">No phases defined</div>'}
                    </div>
                </div>

                <!-- File -->
                <div>
                    <h4 class="font-semibold mb-2">File</h4>
                    <code class="text-xs text-slate-400">${plan.filePath}</code>
                </div>

                <!-- Content Stats -->
                <div class="text-xs text-slate-500">
                    Content: ${plan.contentLength || 0} chars |
                    Has Goal: ${plan.hasGoal ? 'Yes' : 'No'} |
                    Has Phases: ${plan.hasPhases ? 'Yes' : 'No'}
                </div>
            </div>
        `;
        document.getElementById('plan-modal').classList.remove('hidden');

        // Load lifecycle data (Phase 8C)
        loadLifecycleForPlan(planId);
    } catch (error) {
        console.error('Error loading plan:', error);
    }
}

// Load lifecycle data for plan detail modal (Phase 8C)
async function loadLifecycleForPlan(planId) {
    const container = document.getElementById(`lifecycle-inline-${planId}`);
    if (!container) return;

    try {
        const res = await fetch(`/api/lifecycle/${planId}`);
        const lifecycle = await res.json();

        if (!lifecycle || !lifecycle.phases) {
            container.innerHTML = '<span class="text-slate-500">No lifecycle data</span>';
            return;
        }

        // Render inline lifecycle using LifecycleViz if available
        if (typeof LifecycleViz !== 'undefined' && LifecycleViz.renderInline) {
            LifecycleViz.renderInline(`lifecycle-inline-${planId}`, lifecycle);
        } else {
            // Fallback rendering
            const phases = ['prd', 'mvp', 'implementation', 'release'];
            const phaseLabels = { prd: 'PRD', mvp: 'MVP', implementation: 'Dev', release: 'Rel' };
            const phaseColors = { prd: '#0284c7', mvp: '#d97706', implementation: '#059669', release: '#0f766e' };

            container.innerHTML = `
                <div class="flex gap-2 items-center">
                    ${phases.map(p => {
                        const data = lifecycle.phases[p];
                        const isComplete = data.status === 'completed';
                        const isActive = data.status === 'in_progress';
                        return `
                            <div class="flex-1 text-center p-2 rounded border ${isComplete ? 'border-emerald-500 bg-emerald-900/20' : isActive ? 'border-amber-500 bg-amber-900/20' : 'border-slate-600'}">
                                <div class="text-xs font-semibold" style="color: ${phaseColors[p]}">${phaseLabels[p]}</div>
                                <div class="text-xs text-slate-400">${data.progress}%</div>
                            </div>
                            ${p !== 'release' ? '<span class="text-slate-600">-></span>' : ''}
                        `;
                    }).join('')}
                </div>
                <div class="text-center mt-2">
                    <span class="text-lg font-bold text-teal-400">${lifecycle.overallProgress}%</span>
                    <span class="text-xs text-slate-400 ml-1">Overall</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading lifecycle:', error);
        container.innerHTML = '<span class="text-red-400">Failed to load lifecycle</span>';
    }
}

function closeModal() {
    document.getElementById('plan-modal').classList.add('hidden');
}

// Activity feed
function addActivity(message, type = 'info') {
    const feed = document.getElementById('activity-feed');
    const time = new Date().toLocaleTimeString('ko-KR');
    const icons = { refresh: '[*]', task: '[T]', file: '[F]', info: '[i]' };
    
    const item = document.createElement('div');
    item.className = 'text-sm text-slate-300 flex gap-2';
    item.innerHTML = `
        <span class="text-slate-500">${time}</span>
        <span class="text-teal-400">${icons[type] || '[i]'}</span>
        <span>${escapeHtml(message)}</span>
    `;
    
    feed.insertBefore(item, feed.firstChild);
    
    // Keep only last 20 items
    while (feed.children.length > 20) {
        feed.removeChild(feed.lastChild);
    }
}

// Chart
function updateChart() {
    const ctx = document.getElementById('progress-chart').getContext('2d');

    const statusCounts = {
        active: allPlans.filter(p => p.status === 'active').length,
        completed: allPlans.filter(p => p.status === 'completed').length,
        archived: allPlans.filter(p => p.status === 'archived').length
    };

    if (progressChart) {
        progressChart.destroy();
    }

    progressChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Completed', 'Archived'],
            datasets: [{
                data: [statusCounts.active, statusCounts.completed, statusCounts.archived],
                backgroundColor: ['#14b8a6', '#3b82f6', '#6b7280'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8' }
                }
            }
        }
    });

    // 주별 활동 차트
    updateActivityChart();
}

// 주별 활동 차트
function updateActivityChart() {
    const ctx = document.getElementById('activity-chart');
    if (!ctx) return;

    // 최근 7일 날짜 생성
    const days = [];
    const counts = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        days.push(date.toLocaleDateString('ko-KR', { weekday: 'short' }));

        // 해당 날짜에 업데이트된 플랜 수
        const count = allPlans.filter(p => {
            if (!p.updatedAt) return false;
            const planDate = new Date(p.updatedAt).toISOString().split('T')[0];
            return planDate === dateStr;
        }).length;
        counts.push(count);
    }

    if (activityChart) {
        activityChart.destroy();
    }

    activityChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Plans Updated',
                data: counts,
                backgroundColor: '#14b8a6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8', stepSize: 1 },
                    grid: { color: '#334155' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            }
        }
    });
}


// Utility
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 상대 시간 표시 (예: "2시간 전")
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;
    if (diffWeek < 4) return `${diffWeek}주 전`;
    if (diffMonth < 12) return `${diffMonth}개월 전`;
    return date.toLocaleDateString('ko-KR');
}

// 날짜 포맷 (간단)
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// 품질 상태 배지 생성
function getQualityBadge(plan) {
    if (plan.qualityStatus === 'empty') {
        return '<span class="ml-2 px-2 py-0.5 rounded text-xs bg-red-600">Empty</span>';
    }
    if (plan.qualityStatus === 'draft') {
        return '<span class="ml-2 px-2 py-0.5 rounded text-xs bg-amber-600">Draft</span>';
    }
    if (plan.progress === 100) {
        return '<span class="ml-2 px-2 py-0.5 rounded text-xs bg-blue-600">Complete</span>';
    }
    return '';
}

// Initial load (fallback if socket fails)
async function loadInitialData() {
    try {
        const res = await fetch('/api/plans');
        const data = await res.json();
        updatePlans(data);
        updateStats(data.stats, {});
        updateLastUpdate();
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// Load on page ready
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    addActivity('Dashboard loaded', 'info');

    // v3.0 Phase 7: Initialize Lifecycle View
    if (typeof LifecycleViz !== 'undefined') {
        LifecycleViz.init('lifecycle-view');
        LifecycleViz.renderList('lifecycle-list');
    }

    // Phase 8H: Load Multi-Plan Overview
    if (typeof MultiPlanOverview !== 'undefined') {
        MultiPlanOverview.loadAndRender('multi-plan-overview');
    }
});

// Close modal on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ===== v2.0: Tab Navigation =====
function switchTab(tabName) {
    currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('tab-active');
        btn.classList.add('text-slate-400');
    });
    document.getElementById(`tab-${tabName}`).classList.add('tab-active');
    document.getElementById(`tab-${tabName}`).classList.remove('text-slate-400');

    // Show/hide content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`content-${tabName}`).classList.remove('hidden');

    // Load tab-specific data
    if (tabName === 'projects') loadProjectsTab();
    if (tabName === 'tools') loadToolsTab();
    if (tabName === 'agents') loadAgentsTab();
    if (tabName === 'prompts') loadPromptsTab();
    if (tabName === 'timeline') loadTimelineTab();
    if (tabName === 'skills') loadSkillsTab();
    if (tabName === 'tasks') loadTasksTab();
    if (tabName === 'system') loadSystemTab();
    if (tabName === 'costs') loadCostsTab();
    if (tabName === 'workflows') loadWorkflowsTab();
    if (tabName === 'mcp') loadMCPTab();
}

// ===== v4.0: Projects Tab =====
function loadProjectsTab() {
    if (window.ProjectDashboard) {
        ProjectDashboard.loadProjects();
        ProjectDashboard.loadOverview();
    }
}

// ===== v4.0: Workflows Tab =====
function loadWorkflowsTab() {
    if (window.WorkflowViz) {
        WorkflowViz.loadWorkflowData();
    }
}

// ===== v4.0 Phase 9 Week 4: MCP Tab =====
function loadMCPTab() {
    if (window.MCPDashboard) {
        MCPDashboard.loadMCPData();
    }
}

// ===== v2.0: Tools Tab =====
function updateToolsData(data) {
    toolsData = data;
    document.getElementById('stat-tools').textContent = data.totalCalls || 0;
    if (currentTab === 'tools') renderToolsList();
}

async function loadToolsTab() {
    try {
        const [toolsRes, chainsRes, categoriesRes] = await Promise.all([
            fetch('/api/tools/top?n=20'),
            fetch('/api/tools/chains?n=10'),
            fetch('/api/tools/categories')
        ]);

        const tools = await toolsRes.json();
        const chains = await chainsRes.json();
        const categories = await categoriesRes.json();

        renderToolsList(tools);
        renderChainsList(chains);
        renderToolsCategoryChart(categories);
        updateToolsStats();
    } catch (error) {
        console.error('Error loading tools:', error);
    }
}

function renderToolsList(tools = []) {
    const container = document.getElementById('tools-list');
    if (!tools.length) {
        container.innerHTML = '<div class="text-slate-500">No tool data yet</div>';
        return;
    }

    container.innerHTML = tools.map((tool, i) => `
        <div class="flex items-center justify-between p-2 bg-slate-700/50 rounded">
            <div class="flex items-center gap-3">
                <span class="text-slate-500 text-sm w-6">#${i + 1}</span>
                <div>
                    <div class="font-medium text-sm">${escapeHtml(tool.name)}</div>
                    <div class="text-xs text-slate-400">${tool.category || 'general'}</div>
                </div>
            </div>
            <div class="flex items-center gap-4 text-sm">
                <span class="text-slate-300">${tool.totalCalls} calls</span>
                <span class="${tool.successRate >= 90 ? 'text-green-400' : tool.successRate >= 70 ? 'text-amber-400' : 'text-red-400'}">${tool.successRate}%</span>
                <span class="text-slate-500">${tool.averageResponseTime}ms</span>
            </div>
        </div>
    `).join('');
}

function renderChainsList(chains = []) {
    const container = document.getElementById('chains-list');
    if (!chains.length) {
        container.innerHTML = '<div class="text-slate-500">No chaining patterns yet</div>';
        return;
    }

    container.innerHTML = chains.map(chain => `
        <div class="flex items-center justify-between p-2 bg-slate-700/50 rounded">
            <div class="text-sm">
                <span class="text-teal-400">${escapeHtml(chain.from || chain.pattern?.split(' -> ')[0] || '')}</span>
                <span class="text-slate-500 mx-2">-></span>
                <span class="text-blue-400">${escapeHtml(chain.to || chain.pattern?.split(' -> ')[1] || '')}</span>
            </div>
            <span class="text-slate-400 text-sm">${chain.count}x</span>
        </div>
    `).join('');
}

function renderToolsCategoryChart(categories) {
    const ctx = document.getElementById('tools-category-chart');
    if (!ctx) return;

    const labels = Object.keys(categories);
    const data = labels.map(cat => categories[cat].totalCalls);

    if (toolsCategoryChart) toolsCategoryChart.destroy();

    toolsCategoryChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 10 } } }
            }
        }
    });
}

function updateToolsStats() {
    document.getElementById('tools-total').textContent = toolsData.totalCalls || 0;
    document.getElementById('tools-unique').textContent = toolsData.totalUniqueTools || 0;

    // Calculate average success rate
    if (toolsData.tools && toolsData.tools.length > 0) {
        const avgRate = Math.round(toolsData.tools.reduce((sum, t) => sum + (t.successRate || 0), 0) / toolsData.tools.length);
        document.getElementById('tools-success-rate').textContent = avgRate + '%';
    }
}

// ===== v2.0: Agents Tab =====
function updateAgentsData(data) {
    agentsData = data;
    document.getElementById('stat-agents').textContent = data.totalCount || 0;
    if (currentTab === 'agents') renderAgentsList();
}

async function loadAgentsTab() {
    try {
        const [agentsRes, statsRes, runningRes] = await Promise.all([
            fetch('/api/agents?days=7'),
            fetch('/api/agents/stats?days=7'),
            fetch('/api/agents/running')
        ]);

        const agents = await agentsRes.json();
        const stats = await statsRes.json();
        const running = await runningRes.json();

        agentsData = agents;
        renderAgentsList(agents.agents);
        renderRunningAgents(running);
        renderAgentsTypeChart(stats.byType);
        updateAgentsStats(stats);
    } catch (error) {
        console.error('Error loading agents:', error);
    }
}

function renderAgentsList(agents = []) {
    const container = document.getElementById('agents-list');
    if (!agents.length) {
        container.innerHTML = '<div class="text-slate-500">No agent activity yet</div>';
        return;
    }

    const recentAgents = agents.slice(0, 20);
    container.innerHTML = recentAgents.map(agent => `
        <div class="p-3 bg-slate-700/50 rounded ${agent.status === 'running' ? 'agent-running border-l-2 border-green-500' : ''}">
            <div class="flex justify-between items-start">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-medium">${escapeHtml(agent.type)}</span>
                        <span class="px-2 py-0.5 rounded text-xs ${
                            agent.status === 'completed' ? 'bg-green-600' :
                            agent.status === 'running' ? 'bg-blue-600' : 'bg-red-600'
                        }">${agent.status}</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-1 truncate max-w-md" title="${escapeHtml(agent.prompt || '')}">${escapeHtml((agent.prompt || '').substring(0, 80))}...</div>
                </div>
                <div class="text-right text-xs text-slate-500">
                    <div>${timeAgo(agent.startTime)}</div>
                    ${agent.endTime ? `<div>${Math.round((new Date(agent.endTime) - new Date(agent.startTime)) / 1000)}s</div>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function renderRunningAgents(agents = []) {
    const container = document.getElementById('running-agents');
    const countEl = document.getElementById('running-count');

    countEl.textContent = agents.length;

    if (!agents.length) {
        container.innerHTML = '<div class="text-slate-500">No agents running</div>';
        return;
    }

    container.innerHTML = agents.map(agent => `
        <div class="p-3 bg-green-900/30 border border-green-600 rounded agent-running">
            <div class="flex justify-between items-center">
                <span class="font-medium text-green-400">${escapeHtml(agent.type)}</span>
                <span class="text-xs text-slate-400">${timeAgo(agent.startTime)}</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 truncate">${escapeHtml((agent.prompt || '').substring(0, 60))}...</div>
        </div>
    `).join('');
}

async function loadRunningAgents() {
    try {
        const res = await fetch('/api/agents/running');
        const running = await res.json();
        renderRunningAgents(running);
    } catch (error) {
        console.error('Error loading running agents:', error);
    }
}

function renderAgentsTypeChart(byType = {}) {
    const ctx = document.getElementById('agents-type-chart');
    if (!ctx) return;

    const labels = Object.keys(byType);
    const data = labels.map(type => byType[type].count);

    if (agentsTypeChart) agentsTypeChart.destroy();

    agentsTypeChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: '#f43f5e',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                y: { ticks: { color: '#94a3b8' }, grid: { display: false } }
            }
        }
    });
}

function updateAgentsStats(stats) {
    document.getElementById('agents-total').textContent = stats.totalAgents || 0;

    let completed = 0;
    for (const type of Object.values(stats.byType || {})) {
        completed += type.completed || 0;
    }
    document.getElementById('agents-completed').textContent = completed;
    document.getElementById('agents-avg-duration').textContent = (stats.avgDuration || 0) + 's';
}

// ===== v2.0: Prompts Tab =====
function updatePromptsData(data) {
    promptsData = data;
    document.getElementById('stat-prompts').textContent = data.totalCount || 0;
    if (currentTab === 'prompts') renderPromptsList();
}

async function loadPromptsTab() {
    try {
        const [promptsRes, statsRes] = await Promise.all([
            fetch('/api/prompts?days=7'),
            fetch('/api/prompts/stats?days=7')
        ]);

        const prompts = await promptsRes.json();
        const stats = await statsRes.json();

        promptsData = prompts;
        renderPromptsList(prompts.prompts);
        renderPromptsHourlyChart(stats.hourlyDistribution);
        updatePromptsStats(stats);
    } catch (error) {
        console.error('Error loading prompts:', error);
    }
}

function renderPromptsList(prompts = []) {
    const container = document.getElementById('prompts-list');
    if (!prompts.length) {
        container.innerHTML = '<div class="text-slate-500">No prompts recorded yet</div>';
        return;
    }

    const recentPrompts = prompts.slice(0, 30);
    container.innerHTML = recentPrompts.map(p => `
        <div class="p-3 bg-slate-700/50 rounded">
            <div class="flex justify-between items-start mb-2">
                <div class="text-sm text-white flex-1 mr-4">${escapeHtml(p.prompt.substring(0, 200))}${p.prompt.length > 200 ? '...' : ''}</div>
                <div class="text-xs text-slate-500 whitespace-nowrap">${timeAgo(p.timestamp)}</div>
            </div>
            <div class="flex gap-4 text-xs">
                ${p.response?.toolsUsed?.length ? `<span class="text-purple-400">Tools: ${p.response.toolsUsed.length}</span>` : ''}
                ${p.response?.agentsSpawned?.length ? `<span class="text-rose-400">Agents: ${p.response.agentsSpawned.length}</span>` : ''}
                ${p.context?.activePlan ? `<span class="text-teal-400">Plan: ${p.context.activePlan}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function renderPromptsHourlyChart(hourlyDistribution = []) {
    const ctx = document.getElementById('prompts-hourly-chart');
    if (!ctx) return;

    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const data = hourlyDistribution.length ? hourlyDistribution : Array(24).fill(0);

    if (promptsHourlyChart) promptsHourlyChart.destroy();

    promptsHourlyChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#94a3b8', maxTicksLimit: 12 }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' }, beginAtZero: true }
            }
        }
    });
}

function updatePromptsStats(stats) {
    document.getElementById('prompts-total').textContent = stats.totalPrompts || 0;

    let withTools = 0, withAgents = 0;
    for (const day of stats.dailyStats || []) {
        withTools += day.withTools || 0;
        withAgents += day.withAgents || 0;
    }
    document.getElementById('prompts-with-tools').textContent = withTools;
    document.getElementById('prompts-with-agents').textContent = withAgents;
}

// Prompt search
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('prompt-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const query = e.target.value.trim();
                if (query.length < 2) {
                    loadPromptsTab();
                    return;
                }
                try {
                    const res = await fetch(`/api/prompts/search?q=${encodeURIComponent(query)}&days=30`);
                    const data = await res.json();
                    renderPromptsList(data.results);
                } catch (error) {
                    console.error('Error searching prompts:', error);
                }
            }, 300);
        });
    }
});

// ===== v2.0: Timeline Tab =====
async function loadTimelineTab() {
    const dateInput = document.getElementById('timeline-date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    dateInput.addEventListener('change', () => loadTimelineForDate(dateInput.value));
    loadTimelineForDate(today);
}

async function loadTimelineForDate(date) {
    try {
        const [toolsRes, agentsRes] = await Promise.all([
            fetch(`/api/tools/timeline?date=${date}`),
            fetch(`/api/agents/timeline?date=${date}`)
        ]);

        const tools = await toolsRes.json();
        const agents = await agentsRes.json();

        renderTimeline(tools.events, agents.timeline);
    } catch (error) {
        console.error('Error loading timeline:', error);
    }
}

function renderTimeline(toolEvents = [], agentTimeline = []) {
    const container = document.getElementById('timeline-view');

    // Merge and sort all events
    const allEvents = [
        ...toolEvents.map(e => ({ ...e, eventType: 'tool', time: new Date(e.timestamp) })),
        ...agentTimeline.map(a => ({ ...a, eventType: 'agent', time: new Date(a.start) }))
    ].sort((a, b) => b.time - a.time);

    if (!allEvents.length) {
        container.innerHTML = '<div class="text-slate-500">No activity on this date</div>';
        return;
    }

    container.innerHTML = allEvents.slice(0, 100).map(event => {
        if (event.eventType === 'tool') {
            return `
                <div class="timeline-item py-2">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-500">${event.time.toLocaleTimeString('ko-KR')}</span>
                        <span class="px-2 py-0.5 rounded text-xs bg-purple-600">Tool</span>
                        <span class="text-sm">${escapeHtml(event.tool)}</span>
                        <span class="${event.success ? 'text-green-400' : 'text-red-400'} text-xs">${event.success ? 'OK' : 'FAIL'}</span>
                        <span class="text-xs text-slate-500">${event.responseTime}ms</span>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="timeline-item py-2">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-500">${event.time.toLocaleTimeString('ko-KR')}</span>
                        <span class="px-2 py-0.5 rounded text-xs bg-rose-600">Agent</span>
                        <span class="text-sm">${escapeHtml(event.type)}</span>
                        <span class="px-2 py-0.5 rounded text-xs ${
                            event.status === 'completed' ? 'bg-green-600' :
                            event.status === 'running' ? 'bg-blue-600' : 'bg-slate-600'
                        }">${event.status}</span>
                        ${event.duration ? `<span class="text-xs text-slate-500">${Math.round(event.duration)}s</span>` : ''}
                    </div>
                </div>
            `;
        }
    }).join('');
}

// ===== v2.0: Skills Tab (Phase 7) =====
function updateSkillsData(data) {
    skillsData = data;
    if (currentTab === 'skills') renderSkillsList();
}

async function loadSkillsTab() {
    try {
        const res = await fetch('/api/skills');
        const data = await res.json();
        skillsData = data;
        renderSkillsList(data.skills);
        renderSkillsUsageChart(data.skills);
        updateSkillsStats(data);
    } catch (error) {
        console.error('Error loading skills:', error);
    }
}

function renderSkillsList(skills = []) {
    const container = document.getElementById('skills-list');
    if (!skills.length) {
        container.innerHTML = '<div class="text-slate-500">No skills registered</div>';
        return;
    }

    container.innerHTML = skills.map(skill => `
        <div class="p-3 bg-slate-700/50 rounded">
            <div class="flex justify-between items-start">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-medium">${escapeHtml(skill.name)}</span>
                        ${skill.registered ? '<span class="px-2 py-0.5 rounded text-xs bg-teal-600">Registered</span>' : ''}
                    </div>
                    <div class="text-xs text-slate-400 mt-1">
                        ${skill.triggers && skill.triggers.length > 0 ? `Triggers: ${skill.triggers.slice(0, 3).map(t => escapeHtml(t)).join(', ')}` : 'No triggers defined'}
                    </div>
                </div>
                <div class="text-right text-sm">
                    <div class="text-teal-400">${skill.totalActivations} activations</div>
                    ${skill.successRate > 0 ? `<div class="text-xs text-slate-500">${skill.successRate}% success</div>` : ''}
                </div>
            </div>
            ${skill.lastUsed ? `<div class="text-xs text-slate-500 mt-2">Last used: ${timeAgo(skill.lastUsed)}</div>` : ''}
        </div>
    `).join('');
}

function renderSkillsUsageChart(skills = []) {
    const ctx = document.getElementById('skills-usage-chart');
    if (!ctx) return;

    const topSkills = skills.filter(s => s.totalActivations > 0).slice(0, 5);
    const labels = topSkills.map(s => s.name);
    const data = topSkills.map(s => s.totalActivations);

    if (skillsUsageChart) skillsUsageChart.destroy();

    if (!topSkills.length) {
        ctx.parentElement.innerHTML = '<div class="text-slate-500 text-center py-8">No usage data yet</div>';
        return;
    }

    skillsUsageChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: '#14b8a6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                y: { ticks: { color: '#94a3b8' }, grid: { display: false } }
            }
        }
    });
}

function updateSkillsStats(data) {
    document.getElementById('skills-registered').textContent = data.registeredCount || 0;
    document.getElementById('skills-activations').textContent = data.totalActivations || 0;
}

// ===== v2.0: Tasks Tab (Phase 8) =====
function updateTasksData(data) {
    tasksData = data;
    if (currentTab === 'tasks') renderTasksList();
}

async function loadTasksTab() {
    try {
        const res = await fetch('/api/tasks/all');
        const data = await res.json();
        tasksData = data;
        renderTasksList(data.tasks);
        renderTasksSourceChart(data.stats.bySource);
        updateTasksStats(data.stats);
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function renderTasksList(tasks = []) {
    const container = document.getElementById('tasks-list');
    if (!tasks.length) {
        container.innerHTML = '<div class="text-slate-500">No tasks found</div>';
        return;
    }

    // Apply filters
    let filtered = tasks;
    if (currentTaskFilter !== 'all') {
        filtered = filtered.filter(t => t.status === currentTaskFilter || t.status === currentTaskFilter.replace('-', '_'));
    }
    if (currentTaskSourceFilter !== 'all') {
        filtered = filtered.filter(t => t.source === currentTaskSourceFilter);
    }

    container.innerHTML = filtered.map(task => {
        const statusColor = {
            'pending': 'bg-amber-600',
            'in-progress': 'bg-blue-600',
            'in_progress': 'bg-blue-600',
            'completed': 'bg-green-600',
            'done': 'bg-green-600'
        };
        const sourceColor = {
            'shrimp': 'text-teal-400',
            'unified': 'text-blue-400',
            'task-master': 'text-purple-400'
        };

        return `
            <div class="p-3 bg-slate-700/50 rounded">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span class="font-medium text-sm">${escapeHtml(task.name || 'Unnamed Task')}</span>
                            <span class="px-2 py-0.5 rounded text-xs ${statusColor[task.status] || 'bg-slate-600'}">${task.status}</span>
                        </div>
                        ${task.description ? `<div class="text-xs text-slate-400 mt-1 truncate max-w-lg">${escapeHtml(task.description.substring(0, 100))}${task.description.length > 100 ? '...' : ''}</div>` : ''}
                    </div>
                    <div class="text-right">
                        <div class="text-xs ${sourceColor[task.source] || 'text-slate-400'}">${task.source}</div>
                        <div class="text-xs text-slate-500">${task.id?.substring(0, 8) || ''}</div>
                    </div>
                </div>
                ${task.dependencies && task.dependencies.length > 0 ? `
                    <div class="text-xs text-slate-500 mt-2">
                        Blocked by: ${task.dependencies.length} task(s)
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function filterTasks(filter) {
    currentTaskFilter = filter;
    document.querySelectorAll('.task-filter').forEach(btn => {
        btn.classList.remove('bg-teal-600');
        if (!btn.classList.contains('bg-amber-600')) {
            btn.classList.add('bg-slate-700');
        }
    });
    if (event && event.target) {
        event.target.classList.remove('bg-slate-700');
        event.target.classList.add('bg-teal-600');
    }
    renderTasksList(tasksData.tasks);
}

function filterTasksSource(source) {
    currentTaskSourceFilter = source;
    document.querySelectorAll('.source-filter').forEach(btn => {
        if (!btn.classList.contains('bg-teal-600') && !btn.classList.contains('bg-blue-600') && !btn.classList.contains('bg-purple-600')) {
            btn.classList.remove('bg-teal-600');
            btn.classList.add('bg-slate-700');
        }
    });
    renderTasksList(tasksData.tasks);
}

function renderTasksSourceChart(bySource = {}) {
    const ctx = document.getElementById('tasks-source-chart');
    if (!ctx) return;

    const labels = Object.keys(bySource);
    const data = labels.map(source => bySource[source]);
    const colors = {
        'shrimp': '#14b8a6',
        'unified': '#3b82f6',
        'task-master': '#8b5cf6'
    };

    if (tasksSourceChart) tasksSourceChart.destroy();

    tasksSourceChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: labels.map(l => colors[l] || '#6b7280'),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8' } }
            }
        }
    });
}

function updateTasksStats(stats) {
    document.getElementById('tasks-total').textContent = stats.total || 0;
    document.getElementById('tasks-pending').textContent = stats.byStatus?.pending || 0;
    document.getElementById('tasks-in-progress').textContent = stats.byStatus?.['in-progress'] || 0;
    document.getElementById('tasks-completed').textContent = stats.byStatus?.completed || 0;
    document.getElementById('tasks-completion-rate').textContent = (stats.completionRate || 0) + '%';
}

// ===== v2.0: System Graph Tab (Phase 9) =====
async function loadSystemTab() {
    try {
        const [graphRes, statusRes, categoriesRes] = await Promise.all([
            fetch('/api/system-graph/d3'),
            fetch('/api/system-graph/status'),
            fetch('/api/system-graph/categories')
        ]);

        const graphData = await graphRes.json();
        const status = await statusRes.json();
        const categories = await categoriesRes.json();

        systemGraphData = graphData;
        renderSystemGraph(graphData);
        updateSystemStatus(status);
        renderSystemCategories(categories);
    } catch (error) {
        console.error('Error loading system graph:', error);
    }
}

// D3.js Force-Directed Graph (v3.0 Phase 15)
let d3Simulation = null;
let d3Zoom = null;

function renderSystemGraph(data) {
    const svg = d3.select('#d3-graph');
    svg.selectAll('*').remove();

    if (!data.nodes || !data.nodes.length) {
        svg.append('text')
            .attr('x', '50%')
            .attr('y', '50%')
            .attr('text-anchor', 'middle')
            .attr('fill', '#64748b')
            .text('No system data available');
        return;
    }

    const width = svg.node().getBoundingClientRect().width || 800;
    const height = 500;

    const categoryColors = {
        'core': '#14b8a6',
        'tasks': '#f59e0b',
        'orchestration': '#ec4899',
        'config': '#6366f1',
        'ui': '#f43f5e',
        'mcp': '#22c55e',
        'memory': '#a855f7'
    };

    // Create container for zoom
    const g = svg.append('g');

    // Zoom behavior
    d3Zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(d3Zoom);

    // Force simulation
    d3Simulation = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(40));

    // Links
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data.links)
        .enter()
        .append('line')
        .attr('stroke', '#334155')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.6);

    // Nodes
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(data.nodes)
        .enter()
        .append('g')
        .attr('cursor', 'pointer')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    // Node circles
    node.append('circle')
        .attr('r', d => d.active ? 20 : 15)
        .attr('fill', d => categoryColors[d.group] || '#6b7280')
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 2)
        .on('click', (event, d) => {
            event.stopPropagation();
            showNodeDetails(d.id);
            highlightNode(d.id);
        })
        .on('mouseover', function(event, d) {
            d3.select(this).attr('stroke', '#14b8a6').attr('stroke-width', 3);
            showTooltip(event, d);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).attr('stroke', '#1e293b').attr('stroke-width', 2);
            hideTooltip();
        });

    // Node status indicator
    node.append('circle')
        .attr('r', 5)
        .attr('cx', 12)
        .attr('cy', -12)
        .attr('fill', d => d.active ? '#22c55e' : '#ef4444');

    // Node labels
    node.append('text')
        .attr('dy', 35)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .text(d => d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label);

    // Tooltip
    const tooltip = d3.select('body').append('div')
        .attr('id', 'd3-tooltip')
        .style('position', 'absolute')
        .style('background', '#1e293b')
        .style('border', '1px solid #334155')
        .style('border-radius', '4px')
        .style('padding', '8px 12px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 1000);

    function showTooltip(event, d) {
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
            <div style="font-weight: bold; color: #f8fafc;">${d.label}</div>
            <div style="font-size: 11px; color: #94a3b8;">${d.description || ''}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Category: ${d.group}</div>
        `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }

    function hideTooltip() {
        tooltip.transition().duration(200).style('opacity', 0);
    }

    // Tick update
    d3Simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) d3Simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) d3Simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function highlightNode(nodeId) {
    d3.selectAll('#d3-graph circle')
        .attr('opacity', function() {
            const parentData = d3.select(this.parentNode).datum();
            return parentData && parentData.id === nodeId ? 1 : 0.4;
        });

    d3.selectAll('#d3-graph line')
        .attr('opacity', function() {
            const d = d3.select(this).datum();
            return d.source.id === nodeId || d.target.id === nodeId ? 1 : 0.2;
        })
        .attr('stroke', function() {
            const d = d3.select(this).datum();
            return d.source.id === nodeId || d.target.id === nodeId ? '#14b8a6' : '#334155';
        });

    // Reset after 2 seconds
    setTimeout(() => {
        d3.selectAll('#d3-graph circle').attr('opacity', 1);
        d3.selectAll('#d3-graph line').attr('opacity', 0.6).attr('stroke', '#334155');
    }, 2000);
}

function resetD3Zoom() {
    const svg = d3.select('#d3-graph');
    svg.transition().duration(500).call(d3Zoom.transform, d3.zoomIdentity);
}

async function showNodeDetails(nodeId) {
    try {
        const res = await fetch(`/api/system-graph/node/${nodeId}`);
        const data = await res.json();

        const container = document.getElementById('node-details');
        const node = systemGraphData?.nodes?.find(n => n.id === nodeId);

        if (!node) {
            container.innerHTML = '<div class="text-slate-500">Node not found</div>';
            return;
        }

        container.innerHTML = `
            <div class="space-y-4">
                <div>
                    <h3 class="text-lg font-semibold">${escapeHtml(node.label)}</h3>
                    <p class="text-slate-400 text-sm">${escapeHtml(node.description || '')}</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-slate-700/50 p-3 rounded">
                        <div class="text-slate-400 text-xs">Incoming</div>
                        <div class="text-lg font-bold">${data.incoming.length}</div>
                    </div>
                    <div class="bg-slate-700/50 p-3 rounded">
                        <div class="text-slate-400 text-xs">Outgoing</div>
                        <div class="text-lg font-bold">${data.outgoing.length}</div>
                    </div>
                </div>
                ${data.incoming.length > 0 ? `
                    <div>
                        <div class="text-sm font-semibold mb-2">Receives from:</div>
                        <div class="space-y-1">
                            ${data.incoming.map(c => `
                                <div class="text-xs bg-slate-700/50 p-2 rounded">
                                    <span class="text-teal-400">${escapeHtml(c.from)}</span>
                                    <span class="text-slate-500 mx-2">(${c.type})</span>
                                    <span class="text-slate-400">${c.label || ''}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${data.outgoing.length > 0 ? `
                    <div>
                        <div class="text-sm font-semibold mb-2">Sends to:</div>
                        <div class="space-y-1">
                            ${data.outgoing.map(c => `
                                <div class="text-xs bg-slate-700/50 p-2 rounded">
                                    <span class="text-blue-400">${escapeHtml(c.to)}</span>
                                    <span class="text-slate-500 mx-2">(${c.type})</span>
                                    <span class="text-slate-400">${c.label || ''}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    } catch (error) {
        console.error('Error loading node details:', error);
    }
}

function updateSystemStatus(status) {
    document.getElementById('system-total-nodes').textContent = status.totalNodes || 0;
    document.getElementById('system-active-nodes').textContent = status.activeNodes || 0;
    document.getElementById('system-connections').textContent = status.totalConnections || 0;
}

function renderSystemCategories(categories) {
    const container = document.getElementById('system-categories');

    const categoryNames = {
        'core': 'Core Systems',
        'tasks': 'Task Management',
        'orchestration': 'Orchestration',
        'config': 'Configuration',
        'ui': 'UI/Dashboard',
        'mcp': 'MCP Servers',
        'memory': 'Memory'
    };

    container.innerHTML = Object.entries(categories).map(([cat, nodes]) => `
        <div class="flex justify-between items-center p-2 bg-slate-700/50 rounded">
            <span class="text-sm">${categoryNames[cat] || cat}</span>
            <span class="text-xs text-slate-400">${nodes.length} nodes</span>
        </div>
    `).join('');
}

function refreshSystemGraph() {
    loadSystemTab();
}

async function exportMermaid() {
    try {
        const res = await fetch('/api/system-graph/mermaid');
        const mermaid = await res.text();

        // Copy to clipboard
        navigator.clipboard.writeText(mermaid).then(() => {
            alert('Mermaid diagram copied to clipboard!');
        });
    } catch (error) {
        console.error('Error exporting mermaid:', error);
    }
}

// ===== v2.0: Costs Tab (Phase 11) =====
async function loadCostsTab() {
    try {
        const [statsRes, todayRes, sessionsRes, projectedRes] = await Promise.all([
            fetch('/api/costs?days=30'),
            fetch('/api/costs/today'),
            fetch('/api/costs/sessions?limit=20'),
            fetch('/api/costs/projected')
        ]);

        const stats = await statsRes.json();
        const today = await todayRes.json();
        const sessions = await sessionsRes.json();
        const projected = await projectedRes.json();

        renderCostTrendChart(stats);
        updateTodayCost(today);
        updateProjectedCost(projected);
        renderCostSessions(sessions);
        renderModelBreakdown(stats.modelBreakdown);
    } catch (error) {
        console.error('Error loading costs:', error);
    }
}

function renderCostTrendChart(stats) {
    const ctx = document.getElementById('cost-trend-chart');
    if (!ctx) return;

    const labels = stats.dailyStats.map(d => d.date.substring(5)); // MM-DD
    const costs = stats.dailyStats.map(d => d.cost);

    if (costTrendChart) costTrendChart.destroy();

    costTrendChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Cost ($)',
                data: costs,
                borderColor: '#14b8a6',
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8', maxTicksLimit: 15 },
                    grid: { display: false }
                },
                y: {
                    ticks: {
                        color: '#94a3b8',
                        callback: (value) => '$' + value.toFixed(2)
                    },
                    grid: { color: '#334155' },
                    beginAtZero: true
                }
            }
        }
    });
}

function updateTodayCost(today) {
    document.getElementById('cost-today').textContent = today.formattedCost || '$0.00';
    document.getElementById('cost-input-tokens').textContent = formatNumber(today.inputTokens);
    document.getElementById('cost-output-tokens').textContent = formatNumber(today.outputTokens);
    document.getElementById('cost-sessions-count').textContent = today.sessions || 0;
}

function updateProjectedCost(projected) {
    document.getElementById('cost-projected').textContent = projected.formattedProjected || '$0.00';
    document.getElementById('cost-mtd').textContent = '$' + (projected.currentMonthCost || 0).toFixed(2);
}

function renderCostSessions(sessions) {
    const container = document.getElementById('cost-sessions');

    if (!sessions.length) {
        container.innerHTML = '<div class="text-slate-500">No session data yet</div>';
        return;
    }

    container.innerHTML = sessions.map(session => `
        <div class="flex justify-between items-center p-2 bg-slate-700/50 rounded">
            <div>
                <div class="text-sm">${escapeHtml(session.modelName || session.model)}</div>
                <div class="text-xs text-slate-400">${timeAgo(session.startTime)}</div>
            </div>
            <div class="text-right">
                <div class="text-teal-400 font-medium">$${session.cost.toFixed(4)}</div>
                <div class="text-xs text-slate-500">${formatNumber(session.inputTokens + session.outputTokens)} tokens</div>
            </div>
        </div>
    `).join('');
}

function renderModelBreakdown(modelBreakdown) {
    const container = document.getElementById('cost-models');

    if (!modelBreakdown || Object.keys(modelBreakdown).length === 0) {
        container.innerHTML = '<div class="text-slate-500">No model data yet</div>';
        return;
    }

    container.innerHTML = Object.entries(modelBreakdown).map(([model, data]) => `
        <div class="p-2 bg-slate-700/50 rounded">
            <div class="flex justify-between items-center">
                <span class="text-sm">${escapeHtml(data.name)}</span>
                <span class="text-teal-400 font-medium">$${data.cost.toFixed(2)}</span>
            </div>
            <div class="text-xs text-slate-500 mt-1">${data.sessions} sessions</div>
        </div>
    `).join('');
}

// Utility: Format large numbers
function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Socket event for cost updates
socket.on('cost-recorded', (data) => {
    addActivity(`Cost recorded: $${data.cost.toFixed(4)}`, 'cost');
    if (currentTab === 'costs') loadCostsTab();
});

// ===== v3.0: Alerts System (Phase 13) =====

let alertsData = [];
let alertsUnreadCount = 0;

// Initialize alerts from server
socket.on('init', (data) => {
    if (data.alerts) {
        alertsData = data.alerts.recent || [];
        alertsUnreadCount = data.alerts.unread || 0;
        updateAlertsBadge();
        renderAlertsList();
    }
});

// Real-time alert events
socket.on('alert', (alert) => {
    console.log('[!] New alert:', alert.message);
    alertsData.unshift(alert);
    alertsUnreadCount++;
    updateAlertsBadge();
    renderAlertsList();
    showAlertToast(alert);
    addActivity(`Alert: ${alert.message}`, 'alert');
});

socket.on('alert-read', (data) => {
    const alert = alertsData.find(a => a.id === data.alertId);
    if (alert) {
        alert.read = true;
        alertsUnreadCount = Math.max(0, alertsUnreadCount - 1);
        updateAlertsBadge();
        renderAlertsList();
    }
});

socket.on('alerts-all-read', () => {
    alertsData.forEach(a => a.read = true);
    alertsUnreadCount = 0;
    updateAlertsBadge();
    renderAlertsList();
});

socket.on('alert-dismissed', (data) => {
    alertsData = alertsData.filter(a => a.id !== data.alertId);
    renderAlertsList();
});

// Hook events
socket.on('hook-prompt', (data) => {
    addActivity(`Prompt logged: ${(data.prompt || '').substring(0, 40)}...`, 'prompt');
});

socket.on('hook-cost', (data) => {
    addActivity(`Cost tracked: ${data.inputTokens} in / ${data.outputTokens} out`, 'cost');
});

socket.on('hook-tool', (data) => {
    addActivity(`Tool ${data.tool}: ${data.success ? 'OK' : 'FAIL'}`, 'tool');
});

socket.on('hook-agent-start', (data) => {
    addActivity(`Agent started: ${data.type}`, 'agent');
});

socket.on('hook-agent-complete', (data) => {
    addActivity(`Agent completed: ${data.agentId}`, 'agent');
});

function toggleAlertDropdown() {
    const dropdown = document.getElementById('alert-dropdown');
    dropdown.classList.toggle('show');

    // Close when clicking outside
    if (dropdown.classList.contains('show')) {
        setTimeout(() => {
            document.addEventListener('click', closeAlertDropdownOutside);
        }, 100);
    }
}

function closeAlertDropdownOutside(e) {
    const bell = document.getElementById('alert-bell');
    if (!bell.contains(e.target)) {
        document.getElementById('alert-dropdown').classList.remove('show');
        document.removeEventListener('click', closeAlertDropdownOutside);
    }
}

function updateAlertsBadge() {
    const badge = document.getElementById('alert-badge');
    if (alertsUnreadCount > 0) {
        badge.textContent = alertsUnreadCount > 99 ? '99+' : alertsUnreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function renderAlertsList() {
    const container = document.getElementById('alert-list');

    if (!alertsData || alertsData.length === 0) {
        container.innerHTML = '<div class="p-4 text-slate-500 text-center">No alerts</div>';
        return;
    }

    container.innerHTML = alertsData.slice(0, 20).map(alert => {
        const severityClass = `alert-severity-${alert.severity || 'info'}`;
        const unreadClass = !alert.read ? 'unread' : '';
        return `
            <div class="alert-item ${unreadClass} ${severityClass}" onclick="handleAlertClick('${alert.id}')">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="text-sm">${escapeHtml(alert.message)}</div>
                        <div class="text-xs text-slate-500 mt-1">${timeAgo(alert.timestamp)}</div>
                    </div>
                    <button onclick="dismissAlert(event, '${alert.id}')" class="text-slate-500 hover:text-red-400 ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function handleAlertClick(alertId) {
    try {
        await fetch(`/api/alerts/${alertId}/read`, { method: 'POST' });
        const alert = alertsData.find(a => a.id === alertId);
        if (alert && !alert.read) {
            alert.read = true;
            alertsUnreadCount = Math.max(0, alertsUnreadCount - 1);
            updateAlertsBadge();
            renderAlertsList();
        }
    } catch (error) {
        console.error('Error marking alert as read:', error);
    }
}

async function dismissAlert(event, alertId) {
    event.stopPropagation();
    try {
        await fetch(`/api/alerts/${alertId}/dismiss`, { method: 'POST' });
        const alert = alertsData.find(a => a.id === alertId);
        if (alert && !alert.read) {
            alertsUnreadCount = Math.max(0, alertsUnreadCount - 1);
            updateAlertsBadge();
        }
        alertsData = alertsData.filter(a => a.id !== alertId);
        renderAlertsList();
    } catch (error) {
        console.error('Error dismissing alert:', error);
    }
}

async function markAllAlertsRead(event) {
    event.stopPropagation();
    try {
        await fetch('/api/alerts/read-all', { method: 'POST' });
        alertsData.forEach(a => a.read = true);
        alertsUnreadCount = 0;
        updateAlertsBadge();
        renderAlertsList();
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

function showAlertToast(alert) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm animate-slide-in
        ${alert.severity === 'critical' ? 'bg-red-600' : alert.severity === 'warning' ? 'bg-amber-600' : 'bg-blue-600'}`;
    toast.innerHTML = `
        <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div class="flex-1">
                <div class="text-sm font-medium text-white">${escapeHtml(alert.message)}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white/70 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Add animation style
const alertStyle = document.createElement('style');
alertStyle.textContent = `
    @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in { animation: slide-in 0.3s ease; transition: transform 0.3s, opacity 0.3s; }
`;
document.head.appendChild(alertStyle);

// ===== v3.0: Session Replay (Phase 14) =====

let sessionsData = [];
let currentReplayData = null;
let replayInterval = null;
let replayIndex = 0;
let replaySpeed = 1;
let isPlaying = false;
let eventFilters = {
    prompt: true,
    tool_call: true,
    agent_spawn: true,
    agent_complete: true,
    error: true,
    session_start: true,
    session_end: true
};

// Socket events for sessions
socket.on('session-started', (data) => {
    addActivity(`Session started: ${data.sessionId}`, 'session');
    if (currentTab === 'sessions') refreshSessionList();
});

socket.on('session-ended', (data) => {
    addActivity(`Session ended: ${data.sessionId}`, 'session');
    if (currentTab === 'sessions') refreshSessionList();
});

socket.on('session-event', (data) => {
    if (currentReplayData && data.sessionId === currentReplayData.sessionId) {
        currentReplayData.timeline.push({
            ...data.event,
            relativeTime: new Date(data.event.timestamp).getTime() - new Date(currentReplayData.startTime).getTime(),
            formattedTime: formatDuration(new Date(data.event.timestamp).getTime() - new Date(currentReplayData.startTime).getTime())
        });
        renderSessionTimeline();
    }
});

async function loadSessionsTab() {
    try {
        const [sessionsRes, statsRes] = await Promise.all([
            fetch('/api/sessions?limit=50'),
            fetch('/api/sessions/stats')
        ]);

        sessionsData = await sessionsRes.json();
        const stats = await statsRes.json();

        // Update session selector
        const select = document.getElementById('session-select');
        select.innerHTML = '<option value="">Select a session...</option>' +
            sessionsData.map(s => `
                <option value="${s.sessionId}">
                    ${s.sessionId.substring(0, 20)}... (${s.status}) - ${timeAgo(s.startTime)}
                </option>
            `).join('');

        // Update stats
        document.getElementById('session-total').textContent = stats.totalSessions;
        document.getElementById('session-active').textContent = stats.activeSessions;
        document.getElementById('session-completed').textContent = stats.completedSessions;
        document.getElementById('session-avg-duration').textContent = formatDuration(stats.avgSessionDuration);

    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

function refreshSessionList() {
    loadSessionsTab();
}

async function loadSessionReplay() {
    const sessionId = document.getElementById('session-select').value;
    if (!sessionId) {
        currentReplayData = null;
        document.getElementById('replay-controls').classList.add('hidden');
        document.getElementById('session-timeline').innerHTML = '<div class="text-slate-500 text-center py-8">Select a session to view replay</div>';
        document.getElementById('session-info').innerHTML = '<div class="text-slate-500">No session selected</div>';
        return;
    }

    try {
        const res = await fetch(`/api/sessions/${sessionId}/replay`);
        currentReplayData = await res.json();

        // Show controls
        document.getElementById('replay-controls').classList.remove('hidden');

        // Update session info
        document.getElementById('session-info').innerHTML = `
            <div class="flex justify-between">
                <span class="text-slate-400">Session ID</span>
                <span class="font-mono text-xs">${currentReplayData.sessionId.substring(0, 15)}...</span>
            </div>
            <div class="flex justify-between">
                <span class="text-slate-400">Started</span>
                <span>${new Date(currentReplayData.startTime).toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-slate-400">Duration</span>
                <span>${formatDuration(currentReplayData.totalDuration)}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-slate-400">Events</span>
                <span class="font-bold">${currentReplayData.eventCount}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-slate-400">Prompts</span>
                <span>${currentReplayData.stats.promptCount || 0}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-slate-400">Tool Calls</span>
                <span>${currentReplayData.stats.toolCallCount || 0}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-slate-400">Agents</span>
                <span>${currentReplayData.stats.agentCount || 0}</span>
            </div>
        `;

        // Reset replay state
        replayIndex = 0;
        isPlaying = false;
        updateReplayTime();
        renderSessionTimeline();

    } catch (error) {
        console.error('Error loading session replay:', error);
    }
}

function renderSessionTimeline() {
    if (!currentReplayData) return;

    const container = document.getElementById('session-timeline');
    const filteredEvents = currentReplayData.timeline.filter(e => eventFilters[e.type] !== false);

    if (filteredEvents.length === 0) {
        container.innerHTML = '<div class="text-slate-500 text-center py-4">No events match the filter</div>';
        return;
    }

    container.innerHTML = filteredEvents.map((event, idx) => {
        const color = currentReplayData.typeColors[event.type] || '#6b7280';
        const isActive = idx === replayIndex;
        const isPast = idx < replayIndex;

        return `
            <div class="timeline-item flex gap-3 p-2 rounded cursor-pointer hover:bg-slate-700/50 ${isActive ? 'bg-slate-700/50 border-l-2 border-teal-400' : ''} ${isPast ? 'opacity-60' : ''}"
                 onclick="showEventDetail(${idx})" style="border-left-color: ${color};">
                <div class="flex-shrink-0 w-16 text-xs text-slate-500">${event.formattedTime}</div>
                <div class="flex-shrink-0 w-2 h-2 rounded-full mt-1.5" style="background: ${color};"></div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium">${formatEventType(event.type)}</div>
                    <div class="text-xs text-slate-500 truncate">${getEventPreview(event)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function formatEventType(type) {
    const typeNames = {
        'session_start': 'Session Start',
        'session_end': 'Session End',
        'prompt': 'Prompt',
        'response': 'Response',
        'tool_call': 'Tool Call',
        'tool_result': 'Tool Result',
        'agent_spawn': 'Agent Spawn',
        'agent_complete': 'Agent Complete',
        'plan_update': 'Plan Update',
        'task_update': 'Task Update',
        'error': 'Error',
        'alert': 'Alert'
    };
    return typeNames[type] || type;
}

function getEventPreview(event) {
    if (!event.data) return '';

    switch (event.type) {
        case 'prompt':
            return (event.data.prompt || '').substring(0, 60) + '...';
        case 'tool_call':
            return `${event.data.tool} (${event.data.success ? 'OK' : 'FAIL'})`;
        case 'agent_spawn':
        case 'agent_complete':
            return `${event.data.type || 'Unknown'} agent`;
        case 'error':
            return event.data.message || 'Error occurred';
        default:
            return event.data.message || '';
    }
}

function showEventDetail(index) {
    if (!currentReplayData) return;

    const filteredEvents = currentReplayData.timeline.filter(e => eventFilters[e.type] !== false);
    const event = filteredEvents[index];
    if (!event) return;

    replayIndex = index;
    renderSessionTimeline();

    const container = document.getElementById('event-detail');
    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-start">
                <div>
                    <div class="text-lg font-semibold">${formatEventType(event.type)}</div>
                    <div class="text-sm text-slate-500">${event.formattedTime} into session</div>
                </div>
                <span class="px-2 py-1 rounded text-xs" style="background: ${currentReplayData.typeColors[event.type]}20; color: ${currentReplayData.typeColors[event.type]}">
                    ${event.type}
                </span>
            </div>
            <div class="text-xs text-slate-500">${new Date(event.timestamp).toLocaleString()}</div>
            <div class="bg-slate-700/50 rounded p-3">
                <pre class="text-sm whitespace-pre-wrap overflow-x-auto">${JSON.stringify(event.data, null, 2)}</pre>
            </div>
        </div>
    `;
}

function toggleReplay() {
    if (isPlaying) {
        pauseReplay();
    } else {
        playReplay();
    }
}

function playReplay() {
    if (!currentReplayData || currentReplayData.timeline.length === 0) return;

    isPlaying = true;
    updatePlayButton();

    const filteredEvents = currentReplayData.timeline.filter(e => eventFilters[e.type] !== false);

    replayInterval = setInterval(() => {
        if (replayIndex >= filteredEvents.length - 1) {
            pauseReplay();
            return;
        }

        replayIndex++;
        showEventDetail(replayIndex);
        updateReplayTime();
    }, 1000 / replaySpeed);
}

function pauseReplay() {
    isPlaying = false;
    if (replayInterval) {
        clearInterval(replayInterval);
        replayInterval = null;
    }
    updatePlayButton();
}

function updatePlayButton() {
    const btn = document.getElementById('replay-play-btn');
    if (isPlaying) {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`;
    } else {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        </svg>`;
    }
}

function seekReplay(value) {
    if (!currentReplayData) return;

    const filteredEvents = currentReplayData.timeline.filter(e => eventFilters[e.type] !== false);
    replayIndex = Math.floor((value / 100) * (filteredEvents.length - 1));
    showEventDetail(replayIndex);
    updateReplayTime();
}

function setReplaySpeed(speed) {
    replaySpeed = parseFloat(speed);
    if (isPlaying) {
        pauseReplay();
        playReplay();
    }
}

function updateReplayTime() {
    if (!currentReplayData) return;

    const filteredEvents = currentReplayData.timeline.filter(e => eventFilters[e.type] !== false);
    const currentEvent = filteredEvents[replayIndex];
    const lastEvent = filteredEvents[filteredEvents.length - 1];

    const currentTime = currentEvent ? currentEvent.relativeTime : 0;
    const totalTime = lastEvent ? lastEvent.relativeTime : 0;

    document.getElementById('replay-time').textContent = `${formatDuration(currentTime)} / ${formatDuration(totalTime)}`;

    const slider = document.getElementById('replay-slider');
    slider.value = filteredEvents.length > 1 ? (replayIndex / (filteredEvents.length - 1)) * 100 : 0;
}

function filterSessionEvents(type, enabled) {
    eventFilters[type] = enabled;
    if (type === 'agent_spawn') eventFilters['agent_complete'] = enabled;
    renderSessionTimeline();
}

function formatDuration(ms) {
    if (!ms || ms <= 0) return '0:00';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

// ===== v3.0: Theme Toggle (Phase 18) =====

let currentTheme = localStorage.getItem('dashboard-theme') || 'dark';

function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('dashboard-theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const darkIcon = document.getElementById('theme-icon-dark');
    const lightIcon = document.getElementById('theme-icon-light');

    if (currentTheme === 'dark') {
        darkIcon.classList.remove('hidden');
        lightIcon.classList.add('hidden');
    } else {
        darkIcon.classList.add('hidden');
        lightIcon.classList.remove('hidden');
    }
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', initTheme);

// ===== v3.0: Unified Search (Phase 16) =====

let searchTimeout = null;

function handleSearchInput(event) {
    const query = event.target.value;

    if (event.key === 'Escape') {
        document.getElementById('search-dropdown').classList.remove('show');
        return;
    }

    clearTimeout(searchTimeout);

    if (query.length < 2) {
        document.getElementById('search-results').innerHTML = '<div class="p-3 text-slate-500 text-sm">Type to search...</div>';
        return;
    }

    searchTimeout = setTimeout(() => performSearch(query), 300);
}

async function performSearch(query) {
    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=30`);
        const results = await res.json();

        renderSearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
        document.getElementById('search-results').innerHTML = '<div class="p-3 text-red-400 text-sm">Search failed</div>';
    }
}

function renderSearchResults(results) {
    const container = document.getElementById('search-results');

    if (results.total === 0) {
        container.innerHTML = '<div class="p-3 text-slate-500 text-sm">No results found</div>';
        return;
    }

    let html = '';

    const categories = [
        { key: 'plans', label: 'Plans', icon: 'P' },
        { key: 'tasks', label: 'Tasks', icon: 'T' },
        { key: 'tools', label: 'Tools', icon: 'W' },
        { key: 'agents', label: 'Agents', icon: 'A' },
        { key: 'prompts', label: 'Prompts', icon: 'Q' }
    ];

    categories.forEach(cat => {
        if (results[cat.key] && results[cat.key].length > 0) {
            html += `<div class="search-category">${cat.label} (${results[cat.key].length})</div>`;
            results[cat.key].forEach(item => {
                html += `
                    <div class="search-item" onclick="goToSearchResult('${item.type}', '${item.id}')">
                        <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs font-bold">${cat.icon}</span>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm truncate">${item.highlight || escapeHtml(item.title)}</div>
                                <div class="text-xs text-slate-500 truncate">${escapeHtml(item.description || '')}</div>
                            </div>
                            ${item.status ? `<span class="text-xs px-2 py-0.5 rounded bg-slate-700">${item.status}</span>` : ''}
                        </div>
                    </div>
                `;
            });
        }
    });

    html += `<div class="p-2 text-xs text-center text-slate-500">${results.total} results</div>`;

    container.innerHTML = html;
}

function goToSearchResult(type, id) {
    document.getElementById('search-dropdown').classList.remove('show');
    document.getElementById('global-search').value = '';

    // Navigate to appropriate tab
    const tabMap = {
        'plan': 'plans',
        'task': 'tasks',
        'tool': 'tools',
        'agent': 'agents',
        'prompt': 'prompts'
    };

    const tab = tabMap[type] || 'plans';
    switchTab(tab);

    // TODO: Highlight specific item
    console.log(`Navigate to ${type}: ${id}`);
}

// Close search dropdown when clicking outside
document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('.relative:has(#global-search)');
    if (searchContainer && !searchContainer.contains(e.target)) {
        document.getElementById('search-dropdown').classList.remove('show');
    }
});

// ===== v3.0: Data Export (Phase 17) =====

function exportData(type, format = 'json') {
    const url = `/api/export/${type}?format=${format}`;
    window.open(url, '_blank');
}

// Add export buttons functionality
function showExportMenu(type) {
    const menu = document.createElement('div');
    menu.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    menu.onclick = (e) => { if (e.target === menu) menu.remove(); };
    menu.innerHTML = `
        <div class="bg-slate-800 rounded-lg p-6 w-80">
            <h3 class="text-lg font-semibold mb-4">Export ${type.charAt(0).toUpperCase() + type.slice(1)}</h3>
            <div class="space-y-3">
                <button onclick="exportData('${type}', 'json'); this.closest('.fixed').remove();"
                        class="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded text-left flex justify-between">
                    <span>JSON Format</span>
                    <span class="text-slate-400">.json</span>
                </button>
                <button onclick="exportData('${type}', 'csv'); this.closest('.fixed').remove();"
                        class="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded text-left flex justify-between">
                    <span>CSV Format</span>
                    <span class="text-slate-400">.csv</span>
                </button>
            </div>
            <button onclick="this.closest('.fixed').remove();"
                    class="mt-4 w-full py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded">
                Cancel
            </button>
        </div>
    `;
    document.body.appendChild(menu);
}

// Update switchTab to include sessions
const originalSwitchTab = typeof switchTab === 'function' ? switchTab : null;
window.switchTab = function(tab) {
    currentTab = tab;

    // Hide all content
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('tab-active');
        el.classList.add('text-slate-400');
    });

    // Show selected
    const content = document.getElementById(`content-${tab}`);
    if (content) content.classList.remove('hidden');

    const tabBtn = document.getElementById(`tab-${tab}`);
    if (tabBtn) {
        tabBtn.classList.add('tab-active');
        tabBtn.classList.remove('text-slate-400');
    }

    // Load tab-specific data
    switch (tab) {
        case 'sessions':
            loadSessionsTab();
            break;
        case 'tools':
            loadToolsTab();
            break;
        case 'agents':
            loadAgentsTab();
            break;
        case 'prompts':
            loadPromptsTab();
            break;
        case 'skills':
            loadSkillsTab();
            break;
        case 'tasks':
            loadTasksTab();
            break;
        case 'system':
            loadSystemTab();
            break;
        case 'costs':
            loadCostsTab();
            break;
    }
};
