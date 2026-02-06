/**
 * LangGraph State Machine Schema
 * RIPER+ 워크플로우 호환 상태 머신 정의
 *
 * @module unified-task-system/schemas/state-machine.schema
 * @version 2.0.0
 */

const { TaskStatus, AgentRole } = require('./task.schema');

/**
 * RIPER+ Phase Definition
 * 6단계 개발 워크플로우
 */
const RIPERPhase = {
  SPECIFY: 'specify',     // 요구사항 명확화
  EXPLORE: 'explore',     // 코드베이스 이해
  PLAN: 'plan',           // 계획 수립
  IMPLEMENT: 'implement', // 코드 작성
  VERIFY: 'verify',       // 품질 검증
  RELEASE: 'release'      // 배포
};

/**
 * State Machine State Definition
 * LangGraph 호환 상태 정의
 */
const StateSchema = {
  // 현재 상태
  currentPhase: { type: 'string', enum: Object.values(RIPERPhase) },
  currentTask: { type: 'object', ref: 'TaskSchema' },


  // 에이전트 풀 상태
  agents: {
    type: 'object',
    properties: {
      available: { type: 'array', items: 'string' },
      busy: { type: 'array', items: 'string' },
      assignments: { type: 'object' }  // taskId -> agentRole
    }
  },

  // 태스크 큐
  taskQueue: {
    type: 'object',
    properties: {
      pending: { type: 'array', items: 'string' },    // taskIds
      inProgress: { type: 'array', items: 'string' },
      completed: { type: 'array', items: 'string' },
      failed: { type: 'array', items: 'string' }
    }
  },

  // 컨텍스트 상태 (FIC)
  context: {
    type: 'object',
    properties: {
      usage: { type: 'number' },          // 현재 사용량 (%)
      budget: { type: 'number' },         // 할당된 버짓
      compactionNeeded: { type: 'boolean' }
    }
  },


  // 히스토리
  history: {
    type: 'array',
    items: {
      phase: 'string',
      action: 'string',
      timestamp: 'string',
      agent: 'string',
      result: 'object'
    }
  },

  // Gate 검증 결과
  gateResults: {
    type: 'object',
    properties: {
      specify: { passed: 'boolean', checklist: 'array' },
      explore: { passed: 'boolean', checklist: 'array' },
      plan: { passed: 'boolean', checklist: 'array' },
      implement: { passed: 'boolean', checklist: 'array' },
      verify: { passed: 'boolean', checklist: 'array' }
    }
  },

  // 메타데이터
  metadata: {
    type: 'object',
    properties: {
      sessionId: 'string',
      planId: 'string',
      startTime: 'string',
      lastUpdate: 'string'
    }
  }
};


/**
 * Transition Rules
 * RIPER+ Phase 전환 규칙 (회귀 허용)
 */
const TransitionRules = {
  [RIPERPhase.SPECIFY]: {
    next: [RIPERPhase.EXPLORE],
    gateCheck: ['goal_defined', 'scope_defined', 'criteria_defined']
  },
  [RIPERPhase.EXPLORE]: {
    next: [RIPERPhase.PLAN, RIPERPhase.SPECIFY],  // SPECIFY로 회귀 가능
    gateCheck: ['files_identified', 'patterns_analyzed', 'risks_assessed']
  },
  [RIPERPhase.PLAN]: {
    next: [RIPERPhase.IMPLEMENT, RIPERPhase.EXPLORE],  // EXPLORE로 회귀 가능
    gateCheck: ['architecture_designed', 'tasks_decomposed', 'human_approved']
  },
  [RIPERPhase.IMPLEMENT]: {
    next: [RIPERPhase.VERIFY, RIPERPhase.PLAN, RIPERPhase.EXPLORE],  // 회귀 가능
    gateCheck: ['code_written', 'tests_passed', 'no_errors']
  },
  [RIPERPhase.VERIFY]: {
    next: [RIPERPhase.RELEASE, RIPERPhase.IMPLEMENT],  // IMPLEMENT로 회귀 가능
    gateCheck: ['qa_passed', 'security_scanned', 'review_approved']
  },
  [RIPERPhase.RELEASE]: {
    next: [],  // 종료 상태
    gateCheck: ['pr_created', 'changelog_updated']
  }
};


/**
 * Agent-Phase Mapping
 * 각 Phase에서 주로 활동하는 에이전트 역할
 */
const AgentPhaseMapping = {
  [RIPERPhase.SPECIFY]: [AgentRole.ORCHESTRATOR],
  [RIPERPhase.EXPLORE]: [AgentRole.RESEARCHER],
  [RIPERPhase.PLAN]: [AgentRole.ORCHESTRATOR, AgentRole.REVIEWER],
  [RIPERPhase.IMPLEMENT]: [AgentRole.CODER],
  [RIPERPhase.VERIFY]: [AgentRole.TESTER, AgentRole.REVIEWER],
  [RIPERPhase.RELEASE]: [AgentRole.ORCHESTRATOR]
};

/**
 * State Factory
 * @returns {Object} 초기 상태 객체
 */
function createInitialState() {
  return {
    currentPhase: null,
    currentTask: null,
    agents: {
      available: Object.values(AgentRole),
      busy: [],
      assignments: {}
    },
    taskQueue: {
      pending: [],
      inProgress: [],
      completed: [],
      failed: []
    },


    context: {
      usage: 0,
      budget: 100,
      compactionNeeded: false
    },
    history: [],
    gateResults: {
      specify: { passed: false, checklist: [] },
      explore: { passed: false, checklist: [] },
      plan: { passed: false, checklist: [] },
      implement: { passed: false, checklist: [] },
      verify: { passed: false, checklist: [] }
    },
    metadata: {
      sessionId: `session-${Date.now()}`,
      planId: null,
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    }
  };
}

/**
 * Transition Validator
 * @param {string} from - 현재 상태
 * @param {string} to - 목표 상태
 * @returns {Object} { valid: boolean, reason: string }
 */
function validateTransition(from, to) {
  if (!from) {
    // 초기 상태에서는 SPECIFY만 가능
    return {
      valid: to === RIPERPhase.SPECIFY,
      reason: to === RIPERPhase.SPECIFY ? 'OK' : 'Must start with SPECIFY phase'
    };
  }


  const rule = TransitionRules[from];
  if (!rule) {
    return { valid: false, reason: `Unknown phase: ${from}` };
  }

  if (!rule.next.includes(to)) {
    return {
      valid: false,
      reason: `Cannot transition from ${from} to ${to}. Allowed: ${rule.next.join(', ')}`
    };
  }

  return { valid: true, reason: 'OK' };
}

/**
 * Gate Checker
 * @param {string} phase - 검증할 Phase
 * @param {Object} state - 현재 상태
 * @returns {Object} { passed: boolean, missing: string[] }
 */
function checkGate(phase, state) {
  const rule = TransitionRules[phase];
  if (!rule) {
    return { passed: false, missing: ['Unknown phase'] };
  }

  const gateResult = state.gateResults[phase];
  const missing = rule.gateCheck.filter(check => !gateResult.checklist.includes(check));

  return {
    passed: missing.length === 0,
    missing
  };
}


module.exports = {
  RIPERPhase,
  StateSchema,
  TransitionRules,
  AgentPhaseMapping,
  createInitialState,
  validateTransition,
  checkGate
};
