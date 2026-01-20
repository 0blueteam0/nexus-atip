/**
 * Session Restore Script
 * 세션 시작 시 자동 실행되어 이전 세션의 후속조치 복원
 *
 * 위치: K:/PortableApps/Claude-Code/unified-task-system/session-restore.js
 * 호출: .claude-hooks.json의 session-start hook
 *
 * [v2.0] Autosave 복원 지원 추가
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_PATH = 'K:/PortableApps/Claude-Code/unified-task-system';
const SESSION_STATE_FILE = path.join(BASE_PATH, 'session-state.json');
const TASKS_FILE = path.join(BASE_PATH, 'tasks.json');
const AUTOSAVE_FILE = path.join('K:/PortableApps/Claude-Code/atos', 'autosave-snapshot.json');

/**
 * 세션 상태 파일 로드 (Autosave 복구 포함)
 */
function loadSessionState() {
  const defaultState = {
    version: '1.0.0',
    pendingFollowups: [],
    recentTasks: [],
    sessionHistory: []
  };

  // 1. 정상 상태 파일 시도
  try {
    if (fs.existsSync(SESSION_STATE_FILE)) {
      const data = fs.readFileSync(SESSION_STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[!] 세션 상태 파일 손상 감지');
  }

  // 2. 백업 파일에서 복구 시도
  const backupFile = `${SESSION_STATE_FILE}.backup`;
  try {
    if (fs.existsSync(backupFile)) {
      console.log('[*] 백업 파일에서 복구 시도...');
      const backupData = fs.readFileSync(backupFile, 'utf8');
      const state = JSON.parse(backupData);
      console.log('[+] 백업에서 복구 성공');
      return state;
    }
  } catch (error) {
    console.error('[!] 백업 파일도 손상됨');
  }

  // 3. Autosave 스냅샷에서 복구 시도
  try {
    if (fs.existsSync(AUTOSAVE_FILE)) {
      console.log('[*] Autosave 스냅샷에서 복구 시도...');
      const autosaveData = fs.readFileSync(AUTOSAVE_FILE, 'utf8');
      const snapshot = JSON.parse(autosaveData);

      if (snapshot.sessionState) {
        console.log(`[+] Autosave에서 복구 성공: ${snapshot.timestamp}`);
        if (snapshot.emergencySave) {
          console.log('[!] 긴급 저장 스냅샷 - 이전 세션이 비정상 종료됨');
        }
        return snapshot.sessionState;
      }
    }
  } catch (error) {
    console.error('[!] Autosave 복구 실패:', error.message);
  }

  // 4. 모든 복구 실패 - 기본값 반환
  console.log('[*] 새 세션 상태로 시작');
  return defaultState;
}

/**
 * 새 세션 ID 생성
 */
function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 플래닝 시스템 상태 복원
 * [DEPRECATED] planning-restore 훅에서 처리하므로 중복 호출 제거 (2026-01-20)
 * 이 함수는 호환성을 위해 유지하되 내부 로직 비활성화
 */
function restorePlanningState() {
  // 중복 호출 방지: planning-restore 훅에서 이미 처리됨
  // 참조: .claude-hooks.json > planning-restore
  // console.log('[*] Planning restore handled by planning-restore hook');
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
