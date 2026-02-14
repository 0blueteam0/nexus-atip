/**
 * LangGraph Main Graph
 * RIPER+ 워크플로우 State Machine
 *
 * @module langgraph-system/graph
 * @version 1.0.0
 */

const { StateGraph, END, START } = require('@langchain/langgraph');
const { MemorySaver } = require('@langchain/langgraph');

const { StateAnnotation, RIPERPhase } = require('./state');
const {
  specifyNode,
  exploreNode,
  planNode,
  implementNode,
  verifyNode,
  releaseNode,
  errorNode,
  endNode
} = require('./nodes');
const {
  routeFromSpecify,
  routeFromExplore,
  routeFromPlan,
  routeFromImplement,
  routeFromVerify,
  routeFromRelease,
  routeFromError
} = require('./edges');


/**
 * Build RIPER+ Workflow Graph
 * @returns {CompiledStateGraph} 컴파일된 그래프
 */
function buildRIPERGraph() {
  // 그래프 생성
  const graph = new StateGraph(StateAnnotation);

  // 노드 추가
  graph.addNode('specify', specifyNode);
  graph.addNode('explore', exploreNode);
  graph.addNode('plan', planNode);
  graph.addNode('implement', implementNode);
  graph.addNode('verify', verifyNode);
  graph.addNode('release', releaseNode);
  graph.addNode('error_handler', errorNode);
  graph.addNode('end', endNode);

  // 시작 엣지
  graph.addEdge(START, 'specify');

  // 조건부 엣지 (RIPER+ 전환 규칙)
  graph.addConditionalEdges('specify', routeFromSpecify, {
    specify: 'specify',
    explore: 'explore'
  });

  graph.addConditionalEdges('explore', routeFromExplore, {
    specify: 'specify',
    explore: 'explore',
    plan: 'plan',
    error: 'error_handler'
  });


  graph.addConditionalEdges('plan', routeFromPlan, {
    explore: 'explore',
    plan: 'plan',
    plan_interrupt: 'plan',  // Human approval 대기
    implement: 'implement',
    error: 'error_handler'
  });

  graph.addConditionalEdges('implement', routeFromImplement, {
    explore: 'explore',
    plan: 'plan',
    implement: 'implement',
    verify: 'verify',
    error: 'error_handler'
  });

  graph.addConditionalEdges('verify', routeFromVerify, {
    implement: 'implement',
    verify: 'verify',
    release: 'release',
    error: 'error_handler'
  });

  graph.addConditionalEdges('release', routeFromRelease, {
    specify: 'specify',  // 다음 태스크
    end: 'end'
  });

  graph.addConditionalEdges('error_handler', routeFromError, {
    specify: 'specify',
    explore: 'explore',
    plan: 'plan',
    implement: 'implement',
    verify: 'verify',
    end: 'end'
  });

  // 종료 엣지
  graph.addEdge('end', END);

  return graph;
}


/**
 * Compile Graph with Checkpointer
 * @param {Object} options - 컴파일 옵션
 * @returns {CompiledStateGraph} 컴파일된 그래프
 */
function compileGraph(options = {}) {
  const graph = buildRIPERGraph();

  // 메모리 체크포인터 (상태 저장/복원)
  const checkpointer = new MemorySaver();

  // 인터럽트 설정 (Human-in-the-loop)
  const interruptBefore = options.interruptBefore || ['plan'];
  const interruptAfter = options.interruptAfter || [];

  return graph.compile({
    checkpointer,
    interruptBefore,
    interruptAfter
  });
}

/**
 * Run Workflow
 * @param {Object} initialState - 초기 상태
 * @param {Object} config - 실행 설정
 * @returns {AsyncGenerator} 상태 스트림
 */
async function* runWorkflow(initialState, config = {}) {
  const app = compileGraph(config.compileOptions);

  const threadId = config.threadId || `thread-${Date.now()}`;

  const streamConfig = {
    configurable: { thread_id: threadId },
    streamMode: 'values'
  };


  for await (const state of app.stream(initialState, streamConfig)) {
    yield state;
  }
}

/**
 * Resume Workflow (인터럽트 후 재개)
 * @param {string} threadId - 스레드 ID
 * @param {Object} updates - 상태 업데이트
 * @param {Object} config - 실행 설정
 * @returns {AsyncGenerator} 상태 스트림
 */
async function* resumeWorkflow(threadId, updates, config = {}) {
  const app = compileGraph(config.compileOptions);

  const streamConfig = {
    configurable: { thread_id: threadId },
    streamMode: 'values'
  };

  // null을 전달하여 인터럽트된 위치에서 재개
  // updates는 state에 병합됨
  for await (const state of app.stream(updates, streamConfig)) {
    yield state;
  }
}

/**
 * Get Current State
 * @param {string} threadId - 스레드 ID
 * @returns {Object} 현재 상태
 */
async function getState(threadId, config = {}) {
  const app = compileGraph(config.compileOptions);

  return await app.getState({
    configurable: { thread_id: threadId }
  });
}


module.exports = {
  buildRIPERGraph,
  compileGraph,
  runWorkflow,
  resumeWorkflow,
  getState,
  RIPERPhase
};
