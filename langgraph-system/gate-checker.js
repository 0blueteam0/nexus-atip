#!/usr/bin/env node
/**
 * RIPER+ Gate Checker
 * 
 * 위치: K:/PortableApps/genai/langgraph-system/gate-checker.js
 * 
 * 목적:
 * - Phase 전환 전 품질 관문(Gate) 검증
 * - 체크리스트 기반 통과 여부 판단
 * - 이벤트 버스로 결과 전파
 * 
 * @module langgraph-system/gate-checker
 * @version 1.0.0
 */

const { EVENTS, getInstance: getEventBus } = require('../unified-task-system/event-bus');

const eventBus = getEventBus();

/**
 * Gate 규칙 정의
 */
const GATE_RULES = {
  specify: {
    name: 'SPECIFY Gate',
    required: ['goal_defined', 'scope_defined', 'criteria_defined'],
    minScore: 3,
    description: '요구사항 명확화 완료 확인'
  },
  explore: {
    name: 'EXPLORE Gate',
    required: ['files_identified', 'patterns_analyzed', 'risks_assessed'],
    minScore: 3,
    description: '코드베이스 탐색 완료 확인'
  },
  plan: {
    name: 'PLAN Gate',
    required: ['architecture_designed', 'tasks_decomposed', 'human_approved'],
    minScore: 3,
    humanApproval: true,
    description: '계획 수립 및 승인 확인'
  },
  implement: {
    name: 'IMPLEMENT Gate',
    required: ['code_written', 'tests_passed', 'no_errors'],
    minScore: 3,
    description: '구현 완료 및 테스트 통과 확인'
  },
  verify: {
    name: 'VERIFY Gate',
    required: ['qa_passed', 'security_scanned', 'review_approved'],
    minScore: 3,
    description: '품질 검증 완료 확인'
  },
  release: {
    name: 'RELEASE Gate',
    required: ['pr_created', 'changelog_updated'],
    minScore: 2,
    description: '배포 준비 완료 확인'
  }
};

/**
 * Gate 검사 수행
 * @param {string} phase - 현재 Phase
 * @param {string[]} checklist - 완료된 항목 목록
 * @param {Object} context - 추가 컨텍스트 (taskId 등)
 * @returns {Object} 검사 결과
 */
function checkGate(phase, checklist = [], context = {}) {
  const rules = GATE_RULES[phase];
  
  if (!rules) {
    return { 
      passed: true, 
      phase, 
      message: `Unknown phase: ${phase}, passing by default` 
    };
  }

  // 체크리스트에서 필수 항목 충족 여부 확인
  const matchedItems = rules.required.filter(item => checklist.includes(item));
  const score = matchedItems.length;
  const missingItems = rules.required.filter(item => !checklist.includes(item));
  
  // Human approval 특별 처리
  const needsHumanApproval = rules.humanApproval && !checklist.includes('human_approved');
  
  // 통과 여부 판단
  const passed = score >= rules.minScore && !needsHumanApproval;

  const result = {
    phase,
    gateName: rules.name,
    passed,
    score,
    minScore: rules.minScore,
    checklist,
    matchedItems,
    missingItems,
    needsHumanApproval,
    description: rules.description,
    timestamp: new Date().toISOString()
  };

  // 이벤트 발행
  const event = passed ? EVENTS.GATE_PASSED : EVENTS.GATE_FAILED;
  eventBus.publish(event, { ...result, ...context }, 'gate-checker');

  return result;
}

/**
 * 모든 Gate 규칙 조회
 */
function getAllGateRules() {
  return { ...GATE_RULES };
}

/**
 * 특정 Phase의 Gate 규칙 조회
 */
function getGateRule(phase) {
  return GATE_RULES[phase] || null;
}

/**
 * Gate 통과를 위한 필수 항목 조회
 */
function getRequiredItems(phase) {
  const rules = GATE_RULES[phase];
  return rules ? rules.required : [];
}

/**
 * Human Approval이 필요한 Phase 목록
 */
function getPhasesRequiringHumanApproval() {
  return Object.entries(GATE_RULES)
    .filter(([_, rules]) => rules.humanApproval)
    .map(([phase, _]) => phase);
}

/**
 * 다음 Phase로 이동 가능한지 확인
 */
function canAdvanceToNextPhase(currentPhase, checklist, context = {}) {
  const result = checkGate(currentPhase, checklist, context);
  return {
    canAdvance: result.passed,
    ...result
  };
}


/**
 * Phase 전환 경로 정의
 */
const PHASE_TRANSITIONS = {
  specify: { next: 'explore', backtrack: null },
  explore: { next: 'plan', backtrack: 'specify' },
  plan: { next: 'implement', backtrack: 'explore' },
  implement: { next: 'verify', backtrack: 'plan' },
  verify: { next: 'release', backtrack: 'implement' },
  release: { next: null, backtrack: 'verify' }
};

/**
 * 다음 Phase 조회
 */
function getNextPhase(currentPhase) {
  const transition = PHASE_TRANSITIONS[currentPhase];
  return transition ? transition.next : null;
}

/**
 * 이전 Phase 조회 (Backtrack)
 */
function getPreviousPhase(currentPhase) {
  const transition = PHASE_TRANSITIONS[currentPhase];
  return transition ? transition.backtrack : null;
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  GATE_RULES,
  PHASE_TRANSITIONS,
  checkGate,
  getAllGateRules,
  getGateRule,
  getRequiredItems,
  getPhasesRequiringHumanApproval,
  canAdvanceToNextPhase,
  getNextPhase,
  getPreviousPhase
};

// CLI 실행
if (require.main === module) {
  console.log('\n--- RIPER+ Gate Rules ---\n');
  for (const [phase, rules] of Object.entries(GATE_RULES)) {
    console.log(`[${phase.toUpperCase()}]`);
    console.log(`  이름: ${rules.name}`);
    console.log(`  필수: ${rules.required.join(', ')}`);
    console.log(`  최소 점수: ${rules.minScore}`);
    console.log(`  Human Approval: ${rules.humanApproval ? 'Yes' : 'No'}`);
    console.log('');
  }

  // 테스트
  console.log('--- Gate Check Test ---\n');
  const testResult = checkGate('plan', ['architecture_designed', 'tasks_decomposed'], { taskId: 'test-1' });
  console.log('Test (plan without human_approved):');
  console.log(JSON.stringify(testResult, null, 2));
}
