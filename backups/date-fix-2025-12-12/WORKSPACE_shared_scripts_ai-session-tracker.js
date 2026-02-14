/**
 * AI 세션 추적 스크립트
 * <!-- AI: claude-code, Created: 2025-01-12 -->
 * 
 * 기능:
 * - AI 세션 시작/종료 기록
 * - 세션별 생성 파일 추적
 * - 협업 상태 관리
 */

const fs = require('fs');
const path = require('path');

const SESSIONS_PATH = 'K:/WORKSPACE/_workspace-meta/ai-sessions.json';

function loadSessions() {
  try {
    return JSON.parse(fs.readFileSync(SESSIONS_PATH, 'utf8'));
  } catch (e) {
    return { sessions: [], registered_ais: [] };
  }
}

function saveSessions(data) {
  fs.writeFileSync(SESSIONS_PATH, JSON.stringify(data, null, 2));
}

function startSession(aiId, purpose = '') {
  const data = loadSessions();
  const session = {
    id: `${aiId}-${Date.now()}`,
    ai: aiId,
    started: new Date().toISOString(),
    ended: null,
    purpose: purpose,
    files_created: [],
    status: 'active'
  };
  data.sessions.push(session);
  saveSessions(data);
  console.log(`[+] 세션 시작: ${session.id}`);
  return session.id;
}

function endSession(sessionId) {
  const data = loadSessions();
  const session = data.sessions.find(s => s.id === sessionId);
  if (session) {
    session.ended = new Date().toISOString();
    session.status = 'completed';
    saveSessions(data);
    console.log(`[+] 세션 종료: ${sessionId}`);
  } else {
    console.log(`[-] 세션 없음: ${sessionId}`);
  }
}

function addFile(sessionId, filePath) {
  const data = loadSessions();
  const session = data.sessions.find(s => s.id === sessionId);
  if (session) {
    session.files_created.push({
      path: filePath,
      added: new Date().toISOString()
    });
    saveSessions(data);
    console.log(`[+] 파일 추가: ${filePath}`);
  }
}

function listActiveSessions() {
  const data = loadSessions();
  const active = data.sessions.filter(s => s.status === 'active');
  console.log(`[*] 활성 세션: ${active.length}개`);
  active.forEach(s => {
    console.log(`  - ${s.id} (${s.ai}): ${s.purpose || '목적 미지정'}`);
  });
  return active;
}

// CLI 처리
const args = process.argv.slice(2);
const cmd = args[0];

switch (cmd) {
  case 'start':
    startSession(args[1] || 'unknown', args[2] || '');
    break;
  case 'end':
    endSession(args[1]);
    break;
  case 'add':
    addFile(args[1], args[2]);
    break;
  case 'list':
    listActiveSessions();
    break;
  default:
    console.log('사용법:');
    console.log('  node ai-session-tracker.js start <ai-id> [purpose]');
    console.log('  node ai-session-tracker.js end <session-id>');
    console.log('  node ai-session-tracker.js add <session-id> <file-path>');
    console.log('  node ai-session-tracker.js list');
}
