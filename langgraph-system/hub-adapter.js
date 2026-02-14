#!/usr/bin/env node
/**
 * LangGraph Hub Adapter
 * 
 * 위치: K:/PortableApps/genai/langgraph-system/hub-adapter.js
 * 
 * 목적:
 * - UnifiedTaskHub와 LangGraph State 양방향 동기화
 * - Phase 변경 시 Hub 자동 업데이트
 * - Task 상태 변경 시 LangGraph State 업데이트
 * 
 * @module langgraph-system/hub-adapter
 * @version 1.0.0
 */

const path = require('path');
const { EVENTS, getInstance: getEventBus } = require('../unified-task-system/event-bus');

// Hub 동적 로드 (순환 참조 방지)
let UnifiedTaskHub = null;
let hubInstance = null;

// Lifecycle Collector 동적 로드 (Phase 8D)
let lifecycleCollector = null;
function getLifecycleCollector() {
  if (!lifecycleCollector) {
    try {
      lifecycleCollector = require('../dashboard/plan-ecosystem/collectors/lifecycle-collector');
    } catch (e) {
      console.log('[*] Lifecycle collector not available');
    }
  }
  return lifecycleCollector;
}

function getHub() {
  if (!hubInstance) {
    if (!UnifiedTaskHub) {
      UnifiedTaskHub = require('../unified-task-system/unified-task-hub');
    }
    hubInstance = new UnifiedTaskHub({ autoSync: false });
  }
  return hubInstance;
}

const eventBus = getEventBus();


/**
 * Phase 매핑 (LangGraph -> Hub)
 */
const PHASE_MAP = {
  specify: 'specify',
  explore: 'explore',
  plan: 'plan',
  implement: 'implement',
  verify: 'verify',
  release: 'release'
};

/**
 * RIPER+ Phase -> Lifecycle Phase 매핑 (Phase 8D)
 */
const RIPER_TO_LIFECYCLE = {
  specify: 'prd',
  explore: 'prd',
  plan: 'prd',
  implement: 'implementation',
  verify: 'implementation',
  release: 'release'
};

/**
 * Status 매핑 (LangGraph -> Hub)
 */
const STATUS_MAP = {
  pending: 'pending',
  running: 'in_progress',
  completed: 'completed',
  failed: 'blocked',
  paused: 'pending'
};

/**
 * HubAdapter 클래스
 */
class HubAdapter {
  constructor(options = {}) {
    this.options = {
      autoUpdate: options.autoUpdate !== false,
      ...options
    };
    
    this.activeWorkflows = new Map(); // taskId -> threadId
    this.listeners = [];
  }


  /**
   * 초기화 - 이벤트 리스너 등록
   */
  init() {
    if (this.options.autoUpdate) {
      this._setupEventListeners();
    }
    console.log('[+] HubAdapter 초기화 완료');
    return this;
  }

  /**
   * 이벤트 리스너 설정
   */
  _setupEventListeners() {
    // Hub -> LangGraph: 태스크 업데이트 시
    const hubUpdateKey = eventBus.subscribe(EVENTS.TASK_UPDATED, async (data) => {
      const { task } = data;
      if (this.activeWorkflows.has(task?.id)) {
        await this._syncHubToLangGraph(task);
      }
    }, 'hub-adapter');
    this.listeners.push(hubUpdateKey);

    // LangGraph -> Hub: Phase 변경 시
    const phaseChangeKey = eventBus.subscribe(EVENTS.PHASE_CHANGED, async (data) => {
      const { taskId, phase, gateResult } = data;
      await this._syncLangGraphToHub(taskId, phase, gateResult);
    }, 'hub-adapter');
    this.listeners.push(phaseChangeKey);

    console.log('[*] HubAdapter 이벤트 리스너 등록됨');
  }


  /**
   * Hub 태스크를 LangGraph State로 변환
   */
  hubTaskToLangGraphState(hubTask) {
    return {
      currentTask: {
        id: hubTask.id,
        title: hubTask.title,
        description: hubTask.description,
        acceptance_criteria: hubTask.subtasks?.map(st => st.title) || []
      },
      currentPhase: PHASE_MAP[hubTask.phase] || 'specify',
      metadata: {
        hubId: hubTask.id,
        hubSource: hubTask.source,
        hubPhase: hubTask.phase,
        lastSync: new Date().toISOString()
      }
    };
  }

  /**
   * LangGraph State를 Hub 태스크 업데이트로 변환
   */
  langGraphStateToHubUpdate(state) {
    return {
      phase: state.currentPhase,
      status: state.taskQueue?.completed?.includes(state.currentTask?.id) 
        ? 'completed' 
        : 'in_progress',
      metadata: {
        langGraphPhase: state.currentPhase,
        lastPhaseChange: new Date().toISOString(),
        gateResults: state.gateResults
      }
    };
  }


  /**
   * 워크플로우 시작 등록
   */
  startWorkflow(hubTask) {
    const threadId = `thread-${hubTask.id}-${Date.now()}`;
    this.activeWorkflows.set(hubTask.id, threadId);

    // Hub 태스크 상태 업데이트
    const hub = getHub();
    hub.updateTask(hubTask.id, {
      status: 'in_progress',
      phase: 'specify',
      metadata: {
        ...hubTask.metadata,
        langGraphThreadId: threadId,
        workflowStarted: new Date().toISOString()
      }
    });

    // 이벤트 발행
    eventBus.publish(EVENTS.WORKFLOW_STARTED, {
      taskId: hubTask.id,
      threadId,
      task: hubTask
    }, 'hub-adapter');

    console.log(`[+] 워크플로우 시작: ${hubTask.id} -> ${threadId}`);
    return threadId;
  }

  /**
   * 워크플로우 완료 등록
   */
  completeWorkflow(taskId, result = {}) {
    const threadId = this.activeWorkflows.get(taskId);
    if (!threadId) return null;

    this.activeWorkflows.delete(taskId);

    // Hub 태스크 완료 처리
    const hub = getHub();
    hub.updateTask(taskId, {
      status: 'completed',
      phase: 'release',
      completedAt: new Date().toISOString(),
      metadata: {
        workflowCompleted: new Date().toISOString(),
        workflowResult: result
      }
    });

    // 이벤트 발행
    eventBus.publish(EVENTS.WORKFLOW_COMPLETED, {
      taskId,
      threadId,
      result
    }, 'hub-adapter');

    console.log(`[+] 워크플로우 완료: ${taskId}`);
    return { taskId, threadId, result };
  }

  /**
   * Hub -> LangGraph 동기화
   */
  async _syncHubToLangGraph(hubTask) {
    const threadId = this.activeWorkflows.get(hubTask.id);
    if (!threadId) return;

    console.log(`[*] Hub -> LangGraph 동기화: ${hubTask.id}`);
    // 실제 LangGraph 상태 업데이트는 graph.js의 resumeWorkflow 사용
    // 여기서는 이벤트만 발행
    eventBus.publish('hub-adapter:sync:hub-to-langgraph', {
      taskId: hubTask.id,
      threadId,
      state: this.hubTaskToLangGraphState(hubTask)
    }, 'hub-adapter');
  }

  /**
   * LangGraph -> Hub 동기화
   */
  async _syncLangGraphToHub(taskId, phase, gateResult = null) {
    console.log(`[*] LangGraph -> Hub 동기화: ${taskId} -> ${phase}`);

    const hub = getHub();
    const updates = {
      phase,
      status: 'in_progress',
      metadata: {
        langGraphPhase: phase,
        lastPhaseChange: new Date().toISOString()
      }
    };

    if (gateResult) {
      updates.metadata.lastGateResult = gateResult;
    }

    hub.updateTask(taskId, updates);

    // Phase 8D: Lifecycle 동기화
    this._syncToLifecycle(taskId, phase, gateResult);
  }

  /**
   * Lifecycle 동기화 (Phase 8D)
   * RIPER+ 워크플로우와 Planning Lifecycle 연결
   */
  _syncToLifecycle(taskId, phase, gateResult = null) {
    const lc = getLifecycleCollector();
    if (!lc) return;

    const hub = getHub();
    const task = hub.getTask(taskId);
    if (!task) return;

    // planId 추출 (metadata에서 또는 taskId에서)
    const planId = task.metadata?.planId || task.planId;
    if (!planId) {
      console.log(`  [*] No planId for task ${taskId}, skipping lifecycle sync`);
      return;
    }

    const lifecyclePhase = RIPER_TO_LIFECYCLE[phase];
    if (!lifecyclePhase) return;

    try {
      const lifecycle = lc.loadLifecycle(planId);

      // Phase 업데이트
      if (lifecycle.phases[lifecyclePhase].status !== 'completed') {
        lifecycle.phases[lifecyclePhase].status = 'in_progress';
        if (!lifecycle.phases[lifecyclePhase].startedAt) {
          lifecycle.phases[lifecyclePhase].startedAt = new Date().toISOString();
        }

        // Progress 추정 (RIPER phase 기반)
        const riperProgress = { specify: 10, explore: 30, plan: 50, implement: 70, verify: 90, release: 100 };
        const baseProgress = riperProgress[phase] || 50;
        lifecycle.phases[lifecyclePhase].progress = Math.max(
          lifecycle.phases[lifecyclePhase].progress,
          Math.min(100, baseProgress)
        );
      }

      // 전체 진행률 계산
      const weights = { prd: 15, mvp: 25, implementation: 45, release: 15 };
      lifecycle.overallProgress = Math.round(
        Object.entries(weights).reduce((sum, [p, weight]) => {
          return sum + (lifecycle.phases[p].progress / 100) * weight;
        }, 0)
      );

      lc.saveLifecycle(lifecycle);
      console.log(`  [+] Lifecycle synced: ${planId}/${lifecyclePhase} -> ${lifecycle.overallProgress}%`);

      // Dashboard 실시간 알림
      eventBus.publish('lifecycle-phase-changed', {
        planId,
        phase: lifecyclePhase,
        progress: lifecycle.phases[lifecyclePhase].progress,
        overallProgress: lifecycle.overallProgress
      }, 'hub-adapter');

    } catch (e) {
      console.log(`  [*] Lifecycle sync failed: ${e.message}`);
    }
  }

  /**
   * Phase 변경 알림 (nodes.js에서 호출)
   */
  notifyPhaseChange(taskId, newPhase, gateResult = null) {
    eventBus.publish(EVENTS.PHASE_CHANGED, {
      taskId,
      phase: newPhase,
      gateResult
    }, 'langgraph');
  }

  /**
   * Gate 결과 알림
   */
  notifyGateResult(taskId, phase, passed, checklist = []) {
    const event = passed ? EVENTS.GATE_PASSED : EVENTS.GATE_FAILED;
    eventBus.publish(event, {
      taskId,
      phase,
      passed,
      checklist
    }, 'langgraph');
  }

  /**
   * 활성 워크플로우 조회
   */
  getActiveWorkflows() {
    return Array.from(this.activeWorkflows.entries()).map(([taskId, threadId]) => ({
      taskId,
      threadId
    }));
  }

  /**
   * 상태 조회
   */
  getStatus() {
    return {
      activeWorkflows: this.activeWorkflows.size,
      workflows: this.getActiveWorkflows(),
      listenersCount: this.listeners.length
    };
  }


  /**
   * 정리
   */
  destroy() {
    for (const key of this.listeners) {
      eventBus.unsubscribe(key);
    }
    this.listeners = [];
    this.activeWorkflows.clear();
    console.log('[*] HubAdapter 정리됨');
  }
}

// ============================================
// Singleton 인스턴스
// ============================================

let adapterInstance = null;

function getHubAdapter(options) {
  if (!adapterInstance) {
    adapterInstance = new HubAdapter(options);
    adapterInstance.init();
  }
  return adapterInstance;
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  HubAdapter,
  getHubAdapter,
  PHASE_MAP,
  STATUS_MAP
};

// CLI 실행
if (require.main === module) {
  const adapter = getHubAdapter();
  console.log('\n--- Hub Adapter Status ---\n');
  console.log(JSON.stringify(adapter.getStatus(), null, 2));
}
