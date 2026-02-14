/**
 * Unified Task System - 메인 진입점
 * 자동 작동: 키워드 입력 없이도 상황에 따라 스스로 실행
 *
 * 위치: K:/PortableApps/genai/unified-task-system/index.js
 *
 * 핵심 원칙:
 * 1. 사용자가 키워드를 기억할 필요 없음
 * 2. 상황에 맞게 자동으로 안내
 * 3. 세션 시작/종료 시 자동 실행
 * 4. 필요할 때 프로그래매틱하게 호출 가능
 *
 * 자동 실행 시점:
 * - 세션 시작: 이전 작업 상태 자동 표시
 * - 세션 종료: 현재 작업 상태 자동 저장
 * - 작업 추가/완료: 상태 변경 자동 안내
 *
 * Claude에서 호출:
 *   const uts = require('./unified-task-system');
 *   uts.auto();                    // 상황 자동 판단
 *   uts.showStatus();              // 현재 상태 표시
 *   uts.saveTask('작업명');        // 작업 저장
 *   uts.completeTask();            // 현재 작업 완료
 */

const taskManager = require('./task-manager.js');
const statusReporter = require('./status-reporter.js');
const triggerDetector = require('./trigger-detector.js');

// ============================================
// 자동 실행 시스템
// ============================================

/**
 * 자동 상황 판단 및 실행
 * 키워드 없이도 현재 상황에 맞는 행동 수행
 */
function auto() {
  const state = taskManager.getSessionState();
  const followups = state.pendingFollowups || [];
  const tasks = state.recentTasks || [];
  const inProgress = tasks.filter(t => t.status === 'in_progress');

  console.log('');
  console.log('[*] ════════════════════════════════════════');
  console.log('[*]   Unified Task System - 자동 상태 점검');
  console.log('[*] ════════════════════════════════════════');
  console.log('');

  // 상황별 자동 안내
  if (followups.length > 0) {
    // 후속조치가 있으면 자동으로 표시
    console.log('[!] 대기 중인 후속조치가 있습니다:');
    console.log('');
    followups.forEach((f, i) => {
      const priority = f.priority === 'high' ? '[!!!]' :
                       f.priority === 'low' ? '[.]' : '[!]';
      console.log(`  ${i + 1}. ${priority} ${f.title}`);
      if (f.description) {
        console.log(`     └─ ${f.description}`);
      }
    });
    console.log('');
    console.log('[*] 이 작업들을 이어서 진행하시겠습니까?');
    console.log('[*] Claude가 자동으로 첫 번째 작업부터 도움을 드립니다.');
    console.log('');
  } else if (inProgress.length > 0) {
    // 진행 중 작업이 있으면 표시
    console.log('[*] 진행 중인 작업:');
    console.log('');
    inProgress.forEach((t, i) => {
      console.log(`  ${i + 1}. [*] ${t.title}`);
    });
    console.log('');
    console.log('[?] 위 작업을 계속 진행하시겠습니까?');
    console.log('');
  } else {
    // 새 작업 시작 안내
    console.log('[+] 대기 중인 작업이 없습니다.');
    console.log('[?] 새로운 작업을 시작하시겠습니까?');
    console.log('');
    console.log('[*] 작업 저장: "이 작업 나중에 이어서 해줘"');
    console.log('[*] 상태 확인: "지금 뭐하고 있었지?"');
    console.log('');
  }

  console.log('[*] ════════════════════════════════════════');
  console.log('');

  return {
    hasFollowups: followups.length > 0,
    hasInProgress: inProgress.length > 0,
    followups,
    inProgress
  };
}

/**
 * 현재 상태 표시 (간단 버전)
 */
function showStatus() {
  return statusReporter.reportCurrentStatus();
}

/**
 * 작업/후속조치 저장
 * @param {string} title - 작업 제목
 * @param {object} options - { description, priority }
 */
function saveTask(title, options = {}) {
  const result = taskManager.saveFollowup(title, options);

  console.log('');
  console.log('[+] ════════════════════════════════════════');
  console.log(`[+] 작업 저장됨: ${title}`);
  console.log('[+] ════════════════════════════════════════');
  console.log('');
  console.log('[*] 다음 세션에서 자동으로 이 작업을 안내합니다.');
  console.log('[*] 지금 바로 진행하려면 말씀해 주세요.');
  console.log('');

  statusReporter.reportTaskChange('added', result);

  return result;
}

/**
 * 현재 작업 완료 처리
 */
function completeTask() {
  const followups = taskManager.getFollowups();

  if (followups.length === 0) {
    console.log('');
    console.log('[*] 완료 처리할 후속조치가 없습니다.');
    console.log('');
    return null;
  }

  const completed = taskManager.completeFollowup(followups[0].id);
  statusReporter.reportTaskChange('completed', completed);

  return completed;
}

/**
 * 세션 시작 시 자동 실행
 * (.claude-hooks.json에서 호출)
 */
function onSessionStart() {
  const result = statusReporter.reportSessionStart();

  // 후속조치가 있으면 자동으로 첫 번째 작업 안내
  if (result.hasWork) {
    console.log('');
    console.log('[!] ════════════════════════════════════════');
    console.log('[!] Claude가 자동으로 첫 번째 후속조치를 시작합니다.');
    console.log('[!] ════════════════════════════════════════');
    console.log('');
  }

  return result;
}

/**
 * 세션 종료 시 자동 실행
 * (.claude-hooks.json에서 호출)
 */
function onSessionEnd() {
  // 상태 저장
  const state = taskManager.getSessionState();
  taskManager.saveSessionState(state);

  return statusReporter.reportSessionEnd();
}

/**
 * 컨텍스트 인식 자동 안내
 * Claude 대화 중 자동 호출용
 * @param {string} context - 현재 대화 컨텍스트 (선택)
 */
function contextAwareGuide(context = '') {
  const state = taskManager.getSessionState();
  const followups = state.pendingFollowups || [];

  // 컨텍스트 기반 트리거 감지 (키워드 없이도)
  const contextHints = [
    { pattern: /시작|start|begin/i, action: 'showPending' },
    { pattern: /끝|종료|마무리|end|finish/i, action: 'saveAndExit' },
    { pattern: /뭐|what|상태|status/i, action: 'showStatus' },
    { pattern: /저장|save|기억/i, action: 'promptSave' },
  ];

  for (const hint of contextHints) {
    if (hint.pattern.test(context)) {
      switch (hint.action) {
        case 'showPending':
          if (followups.length > 0) {
            console.log('\n[!] 이전에 저장된 후속조치가 있습니다:');
            followups.forEach((f, i) => {
              console.log(`  ${i + 1}. ${f.title}`);
            });
            console.log('');
          }
          break;
        case 'showStatus':
          showStatus();
          break;
        case 'promptSave':
          console.log('\n[?] 현재 작업을 저장하시겠습니까?');
          console.log('[*] 작업 제목을 알려주세요.\n');
          break;
      }
      return;
    }
  }

  // 기본 동작: 후속조치가 있으면 항상 안내
  if (followups.length > 0) {
    console.log(`\n[*] 참고: ${followups.length}개의 후속조치가 대기 중입니다.\n`);
  }
}

// ============================================
// 상태 요약 (Claude 내부 호출용)
// ============================================

/**
 * 현재 상태 JSON 반환 (Claude 처리용)
 */
function getState() {
  const state = taskManager.getSessionState();
  const summary = statusReporter.getStatusSummary();

  return {
    ...summary,
    session: state.currentSession,
    pendingFollowups: state.pendingFollowups || [],
    recentTasks: state.recentTasks || [],
    lastUpdated: state.lastUpdated
  };
}

/**
 * 후속조치 목록만 반환
 */
function getPendingTasks() {
  return taskManager.getFollowups();
}

// ============================================
// CLI 처리
// ============================================

function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0] || 'auto';

  switch (command) {
    case 'auto':
    case 'a':
      auto();
      break;

    case 'status':
    case 's':
      showStatus();
      break;

    case 'save':
      if (args[1]) {
        saveTask(args.slice(1).join(' '));
      } else {
        console.log('사용법: node index.js save "작업 제목"');
      }
      break;

    case 'complete':
    case 'done':
      completeTask();
      break;

    case 'start':
      onSessionStart();
      break;

    case 'end':
      onSessionEnd();
      break;

    case 'state':
      console.log(JSON.stringify(getState(), null, 2));
      break;

    default:
      console.log('\nUnified Task System - 자동 작업 관리\n');
      console.log('사용법:');
      console.log('  node index.js auto     # 자동 상황 판단');
      console.log('  node index.js status   # 현재 상태');
      console.log('  node index.js save "제목" # 작업 저장');
      console.log('  node index.js complete # 작업 완료');
      console.log('  node index.js start    # 세션 시작');
      console.log('  node index.js end      # 세션 종료');
      console.log('  node index.js state    # JSON 상태');
      console.log('');
      break;
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  // 자동 실행
  auto,
  onSessionStart,
  onSessionEnd,
  contextAwareGuide,

  // 상태 관련
  showStatus,
  getState,
  getPendingTasks,

  // 작업 관리
  saveTask,
  completeTask,

  // 하위 모듈 접근
  taskManager,
  statusReporter,
  triggerDetector
};

// CLI 실행
if (require.main === module) {
  handleCLI();
}
