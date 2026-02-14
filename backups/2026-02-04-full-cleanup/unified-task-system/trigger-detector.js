/**
 * Trigger Detector - 키워드 기반 자동 액션 실행
 * 영구적 솔루션: 모든 세션에서 동일하게 작동
 *
 * 위치: K:/PortableApps/genai/unified-task-system/trigger-detector.js
 *
 * 기능:
 * - 사용자 입력에서 트리거 키워드 감지
 * - 매칭된 트리거의 액션 자동 실행
 * - task-manager.js와 연동
 *
 * 사용법 (Node.js):
 *   const td = require('./trigger-detector.js');
 *   const result = td.detect("후속조치 확인해줘");
 *   if (result.matched) td.execute(result);
 *
 * CLI 사용법:
 *   node trigger-detector.js "후속조치"
 *   node trigger-detector.js --test      # 모든 트리거 테스트
 *   node trigger-detector.js --list      # 트리거 목록
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = path.resolve(__dirname);
const TRIGGERS_FILE = path.join(BASE_PATH, 'triggers.json');
const taskManager = require('./task-manager.js');

/**
 * 트리거 설정 로드
 */
function loadTriggers() {
  try {
    if (fs.existsSync(TRIGGERS_FILE)) {
      const data = fs.readFileSync(TRIGGERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[!] 트리거 로드 실패:', error.message);
  }
  return { version: '1.0.0', triggers: [] };
}

/**
 * 입력 텍스트에서 트리거 감지
 * @param {string} input - 사용자 입력 텍스트
 * @returns {object} - { matched: boolean, trigger: object, matches: array }
 */
function detect(input) {
  if (!input || typeof input !== 'string') {
    return { matched: false, trigger: null, matches: [] };
  }

  const config = loadTriggers();
  const normalizedInput = input.toLowerCase().trim();
  const allMatches = [];

  for (const trigger of config.triggers) {
    try {
      const regex = new RegExp(trigger.pattern, 'i');
      const match = normalizedInput.match(regex);

      if (match) {
        allMatches.push({
          trigger: trigger,
          matchedText: match[0],
          position: match.index
        });
      }
    } catch (error) {
      console.error(`[!] 트리거 패턴 오류 (${trigger.id}):`, error.message);
    }
  }

  // 우선순위별 정렬: immediate > high > medium > low
  const priorityOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
  allMatches.sort((a, b) => {
    const pa = priorityOrder[a.trigger.priority] || 2;
    const pb = priorityOrder[b.trigger.priority] || 2;
    return pa - pb;
  });

  if (allMatches.length > 0) {
    return {
      matched: true,
      trigger: allMatches[0].trigger,
      matchedText: allMatches[0].matchedText,
      allMatches: allMatches
    };
  }

  return { matched: false, trigger: null, matches: [] };
}

/**
 * 트리거 액션 실행
 * @param {object} result - detect() 결과
 * @returns {object} - 실행 결과
 */
function execute(result) {
  if (!result || !result.matched || !result.trigger) {
    return { success: false, message: '실행할 트리거 없음' };
  }

  const trigger = result.trigger;
  console.log(`\n[*] 트리거 감지: ${trigger.id}`);
  console.log(`[*] 매칭 텍스트: "${result.matchedText}"`);
  console.log(`[*] 액션 실행: ${trigger.action}\n`);

  try {
    switch (trigger.action) {
      case 'restorePendingTasks':
        return executeRestorePendingTasks();

      case 'showCurrentTasks':
        return executeShowCurrentTasks();

      case 'markTaskComplete':
        return executeMarkTaskComplete();

      case 'persistCurrentState':
        return executePersistCurrentState();

      default:
        console.log(`[!] 알 수 없는 액션: ${trigger.action}`);
        return { success: false, message: `알 수 없는 액션: ${trigger.action}` };
    }
  } catch (error) {
    console.error(`[!] 액션 실행 실패:`, error.message);
    return { success: false, message: error.message };
  }
}

// ============================================
// 액션 구현부
// ============================================

/**
 * 후속조치 복원 액션
 */
function executeRestorePendingTasks() {
  console.log('========================================');
  console.log('  [!] 후속조치 복원 (Pending Followups)');
  console.log('========================================\n');

  const followups = taskManager.getFollowups();

  if (followups.length === 0) {
    console.log('  대기 중인 후속조치가 없습니다.');
    console.log('  새 작업을 시작하거나 saveFollowup()으로 추가하세요.\n');
    return {
      success: true,
      action: 'restorePendingTasks',
      data: [],
      message: '대기 중인 후속조치 없음'
    };
  }

  console.log(`  총 ${followups.length}개의 후속조치 발견:\n`);

  followups.forEach((f, i) => {
    const priority = f.priority === 'high' ? '[!!!]' :
                     f.priority === 'low' ? '[.]' : '[!]';
    console.log(`  ${i + 1}. ${priority} ${f.title}`);
    if (f.description) {
      console.log(`     - ${f.description}`);
    }
    if (f.savedAt) {
      console.log(`     - 저장: ${new Date(f.savedAt).toLocaleString('ko-KR')}`);
    }
    console.log('');
  });

  console.log('========================================');
  console.log('  [*] 위 작업들을 순차적으로 진행하세요.');
  console.log('  [*] 완료 후 "작업 완료" 또는 completeFollowup() 호출');
  console.log('========================================\n');

  return {
    success: true,
    action: 'restorePendingTasks',
    data: followups,
    message: `${followups.length}개 후속조치 복원됨`
  };
}

/**
 * 현재 작업 상태 표시 액션
 */
function executeShowCurrentTasks() {
  console.log('========================================');
  console.log('  [*] 현재 작업 상태 (Current Status)');
  console.log('========================================\n');

  const state = taskManager.getSessionState();

  // 현재 세션 정보
  if (state.currentSession && state.currentSession.id) {
    console.log(`  세션: ${state.currentSession.id}`);
    if (state.currentSession.startTime) {
      console.log(`  시작: ${new Date(state.currentSession.startTime).toLocaleString('ko-KR')}`);
    }
    if (state.currentSession.activeTask) {
      console.log(`  활성 작업: ${state.currentSession.activeTask.title}`);
    }
    console.log('');
  }

  // 후속조치
  const followups = state.pendingFollowups || [];
  console.log(`  --- 후속조치: ${followups.length}개 ---`);
  if (followups.length > 0) {
    followups.forEach((f, i) => {
      const priority = f.priority === 'high' ? '[!!!]' :
                       f.priority === 'low' ? '[.]' : '[!]';
      console.log(`  ${i + 1}. ${priority} ${f.title}`);
    });
  } else {
    console.log('  (대기 중인 후속조치 없음)');
  }
  console.log('');

  // 최근 작업
  const tasks = state.recentTasks || [];
  console.log(`  --- 최근 작업: ${tasks.length}개 ---`);
  if (tasks.length > 0) {
    tasks.slice(0, 5).forEach((t) => {
      const status = t.status === 'completed' ? '[+]' :
                     t.status === 'in_progress' ? '[*]' : '[-]';
      console.log(`  ${status} ${t.title}`);
    });
  } else {
    console.log('  (최근 작업 없음)');
  }

  console.log('\n========================================\n');

  return {
    success: true,
    action: 'showCurrentTasks',
    data: { followups, tasks, session: state.currentSession },
    message: '상태 표시 완료'
  };
}

/**
 * 작업 완료 표시 액션
 */
function executeMarkTaskComplete() {
  const followups = taskManager.getFollowups();

  if (followups.length === 0) {
    console.log('[*] 완료할 후속조치가 없습니다.');
    return {
      success: true,
      action: 'markTaskComplete',
      data: null,
      message: '완료할 작업 없음'
    };
  }

  // 첫 번째 후속조치 완료 처리
  const completed = taskManager.completeFollowup(followups[0].id);

  console.log('========================================');
  console.log('  [+] 작업 완료 처리');
  console.log('========================================\n');

  if (completed) {
    console.log(`  완료된 작업: ${completed.title}`);
    console.log(`  완료 시간: ${new Date().toLocaleString('ko-KR')}`);

    const remaining = taskManager.getFollowups();
    if (remaining.length > 0) {
      console.log(`\n  남은 후속조치: ${remaining.length}개`);
      remaining.forEach((f, i) => {
        console.log(`    ${i + 1}. ${f.title}`);
      });
    } else {
      console.log('\n  [+] 모든 후속조치가 완료되었습니다!');
    }
  }

  console.log('\n========================================\n');

  return {
    success: true,
    action: 'markTaskComplete',
    data: completed,
    message: completed ? `완료: ${completed.title}` : '완료 실패'
  };
}

/**
 * 현재 상태 저장 액션
 */
function executePersistCurrentState() {
  console.log('========================================');
  console.log('  [+] 현재 상태 저장');
  console.log('========================================\n');

  const state = taskManager.getSessionState();
  const success = taskManager.saveSessionState(state);

  if (success) {
    console.log('  [+] 세션 상태 저장 완료');
    console.log(`  저장 시간: ${new Date().toLocaleString('ko-KR')}`);

    if (state.pendingFollowups && state.pendingFollowups.length > 0) {
      console.log(`  후속조치 ${state.pendingFollowups.length}개 보존됨`);
    }
    if (state.recentTasks && state.recentTasks.length > 0) {
      console.log(`  최근 작업 ${state.recentTasks.length}개 보존됨`);
    }
  } else {
    console.log('  [!] 저장 실패');
  }

  console.log('\n========================================\n');

  return {
    success: success,
    action: 'persistCurrentState',
    data: state,
    message: success ? '상태 저장 완료' : '저장 실패'
  };
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 트리거 목록 출력
 */
function listTriggers() {
  const config = loadTriggers();

  console.log('\n========================================');
  console.log('  등록된 트리거 목록');
  console.log('========================================\n');

  config.triggers.forEach((t, i) => {
    console.log(`${i + 1}. [${t.id}]`);
    console.log(`   패턴: ${t.pattern}`);
    console.log(`   액션: ${t.action}`);
    console.log(`   우선순위: ${t.priority}`);
    console.log(`   설명: ${t.description || '-'}`);
    console.log('');
  });

  console.log('========================================\n');
}

/**
 * 모든 트리거 테스트
 */
function testAllTriggers() {
  console.log('\n========================================');
  console.log('  트리거 테스트');
  console.log('========================================\n');

  const testCases = [
    '후속조치',
    'follow-up 확인',
    '이어서 작업',
    '진행상황 알려줘',
    'status check',
    '현재 작업 뭐야',
    '작업 완료',
    'done',
    '완료했어',
    '저장해줘',
    'save this',
    '기억해'
  ];

  testCases.forEach(tc => {
    const result = detect(tc);
    const status = result.matched ? '[+]' : '[-]';
    const trigger = result.matched ? ` → ${result.trigger.id}` : '';
    console.log(`${status} "${tc}"${trigger}`);
  });

  console.log('\n========================================\n');
}

// ============================================
// CLI 처리
// ============================================

function handleCLI() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('\n사용법:');
    console.log('  node trigger-detector.js "입력 텍스트"');
    console.log('  node trigger-detector.js --list');
    console.log('  node trigger-detector.js --test');
    console.log('');
    return;
  }

  const command = args[0];

  switch (command) {
    case '--list':
    case '-l':
      listTriggers();
      break;

    case '--test':
    case '-t':
      testAllTriggers();
      break;

    default:
      // 입력 텍스트로 트리거 감지 및 실행
      const input = args.join(' ');
      const result = detect(input);

      if (result.matched) {
        execute(result);
      } else {
        console.log(`\n[-] 트리거 감지 안됨: "${input}"`);
        console.log('[*] --list로 등록된 트리거를 확인하세요.\n');
      }
      break;
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  detect,
  execute,
  loadTriggers,
  listTriggers,
  testAllTriggers,

  // 개별 액션 (외부 호출용)
  executeRestorePendingTasks,
  executeShowCurrentTasks,
  executeMarkTaskComplete,
  executePersistCurrentState
};

// CLI 실행
if (require.main === module) {
  handleCLI();
}
