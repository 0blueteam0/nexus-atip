/**
 * Workflow Collector
 * 
 * 위치: K:/PortableApps/genai/dashboard/plan-ecosystem/collectors/workflow-collector.js
 * 
 * 목적:
 * - RIPER+ 워크플로우 상태 수집
 * - LangGraph 실행 히스토리 추적
 * - Mermaid 다이어그램 생성
 * 
 * @module collectors/workflow-collector
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/genai';
const WORKFLOW_DATA_PATH = path.join(BASE_PATH, 'data', 'workflow-history.json');

// RIPER+ Phase 정의
const RIPER_PHASES = ['specify', 'explore', 'plan', 'implement', 'verify', 'release'];

// 워크플로우 히스토리 저장소
let workflowHistory = [];
let activeWorkflows = new Map();

/**
 * 데이터 로드
 */
function loadWorkflowData() {
  try {
    if (fs.existsSync(WORKFLOW_DATA_PATH)) {
      const raw = fs.readFileSync(WORKFLOW_DATA_PATH, 'utf8');
      const data = JSON.parse(raw);
      workflowHistory = data.history || [];
      return data;
    }
  } catch (error) {
    console.error('[!] Workflow data load error:', error.message);
  }
  return { history: [], activeWorkflows: [] };
}

/**
 * 데이터 저장
 */
function saveWorkflowData() {
  try {
    const dir = path.dirname(WORKFLOW_DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const data = {
      lastUpdated: new Date().toISOString(),
      history: workflowHistory.slice(-500), // 최근 500개만 유지
      activeWorkflows: Array.from(activeWorkflows.entries()).map(([id, wf]) => ({ id, ...wf }))
    };
    
    fs.writeFileSync(WORKFLOW_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('[!] Workflow data save error:', error.message);
  }
}

// 초기 로드
loadWorkflowData();


/**
 * 워크플로우 시작 기록
 */
function recordWorkflowStart(workflowId, taskId, metadata = {}) {
  const workflow = {
    workflowId,
    taskId,
    startTime: new Date().toISOString(),
    currentPhase: 'specify',
    phaseHistory: [{ phase: 'specify', startTime: new Date().toISOString() }],
    gateResults: {},
    status: 'running',
    metadata
  };
  
  activeWorkflows.set(workflowId, workflow);
  
  workflowHistory.push({
    type: 'workflow_started',
    workflowId,
    taskId,
    timestamp: new Date().toISOString()
  });
  
  saveWorkflowData();
  return workflow;
}

/**
 * Phase 변경 기록
 */
function recordPhaseChange(workflowId, newPhase, gateResult = null) {
  const workflow = activeWorkflows.get(workflowId);
  if (!workflow) return null;
  
  const now = new Date().toISOString();
  // 이전 phase 종료
  const lastPhase = workflow.phaseHistory[workflow.phaseHistory.length - 1];
  if (lastPhase && !lastPhase.endTime) {
    lastPhase.endTime = now;
    lastPhase.duration = new Date(now) - new Date(lastPhase.startTime);
  }
  
  // 새 phase 시작
  workflow.phaseHistory.push({ phase: newPhase, startTime: now });
  workflow.currentPhase = newPhase;
  
  // Gate 결과 저장
  if (gateResult) {
    workflow.gateResults[workflow.phaseHistory.length - 2] = gateResult;
  }
  
  workflowHistory.push({
    type: 'phase_changed',
    workflowId,
    fromPhase: lastPhase?.phase,
    toPhase: newPhase,
    gateResult,
    timestamp: now
  });
  
  saveWorkflowData();
  return workflow;
}

/**
 * 워크플로우 완료 기록
 */
function recordWorkflowComplete(workflowId, result = {}) {
  const workflow = activeWorkflows.get(workflowId);
  if (!workflow) return null;
  
  const now = new Date().toISOString();
  // 마지막 phase 종료
  const lastPhase = workflow.phaseHistory[workflow.phaseHistory.length - 1];
  if (lastPhase && !lastPhase.endTime) {
    lastPhase.endTime = now;
    lastPhase.duration = new Date(now) - new Date(lastPhase.startTime);
  }
  
  workflow.endTime = now;
  workflow.status = 'completed';
  workflow.result = result;
  workflow.totalDuration = new Date(now) - new Date(workflow.startTime);
  
  activeWorkflows.delete(workflowId);
  
  workflowHistory.push({
    type: 'workflow_completed',
    workflowId,
    taskId: workflow.taskId,
    duration: workflow.totalDuration,
    result,
    timestamp: now
  });
  
  saveWorkflowData();
  return workflow;
}

/**
 * 현재 워크플로우 상태 조회
 */
function getCurrentWorkflow(workflowId) {
  return activeWorkflows.get(workflowId) || null;
}

/**
 * 모든 활성 워크플로우 조회
 */
function getActiveWorkflows() {
  return Array.from(activeWorkflows.values());
}


/**
 * 워크플로우 히스토리 조회
 */
function getWorkflowHistory(options = {}) {
  const { limit = 50, type = null, workflowId = null } = options;
  
  let history = [...workflowHistory];
  
  if (type) {
    history = history.filter(h => h.type === type);
  }
  if (workflowId) {
    history = history.filter(h => h.workflowId === workflowId);
  }
  
  return history.slice(-limit).reverse();
}

/**
 * 워크플로우 통계
 */
function getWorkflowStats() {
  const completed = workflowHistory.filter(h => h.type === 'workflow_completed');
  
  let totalDuration = 0;
  let successCount = 0;
  
  for (const wf of completed) {
    totalDuration += wf.duration || 0;
    if (wf.result?.success !== false) successCount++;
  }
  
  return {
    totalCompleted: completed.length,
    activeCount: activeWorkflows.size,
    avgDuration: completed.length > 0 ? Math.round(totalDuration / completed.length) : 0,
    successRate: completed.length > 0 ? (successCount / completed.length * 100).toFixed(1) : 0,
    phaseBreakdown: getPhaseBreakdown()
  };
}


/**
 * Phase별 통계
 */
function getPhaseBreakdown() {
  const phaseChanges = workflowHistory.filter(h => h.type === 'phase_changed');
  const breakdown = {};
  
  for (const phase of RIPER_PHASES) {
    breakdown[phase] = phaseChanges.filter(h => h.toPhase === phase).length;
  }
  
  return breakdown;
}

/**
 * RIPER+ Mermaid 다이어그램 생성
 */
function generateRIPERMermaid(workflowId = null) {
  const currentPhase = workflowId 
    ? activeWorkflows.get(workflowId)?.currentPhase 
    : null;
  
  let mermaid = `stateDiagram-v2
    [*] --> SPECIFY
    SPECIFY --> EXPLORE: 요구사항 확정
    EXPLORE --> PLAN: 컨텍스트 충분
    EXPLORE --> SPECIFY: 요구사항 불명확
    PLAN --> IMPLEMENT: Human Approved
    PLAN --> EXPLORE: 탐색 부족
    IMPLEMENT --> VERIFY: 코드 완성
    IMPLEMENT --> PLAN: 계획 변경
    VERIFY --> RELEASE: QA 통과
    VERIFY --> IMPLEMENT: 버그 발견
    RELEASE --> [*]
`;
  
  // 현재 Phase 하이라이트 (State 색상)
  if (currentPhase) {
    const phaseUpper = currentPhase.toUpperCase();
    mermaid += `\n    classDef current fill:#4CAF50,color:white`;
    mermaid += `\n    class ${phaseUpper} current`;
  }
  
  return mermaid;
}


/**
 * 워크플로우 타임라인 D3.js 데이터
 */
function getWorkflowTimelineData(workflowId) {
  const workflow = activeWorkflows.get(workflowId);
  if (!workflow) return null;
  
  return {
    workflowId,
    taskId: workflow.taskId,
    startTime: workflow.startTime,
    currentPhase: workflow.currentPhase,
    phases: workflow.phaseHistory.map((ph, idx) => ({
      index: idx,
      phase: ph.phase,
      startTime: ph.startTime,
      endTime: ph.endTime || null,
      duration: ph.duration || (new Date() - new Date(ph.startTime)),
      gateResult: workflow.gateResults[idx] || null
    }))
  };
}

/**
 * 전체 워크플로우 수집
 */
function collectWorkflowData() {
  return {
    active: getActiveWorkflows(),
    stats: getWorkflowStats(),
    history: getWorkflowHistory({ limit: 20 }),
    mermaid: generateRIPERMermaid(),
    phases: RIPER_PHASES
  };
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  recordWorkflowStart,
  recordPhaseChange,
  recordWorkflowComplete,
  getCurrentWorkflow,
  getActiveWorkflows,
  getWorkflowHistory,
  getWorkflowStats,
  getPhaseBreakdown,
  generateRIPERMermaid,
  getWorkflowTimelineData,
  collectWorkflowData,
  RIPER_PHASES
};
