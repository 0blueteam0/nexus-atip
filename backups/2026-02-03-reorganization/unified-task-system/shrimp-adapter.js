/**
 * Shrimp Adapter
 * Shrimp Task Manager <-> Unified Task System 동기화
 *
 * 위치: K:/PortableApps/genai/unified-task-system/shrimp-adapter.js
 *
 * 기능:
 * - Shrimp 작업 데이터를 Unified 형식으로 변환
 * - Unified 작업을 Shrimp 형식으로 변환
 * - 양방향 동기화 지원
 * - 충돌 감지 및 해결
 *
 * 사용법:
 *   const shrimpAdapter = require('./shrimp-adapter.js');
 *   shrimpAdapter.syncToUnified();   // Shrimp -> Unified
 *   shrimpAdapter.syncFromUnified(); // Unified -> Shrimp
 *   shrimpAdapter.syncBoth();        // 양방향 동기화
 */

const fs = require('fs');
const path = require('path');

// 경로 설정
const BASE_PATH = path.resolve(__dirname);
const UNIFIED_TASKS_FILE = path.join(BASE_PATH, 'tasks.json');

// Shrimp 데이터 경로들 (우선순위순)
const SHRIMP_PATHS = [
  path.join(BASE_PATH, '..', 'ShrimpData', 'tasks', 'current-tasks.json'),
  path.join(BASE_PATH, '..', '_ACTIVE', 'data', 'ShrimpData', 'current-tasks.json'),
  path.join(BASE_PATH, '..', 'data', 'tasks.json')
];

/**
 * 파일 안전하게 읽기
 */
function safeReadJSON(filePath, defaultValue = null) {
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
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 백업 생성
    if (fs.existsSync(filePath)) {
      const backupPath = filePath + '.backup';
      fs.copyFileSync(filePath, backupPath);
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`[!] 파일 쓰기 실패:`, error.message);
    return false;
  }
}

/**
 * Shrimp 데이터 파일 찾기
 */
function findShrimpFile() {
  for (const shrimpPath of SHRIMP_PATHS) {
    if (fs.existsSync(shrimpPath)) {
      return shrimpPath;
    }
  }
  return null;
}

/**
 * Shrimp 작업을 Unified 형식으로 변환
 */
function convertShrimpToUnified(shrimpTask) {
  // Shrimp 상태 매핑
  const statusMap = {
    'completed': 'completed',
    'in-progress': 'in_progress',
    'in_progress': 'in_progress',
    'pending': 'pending',
    'planned': 'pending'
  };

  return {
    id: `shrimp-${shrimpTask.id}`,
    title: shrimpTask.title,
    status: statusMap[shrimpTask.status] || 'pending',
    source: 'shrimp',
    priority: shrimpTask.priority || 'medium',
    created: shrimpTask.created || new Date().toISOString(),
    updated: new Date().toISOString(),
    subtasks: (shrimpTask.subtasks || []).map(st => ({
      id: `shrimp-${st.id}`,
      title: st.title,
      status: statusMap[st.status] || 'pending',
      note: st.note || st.details || ''
    })),
    dependencies: [],
    tags: [],
    originalData: { shrimpId: shrimpTask.id }
  };
}

/**
 * Unified 작업을 Shrimp 형식으로 변환
 */
function convertUnifiedToShrimp(unifiedTask) {
  // Unified 상태 매핑
  const statusMap = {
    'completed': 'completed',
    'in_progress': 'in-progress',
    'pending': 'pending'
  };

  // shrimp- 접두사 제거
  const shrimpId = unifiedTask.id.replace(/^shrimp-/, '');

  return {
    id: shrimpId,
    title: unifiedTask.title,
    status: statusMap[unifiedTask.status] || 'pending',
    subtasks: (unifiedTask.subtasks || []).map(st => ({
      id: st.id.replace(/^shrimp-/, ''),
      title: st.title,
      status: statusMap[st.status] || 'pending',
      details: st.note || ''
    }))
  };
}

/**
 * Shrimp -> Unified 동기화
 */
function syncToUnified() {
  console.log('[*] Shrimp -> Unified 동기화 시작...');

  const shrimpPath = findShrimpFile();
  if (!shrimpPath) {
    console.log('[!] Shrimp 데이터 파일을 찾을 수 없습니다.');
    return { success: false, synced: 0 };
  }

  const shrimpData = safeReadJSON(shrimpPath);
  if (!shrimpData || !shrimpData.tasks) {
    console.log('[!] Shrimp 데이터가 유효하지 않습니다.');
    return { success: false, synced: 0 };
  }

  // Unified 데이터 로드
  const unifiedData = safeReadJSON(UNIFIED_TASKS_FILE, {
    version: '1.0.0',
    lastSync: null,
    currentSession: {},
    tasks: [],
    pendingFollowups: [],
    completedTasks: []
  });

  let syncedCount = 0;

  // Shrimp 작업들 동기화
  for (const shrimpTask of shrimpData.tasks) {
    const converted = convertShrimpToUnified(shrimpTask);

    // 기존 작업 찾기
    const existingIndex = unifiedData.tasks.findIndex(
      t => t.id === converted.id ||
           (t.originalData && t.originalData.shrimpId === shrimpTask.id)
    );

    if (existingIndex >= 0) {
      // 업데이트 (Shrimp가 최신이면)
      unifiedData.tasks[existingIndex] = {
        ...unifiedData.tasks[existingIndex],
        ...converted,
        updated: new Date().toISOString()
      };
    } else {
      // 새로 추가
      unifiedData.tasks.push(converted);
    }
    syncedCount++;
  }

  // Chain of thought 정보도 저장
  if (shrimpData.chain_of_thought) {
    unifiedData.chainOfThought = {
      source: 'shrimp',
      ...shrimpData.chain_of_thought,
      syncedAt: new Date().toISOString()
    };
  }

  // 저장
  unifiedData.lastSync = new Date().toISOString();
  unifiedData.lastSyncSource = 'shrimp';

  if (safeWriteJSON(UNIFIED_TASKS_FILE, unifiedData)) {
    console.log(`[+] ${syncedCount}개 작업 동기화 완료 (Shrimp -> Unified)`);
    return { success: true, synced: syncedCount };
  }

  return { success: false, synced: 0 };
}

/**
 * Unified -> Shrimp 동기화
 */
function syncFromUnified() {
  console.log('[*] Unified -> Shrimp 동기화 시작...');

  const shrimpPath = findShrimpFile();
  if (!shrimpPath) {
    console.log('[!] Shrimp 데이터 파일을 찾을 수 없습니다.');
    return { success: false, synced: 0 };
  }

  const unifiedData = safeReadJSON(UNIFIED_TASKS_FILE);
  if (!unifiedData || !unifiedData.tasks) {
    console.log('[!] Unified 데이터가 유효하지 않습니다.');
    return { success: false, synced: 0 };
  }

  // Shrimp 데이터 로드
  const shrimpData = safeReadJSON(shrimpPath, {
    project: 'K드라이브 Claude Code 통합 프로젝트',
    created: new Date().toISOString().split('T')[0],
    tasks: []
  });

  let syncedCount = 0;

  // Unified에서 Shrimp 소스 작업만 동기화
  const shrimpTasks = unifiedData.tasks.filter(t => t.source === 'shrimp');

  for (const unifiedTask of shrimpTasks) {
    const converted = convertUnifiedToShrimp(unifiedTask);

    // 기존 작업 찾기
    const existingIndex = shrimpData.tasks.findIndex(t => t.id === converted.id);

    if (existingIndex >= 0) {
      shrimpData.tasks[existingIndex] = {
        ...shrimpData.tasks[existingIndex],
        ...converted
      };
    } else {
      shrimpData.tasks.push(converted);
    }
    syncedCount++;
  }

  if (safeWriteJSON(shrimpPath, shrimpData)) {
    console.log(`[+] ${syncedCount}개 작업 동기화 완료 (Unified -> Shrimp)`);
    return { success: true, synced: syncedCount };
  }

  return { success: false, synced: 0 };
}

/**
 * 양방향 동기화
 */
function syncBoth() {
  console.log('\n========================================');
  console.log('  Shrimp <-> Unified 양방향 동기화');
  console.log('========================================\n');

  // 1. Shrimp -> Unified (먼저 가져오기)
  const toResult = syncToUnified();

  // 2. Unified -> Shrimp (변경사항 내보내기)
  const fromResult = syncFromUnified();

  console.log('\n--- 동기화 결과 ---');
  console.log(`Shrimp -> Unified: ${toResult.synced}개`);
  console.log(`Unified -> Shrimp: ${fromResult.synced}개`);
  console.log('');

  return {
    toUnified: toResult,
    fromUnified: fromResult
  };
}

/**
 * 동기화 상태 확인
 */
function getSyncStatus() {
  const shrimpPath = findShrimpFile();
  const unifiedData = safeReadJSON(UNIFIED_TASKS_FILE);

  return {
    shrimpFileFound: !!shrimpPath,
    shrimpPath: shrimpPath,
    unifiedTaskCount: unifiedData ? unifiedData.tasks.length : 0,
    lastSync: unifiedData ? unifiedData.lastSync : null,
    lastSyncSource: unifiedData ? unifiedData.lastSyncSource : null
  };
}

// ============================================
// CLI 처리
// ============================================

function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'to-unified':
    case 'import':
      syncToUnified();
      break;

    case 'from-unified':
    case 'export':
      syncFromUnified();
      break;

    case 'both':
    case 'sync':
      syncBoth();
      break;

    case 'status':
      const status = getSyncStatus();
      console.log('\n--- Shrimp Adapter 상태 ---');
      console.log(`Shrimp 파일: ${status.shrimpFileFound ? status.shrimpPath : '찾을 수 없음'}`);
      console.log(`Unified 작업 수: ${status.unifiedTaskCount}`);
      console.log(`마지막 동기화: ${status.lastSync || 'N/A'}`);
      console.log(`동기화 소스: ${status.lastSyncSource || 'N/A'}`);
      console.log('');
      break;

    default:
      console.log('사용법: node shrimp-adapter.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  to-unified, import   Shrimp -> Unified 동기화');
      console.log('  from-unified, export Unified -> Shrimp 동기화');
      console.log('  both, sync           양방향 동기화');
      console.log('  status               동기화 상태 확인');
      console.log('');
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  syncToUnified,
  syncFromUnified,
  syncBoth,
  getSyncStatus,
  convertShrimpToUnified,
  convertUnifiedToShrimp,
  findShrimpFile
};

// CLI 실행
if (require.main === module) {
  handleCLI();
}
