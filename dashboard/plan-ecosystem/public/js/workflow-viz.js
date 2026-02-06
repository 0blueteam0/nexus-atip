/**
 * Workflow Visualization Component
 *
 * RIPER+ 워크플로우 시각화 및 LangGraph 상태 표시
 *
 * @version 1.0.0
 */

const WorkflowViz = {
  socket: null,
  activeWorkflows: [],
  currentWorkflow: null,
  mermaidInitialized: false,

  /**
   * 초기화
   */
  init(socket) {
    this.socket = socket;
    this.setupEventListeners();
    this.initMermaid();
    this.loadWorkflowData();
  },

  /**
   * Mermaid.js 초기화
   */
  initMermaid() {
    if (typeof mermaid !== 'undefined' && !this.mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#0d9488',
          primaryTextColor: '#f1f5f9',
          primaryBorderColor: '#475569',
          lineColor: '#94a3b8',
          secondaryColor: '#1e293b',
          tertiaryColor: '#334155'
        },
        flowchart: {
          curve: 'basis'
        }
      });
      this.mermaidInitialized = true;
    }
  },

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    if (this.socket) {
      // 워크플로우 시작
      this.socket.on('workflow-started', (data) => {
        this.onWorkflowStarted(data);
      });

      // Phase 변경
      this.socket.on('workflow-phase-changed', (data) => {
        this.onPhaseChanged(data);
      });

      // 워크플로우 완료
      this.socket.on('workflow-completed', (data) => {
        this.onWorkflowCompleted(data);
      });

      // Gate 결과
      this.socket.on('gate-result', (data) => {
        this.onGateResult(data);
      });

      // 인사이트 알림
      this.socket.on('insight-created', (data) => {
        this.onInsightCreated(data);
      });
    }
  },

  /**
   * 워크플로우 데이터 로드
   */
  async loadWorkflowData() {
    try {
      const [workflowRes, statsRes, insightsRes] = await Promise.all([
        fetch('/api/workflows'),
        fetch('/api/workflows/stats'),
        fetch('/api/insights?limit=5')
      ]);

      const workflows = await workflowRes.json();
      const stats = await statsRes.json();
      const insights = await insightsRes.json();

      this.activeWorkflows = workflows.active || [];
      this.renderWorkflowOverview(workflows, stats);
      this.renderInsights(insights.insights || []);

      if (this.activeWorkflows.length > 0) {
        this.selectWorkflow(this.activeWorkflows[0].workflowId);
      }
    } catch (error) {
      console.error('[!] Failed to load workflow data:', error);
    }
  },

  /**
   * 워크플로우 개요 렌더링
   */
  renderWorkflowOverview(workflows, stats) {
    const container = document.getElementById('workflow-overview');
    if (!container) return;

    container.innerHTML = `
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="soft-card">
          <div class="soft-project-stat">
            <div class="soft-project-stat-value">${stats.activeCount || 0}</div>
            <div class="soft-project-stat-label">Active Workflows</div>
          </div>
        </div>
        <div class="soft-card">
          <div class="soft-project-stat">
            <div class="soft-project-stat-value soft-text-success">${stats.totalCompleted || 0}</div>
            <div class="soft-project-stat-label">Completed</div>
          </div>
        </div>
        <div class="soft-card">
          <div class="soft-project-stat">
            <div class="soft-project-stat-value">${stats.successRate || 0}%</div>
            <div class="soft-project-stat-label">Success Rate</div>
          </div>
        </div>
        <div class="soft-card">
          <div class="soft-project-stat">
            <div class="soft-project-stat-value">${this.formatDuration(stats.avgDuration || 0)}</div>
            <div class="soft-project-stat-label">Avg Duration</div>
          </div>
        </div>
      </div>

      ${this.activeWorkflows.length > 0 ? `
        <div class="soft-card mb-4">
          <h3 class="text-lg font-semibold mb-3">Active Workflows</h3>
          <div class="space-y-2">
            ${this.activeWorkflows.map(wf => this.renderWorkflowCard(wf)).join('')}
          </div>
        </div>
      ` : ''}
    `;
  },

  /**
   * 워크플로우 카드 렌더링
   */
  renderWorkflowCard(workflow) {
    const phaseIndex = this.getPhaseIndex(workflow.currentPhase);
    const progress = Math.round((phaseIndex / 5) * 100);

    return `
      <div class="soft-goal-item cursor-pointer" onclick="WorkflowViz.selectWorkflow('${workflow.workflowId}')">
        <div class="flex-1">
          <div class="font-medium">${workflow.taskId || workflow.workflowId}</div>
          <div class="text-sm soft-text-muted">Phase: ${workflow.currentPhase?.toUpperCase() || 'SPECIFY'}</div>
        </div>
        <div class="soft-progress" style="width: 100px;">
          <div class="soft-progress-bar" style="width: ${progress}%"></div>
        </div>
        <span class="soft-badge soft-badge-primary">${progress}%</span>
      </div>
    `;
  },

  /**
   * 워크플로우 선택
   */
  async selectWorkflow(workflowId) {
    this.currentWorkflow = this.activeWorkflows.find(w => w.workflowId === workflowId);

    try {
      const [timelineRes, mermaidRes] = await Promise.all([
        fetch(`/api/workflows/${workflowId}/timeline`),
        fetch(`/api/workflows/${workflowId}/mermaid`)
      ]);

      const timeline = await timelineRes.json();
      const mermaid = await mermaidRes.json();

      this.renderWorkflowDetail(timeline, mermaid);
    } catch (error) {
      console.error('[!] Failed to load workflow detail:', error);
    }
  },

  /**
   * 워크플로우 상세 렌더링
   */
  renderWorkflowDetail(timeline, mermaidData) {
    const container = document.getElementById('workflow-detail');
    if (!container) return;

    container.innerHTML = `
      <div class="soft-card">
        <div class="soft-card-header">
          <h3 class="soft-card-title">Workflow: ${timeline.workflowId}</h3>
          <span class="soft-badge soft-badge-primary">${timeline.currentPhase?.toUpperCase() || 'N/A'}</span>
        </div>

        <!-- RIPER+ Phase Tracker -->
        <div class="soft-phase-tracker mb-6">
          ${this.renderPhaseTracker(timeline)}
        </div>

        <!-- Mermaid Diagram -->
        <div id="mermaid-container" class="mb-6 p-4 bg-slate-900 rounded-lg">
          <div id="mermaid-diagram"></div>
        </div>

        <!-- Phase Timeline -->
        <div class="mb-4">
          <h4 class="font-semibold mb-3">Phase Timeline</h4>
          <div class="space-y-2">
            ${(timeline.phases || []).map(p => this.renderPhaseItem(p)).join('')}
          </div>
        </div>
      </div>
    `;

    // Mermaid 다이어그램 렌더링
    this.renderMermaid(mermaidData.mermaid);
  },

  /**
   * Phase Tracker 렌더링
   */
  renderPhaseTracker(timeline) {
    const phases = ['specify', 'explore', 'plan', 'implement', 'verify', 'release'];
    const currentPhase = timeline.currentPhase || 'specify';
    const currentIndex = phases.indexOf(currentPhase);

    return phases.map((phase, index) => {
      const isActive = phase === currentPhase;
      const isCompleted = index < currentIndex;
      const phaseData = (timeline.phases || []).find(p => p.phase === phase);

      return `
        <div class="soft-phase-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
          <div class="soft-phase-name">${phase.toUpperCase()}</div>
          <div class="soft-phase-progress">
            ${isCompleted ? '100%' : isActive ? 'In Progress' : 'Pending'}
          </div>
          ${phaseData?.duration ? `
            <div class="text-xs soft-text-muted mt-1">
              ${this.formatDuration(phaseData.duration)}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  },

  /**
   * Phase 아이템 렌더링
   */
  renderPhaseItem(phase) {
    const statusIcon = phase.endTime ? '[+]' : '[*]';
    const statusColor = phase.endTime ? 'soft-text-success' : 'soft-text-warning';

    return `
      <div class="soft-goal-item">
        <span class="${statusColor}">${statusIcon}</span>
        <span class="font-medium flex-1">${phase.phase?.toUpperCase() || 'N/A'}</span>
        <span class="text-sm soft-text-muted">
          ${phase.startTime ? new Date(phase.startTime).toLocaleTimeString() : ''}
        </span>
        ${phase.duration ? `
          <span class="soft-badge soft-badge-info">${this.formatDuration(phase.duration)}</span>
        ` : ''}
      </div>
    `;
  },

  /**
   * Mermaid 다이어그램 렌더링
   */
  async renderMermaid(code) {
    const container = document.getElementById('mermaid-diagram');
    if (!container || !code) return;

    try {
      if (typeof mermaid !== 'undefined') {
        container.innerHTML = '';
        const { svg } = await mermaid.render('mermaid-graph', code);
        container.innerHTML = svg;
      } else {
        container.innerHTML = `<pre class="text-sm text-slate-400">${code}</pre>`;
      }
    } catch (error) {
      console.error('[!] Mermaid render error:', error);
      container.innerHTML = `<pre class="text-sm text-red-400">Diagram render error</pre>`;
    }
  },

  /**
   * 인사이트 렌더링
   */
  renderInsights(insights) {
    const container = document.getElementById('workflow-insights');
    if (!container) return;

    if (insights.length === 0) {
      container.innerHTML = `
        <div class="soft-card text-center py-4">
          <p class="soft-text-muted">No insights yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="soft-card">
        <h3 class="font-semibold mb-3">Recent Insights</h3>
        <div class="space-y-2">
          ${insights.map(i => this.renderInsightItem(i)).join('')}
        </div>
      </div>
    `;
  },

  /**
   * 인사이트 아이템 렌더링
   */
  renderInsightItem(insight) {
    const typeIcons = {
      suggestion: '[*]',
      warning: '[!]',
      optimization: '[+]',
      milestone: '[#]',
      prediction: '[?]'
    };

    const typeColors = {
      suggestion: 'soft-text-primary',
      warning: 'soft-text-warning',
      optimization: 'soft-text-success',
      milestone: 'soft-badge-info',
      prediction: 'soft-text-muted'
    };

    return `
      <div class="soft-goal-item ${insight.acknowledged ? 'opacity-50' : ''}">
        <span class="${typeColors[insight.type] || 'soft-text-muted'}">${typeIcons[insight.type] || '[*]'}</span>
        <div class="flex-1">
          <div class="font-medium">${this.escapeHtml(insight.title)}</div>
          <div class="text-sm soft-text-muted">${this.escapeHtml(insight.description)}</div>
        </div>
        ${!insight.acknowledged ? `
          <button onclick="WorkflowViz.acknowledgeInsight('${insight.id}')" class="soft-btn soft-btn-ghost text-xs">
            Dismiss
          </button>
        ` : ''}
      </div>
    `;
  },

  /**
   * 인사이트 확인 처리
   */
  async acknowledgeInsight(insightId) {
    try {
      await fetch(`/api/insights/${insightId}/acknowledge`, { method: 'POST' });
      this.loadWorkflowData(); // 새로고침
    } catch (error) {
      console.error('[!] Failed to acknowledge insight:', error);
    }
  },

  // ============================================
  // 실시간 이벤트 핸들러
  // ============================================

  onWorkflowStarted(data) {
    console.log('[+] Workflow started:', data.workflowId);
    this.loadWorkflowData();
    this.showNotification('Workflow Started', `Task: ${data.taskId}`);
  },

  onPhaseChanged(data) {
    console.log('[*] Phase changed:', data);
    if (this.currentWorkflow?.workflowId === data.workflowId) {
      this.selectWorkflow(data.workflowId);
    }
    this.updatePhaseUI(data);
  },

  onWorkflowCompleted(data) {
    console.log('[+] Workflow completed:', data.workflowId);
    this.loadWorkflowData();
    this.showNotification('Workflow Completed', `Duration: ${this.formatDuration(data.duration)}`);
  },

  onGateResult(data) {
    console.log('[*] Gate result:', data);
    const icon = data.passed ? '[+]' : '[!]';
    const msg = data.passed ? 'Gate Passed' : 'Gate Failed';
    this.showNotification(`${icon} ${msg}`, `Phase: ${data.phase?.toUpperCase()}`);
  },

  onInsightCreated(data) {
    console.log('[*] Insight created:', data);
    this.loadWorkflowData();
  },

  // ============================================
  // 유틸리티
  // ============================================

  updatePhaseUI(data) {
    // Phase card 하이라이트 업데이트
    const phaseCards = document.querySelectorAll('.soft-phase-card');
    phaseCards.forEach(card => {
      const phaseName = card.querySelector('.soft-phase-name')?.textContent?.toLowerCase();
      card.classList.remove('active', 'completed');

      if (phaseName === data.toPhase) {
        card.classList.add('active');
      } else if (this.getPhaseIndex(phaseName) < this.getPhaseIndex(data.toPhase)) {
        card.classList.add('completed');
      }
    });
  },

  getPhaseIndex(phase) {
    const phases = ['specify', 'explore', 'plan', 'implement', 'verify', 'release'];
    return phases.indexOf(phase?.toLowerCase() || 'specify');
  },

  formatDuration(ms) {
    if (!ms || ms < 1000) return '< 1s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  },

  showNotification(title, message) {
    // 간단한 토스트 알림
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 soft-card p-4 z-50 soft-animate-fade';
    toast.innerHTML = `
      <div class="font-semibold">${this.escapeHtml(title)}</div>
      <div class="text-sm soft-text-muted">${this.escapeHtml(message)}</div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// 전역 노출
window.WorkflowViz = WorkflowViz;
