/**
 * Session Persist Script
 * 세션 종료 시 자동 실행되어 후속조치 및 상태 저장
 *
 * 위치: K:/PortableApps/genai/unified-task-system/session-persist.js
 * 호출: .claude-hooks.json의 session-end hook
 *
 * 사용법:
 *   node session-persist.js                     # 기본 저장
 *   node session-persist.js --followup "작업1"  # 후속조치 추가
 *   node session-persist.js --task "제목" --priority high
 *
 * [v2.0] 원자적 쓰기 + 백업 지원
 */

const fs = require('fs');
const path = require('path');

// file-ops 모듈 로드 시도
let fileOps;
try {
  fileOps = require('../atos/file-ops');
} catch (e) {
  // 모듈 없으면 기본 fs 사용
  fileOps = null;
}

const BASE_PATH = 'K:/PortableApps/genai/unified-task-system';
const SESSION_STATE_FILE = path.join(BASE_PATH, 'session-state.json');
const TASKS_FILE = path.join(BASE_PATH, 'tasks.json');

/**
 * 세션 상태 파일 로드
 */
function loadSessionState() {
  try {
    if (fs.existsSync(SESSION_STATE_FILE)) {
      const data = fs.readFileSync(SESSION_STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[!] 세션 상태 로드 실패:', error.message);
  }
  return {
    version: '1.0.0',
    pendingFollowups: [],
    recentTasks: [],
    sessionHistory: []
  };
}

/**
 * 세션 상태 저장 (원자적 쓰기 + 백업)
 */
function saveSessionState(state) {
  try {
    state.lastUpdated = new Date().toISOString();

    // file-ops 모듈 사용 (있으면)
    if (fileOps && fileOps.writeWithBackup) {
      const result = fileOps.writeWithBackup(SESSION_STATE_FILE, state);
      if (!result.success) {
        console.error('[!] 원자적 저장 실패:', result.error);
        return false;
      }
      return true;
    }

    // 폴백: 기본 fs 사용 (백업 생성)
    const backupFile = `${SESSION_STATE_FILE}.backup`;
    if (fs.existsSync(SESSION_STATE_FILE)) {
      fs.copyFileSync(SESSION_STATE_FILE, backupFile);
    }
    fs.writeFileSync(SESSION_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[!] 세션 상태 저장 실패:', error.message);
    return false;
  }
}

/**
 * 후속조치 추가
 */
function addFollowup(state, title, options = {}) {
  const followup = {
    id: `followup-${Date.now()}`,
    title: title,
    description: options.description || '',
    priority: options.priority || 'medium',
    savedAt: new Date().toISOString(),
    sessionId: state.currentSession ? state.currentSession.id : null
  };

  if (!state.pendingFollowups) {
    state.pendingFollowups = [];
  }

  state.pendingFollowups.push(followup);
  console.log(`[+] 후속조치 추가: ${title}`);
  return followup;
}

/**
 * 현재 작업 저장
 */
function addRecentTask(state, title, status = 'in_progress') {
  const task = {
    id: `task-${Date.now()}`,
    title: title,
    status: status,
    savedAt: new Date().toISOString()
  };

  if (!state.recentTasks) {
    state.recentTasks = [];
  }

  // 중복 제거 (같은 제목)
  state.recentTasks = state.recentTasks.filter(t => t.title !== title);
  state.recentTasks.unshift(task);

  // 최대 10개 유지
  if (state.recentTasks.length > 10) {
    state.recentTasks = state.recentTasks.slice(0, 10);
  }

  console.log(`[+] 작업 저장: ${title} (${status})`);
  return task;
}

/**
 * 명령줄 인자 파싱
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    followups: [],
    tasks: [],
    clear: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--followup' && args[i + 1]) {
      result.followups.push({
        title: args[i + 1],
        priority: 'medium'
      });
      i++;
    } else if (args[i] === '--task' && args[i + 1]) {
      result.tasks.push({
        title: args[i + 1],
        status: 'in_progress'
      });
      i++;
    } else if (args[i] === '--priority' && args[i + 1]) {
      // 마지막 추가된 항목의 priority 변경
      if (result.followups.length > 0) {
        result.followups[result.followups.length - 1].priority = args[i + 1];
      }
      i++;
    } else if (args[i] === '--clear') {
      result.clear = true;
    }
  }

  return result;
}

/**
 * 세션 종료 처리 메인 함수
 */
function persistSession() {
  console.log('\n[*] ========================================');
  console.log('[*] Unified Task System - Session Persist');
  console.log('[*] ========================================\n');

  const state = loadSessionState();
  const args = parseArgs();

  // 후속조치 초기화
  if (args.clear) {
    state.pendingFollowups = [];
    console.log('[*] 후속조치 목록 초기화됨');
  }

  // 후속조치 추가
  args.followups.forEach(f => {
    addFollowup(state, f.title, { priority: f.priority });
  });

  // 작업 추가
  args.tasks.forEach(t => {
    addRecentTask(state, t.title, t.status);
  });

  // 세션 종료 시간 기록
  if (state.currentSession) {
    state.currentSession.endTime = new Date().toISOString();
  }

  // 상태 저장
  if (saveSessionState(state)) {
    console.log('\n[+] 세션 상태 저장 완료');

    // 저장된 후속조치 표시
    if (state.pendingFollowups && state.pendingFollowups.length > 0) {
      console.log('\n[*] 저장된 후속조치:');
      state.pendingFollowups.forEach((f, i) => {
        console.log(`  ${i + 1}. [${f.priority}] ${f.title}`);
      });
      console.log('\n[*] 다음 세션에서 "후속조치" 입력 시 복원됩니다.');
    }
  }

  console.log('\n[*] ========================================\n');
}

// API 내보내기 (다른 스크립트에서 사용 가능)
module.exports = {
  loadSessionState,
  saveSessionState,
  addFollowup,
  addRecentTask,
  persistSession
};

// 직접 실행 시
if (require.main === module) {
  persistSession();
}
