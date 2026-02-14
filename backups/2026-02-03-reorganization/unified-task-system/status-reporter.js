/**
 * Status Reporter - 지속적 작업 상태 안내 시스템
 * 영구적 솔루션: 사용자에게 항상 현재 상태를 명확히 안내
 *
 * 위치: K:/PortableApps/genai/unified-task-system/status-reporter.js
 *
 * 핵심 기능:
 * - 작업 진행/종료/예정 상태 추적
 * - 세션 시작/종료 시 자동 안내
 * - 사용자에게 명확한 가이드 제공
 *
 * 사용법:
 *   const sr = require('./status-reporter.js');
 *   sr.reportCurrentStatus();     // 현재 상태 보고
 *   sr.reportSessionStart();      // 세션 시작 안내
 *   sr.reportSessionEnd();        // 세션 종료 안내
 *   sr.reportTaskChange(type, task); // 작업 변경 안내
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = path.resolve(__dirname);
const taskManager = require('./task-manager.js');

// ============================================
// 상태 보고 함수들
// ============================================

/**
 * 현재 전체 상태 보고
 */
function reportCurrentStatus() {
  const state = taskManager.getSessionState();
  const followups = state.pendingFollowups || [];
  const tasks = state.recentTasks || [];

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║             [*] 현재 작업 상태 보고서                      ║');
  console.log('╠════════════════════════════════════════════════════════════╣');

  // 세션 정보
  if (state.currentSession && state.currentSession.id) {
    console.log(`║ 세션 ID: ${state.currentSession.id.substring(0, 30)}...`);
    if (state.currentSession.startTime) {
      const startTime = new Date(state.currentSession.startTime);
      const duration = Math.floor((Date.now() - startTime.getTime()) / 60000);
      console.log(`║ 진행 시간: ${duration}분`);
    }
  }

  console.log('╠════════════════════════════════════════════════════════════╣');

  // 진행 중인 작업
  console.log('║ [*] 진행 중인 작업 (In Progress):');
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  if (inProgress.length > 0) {
    inProgress.forEach((t, i) => {
      console.log(`║   ${i + 1}. ${t.title.substring(0, 50)}`);
    });
  } else {
    console.log('║   (진행 중인 작업 없음)');
  }

  console.log('╠════════════════════════════════════════════════════════════╣');

  // 예정된 후속조치
  console.log('║ [!] 예정된 후속조치 (Pending Followups):');
  if (followups.length > 0) {
    followups.forEach((f, i) => {
      const priority = f.priority === 'high' ? '[!!!]' :
                       f.priority === 'low' ? '[.]' : '[!]';
      console.log(`║   ${i + 1}. ${priority} ${f.title.substring(0, 45)}`);
    });
  } else {
    console.log('║   (예정된 후속조치 없음)');
  }

  console.log('╠════════════════════════════════════════════════════════════╣');

  // 최근 완료된 작업
  console.log('║ [+] 최근 완료된 작업 (Recently Completed):');
  const completed = tasks.filter(t => t.status === 'completed').slice(0, 3);
  if (completed.length > 0) {
    completed.forEach((t, i) => {
      console.log(`║   ${i + 1}. ${t.title.substring(0, 50)}`);
    });
  } else {
    console.log('║   (완료된 작업 없음)');
  }

  console.log('╠════════════════════════════════════════════════════════════╣');

  // 사용자 안내
  console.log('║ [?] 다음 행동 안내:');
  if (followups.length > 0) {
    console.log('║   → "후속조치" 입력하여 대기 작업 시작');
  }
  if (inProgress.length > 0) {
    console.log('║   → "작업 완료" 입력하여 현재 작업 완료 처리');
  }
  console.log('║   → "진행상황" 입력하여 상태 재확인');
  console.log('║   → "저장해" 입력하여 현재 상태 저장');

  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  return {
    session: state.currentSession,
    inProgress: inProgress,
    pending: followups,
    completed: completed
  };
}

/**
 * 세션 시작 안내 (자동 호출)
 */
function reportSessionStart() {
  const state = taskManager.getSessionState();
  const followups = state.pendingFollowups || [];

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       [+] 새 세션 시작 - Unified Task System 활성화        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  if (followups.length > 0) {
    console.log('┌────────────────────────────────────────────────────────────┐');
    console.log('│ [!] 이전 세션에서 저장된 후속조치가 있습니다!             │');
    console.log('├────────────────────────────────────────────────────────────┤');
    followups.forEach((f, i) => {
      const priority = f.priority === 'high' ? '[!!!]' :
                       f.priority === 'low' ? '[.]' : '[!]';
      const title = f.title.length > 48 ? f.title.substring(0, 45) + '...' : f.title;
      console.log(`│ ${i + 1}. ${priority} ${title}`);
    });
    console.log('├────────────────────────────────────────────────────────────┤');
    console.log('│ [*] "후속조치" 입력하면 위 작업을 이어서 진행합니다.      │');
    console.log('└────────────────────────────────────────────────────────────┘');
  } else {
    console.log('┌────────────────────────────────────────────────────────────┐');
    console.log('│ [+] 대기 중인 후속조치가 없습니다. 새 작업을 시작하세요.  │');
    console.log('└────────────────────────────────────────────────────────────┘');
  }

  // 마지막 세션 정보
  if (state.lastUpdated) {
    const lastUpdate = new Date(state.lastUpdated);
    console.log('');
    console.log(`[*] 마지막 저장: ${lastUpdate.toLocaleString('ko-KR')}`);
  }

  console.log('');

  return { followups: followups, hasWork: followups.length > 0 };
}

/**
 * 세션 종료 안내 (자동 호출)
 */
function reportSessionEnd() {
  const state = taskManager.getSessionState();
  const followups = state.pendingFollowups || [];
  const tasks = state.recentTasks || [];

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         [*] 세션 종료 - 상태 저장 완료                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // 저장된 후속조치
  if (followups.length > 0) {
    console.log('┌────────────────────────────────────────────────────────────┐');
    console.log('│ [!] 다음 세션에서 이어서 진행할 후속조치:                  │');
    console.log('├────────────────────────────────────────────────────────────┤');
    followups.forEach((f, i) => {
      const priority = f.priority === 'high' ? '[!!!]' :
                       f.priority === 'low' ? '[.]' : '[!]';
      const title = f.title.length > 48 ? f.title.substring(0, 45) + '...' : f.title;
      console.log(`│ ${i + 1}. ${priority} ${title}`);
    });
    console.log('└────────────────────────────────────────────────────────────┘');
  }

  // 이번 세션 작업 요약
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const completed = tasks.filter(t => t.status === 'completed');

  console.log('');
  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ [*] 이번 세션 요약:                                        │');
  console.log(`│   - 완료된 작업: ${completed.length}개`);
  console.log(`│   - 진행 중 작업: ${inProgress.length}개`);
  console.log(`│   - 저장된 후속조치: ${followups.length}개`);
  console.log('├────────────────────────────────────────────────────────────┤');
  console.log('│ [+] 다음 세션에서 "후속조치" 입력하면 자동 복원됩니다.     │');
  console.log('└────────────────────────────────────────────────────────────┘');
  console.log('');

  return {
    savedFollowups: followups.length,
    completedTasks: completed.length,
    inProgressTasks: inProgress.length
  };
}

/**
 * 작업 변경 시 안내
 * @param {string} type - 'added', 'completed', 'updated'
 * @param {object} task - 변경된 작업 정보
 */
function reportTaskChange(type, task) {
  const timestamp = new Date().toLocaleString('ko-KR');

  console.log('');
  switch (type) {
    case 'added':
      console.log('┌────────────────────────────────────────────────────────────┐');
      console.log('│ [+] 새 작업/후속조치 추가됨                                │');
      console.log(`│ 제목: ${task.title}`);
      console.log(`│ 우선순위: ${task.priority || 'medium'}`);
      console.log(`│ 시간: ${timestamp}`);
      console.log('└────────────────────────────────────────────────────────────┘');
      break;

    case 'completed':
      console.log('┌────────────────────────────────────────────────────────────┐');
      console.log('│ [+] 작업 완료됨                                            │');
      console.log(`│ 제목: ${task.title}`);
      console.log(`│ 완료 시간: ${timestamp}`);
      console.log('└────────────────────────────────────────────────────────────┘');

      // 남은 작업 안내
      const remaining = taskManager.getFollowups();
      if (remaining.length > 0) {
        console.log(`│ [*] 남은 후속조치: ${remaining.length}개`);
        console.log('│ [*] "후속조치" 입력하여 다음 작업을 확인하세요.');
      } else {
        console.log('│ [+] 모든 후속조치가 완료되었습니다!');
      }
      break;

    case 'updated':
      console.log('┌────────────────────────────────────────────────────────────┐');
      console.log('│ [*] 작업 상태 변경됨                                       │');
      console.log(`│ 제목: ${task.title}`);
      console.log(`│ 새 상태: ${task.status}`);
      console.log(`│ 시간: ${timestamp}`);
      console.log('└────────────────────────────────────────────────────────────┘');
      break;

    default:
      console.log(`[*] 작업 변경: ${type} - ${task.title}`);
  }
  console.log('');

  return { type, task, timestamp };
}

/**
 * 간단한 상태 요약 (한 줄)
 */
function getStatusSummary() {
  const state = taskManager.getSessionState();
  const followups = state.pendingFollowups || [];
  const tasks = state.recentTasks || [];
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;

  return {
    summary: `후속조치: ${followups.length}개 | 진행중: ${inProgress}개 | 완료: ${completed}개`,
    followups: followups.length,
    inProgress: inProgress,
    completed: completed
  };
}

/**
 * 상태 변경 감지 및 자동 안내
 * (워치 모드용 - 별도 프로세스에서 실행)
 */
function watchAndReport(intervalMs = 30000) {
  let lastState = JSON.stringify(taskManager.getSessionState());

  console.log('[*] 상태 감시 시작...');

  setInterval(() => {
    const currentState = JSON.stringify(taskManager.getSessionState());
    if (currentState !== lastState) {
      console.log('\n[!] 상태 변경 감지됨');
      reportCurrentStatus();
      lastState = currentState;
    }
  }, intervalMs);
}

// ============================================
// CLI 처리
// ============================================

function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  switch (command) {
    case 'status':
    case 's':
      reportCurrentStatus();
      break;

    case 'start':
      reportSessionStart();
      break;

    case 'end':
      reportSessionEnd();
      break;

    case 'summary':
      const summary = getStatusSummary();
      console.log(`\n[*] ${summary.summary}\n`);
      break;

    case 'watch':
      const interval = parseInt(args[1]) || 30000;
      watchAndReport(interval);
      break;

    default:
      console.log('\n사용법:');
      console.log('  node status-reporter.js status   # 전체 상태 보고');
      console.log('  node status-reporter.js start    # 세션 시작 안내');
      console.log('  node status-reporter.js end      # 세션 종료 안내');
      console.log('  node status-reporter.js summary  # 한 줄 요약');
      console.log('  node status-reporter.js watch [ms] # 상태 감시');
      console.log('');
      break;
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  reportCurrentStatus,
  reportSessionStart,
  reportSessionEnd,
  reportTaskChange,
  getStatusSummary,
  watchAndReport
};

// CLI 실행
if (require.main === module) {
  handleCLI();
}
