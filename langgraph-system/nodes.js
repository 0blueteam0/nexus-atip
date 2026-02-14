/**
 * LangGraph Nodes
 * RIPER+ Phase별 노드 구현
 *
 * @module langgraph-system/nodes
 * @version 1.0.0
 */

const { RIPERPhase, AgentRole } = require('./state');
const { createTask } = require('../unified-task-system/schemas');

/**
 * 공통 유틸리티
 */
function createHistoryEntry(phase, action, agent, result) {
  return {
    phase,
    action,
    agent,
    result,
    timestamp: new Date().toISOString()
  };
}

function updateMetadata(state) {
  return {
    ...state.metadata,
    lastUpdate: new Date().toISOString()
  };
}

/**
 * SPECIFY Node
 * 요구사항 명확화 단계
 */
async function specifyNode(state) {
  console.log('[Node] SPECIFY - 요구사항 명확화');


  const task = state.currentTask;

  // Gate 체크리스트 항목 확인
  const checklist = [];

  if (task?.title) checklist.push('goal_defined');
  if (task?.description) checklist.push('scope_defined');
  if (task?.acceptance_criteria?.length > 0) checklist.push('criteria_defined');

  const passed = checklist.length >= 3;

  return {
    currentPhase: RIPERPhase.SPECIFY,
    gateResults: {
      specify: { passed, checklist }
    },
    history: createHistoryEntry(
      RIPERPhase.SPECIFY,
      'requirements_analysis',
      AgentRole.ORCHESTRATOR,
      { checklist, passed }
    ),
    metadata: updateMetadata(state)
  };
}

/**
 * EXPLORE Node
 * 코드베이스 탐색 단계
 */
async function exploreNode(state) {
  console.log('[Node] EXPLORE - 코드베이스 탐색');

  const checklist = [];


  // 탐색 결과 시뮬레이션 (실제로는 에이전트가 수행)
  // TODO: Researcher 에이전트 연동
  checklist.push('files_identified');
  checklist.push('patterns_analyzed');
  checklist.push('risks_assessed');

  const passed = checklist.length >= 3;

  return {
    currentPhase: RIPERPhase.EXPLORE,
    gateResults: {
      explore: { passed, checklist }
    },
    history: createHistoryEntry(
      RIPERPhase.EXPLORE,
      'codebase_exploration',
      AgentRole.RESEARCHER,
      { checklist, passed }
    ),
    metadata: updateMetadata(state)
  };
}

/**
 * PLAN Node
 * 계획 수립 단계
 */
async function planNode(state) {
  console.log('[Node] PLAN - 계획 수립');

  const checklist = [];

  // Human approval 대기 (실제로는 인터럽트)
  // TODO: Human-in-the-loop 구현
  checklist.push('architecture_designed');
  checklist.push('tasks_decomposed');


  // Human approval은 별도 인터럽트로 처리
  const humanApproved = state.metadata?.humanApproved ?? false;
  if (humanApproved) {
    checklist.push('human_approved');
  }

  const passed = checklist.includes('human_approved') && checklist.length >= 3;

  return {
    currentPhase: RIPERPhase.PLAN,
    gateResults: {
      plan: { passed, checklist }
    },
    history: createHistoryEntry(
      RIPERPhase.PLAN,
      'planning',
      AgentRole.ORCHESTRATOR,
      { checklist, passed, humanApproved }
    ),
    metadata: updateMetadata(state)
  };
}

/**
 * IMPLEMENT Node
 * 코드 구현 단계
 */
async function implementNode(state) {
  console.log('[Node] IMPLEMENT - 코드 구현');

  const checklist = [];

  // TODO: Coder 에이전트 연동
  checklist.push('code_written');
  checklist.push('tests_passed');
  checklist.push('no_errors');

  const passed = checklist.length >= 3;


  return {
    currentPhase: RIPERPhase.IMPLEMENT,
    gateResults: {
      implement: { passed, checklist }
    },
    history: createHistoryEntry(
      RIPERPhase.IMPLEMENT,
      'implementation',
      AgentRole.CODER,
      { checklist, passed }
    ),
    metadata: updateMetadata(state)
  };
}

/**
 * VERIFY Node
 * 품질 검증 단계
 */
async function verifyNode(state) {
  console.log('[Node] VERIFY - 품질 검증');

  const checklist = [];

  // TODO: Tester, Reviewer 에이전트 연동
  checklist.push('qa_passed');
  checklist.push('security_scanned');
  checklist.push('review_approved');

  const passed = checklist.length >= 3;

  return {
    currentPhase: RIPERPhase.VERIFY,
    gateResults: {
      verify: { passed, checklist }
    },
    history: createHistoryEntry(
      RIPERPhase.VERIFY,
      'verification',
      AgentRole.TESTER,
      { checklist, passed }
    ),
    metadata: updateMetadata(state)
  };
}


/**
 * RELEASE Node
 * 배포 단계
 */
async function releaseNode(state) {
  console.log('[Node] RELEASE - 배포');

  const checklist = [];

  // TODO: Orchestrator 에이전트 연동
  checklist.push('pr_created');
  checklist.push('changelog_updated');

  const task = state.currentTask;
  const updatedTask = task ? {
    ...task,
    status: 'completed',
    completed: new Date().toISOString()
  } : null;

  return {
    currentPhase: RIPERPhase.RELEASE,
    currentTask: updatedTask,
    taskQueue: {
      completed: [...(state.taskQueue?.completed || []), task?.id].filter(Boolean)
    },
    history: createHistoryEntry(
      RIPERPhase.RELEASE,
      'release',
      AgentRole.ORCHESTRATOR,
      { checklist, taskCompleted: !!task }
    ),
    metadata: updateMetadata(state)
  };
}


/**
 * Error Handler Node
 * 에러 처리 노드
 */
async function errorNode(state) {
  console.log('[Node] ERROR - 에러 처리');

  const error = state.error;

  return {
    history: createHistoryEntry(
      state.currentPhase || 'unknown',
      'error_handling',
      AgentRole.ORCHESTRATOR,
      { error: error?.message || 'Unknown error' }
    ),
    taskQueue: {
      failed: [...(state.taskQueue?.failed || []), state.currentTask?.id].filter(Boolean)
    },
    metadata: updateMetadata(state)
  };
}

/**
 * End Node
 * 워크플로우 종료 노드
 */
async function endNode(state) {
  console.log('[Node] END - 워크플로우 완료');

  return {
    history: createHistoryEntry(
      'end',
      'workflow_completed',
      AgentRole.ORCHESTRATOR,
      {
        totalTasks: (state.taskQueue?.completed?.length || 0) + (state.taskQueue?.failed?.length || 0),
        completed: state.taskQueue?.completed?.length || 0,
        failed: state.taskQueue?.failed?.length || 0
      }
    ),
    metadata: updateMetadata(state)
  };
}


module.exports = {
  specifyNode,
  exploreNode,
  planNode,
  implementNode,
  verifyNode,
  releaseNode,
  errorNode,
  endNode,
  // Utilities
  createHistoryEntry,
  updateMetadata
};
