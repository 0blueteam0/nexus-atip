/**
 * LangGraph Conditional Edges
 * RIPER+ Phase 전환 로직
 *
 * @module langgraph-system/edges
 * @version 1.0.0
 */

const { RIPERPhase } = require('./state');
const { TransitionRules, checkGate } = require('../unified-task-system/schemas');

/**
 * Route from SPECIFY
 * SPECIFY -> EXPLORE (gate 통과 시)
 * SPECIFY -> SPECIFY (gate 미통과 시)
 */
function routeFromSpecify(state) {
  const gate = state.gateResults?.specify;

  if (gate?.passed) {
    console.log('[Edge] SPECIFY -> EXPLORE');
    return 'explore';
  }

  console.log('[Edge] SPECIFY -> SPECIFY (gate not passed)');
  return 'specify';
}

/**
 * Route from EXPLORE
 * EXPLORE -> PLAN (gate 통과 시)
 * EXPLORE -> SPECIFY (회귀 필요 시)
 * EXPLORE -> EXPLORE (재탐색 필요 시)
 */
function routeFromExplore(state) {
  const gate = state.gateResults?.explore;


  // 에러 발생 시 에러 핸들러로
  if (state.error) {
    console.log('[Edge] EXPLORE -> ERROR');
    return 'error_handler';
  }

  // 요구사항 재확인 필요 시 SPECIFY로 회귀
  if (state.metadata?.needsSpecification) {
    console.log('[Edge] EXPLORE -> SPECIFY (backtrack)');
    return 'specify';
  }

  if (gate?.passed) {
    console.log('[Edge] EXPLORE -> PLAN');
    return 'plan';
  }

  console.log('[Edge] EXPLORE -> EXPLORE (re-exploration needed)');
  return 'explore';
}

/**
 * Route from PLAN
 * PLAN -> IMPLEMENT (gate 통과 + human approved)
 * PLAN -> EXPLORE (회귀 필요 시)
 * PLAN -> PLAN (승인 대기)
 */
function routeFromPlan(state) {
  const gate = state.gateResults?.plan;

  if (state.error) {
    console.log('[Edge] PLAN -> ERROR');
    return 'error_handler';
  }

  // 추가 탐색 필요 시 EXPLORE로 회귀
  if (state.metadata?.needsExploration) {
    console.log('[Edge] PLAN -> EXPLORE (backtrack)');
    return 'explore';
  }


  // Human approval 필요
  if (!state.metadata?.humanApproved) {
    console.log('[Edge] PLAN -> PLAN (waiting for human approval)');
    return 'plan_interrupt';  // 인터럽트 포인트
  }

  if (gate?.passed) {
    console.log('[Edge] PLAN -> IMPLEMENT');
    return 'implement';
  }

  console.log('[Edge] PLAN -> PLAN (gate not passed)');
  return 'plan';
}

/**
 * Route from IMPLEMENT
 * IMPLEMENT -> VERIFY (gate 통과 시)
 * IMPLEMENT -> PLAN (계획 수정 필요 시)
 * IMPLEMENT -> EXPLORE (추가 탐색 필요 시)
 */
function routeFromImplement(state) {
  const gate = state.gateResults?.implement;

  if (state.error) {
    console.log('[Edge] IMPLEMENT -> ERROR');
    return 'error_handler';
  }

  // 계획 수정 필요
  if (state.metadata?.needsReplanning) {
    console.log('[Edge] IMPLEMENT -> PLAN (backtrack)');
    return 'plan';
  }

  // 추가 탐색 필요
  if (state.metadata?.needsExploration) {
    console.log('[Edge] IMPLEMENT -> EXPLORE (backtrack)');
    return 'explore';
  }


  if (gate?.passed) {
    console.log('[Edge] IMPLEMENT -> VERIFY');
    return 'verify';
  }

  console.log('[Edge] IMPLEMENT -> IMPLEMENT (continue implementation)');
  return 'implement';
}

/**
 * Route from VERIFY
 * VERIFY -> RELEASE (gate 통과 시)
 * VERIFY -> IMPLEMENT (버그 수정 필요 시)
 */
function routeFromVerify(state) {
  const gate = state.gateResults?.verify;

  if (state.error) {
    console.log('[Edge] VERIFY -> ERROR');
    return 'error_handler';
  }

  // 버그 수정 필요
  if (state.metadata?.needsFix) {
    console.log('[Edge] VERIFY -> IMPLEMENT (backtrack for fix)');
    return 'implement';
  }

  if (gate?.passed) {
    console.log('[Edge] VERIFY -> RELEASE');
    return 'release';
  }

  console.log('[Edge] VERIFY -> VERIFY (continue verification)');
  return 'verify';
}

/**
 * Route from RELEASE
 * RELEASE -> END (완료)
 * RELEASE -> next task (대기 태스크 있을 시)
 */
function routeFromRelease(state) {
  const pendingTasks = state.taskQueue?.pending || [];


  if (pendingTasks.length > 0) {
    console.log('[Edge] RELEASE -> SPECIFY (next task)');
    return 'specify';  // 다음 태스크 시작
  }

  console.log('[Edge] RELEASE -> END');
  return 'end';
}

/**
 * Route from ERROR
 * ERROR -> retry or END
 */
function routeFromError(state) {
  const retryCount = state.metadata?.retryCount || 0;
  const maxRetries = 3;

  if (retryCount < maxRetries) {
    console.log(`[Edge] ERROR -> retry (${retryCount + 1}/${maxRetries})`);
    // 마지막 phase로 복귀
    return state.currentPhase || 'specify';
  }

  console.log('[Edge] ERROR -> END (max retries exceeded)');
  return 'end';
}

module.exports = {
  routeFromSpecify,
  routeFromExplore,
  routeFromPlan,
  routeFromImplement,
  routeFromVerify,
  routeFromRelease,
  routeFromError
};
