/**
 * LangGraph State Definition
 * RIPER+ 워크플로우 상태 관리
 *
 * @module langgraph-system/state
 * @version 1.0.0
 */

const { Annotation } = require('@langchain/langgraph');
const {
  RIPERPhase,
  TaskStatus,
  AgentRole,
  createInitialState
} = require('../unified-task-system/schemas');

/**
 * State Annotation
 * LangGraph 상태 스키마 정의
 */
const StateAnnotation = Annotation.Root({
  // 현재 Phase
  currentPhase: Annotation({
    reducer: (current, update) => update ?? current,
    default: () => null
  }),

  // 현재 처리 중인 태스크
  currentTask: Annotation({
    reducer: (current, update) => update ?? current,
    default: () => null
  }),


  // 태스크 큐
  taskQueue: Annotation({
    reducer: (current, update) => {
      if (!update) return current;
      return {
        pending: update.pending ?? current.pending,
        inProgress: update.inProgress ?? current.inProgress,
        completed: update.completed ?? current.completed,
        failed: update.failed ?? current.failed
      };
    },
    default: () => ({ pending: [], inProgress: [], completed: [], failed: [] })
  }),

  // 에이전트 상태
  agents: Annotation({
    reducer: (current, update) => {
      if (!update) return current;
      return {
        available: update.available ?? current.available,
        busy: update.busy ?? current.busy,
        assignments: { ...current.assignments, ...update.assignments }
      };
    },
    default: () => ({
      available: Object.values(AgentRole),
      busy: [],
      assignments: {}
    })
  }),


  // Gate 검증 결과
  gateResults: Annotation({
    reducer: (current, update) => {
      if (!update) return current;
      return { ...current, ...update };
    },
    default: () => ({
      specify: { passed: false, checklist: [] },
      explore: { passed: false, checklist: [] },
      plan: { passed: false, checklist: [] },
      implement: { passed: false, checklist: [] },
      verify: { passed: false, checklist: [] }
    })
  }),

  // 실행 히스토리
  history: Annotation({
    reducer: (current, update) => {
      if (Array.isArray(update)) {
        return [...current, ...update];
      }
      if (update) {
        return [...current, update];
      }
      return current;
    },
    default: () => []
  }),

  // 컨텍스트 상태 (FIC)
  context: Annotation({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({ usage: 0, budget: 100, compactionNeeded: false })
  }),


  // 메시지 (에이전트 간 통신)
  messages: Annotation({
    reducer: (current, update) => {
      if (Array.isArray(update)) {
        return [...current, ...update];
      }
      if (update) {
        return [...current, update];
      }
      return current;
    },
    default: () => []
  }),

  // 메타데이터
  metadata: Annotation({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({
      sessionId: `session-${Date.now()}`,
      planId: null,
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    })
  }),

  // 에러 상태
  error: Annotation({
    reducer: (current, update) => update ?? current,
    default: () => null
  })
});

module.exports = {
  StateAnnotation,
  RIPERPhase,
  TaskStatus,
  AgentRole
};
