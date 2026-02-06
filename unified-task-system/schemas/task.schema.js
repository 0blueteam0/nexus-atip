/**
 * Unified Task Hub - Task Schema
 * LangGraph 호환 태스크 스키마 정의
 *
 * @module unified-task-system/schemas/task.schema
 * @version 2.0.0
 */

/**
 * Task Status Enum
 * LangGraph State Machine과 호환되는 상태 정의
 */
const TaskStatus = {
  // 기본 상태
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',

  // RIPER+ Phase 상태
  SPECIFY: 'phase:specify',
  EXPLORE: 'phase:explore',
  PLAN: 'phase:plan',
  IMPLEMENT: 'phase:implement',
  VERIFY: 'phase:verify',
  RELEASE: 'phase:release'
};


/**
 * Task Priority Enum
 */
const TaskPriority = {
  CRITICAL: 'critical',   // 즉시 처리 필요
  HIGH: 'high',           // 우선 처리
  MEDIUM: 'medium',       // 일반
  LOW: 'low',             // 여유 있을 때
  DEFERRED: 'deferred'    // 보류
};

/**
 * Agent Role Enum
 * 역할 기반 에이전트 풀 정의
 */
const AgentRole = {
  RESEARCHER: 'researcher',   // 조사/탐색 전문
  CODER: 'coder',             // 코드 작성/수정 전문
  TESTER: 'tester',           // 테스트/검증 전문
  REVIEWER: 'reviewer',       // 리뷰/품질 전문
  ORCHESTRATOR: 'orchestrator' // 조율/관리
};


/**
 * Task Schema Definition
 * @typedef {Object} Task
 */
const TaskSchema = {
  // 필수 필드
  id: { type: 'string', required: true },
  title: { type: 'string', required: true },
  status: { type: 'string', enum: Object.values(TaskStatus), default: TaskStatus.PENDING },

  // 분류
  priority: { type: 'string', enum: Object.values(TaskPriority), default: TaskPriority.MEDIUM },
  phase: { type: 'string', enum: ['specify', 'explore', 'plan', 'implement', 'verify', 'release'] },
  source: { type: 'string', enum: ['shrimp', 'taskmaster', 'vibekanban', 'manual', 'system'] },

  // 상세 정보
  description: { type: 'string', default: '' },
  acceptance_criteria: { type: 'array', items: 'string', default: [] },
  tags: { type: 'array', items: 'string', default: [] },

  // 의존성
  dependencies: { type: 'array', items: 'string', default: [] },
  blockedBy: { type: 'array', items: 'string', default: [] },
  blocks: { type: 'array', items: 'string', default: [] },


  // 하위 태스크
  subtasks: {
    type: 'array',
    items: {
      id: 'string',
      title: 'string',
      status: 'string',
      note: 'string'
    },
    default: []
  },

  // 에이전트 할당
  assignedAgent: { type: 'string', enum: Object.values(AgentRole) },
  agentHistory: {
    type: 'array',
    items: {
      agent: 'string',
      action: 'string',
      timestamp: 'string',
      result: 'object'
    },
    default: []
  },


  // 타임스탬프
  created: { type: 'string', format: 'date-time' },
  updated: { type: 'string', format: 'date-time' },
  started: { type: 'string', format: 'date-time' },
  completed: { type: 'string', format: 'date-time' },

  // LangGraph State Machine 호환
  stateHistory: {
    type: 'array',
    items: {
      from: 'string',
      to: 'string',
      trigger: 'string',
      timestamp: 'string'
    },
    default: []
  },

  // 메타데이터
  metadata: {
    type: 'object',
    properties: {
      originalData: 'object',     // 원본 시스템 데이터 (Shrimp, TaskMaster 등)
      queueInfo: 'object',        // BullMQ 큐 정보
      contextBudget: 'number',    // FIC 컨텍스트 버짓
      retryCount: 'number'        // 재시도 횟수
    }
  }
};


/**
 * Task Factory
 * @param {Object} data - 태스크 초기 데이터
 * @returns {Object} 정규화된 태스크 객체
 */
function createTask(data) {
  const now = new Date().toISOString();

  return {
    id: data.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    title: data.title || 'Untitled Task',
    status: data.status || TaskStatus.PENDING,
    priority: data.priority || TaskPriority.MEDIUM,
    phase: data.phase || null,
    source: data.source || 'manual',
    description: data.description || '',
    acceptance_criteria: data.acceptance_criteria || [],
    tags: data.tags || [],
    dependencies: data.dependencies || [],
    blockedBy: data.blockedBy || [],
    blocks: data.blocks || [],
    subtasks: data.subtasks || [],
    assignedAgent: data.assignedAgent || null,
    agentHistory: data.agentHistory || [],
    created: data.created || now,
    updated: now,
    started: data.started || null,
    completed: data.completed || null,
    stateHistory: data.stateHistory || [],
    metadata: data.metadata || {}
  };
}


/**
 * Task Validator
 * @param {Object} task - 검증할 태스크
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateTask(task) {
  const errors = [];

  if (!task.id) errors.push('id is required');
  if (!task.title) errors.push('title is required');
  if (task.status && !Object.values(TaskStatus).includes(task.status)) {
    errors.push(`Invalid status: ${task.status}`);
  }
  if (task.priority && !Object.values(TaskPriority).includes(task.priority)) {
    errors.push(`Invalid priority: ${task.priority}`);
  }
  if (task.assignedAgent && !Object.values(AgentRole).includes(task.assignedAgent)) {
    errors.push(`Invalid agent role: ${task.assignedAgent}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  TaskStatus,
  TaskPriority,
  AgentRole,
  TaskSchema,
  createTask,
  validateTask
};
