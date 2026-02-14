#!/usr/bin/env node
/**
 * Unified Task System CLI
 *
 * 위치: K:/PortableApps/genai/unified-task-system/cli.js
 *
 * 통합 CLI 진입점 - 모든 태스크 관리 기능 제공
 *
 * 사용법:
 *   node cli.js status         # 전체 상태 확인
 *   node cli.js list           # 태스크 목록
 *   node cli.js add "제목"     # 태스크 추가
 *   node cli.js sync           # 전체 동기화
 *   node cli.js queue          # 큐 상태
 *   node cli.js dashboard      # Dashboard 연결 테스트
 *   node cli.js restore        # 세션 복원
 *   node cli.js persist        # 세션 저장
 */

const path = require('path');

// 모듈 로드
const UnifiedTaskHub = require('./unified-task-hub');
const { getInstance: getDashboardBridge } = require('./dashboard/dashboard-bridge');
const { restoreSession } = require('./session-restore');
const { persistSession } = require('./session-persist');

// 큐 매니저 (옵션)
let QueueManager;
try {
  QueueManager = require('./task-queue/queue-manager');
} catch (e) {
  QueueManager = null;
}

// 색상 출력 헬퍼
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================
// 명령어 핸들러
// ============================================

async function handleStatus() {
  log('\n========================================', 'bold');
  log('  Unified Task System - Status', 'bold');
  log('========================================\n', 'bold');

  const hub = new UnifiedTaskHub({ autoSync: false });
  const status = hub.getStatus();

  log(`[*] 버전: ${status.version}`, 'cyan');
  log(`[*] 마지막 업데이트: ${status.lastUpdated || 'N/A'}`, 'cyan');

  log('\n--- 태스크 통계 ---', 'yellow');
  log(`[*] 전체: ${status.metadata.totalTasks}개`);
  log(`[+] 완료: ${status.metadata.completedTasks}개`, 'green');
  log(`[-] 대기: ${status.metadata.pendingTasks}개`);

  log('\n--- 소스별 ---', 'yellow');
  for (const [source, count] of Object.entries(status.metadata.sources || {})) {
    log(`  [*] ${source}: ${count}개`);
  }

  log('\n--- 어댑터 ---', 'yellow');
  for (const [name, adapter] of Object.entries(status.adapters)) {
    const enabled = adapter.enabled ? '[+]' : '[-]';
    const color = adapter.enabled ? 'green' : 'red';
    log(`  ${enabled} ${name}: ${adapter.taskCount}개`, color);
  }

  // Dashboard 상태
  log('\n--- Dashboard ---', 'yellow');
  const bridge = getDashboardBridge();
  const connected = await bridge.connect();
  const dashStatus = bridge.getStatus();
  log(`  [${connected ? '+' : '-'}] ${dashStatus.dashboardUrl}`, connected ? 'green' : 'red');

  // Queue 상태
  if (QueueManager) {
    log('\n--- Queue ---', 'yellow');
    log(`  [*] Pending: ${status.queueStatus?.pending || 0}`);
    log(`  [*] Processing: ${status.queueStatus?.processing || 0}`);
    log(`  [+] Completed: ${status.queueStatus?.completed || 0}`, 'green');
  }

  log('\n========================================\n', 'bold');
  hub.destroy();
}

async function handleList(filter = {}) {
  const hub = new UnifiedTaskHub({ autoSync: false });
  const tasks = hub.listTasks(filter);

  log('\n--- 태스크 목록 ---\n', 'bold');

  if (tasks.length === 0) {
    log('  (태스크 없음)', 'yellow');
  } else {
    tasks.forEach((t, i) => {
      const statusIcon = t.status === 'completed' ? '[+]' :
                         t.status === 'in_progress' ? '[*]' : '[-]';
      const color = t.status === 'completed' ? 'green' :
                    t.status === 'in_progress' ? 'yellow' : 'reset';
      const source = t.source ? `[${t.source}]` : '';
      log(`${i + 1}. ${statusIcon} ${source} ${t.title}`, color);
    });
  }

  log(`\n총 ${tasks.length}개\n`);
  hub.destroy();
}

async function handleAdd(title, options = {}) {
  if (!title) {
    log('[!] 태스크 제목을 입력하세요', 'red');
    log('사용법: node cli.js add "태스크 제목" [--phase implement] [--priority high]');
    return;
  }

  const hub = new UnifiedTaskHub({ autoSync: false });

  const task = hub.addTask({
    title,
    source: 'cli',
    phase: options.phase || null,
    priority: options.priority || 'medium',
    status: 'pending'
  });

  log(`[+] 태스크 추가됨: ${task.title}`, 'green');
  log(`    ID: ${task.id}`);

  hub.destroy();
}

async function handleSync() {
  const hub = new UnifiedTaskHub({ autoSync: false });

  log('\n[*] 동기화 시작...', 'cyan');
  const results = await hub.syncAll();

  log('\n--- 동기화 결과 ---', 'bold');
  for (const [name, result] of Object.entries(results)) {
    const icon = result.success ? '[+]' : '[!]';
    const color = result.success ? 'green' : 'red';
    log(`${icon} ${name}: ${result.synced}개`, color);
  }

  hub.destroy();
}

async function handleQueue() {
  if (!QueueManager) {
    log('[!] Queue Manager가 설치되지 않았습니다', 'red');
    return;
  }

  log('\n--- Queue 상태 ---\n', 'bold');

  try {
    const manager = new QueueManager();
    const status = await manager.getStatus();

    log(`[*] 연결: ${status.connected ? '정상' : '실패'}`, status.connected ? 'green' : 'red');
    log(`[*] Pending Jobs: ${status.pending || 0}`);
    log(`[*] Processing Jobs: ${status.processing || 0}`);
    log(`[+] Completed Jobs: ${status.completed || 0}`, 'green');

    await manager.close();
  } catch (error) {
    log(`[!] Queue 상태 조회 실패: ${error.message}`, 'red');
  }
}

async function handleDashboard() {
  log('\n--- Dashboard 연결 테스트 ---\n', 'bold');

  const bridge = getDashboardBridge();
  const connected = await bridge.connect();

  if (connected) {
    log('[+] Dashboard 연결 성공', 'green');
    log(`    URL: ${bridge.options.dashboardUrl}`);

    // 테스트 데이터 전송
    await bridge.pushTaskUpdate({
      id: 'cli-test',
      title: 'CLI Test Task',
      status: 'pending',
      timestamp: new Date().toISOString()
    });
    log('[+] 테스트 데이터 전송 완료', 'green');
  } else {
    log('[!] Dashboard 연결 실패', 'red');
    log('    Dashboard가 실행 중인지 확인하세요: http://localhost:7847');
  }

  await bridge.close();
}

async function handleRestore() {
  restoreSession();
}

async function handlePersist() {
  persistSession();
}

async function handleHelp() {
  log('\n========================================', 'bold');
  log('  Unified Task System CLI', 'bold');
  log('========================================\n', 'bold');

  log('명령어:', 'yellow');
  log('  status      전체 상태 확인');
  log('  list        태스크 목록 (--status pending|in_progress|completed)');
  log('  add "제목"  태스크 추가 (--phase, --priority)');
  log('  sync        전체 동기화 (Shrimp, Planning)');
  log('  queue       Redis 큐 상태');
  log('  dashboard   Dashboard 연결 테스트');
  log('  restore     세션 복원');
  log('  persist     세션 저장');
  log('  help        도움말');

  log('\n예시:', 'yellow');
  log('  node cli.js status');
  log('  node cli.js list --status pending');
  log('  node cli.js add "버그 수정" --priority high --phase implement');
  log('  node cli.js sync');

  log('\n========================================\n', 'bold');
}

// ============================================
// 인자 파싱
// ============================================

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    command: args[0] || 'status',
    positional: [],
    options: {}
  };

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      result.options[key] = args[i + 1] || true;
      if (args[i + 1] && !args[i + 1].startsWith('--')) i++;
    } else {
      result.positional.push(args[i]);
    }
  }

  return result;
}

// ============================================
// 메인
// ============================================

async function main() {
  const { command, positional, options } = parseArgs();

  try {
    switch (command) {
      case 'status':
        await handleStatus();
        break;

      case 'list':
        await handleList(options);
        break;

      case 'add':
        await handleAdd(positional[0], options);
        break;

      case 'sync':
        await handleSync();
        break;

      case 'queue':
        await handleQueue();
        break;

      case 'dashboard':
        await handleDashboard();
        break;

      case 'restore':
        await handleRestore();
        break;

      case 'persist':
        await handlePersist();
        break;

      case 'help':
      default:
        await handleHelp();
        break;
    }
  } catch (error) {
    log(`[!] 오류: ${error.message}`, 'red');
    process.exit(1);
  }
}

main().catch(console.error);
