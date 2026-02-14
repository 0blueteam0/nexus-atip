/**
 * Unified Task Manager
 * 통합 작업 관리 시스템 - 영구적 솔루션
 *
 * 위치: K:/PortableApps/genai/unified-task-system/task-manager.js
 *
 * [DEPRECATED] v3.0 - unified-task-hub.js로 대체됨
 * 호환성을 위해 유지되지만, 새 코드에서는 unified-task-hub.js 사용 권장
 *
 * 새 사용법:
 *   const UnifiedTaskHub = require('./unified-task-hub');
 *   const hub = new UnifiedTaskHub();
 *   hub.addTask({ title: '작업 제목', priority: 'high' });
 *   hub.listTasks();
 *   hub.syncAll();
 *
 * CLI:
 *   node cli.js status    # 전체 상태
 *   node cli.js list      # 태스크 목록
 *   node cli.js add "제목" # 태스크 추가
 *   node cli.js sync      # 동기화
 *
 * ---
 * [LEGACY] 기존 API (하위 호환용):
 *
 * 기능:
 * - 후속조치 저장/복원
 * - 작업 상태 관리
 * - 세션 연속성 보장
 * - 트리거 기반 자동 실행
 *
 * 사용법 (Node.js):
 *   const tm = require('./task-manager.js');
 *   tm.saveFollowup('작업 제목', { priority: 'high' });
 *   tm.getFollowups();
 *   tm.clearFollowups();
 *
 * CLI 사용법:
 *   node task-manager.js followups           # 후속조치 목록
 *   node task-manager.js save "작업제목"     # 후속조치 저장
 *   node task-manager.js clear               # 후속조치 초기화
 *   node task-manager.js status              # 전체 상태
 */

// DEPRECATED 경고
if (process.env.NODE_ENV !== 'test') {
  console.warn('[DEPRECATED] task-manager.js는 unified-task-hub.js로 대체되었습니다.');
  console.warn('             새 CLI: node unified-task-system/cli.js help');
}

const fs = require('fs');
const path = require('path');

// 상수 정의
const BASE_PATH = path.resolve(__dirname);
const SESSION_STATE_FILE = path.join(BASE_PATH, 'session-state.json');
const TASKS_FILE = path.join(BASE_PATH, 'tasks.json');
const TRIGGERS_FILE = path.join(BASE_PATH, 'triggers.json');

/**
 * 파일 안전하게 읽기
 */
function safeReadJSON(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`[!] 파일 읽기 실패 (${path.basename(filePath)}):`, error.message);
  }
  return defaultValue;
}

/**
 * 파일 안전하게 쓰기
 */
function safeWriteJSON(filePath, data) {
  try {
    // 디렉토리 확인
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 백업 생성 (기존 파일 존재 시)
    if (fs.existsSync(filePath)) {
      const backupPath = filePath + '.backup';
      fs.copyFileSync(filePath, backupPath);
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`[!] 파일 쓰기 실패 (${path.basename(filePath)}):`, error.message);
    return false;
  }
}

/**
 * 세션 상태 로드
 */
function getSessionState() {
  return safeReadJSON(SESSION_STATE_FILE, {
    version: '1.0.0',
    lastUpdated: null,
    currentSession: { id: null, startTime: null, activeTask: null },
    pendingFollowups: [],
    recentTasks: [],
    sessionHistory: []
  });
}

/**
 * 세션 상태 저장
 */
function saveSessionState(state) {
  state.lastUpdated = new Date().toISOString();
  return safeWriteJSON(SESSION_STATE_FILE, state);
}

// ============================================
// 후속조치 관리 API
// ============================================

/**
 * 후속조치 저장
 * @param {string} title - 후속조치 제목
 * @param {object} options - { description, priority, tags }
 */
function saveFollowup(title, options = {}) {
  const state = getSessionState();

  const followup = {
    id: `followup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: title,
    description: options.description || '',
    priority: options.priority || 'medium', // high, medium, low
    tags: options.tags || [],
    savedAt: new Date().toISOString(),
    sessionId: state.currentSession ? state.currentSession.id : null
  };

  if (!state.pendingFollowups) {
    state.pendingFollowups = [];
  }

  // 중복 확인 (같은 제목)
  const existingIndex = state.pendingFollowups.findIndex(f => f.title === title);
  if (existingIndex >= 0) {
    state.pendingFollowups[existingIndex] = followup;
    console.log(`[*] 후속조치 업데이트: ${title}`);
  } else {
    state.pendingFollowups.push(followup);
    console.log(`[+] 후속조치 저장: ${title}`);
  }

  saveSessionState(state);
  return followup;
}

/**
 * 모든 후속조치 조회
 */
function getFollowups() {
  const state = getSessionState();
  return state.pendingFollowups || [];
}

/**
 * 후속조치 삭제 (완료 처리)
 */
function completeFollowup(followupId) {
  const state = getSessionState();

  const index = state.pendingFollowups.findIndex(f => f.id === followupId);
  if (index >= 0) {
    const completed = state.pendingFollowups.splice(index, 1)[0];
    completed.completedAt = new Date().toISOString();

    // 완료된 작업 기록
    if (!state.completedFollowups) {
      state.completedFollowups = [];
    }
    state.completedFollowups.push(completed);

    saveSessionState(state);
    console.log(`[+] 후속조치 완료: ${completed.title}`);
    return completed;
  }

  console.log(`[!] 후속조치를 찾을 수 없음: ${followupId}`);
  return null;
}

/**
 * 모든 후속조치 초기화
 */
function clearFollowups() {
  const state = getSessionState();
  const count = state.pendingFollowups ? state.pendingFollowups.length : 0;
  state.pendingFollowups = [];
  saveSessionState(state);
  console.log(`[+] ${count}개 후속조치 초기화됨`);
  return count;
}

// ============================================
// 작업 관리 API
// ============================================

/**
 * 현재 작업 설정
 */
function setActiveTask(taskId, taskTitle) {
  const state = getSessionState();
  state.currentSession.activeTask = { id: taskId, title: taskTitle };
  saveSessionState(state);
  console.log(`[*] 활성 작업: ${taskTitle}`);
}

/**
 * 최근 작업 추가
 */
function addRecentTask(title, status = 'in_progress') {
  const state = getSessionState();

  const task = {
    id: `task-${Date.now()}`,
    title: title,
    status: status,
    savedAt: new Date().toISOString()
  };

  if (!state.recentTasks) {
    state.recentTasks = [];
  }

  // 중복 제거
  state.recentTasks = state.recentTasks.filter(t => t.title !== title);
  state.recentTasks.unshift(task);

  // 최대 20개 유지
  if (state.recentTasks.length > 20) {
    state.recentTasks = state.recentTasks.slice(0, 20);
  }

  saveSessionState(state);
  return task;
}

// ============================================
// 상태 출력 API
// ============================================

/**
 * 전체 상태 출력
 */
function printStatus() {
  const state = getSessionState();

  console.log('\n========================================');
  console.log('  Unified Task System - Status');
  console.log('========================================\n');

  // 세션 정보
  if (state.currentSession && state.currentSession.id) {
    console.log(`[*] 현재 세션: ${state.currentSession.id}`);
    console.log(`[*] 시작 시간: ${state.currentSession.startTime || 'N/A'}`);
  }

  if (state.lastUpdated) {
    console.log(`[*] 마지막 업데이트: ${state.lastUpdated}`);
  }

  // 후속조치
  console.log('\n--- 후속조치 (Pending Followups) ---');
  const followups = state.pendingFollowups || [];
  if (followups.length === 0) {
    console.log('  (없음)');
  } else {
    followups.forEach((f, i) => {
      const priority = f.priority === 'high' ? '[!!!]' :
                       f.priority === 'low' ? '[.]' : '[!]';
      console.log(`  ${i + 1}. ${priority} ${f.title}`);
      if (f.description) {
        console.log(`      - ${f.description}`);
      }
    });
  }

  // 최근 작업
  console.log('\n--- 최근 작업 (Recent Tasks) ---');
  const tasks = state.recentTasks || [];
  if (tasks.length === 0) {
    console.log('  (없음)');
  } else {
    tasks.slice(0, 5).forEach((t, i) => {
      const status = t.status === 'completed' ? '[+]' :
                     t.status === 'in_progress' ? '[*]' : '[-]';
      console.log(`  ${status} ${t.title}`);
    });
  }

  console.log('\n========================================\n');
}

/**
 * 후속조치만 출력
 */
function printFollowups() {
  const followups = getFollowups();

  console.log('\n--- 후속조치 목록 ---\n');

  if (followups.length === 0) {
    console.log('  대기 중인 후속조치가 없습니다.');
    console.log('  "후속조치 저장" 또는 saveFollowup()으로 추가하세요.');
  } else {
    followups.forEach((f, i) => {
      const priority = f.priority === 'high' ? '[!!!]' :
                       f.priority === 'low' ? '[.]' : '[!]';
      console.log(`${i + 1}. ${priority} ${f.title}`);
      if (f.description) {
        console.log(`   설명: ${f.description}`);
      }
      console.log(`   저장: ${f.savedAt}`);
      console.log('');
    });

    console.log(`총 ${followups.length}개 후속조치 대기 중`);
  }

  console.log('');
}

// ============================================
// CLI 처리
// ============================================

function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'followups':
    case 'list':
      printFollowups();
      break;

    case 'save':
    case 'add':
      if (args[1]) {
        const priority = args[2] || 'medium';
        saveFollowup(args[1], { priority });
      } else {
        console.log('사용법: node task-manager.js save "작업제목" [priority]');
      }
      break;

    case 'complete':
    case 'done':
      if (args[1]) {
        const followups = getFollowups();
        const index = parseInt(args[1]) - 1;
        if (followups[index]) {
          completeFollowup(followups[index].id);
        } else {
          console.log(`[!] 유효하지 않은 번호: ${args[1]}`);
        }
      } else {
        console.log('사용법: node task-manager.js complete [번호]');
      }
      break;

    case 'clear':
      clearFollowups();
      break;

    case 'status':
    default:
      printStatus();
      break;
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  // 후속조치
  saveFollowup,
  getFollowups,
  completeFollowup,
  clearFollowups,

  // 작업 관리
  setActiveTask,
  addRecentTask,

  // 상태
  getSessionState,
  saveSessionState,
  printStatus,
  printFollowups,

  // 유틸리티
  safeReadJSON,
  safeWriteJSON
};

// CLI 실행
if (require.main === module) {
  handleCLI();
}
