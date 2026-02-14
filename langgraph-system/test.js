/**
 * LangGraph System Test
 * RIPER+ 워크플로우 테스트
 */

const { createTask } = require('../unified-task-system/schemas');

async function testWorkflow() {
  console.log('=== LangGraph RIPER+ Workflow Test ===\n');

  try {
    // 모듈 로드 테스트
    const { RIPERPhase, AgentRole } = require('./state');
    console.log('[+] State module loaded');
    console.log('    Phases:', Object.values(RIPERPhase));
    console.log('    Agents:', Object.values(AgentRole));

    const nodes = require('./nodes');
    console.log('[+] Nodes module loaded');
    console.log('    Nodes:', Object.keys(nodes).filter(k => k.endsWith('Node')));

    const edges = require('./edges');
    console.log('[+] Edges module loaded');
    console.log('    Routes:', Object.keys(edges));

    // 태스크 생성
    const task = createTask({
      title: 'Test Task',
      description: 'LangGraph 테스트용 태스크',
      acceptance_criteria: ['테스트 통과', '문서화 완료']
    });
    console.log('\n[+] Task created:', task.id);


    // 노드 개별 테스트
    console.log('\n--- Node Tests ---');

    const initialState = {
      currentPhase: null,
      currentTask: task,
      taskQueue: { pending: [], inProgress: [], completed: [], failed: [] },
      agents: { available: Object.values(AgentRole), busy: [], assignments: {} },
      gateResults: {},
      history: [],
      context: { usage: 0, budget: 100, compactionNeeded: false },
      messages: [],
      metadata: { sessionId: 'test-session', humanApproved: true },
      error: null
    };

    // SPECIFY 노드 테스트
    const specifyResult = await nodes.specifyNode(initialState);
    console.log('[+] SPECIFY node:', specifyResult.currentPhase);
    console.log('    Gate passed:', specifyResult.gateResults.specify.passed);

    // EXPLORE 노드 테스트
    const exploreResult = await nodes.exploreNode({ ...initialState, ...specifyResult });
    console.log('[+] EXPLORE node:', exploreResult.currentPhase);
    console.log('    Gate passed:', exploreResult.gateResults.explore.passed);

    // PLAN 노드 테스트
    const planResult = await nodes.planNode({ ...initialState, ...exploreResult });
    console.log('[+] PLAN node:', planResult.currentPhase);
    console.log('    Gate passed:', planResult.gateResults.plan.passed);


    // Edge 라우팅 테스트
    console.log('\n--- Edge Tests ---');

    const routeSpecify = edges.routeFromSpecify(specifyResult);
    console.log('[+] Route from SPECIFY:', routeSpecify);

    const routeExplore = edges.routeFromExplore(exploreResult);
    console.log('[+] Route from EXPLORE:', routeExplore);

    const routePlan = edges.routeFromPlan({
      ...planResult,
      metadata: { ...planResult.metadata, humanApproved: true }
    });
    console.log('[+] Route from PLAN:', routePlan);

    console.log('\n=== All tests passed! ===');

  } catch (error) {
    console.error('\n[!] Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 그래프 빌드 테스트 (LangGraph 설치 확인)
async function testGraphBuild() {
  console.log('\n--- Graph Build Test ---');

  try {
    const { buildRIPERGraph } = require('./graph');
    const graph = buildRIPERGraph();
    console.log('[+] Graph built successfully');
    console.log('    Nodes:', graph.nodes ? Object.keys(graph.nodes) : 'N/A');


  } catch (error) {
    console.error('[!] Graph build failed:', error.message);
    // LangGraph 버전 이슈일 수 있음
    if (error.message.includes('Annotation')) {
      console.log('[?] LangGraph API 버전 확인 필요');
    }
  }
}

// CLI 실행
if (require.main === module) {
  (async () => {
    await testWorkflow();
    await testGraphBuild();
  })();
}

module.exports = { testWorkflow, testGraphBuild };
