/**
 * Session Restore Script
 * 세션 시작 시 자동 실행되어 이전 세션의 후속조치 복원
 *
 * 위치: K:/PortableApps/Claude-Code/unified-task-system/session-restore.js
 * 호출: .claude-hooks.json의 session-start hook
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_PATH = 'K:/PortableApps/Claude-Code/unified-task-system';
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
 * 새 세션 ID 생성
 */
function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 플래닝 시스템 상태 복원
 */
function restorePlanningState() {
  try {
    const output = execSync('node K:/PortableApps/Claude-Code/planning-system/restore.js --all --quiet', { encoding: 'utf8' });
    if (output.trim()) {
      console.log('\n' + output.trim());
    }
  } catch (e) {
    // 플랜 없으면 무시 (정상 동작)
  }
}

/**
 * 세션 복원 메인 함수
 */
function restoreSession() {
  console.log('\n[*] ========================================');
  console.log('[*] Unified Task System - Session Restore');
  console.log('[*] ========================================\n');

  const state = loadSessionState();
  const newSessionId = generateSessionId();
  const startTime = new Date().toISOString();

  // 후속조치 확인
  if (state.pendingFollowups && state.pendingFollowups.length > 0) {
    console.log('[!] === 후속조치 발견 (Pending Follow-ups) ===\n');
    state.pendingFollowups.forEach((followup, index) => {
      console.log(`  ${index + 1}. [${followup.priority || 'medium'}] ${followup.title}`);
      if (followup.description) {
        console.log(`     - ${followup.description}`);
      }
      if (followup.savedAt) {
        console.log(`     - 저장 시간: ${followup.savedAt}`);
      }
    });
    console.log('\n[*] "후속조치" 입력 시 위 작업들을 순차 진행합니다.');
    console.log('[*] ========================================\n');
  } else {
    console.log('[+] 대기 중인 후속조치가 없습니다.');
  }

  // 최근 작업 표시
  if (state.recentTasks && state.recentTasks.length > 0) {
    console.log('\n[*] === 최근 작업 (Recent Tasks) ===\n');
    state.recentTasks.slice(0, 5).forEach((task, index) => {
      const statusIcon = task.status === 'completed' ? '[+]' :
                         task.status === 'in_progress' ? '[*]' : '[-]';
      console.log(`  ${statusIcon} ${task.title}`);
    });
  }

  // 이전 세션 정보
  if (state.currentSession && state.currentSession.id) {
    console.log(`\n[*] 이전 세션: ${state.currentSession.id}`);
    if (state.lastUpdated) {
      console.log(`[*] 마지막 업데이트: ${state.lastUpdated}`);
    }
  }

  // 새 세션 정보 저장
  state.currentSession = {
    id: newSessionId,
    startTime: startTime,
    activeTask: null
  };

  // 세션 히스토리에 추가
  if (!state.sessionHistory) {
    state.sessionHistory = [];
  }
  state.sessionHistory.push({
    id: newSessionId,
    startTime: startTime,
    restoredFollowups: state.pendingFollowups ? state.pendingFollowups.length : 0
  });

  // 히스토리 최대 20개 유지
  if (state.sessionHistory.length > 20) {
    state.sessionHistory = state.sessionHistory.slice(-20);
  }

  // 상태 저장
  try {
    fs.writeFileSync(SESSION_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    console.log(`\n[+] 새 세션 시작: ${newSessionId}`);
  } catch (error) {
    console.error('[!] 세션 상태 저장 실패:', error.message);
  }

  // 플래닝 시스템 상태 복원
  restorePlanningState();

  console.log('[*] ========================================\n');
}

// 스크립트 실행
if (require.main === module) {
  restoreSession();
}

// 모듈 내보내기 (다른 스크립트에서 호출 가능)
module.exports = {
  loadSessionState,
  generateSessionId,
  restoreSession,
  restorePlanningState
};
