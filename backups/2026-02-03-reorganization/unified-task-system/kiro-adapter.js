/**
 * Kiro Memory Adapter
 * kiro-memory MCP <-> Unified Task System 동기화
 *
 * 위치: K:/PortableApps/genai/unified-task-system/kiro-adapter.js
 *
 * 기능:
 * - kiro-memory 데이터를 Unified 형식으로 변환
 * - Unified 작업을 kiro-memory 형식으로 변환
 * - 양방향 동기화 지원
 * - SQLite 직접 접근 (better-sqlite3)
 *
 * 사용법:
 *   const kiroAdapter = require('./kiro-adapter.js');
 *   kiroAdapter.syncToUnified();   // kiro-memory -> Unified
 *   kiroAdapter.syncFromUnified(); // Unified -> kiro-memory
 *   kiroAdapter.syncBoth();        // 양방향 동기화
 */

const fs = require('fs');
const path = require('path');

// 경로 설정
const BASE_PATH = path.resolve(__dirname);
const UNIFIED_TASKS_FILE = path.join(BASE_PATH, 'tasks.json');

// kiro-memory 데이터베이스 경로들 (우선순위순)
const KIRO_DB_PATHS = [
  // 1. K드라이브 포터블 경로 (목표 위치)
  path.join(BASE_PATH, '..', 'data', 'kiro-memory', 'mcp_memory.db'),
  // 2. 환경변수 지정 경로
  process.env.KIRO_DB_PATH,
  // 3. 기본 캐시 경로 (Windows)
  path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'uv', 'cache')
].filter(Boolean);

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
 * kiro-memory DB 파일 찾기
 */
function findKiroDatabase() {
  for (const dbPath of KIRO_DB_PATHS) {
    if (!dbPath) continue;

    // 직접 경로인 경우
    if (dbPath.endsWith('.db') && fs.existsSync(dbPath)) {
      return dbPath;
    }

    // 디렉토리인 경우 하위에서 mcp_memory.db 검색
    if (fs.existsSync(dbPath) && fs.statSync(dbPath).isDirectory()) {
      const found = findDbInDirectory(dbPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 디렉토리에서 mcp_memory.db 재귀 검색
 */
function findDbInDirectory(dir, depth = 0) {
  if (depth > 5) return null; // 최대 깊이 제한

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isFile() && entry.name === 'mcp_memory.db') {
        return fullPath;
      }

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const found = findDbInDirectory(fullPath, depth + 1);
        if (found) return found;
      }
    }
  } catch (error) {
    // 권한 없는 디렉토리 무시
  }

  return null;
}

/**
 * SQLite 데이터베이스 읽기 (better-sqlite3 없이 JSON 캐시 사용)
 * 참고: 실제 구현은 better-sqlite3 필요, 여기서는 캐시 기반 동기화
 */
function readKiroMemories() {
  // kiro-memory는 MCP를 통해 접근하므로,
  // 여기서는 캐시된 메모리 데이터를 사용
  const cacheFile = path.join(BASE_PATH, 'kiro-cache.json');
  return safeReadJSON(cacheFile, { entities: [], relations: [] });
}

/**
 * kiro-memory 캐시 업데이트
 * MCP 도구 호출 결과를 저장하는 용도
 */
function updateKiroCache(data) {
  const cacheFile = path.join(BASE_PATH, 'kiro-cache.json');
  return safeWriteJSON(cacheFile, {
    ...data,
    lastUpdated: new Date().toISOString()
  });
}

/**
 * kiro-memory 엔티티를 Unified 작업으로 변환
 */
function convertKiroToUnified(kiroEntity) {
  // kiro-memory 엔티티 구조:
  // { name, entityType, observations: [] }

  // 작업 관련 엔티티만 변환
  if (!isTaskEntity(kiroEntity)) {
    return null;
  }

  return {
    id: `kiro-${kiroEntity.name.replace(/\s+/g, '-').toLowerCase()}`,
    title: kiroEntity.name,
    status: extractStatus(kiroEntity.observations),
    source: 'kiro',
    priority: extractPriority(kiroEntity.observations),
    created: extractDate(kiroEntity.observations) || new Date().toISOString(),
    updated: new Date().toISOString(),
    subtasks: [],
    dependencies: [],
    tags: [kiroEntity.entityType],
    originalData: {
      kiroName: kiroEntity.name,
      entityType: kiroEntity.entityType,
      observations: kiroEntity.observations
    }
  };
}

/**
 * 작업 관련 엔티티인지 확인
 */
function isTaskEntity(entity) {
  const taskTypes = ['task', 'project', 'work', 'todo', 'followup', 'action'];
  const type = (entity.entityType || '').toLowerCase();

  return taskTypes.some(t => type.includes(t)) ||
         entity.observations.some(obs =>
           obs.toLowerCase().includes('task') ||
           obs.toLowerCase().includes('todo') ||
           obs.toLowerCase().includes('작업')
         );
}

/**
 * observations에서 상태 추출
 */
function extractStatus(observations) {
  const obsText = observations.join(' ').toLowerCase();

  if (obsText.includes('completed') || obsText.includes('완료') || obsText.includes('done')) {
    return 'completed';
  }
  if (obsText.includes('in progress') || obsText.includes('진행') || obsText.includes('working')) {
    return 'in_progress';
  }
  return 'pending';
}

/**
 * observations에서 우선순위 추출
 */
function extractPriority(observations) {
  const obsText = observations.join(' ').toLowerCase();

  if (obsText.includes('critical') || obsText.includes('urgent') || obsText.includes('긴급')) {
    return 'high';
  }
  if (obsText.includes('low') || obsText.includes('나중') || obsText.includes('optional')) {
    return 'low';
  }
  return 'medium';
}

/**
 * observations에서 날짜 추출
 */
function extractDate(observations) {
  for (const obs of observations) {
    // ISO 날짜 패턴 찾기
    const match = obs.match(/\d{4}-\d{2}-\d{2}/);
    if (match) {
      return new Date(match[0]).toISOString();
    }
  }
  return null;
}

/**
 * Unified 작업을 kiro-memory 형식으로 변환
 */
function convertUnifiedToKiro(unifiedTask) {
  const observations = [
    `Status: ${unifiedTask.status}`,
    `Priority: ${unifiedTask.priority}`,
    `Created: ${unifiedTask.created}`,
    `Updated: ${unifiedTask.updated}`
  ];

  if (unifiedTask.subtasks && unifiedTask.subtasks.length > 0) {
    observations.push(`Subtasks: ${unifiedTask.subtasks.map(s => s.title).join(', ')}`);
  }

  return {
    name: unifiedTask.title,
    entityType: 'task',
    observations: observations
  };
}

/**
 * kiro-memory -> Unified 동기화
 */
function syncToUnified() {
  console.log('[*] kiro-memory -> Unified 동기화 시작...');

  const kiroData = readKiroMemories();
  if (!kiroData || !kiroData.entities) {
    console.log('[!] kiro-memory 데이터가 없거나 유효하지 않습니다.');
    console.log('[*] 힌트: mcp__kiro-memory__read_graph 결과를 kiro-cache.json에 저장하세요.');
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

  // kiro 엔티티들 동기화
  for (const entity of kiroData.entities) {
    const converted = convertKiroToUnified(entity);
    if (!converted) continue; // 작업이 아닌 엔티티는 건너뛰기

    // 기존 작업 찾기
    const existingIndex = unifiedData.tasks.findIndex(
      t => t.id === converted.id ||
           (t.originalData && t.originalData.kiroName === entity.name)
    );

    if (existingIndex >= 0) {
      // 업데이트
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

  // 저장
  unifiedData.lastSync = new Date().toISOString();
  unifiedData.lastSyncSource = 'kiro';

  if (safeWriteJSON(UNIFIED_TASKS_FILE, unifiedData)) {
    console.log(`[+] ${syncedCount}개 작업 동기화 완료 (kiro-memory -> Unified)`);
    return { success: true, synced: syncedCount };
  }

  return { success: false, synced: 0 };
}

/**
 * Unified -> kiro-memory 동기화
 * 참고: 실제 kiro-memory 업데이트는 MCP 도구를 통해 수행
 */
function syncFromUnified() {
  console.log('[*] Unified -> kiro-memory 동기화 시작...');

  const unifiedData = safeReadJSON(UNIFIED_TASKS_FILE);
  if (!unifiedData || !unifiedData.tasks) {
    console.log('[!] Unified 데이터가 유효하지 않습니다.');
    return { success: false, synced: 0 };
  }

  // kiro 소스 작업들을 kiro 형식으로 변환
  const kiroTasks = unifiedData.tasks
    .filter(t => t.source === 'kiro')
    .map(convertUnifiedToKiro);

  // 캐시 업데이트 (MCP를 통한 실제 동기화용)
  const syncData = {
    pendingSync: kiroTasks,
    lastPrepared: new Date().toISOString(),
    instructions: 'mcp__kiro-memory__create_entities 또는 add_observations 사용하여 동기화'
  };

  const syncFile = path.join(BASE_PATH, 'kiro-sync-pending.json');
  if (safeWriteJSON(syncFile, syncData)) {
    console.log(`[+] ${kiroTasks.length}개 작업 동기화 준비 완료 (Unified -> kiro-memory)`);
    console.log(`[*] 동기화 대기 파일: ${syncFile}`);
    return { success: true, synced: kiroTasks.length };
  }

  return { success: false, synced: 0 };
}

/**
 * 양방향 동기화
 */
function syncBoth() {
  console.log('\n========================================');
  console.log('  kiro-memory <-> Unified 양방향 동기화');
  console.log('========================================\n');

  // 1. kiro -> Unified (먼저 가져오기)
  const toResult = syncToUnified();

  // 2. Unified -> kiro (변경사항 내보내기)
  const fromResult = syncFromUnified();

  console.log('\n--- 동기화 결과 ---');
  console.log(`kiro -> Unified: ${toResult.synced}개`);
  console.log(`Unified -> kiro: ${fromResult.synced}개 (대기 중)`);
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
  const kiroDbPath = findKiroDatabase();
  const kiroCache = safeReadJSON(path.join(BASE_PATH, 'kiro-cache.json'));
  const unifiedData = safeReadJSON(UNIFIED_TASKS_FILE);

  return {
    kiroDbFound: !!kiroDbPath,
    kiroDbPath: kiroDbPath,
    kiroCacheExists: !!kiroCache,
    kiroCacheLastUpdated: kiroCache ? kiroCache.lastUpdated : null,
    kiroEntityCount: kiroCache && kiroCache.entities ? kiroCache.entities.length : 0,
    unifiedTaskCount: unifiedData ? unifiedData.tasks.length : 0,
    lastSync: unifiedData ? unifiedData.lastSync : null,
    lastSyncSource: unifiedData ? unifiedData.lastSyncSource : null
  };
}

/**
 * kiro-memory MCP 결과를 캐시에 저장
 * Claude가 mcp__kiro-memory__read_graph 호출 후 결과 저장용
 */
function cacheKiroGraph(graphData) {
  console.log('[*] kiro-memory 그래프 캐싱...');

  if (!graphData || !graphData.entities) {
    console.log('[!] 유효하지 않은 그래프 데이터');
    return false;
  }

  const result = updateKiroCache({
    entities: graphData.entities || [],
    relations: graphData.relations || [],
    cachedAt: new Date().toISOString()
  });

  if (result) {
    console.log(`[+] ${graphData.entities.length}개 엔티티 캐시 완료`);
  }

  return result;
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

    case 'cache':
      // JSON 파일에서 그래프 데이터 읽어서 캐시
      if (args[1]) {
        const graphData = safeReadJSON(args[1]);
        cacheKiroGraph(graphData);
      } else {
        console.log('사용법: node kiro-adapter.js cache [graph-data.json]');
      }
      break;

    case 'status':
      const status = getSyncStatus();
      console.log('\n--- Kiro Adapter 상태 ---');
      console.log(`kiro-memory DB: ${status.kiroDbFound ? status.kiroDbPath : '찾을 수 없음'}`);
      console.log(`kiro 캐시 존재: ${status.kiroCacheExists ? '예' : '아니오'}`);
      console.log(`kiro 캐시 업데이트: ${status.kiroCacheLastUpdated || 'N/A'}`);
      console.log(`kiro 엔티티 수: ${status.kiroEntityCount}`);
      console.log(`Unified 작업 수: ${status.unifiedTaskCount}`);
      console.log(`마지막 동기화: ${status.lastSync || 'N/A'}`);
      console.log(`동기화 소스: ${status.lastSyncSource || 'N/A'}`);
      console.log('');
      break;

    default:
      console.log('사용법: node kiro-adapter.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  to-unified, import   kiro-memory -> Unified 동기화');
      console.log('  from-unified, export Unified -> kiro-memory 동기화 준비');
      console.log('  both, sync           양방향 동기화');
      console.log('  cache [file]         kiro 그래프 데이터 캐시');
      console.log('  status               동기화 상태 확인');
      console.log('');
      console.log('MCP 연동 방법:');
      console.log('  1. Claude에서 mcp__kiro-memory__read_graph 호출');
      console.log('  2. 결과를 JSON 파일로 저장');
      console.log('  3. node kiro-adapter.js cache [결과파일.json]');
      console.log('  4. node kiro-adapter.js sync');
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
  cacheKiroGraph,
  convertKiroToUnified,
  convertUnifiedToKiro,
  findKiroDatabase,
  updateKiroCache
};

// CLI 실행
if (require.main === module) {
  handleCLI();
}
