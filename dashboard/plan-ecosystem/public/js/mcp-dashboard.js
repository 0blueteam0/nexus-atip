/**
 * MCP Dashboard Component
 *
 * MCP 서버 통합 시각화 (vibekanban, kiro-memory)
 *
 * @version 1.0.0
 */

const MCPDashboard = {
  socket: null,
  mcpStatus: null,
  vibekanbanData: null,
  kiroData: null,

  /**
   * 초기화
   */
  init(socket) {
    this.socket = socket;
    this.setupEventListeners();
  },

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    if (this.socket) {
      this.socket.on('mcp-status-updated', (data) => {
        this.mcpStatus = data;
        this.renderStatus();
      });
    }
  },

  /**
   * MCP 데이터 로드
   */
  async loadMCPData() {
    try {
      const [statusRes, tasksRes, projectsRes] = await Promise.all([
        fetch('/api/mcp/status'),
        fetch('/api/mcp/tasks'),
        fetch('/api/mcp/vibekanban/projects')
      ]);

      this.mcpStatus = await statusRes.json();
      const tasksData = await tasksRes.json();
      const projectsData = await projectsRes.json();

      this.renderOverview(tasksData, projectsData);
      this.renderStatus();
      this.renderTasksList(tasksData.tasks);
    } catch (error) {
      console.error('[!] Failed to load MCP data:', error);
    }
  },

  /**
   * 개요 렌더링
   */
  renderOverview(tasksData, projectsData) {
    const container = document.getElementById('mcp-overview');
    if (!container) return;

    container.innerHTML = `
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="soft-card">
          <div class="soft-project-stat">
            <div class="soft-project-stat-value">${tasksData.stats?.total || 0}</div>
            <div class="soft-project-stat-label">MCP Tasks</div>
          </div>
        </div>
        <div class="soft-card">
          <div class="soft-project-stat">
            <div class="soft-project-stat-value soft-text-primary">${tasksData.stats?.vibekanban || 0}</div>
            <div class="soft-project-stat-label">Vibekanban</div>
          </div>
        </div>
        <div class="soft-card">
          <div class="soft-project-stat">
            <div class="soft-project-stat-value">${tasksData.stats?.kiroMemory || 0}</div>
            <div class="soft-project-stat-label">Kiro Memory</div>
          </div>
        </div>
        <div class="soft-card">
          <div class="soft-project-stat">
            <div class="soft-project-stat-value">${projectsData.count || 0}</div>
            <div class="soft-project-stat-label">Kanban Projects</div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * MCP 서버 상태 렌더링
   */
  renderStatus() {
    const container = document.getElementById('mcp-status');
    if (!container || !this.mcpStatus) return;

    const vibekanban = this.mcpStatus.vibekanban || {};
    const kiroMemory = this.mcpStatus.kiroMemory || {};

    container.innerHTML = `
      <div class="soft-card">
        <h3 class="font-semibold mb-4">MCP Server Status</h3>
        <div class="space-y-3">
          ${this.renderServerStatus('Vibekanban', vibekanban)}
          ${this.renderServerStatus('Kiro Memory', kiroMemory)}
        </div>
      </div>
    `;
  },

  /**
   * 서버 상태 카드 렌더링
   */
  renderServerStatus(name, status) {
    const isAvailable = status.available;
    const icon = isAvailable ? '[+]' : '[-]';
    const colorClass = isAvailable ? 'soft-text-success' : 'soft-text-muted';

    return `
      <div class="soft-goal-item">
        <span class="${colorClass}">${icon}</span>
        <div class="flex-1">
          <div class="font-medium">${name}</div>
          <div class="text-sm soft-text-muted">
            ${isAvailable ? 'Connected' : 'Not Available'}
          </div>
        </div>
        ${status.stats ? `
          <div class="text-sm">
            ${status.stats.projects !== undefined ? `${status.stats.projects} projects` : ''}
            ${status.stats.tickets !== undefined ? ` | ${status.stats.tickets} tickets` : ''}
            ${status.stats.tasks !== undefined ? `${status.stats.tasks} tasks` : ''}
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * 태스크 목록 렌더링
   */
  renderTasksList(tasks) {
    const container = document.getElementById('mcp-tasks');
    if (!container) return;

    if (!tasks || tasks.length === 0) {
      container.innerHTML = `
        <div class="soft-card text-center py-8">
          <p class="soft-text-muted">No MCP tasks available</p>
          <p class="text-sm soft-text-muted mt-2">Use vibekanban or kiro-memory to create tasks</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="soft-card">
        <h3 class="font-semibold mb-4">Unified MCP Tasks</h3>
        <div class="space-y-2">
          ${tasks.map(task => this.renderTaskItem(task)).join('')}
        </div>
      </div>
    `;
  },

  /**
   * 태스크 아이템 렌더링
   */
  renderTaskItem(task) {
    const statusIcon = {
      'pending': '[ ]',
      'in-progress': '[*]',
      'completed': '[+]'
    }[task.status] || '[ ]';

    const statusColor = {
      'pending': 'soft-text-muted',
      'in-progress': 'soft-text-warning',
      'completed': 'soft-text-success'
    }[task.status] || 'soft-text-muted';

    const sourceColor = {
      'vibekanban': 'soft-badge-primary',
      'kiro-memory': 'soft-badge-info'
    }[task.source] || 'soft-badge-secondary';

    return `
      <div class="soft-goal-item">
        <span class="${statusColor}">${statusIcon}</span>
        <div class="flex-1">
          <div class="font-medium">${this.escapeHtml(task.name)}</div>
          ${task.projectName ? `<div class="text-sm soft-text-muted">${this.escapeHtml(task.projectName)}</div>` : ''}
        </div>
        <span class="soft-badge ${sourceColor}">${task.source}</span>
      </div>
    `;
  },

  /**
   * Vibekanban 칸반 보드 로드
   */
  async loadKanbanBoard(projectId) {
    try {
      const res = await fetch(`/api/mcp/vibekanban/kanban/${projectId}`);
      const data = await res.json();
      this.renderKanbanBoard(data);
    } catch (error) {
      console.error('[!] Failed to load kanban board:', error);
    }
  },

  /**
   * 칸반 보드 렌더링
   */
  renderKanbanBoard(data) {
    const container = document.getElementById('mcp-kanban');
    if (!container || !data || !data.project) return;

    container.innerHTML = `
      <div class="soft-card">
        <h3 class="font-semibold mb-4">${this.escapeHtml(data.project.name)} - Kanban Board</h3>
        <div class="grid grid-cols-${data.columns?.length || 3} gap-4">
          ${(data.columns || []).map(col => `
            <div class="bg-slate-700/50 rounded-lg p-3">
              <div class="flex justify-between items-center mb-2">
                <span class="font-medium">${this.escapeHtml(col.name)}</span>
                <span class="soft-badge soft-badge-secondary">${col.count}</span>
              </div>
              <div class="min-h-[100px]">
                <!-- Tickets will be loaded here -->
              </div>
            </div>
          `).join('')}
        </div>
        <div class="mt-4 text-sm soft-text-muted">
          Total: ${data.totalTickets || 0} tickets
        </div>
      </div>
    `;
  },

  /**
   * Kiro Memory Thinking Chains 로드
   */
  async loadThinkingChains() {
    try {
      const res = await fetch('/api/mcp/kiro/thinking-chains?limit=10');
      const data = await res.json();
      this.renderThinkingChains(data.chains);
    } catch (error) {
      console.error('[!] Failed to load thinking chains:', error);
    }
  },

  /**
   * Thinking Chains 렌더링
   */
  renderThinkingChains(chains) {
    const container = document.getElementById('mcp-thinking');
    if (!container) return;

    if (!chains || chains.length === 0) {
      container.innerHTML = `
        <div class="soft-card text-center py-4">
          <p class="soft-text-muted">No thinking chains yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="soft-card">
        <h3 class="font-semibold mb-4">Thinking Chains</h3>
        <div class="space-y-2">
          ${chains.map(chain => `
            <div class="soft-goal-item">
              <span class="soft-text-primary">[*]</span>
              <div class="flex-1">
                <div class="font-medium">${this.escapeHtml(chain.topic || 'Untitled')}</div>
                <div class="text-sm soft-text-muted">${chain.steps?.length || 0} steps</div>
              </div>
              <span class="soft-badge soft-badge-info">${chain.status || 'pending'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * HTML 이스케이프
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// 전역 노출
window.MCPDashboard = MCPDashboard;
