#!/usr/bin/env node
/**
 * Unified Task Hub - Single Source of Truth
 *
 * 위치: K:/PortableApps/Claude-Code/unified-task-system/unified-task-hub.js
 *
 * 목적:
 * - 모든 태스크 시스템의 중앙 허브
 * - Shrimp, TaskMaster, Vibe Kanban, Planning System 통합
 * - Redis Queue 기반 비동기 처리 지원
 * - plan-ecosystem-dashboard 연동
 *
 * 아키텍처:
 * ┌─────────────────────────────────────────────────────┐
 * │              Unified Task Hub                        │
 * │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
 * │  │ Shrimp  │ │TaskMast │ │  Vibe   │ │Planning │   │
 * │  │Adapter  │ │ Adapter │ │ Adapter │ │ Adapter │   │
 * │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
 * │       └───────────┴───────────┴───────────┘        │
 * │                       │                             │
 * │            ┌──────────┴───────────┐                │
 * │            │    Unified Storage    │                │
 * │            │   (tasks-hub.json)    │                │
 * │            └──────────────────────┘                │
 * └─────────────────────────────────────────────────────┘
 *
 * 사용법:
 *   const hub = require('./unified-task-hub');
 *   hub.addTask({ title: '작업', source: 'shrimp' });
 *   hub.syncAll();
 *   hub.getStatus();
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// 경로 설정
const BASE_PATH = path.resolve(__dirname);
const HUB_FILE = path.join(BASE_PATH, 'tasks-hub.json');
const ADAPTERS_DIR = path.join(BASE_PATH, 'adapters');

// 기본 스키마
const DEFAULT_SCHEMA = {
  version: '2.0.0',
  lastUpdated: null,
  metadata: {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    sources: {}
  },
  tasks: [],
  queue: {
    pending: [],
    processing: [],
    completed: []
  },
  adapters: {
    shrimp: { enabled: true, lastSync: null, taskCount: 0 },
    taskmaster: { enabled: false, lastSync: null, taskCount: 0 },
    vibekanban: { enabled: false, lastSync: null, taskCount: 0 },
    planning: { enabled: true, lastSync: null, taskCount: 0 }
  },
  syncHistory: []
};

/**
 * Task 스키마 정의
 */
const TASK_SCHEMA = {
  id: null,                    // 고유 ID (hub-{timestamp}-{random})
  externalId: null,            // 외부 시스템 ID (shrimp-123, taskmaster-456)
  title: '',                   // 제목
  description: '',             // 설명
  status: 'pending',           // pending, in_progress, completed, blocked
  priority: 'medium',          // critical, high, medium, low
  source: 'manual',            // shrimp, taskmaster, vibekanban, planning, manual
  phase: null,                 // RIPER+ phase (specify, explore, plan, implement, verify, release)
  dependencies: [],            // 의존성 태스크 ID 목록
  blockedBy: [],               // 차단 중인 태스크 ID 목록
  subtasks: [],                // 하위 태스크 목록
  tags: [],                    // 태그
  metadata: {},                // 추가 메타데이터
  createdAt: null,             // 생성 시간
  updatedAt: null,             // 수정 시간
  completedAt: null,           // 완료 시간
  syncedAt: null               // 마지막 동기화 시간
};

/**
 * UnifiedTaskHub 클래스
 */
class UnifiedTaskHub extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      autoSync: options.autoSync !== false,
      syncInterval: options.syncInterval || 300000, // 5분
      enableQueue: options.enableQueue !== false,
      dashboardUrl: options.dashboardUrl || 'http://localhost:7847',
      ...options
    };

    this.data = null;
    this.adapters = new Map();
    this.syncTimer = null;

    this._init();
  }

  /**
   * 초기화
   */
  _init() {
    this.data = this._loadData();
    this._registerBuiltinAdapters();

    if (this.options.autoSync) {
      this._startAutoSync();
    }

    console.log('[+] Unified Task Hub 초기화 완료');
    console.log(`[*] 총 ${this.data.tasks.length}개 태스크 로드됨`);
  }

  /**
   * 데이터 로드
   */
  _loadData() {
    try {
      if (fs.existsSync(HUB_FILE)) {
        const raw = fs.readFileSync(HUB_FILE, 'utf8');
        const data = JSON.parse(raw);
        return { ...DEFAULT_SCHEMA, ...data };
      }
    } catch (error) {
      console.error('[!] 데이터 로드 실패:', error.message);
    }
    return { ...DEFAULT_SCHEMA };
  }

  /**
   * 데이터 저장
   */
  _saveData() {
    try {
      // 백업
      if (fs.existsSync(HUB_FILE)) {
        fs.copyFileSync(HUB_FILE, HUB_FILE + '.backup');
      }

      this.data.lastUpdated = new Date().toISOString();
      this._updateMetadata();

      fs.writeFileSync(HUB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('[!] 데이터 저장 실패:', error.message);
      return false;
    }
  }

  /**
   * 메타데이터 업데이트
   */
  _updateMetadata() {
    const tasks = this.data.tasks;

    this.data.metadata.totalTasks = tasks.length;
    this.data.metadata.completedTasks = tasks.filter(t => t.status === 'completed').length;
    this.data.metadata.pendingTasks = tasks.filter(t => t.status === 'pending').length;

    // 소스별 통계
    this.data.metadata.sources = {};
    for (const task of tasks) {
      const source = task.source || 'unknown';
      this.data.metadata.sources[source] = (this.data.metadata.sources[source] || 0) + 1;
    }
  }

  /**
   * 내장 어댑터 등록
   */
  _registerBuiltinAdapters() {
    // Shrimp 어댑터
    this.registerAdapter('shrimp', {
      name: 'Shrimp Task Manager',
      dataPath: path.join(BASE_PATH, '..', 'ShrimpData', 'tasks', 'current-tasks.json'),
      convert: this._convertShrimpTask.bind(this),
      reverseConvert: this._convertToShrimp.bind(this)
    });

    // Planning 어댑터
    this.registerAdapter('planning', {
      name: 'Planning System',
      dataPath: path.join(BASE_PATH, '..', 'plans'),
      convert: this._convertPlanningTask.bind(this),
      reverseConvert: this._convertToPlanning.bind(this)
    });
  }

  /**
   * 어댑터 등록
   */
  registerAdapter(name, config) {
    this.adapters.set(name, {
      name: config.name || name,
      dataPath: config.dataPath,
      convert: config.convert,
      reverseConvert: config.reverseConvert,
      enabled: this.data.adapters[name]?.enabled !== false
    });

    if (!this.data.adapters[name]) {
      this.data.adapters[name] = { enabled: true, lastSync: null, taskCount: 0 };
    }
  }

  // ============================================
  // 태스크 CRUD
  // ============================================

  /**
   * 태스크 추가
   */
  addTask(taskData) {
    const task = {
      ...TASK_SCHEMA,
      ...taskData,
      id: taskData.id || `hub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 중복 체크 (externalId 기준)
    if (task.externalId) {
      const existing = this.data.tasks.findIndex(t => t.externalId === task.externalId);
      if (existing >= 0) {
        return this.updateTask(this.data.tasks[existing].id, taskData);
      }
    }

    this.data.tasks.push(task);
    this._saveData();

    this.emit('task:added', task);
    console.log(`[+] 태스크 추가: ${task.title}`);

    return task;
  }

  /**
   * 태스크 조회
   */
  getTask(taskId) {
    return this.data.tasks.find(t => t.id === taskId || t.externalId === taskId);
  }

  /**
   * 태스크 업데이트
   */
  updateTask(taskId, updates) {
    const index = this.data.tasks.findIndex(t => t.id === taskId);
    if (index < 0) return null;

    const task = this.data.tasks[index];
    Object.assign(task, updates, { updatedAt: new Date().toISOString() });

    // 완료 처리
    if (updates.status === 'completed' && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    }

    this._saveData();
    this.emit('task:updated', task);

    return task;
  }

  /**
   * 태스크 삭제
   */
  deleteTask(taskId) {
    const index = this.data.tasks.findIndex(t => t.id === taskId);
    if (index < 0) return false;

    const deleted = this.data.tasks.splice(index, 1)[0];
    this._saveData();

    this.emit('task:deleted', deleted);
    return true;
  }

  /**
   * 태스크 목록 조회
   */
  listTasks(filter = {}) {
    let tasks = [...this.data.tasks];

    if (filter.status) {
      tasks = tasks.filter(t => t.status === filter.status);
    }
    if (filter.source) {
      tasks = tasks.filter(t => t.source === filter.source);
    }
    if (filter.phase) {
      tasks = tasks.filter(t => t.phase === filter.phase);
    }
    if (filter.priority) {
      tasks = tasks.filter(t => t.priority === filter.priority);
    }

    // 정렬
    if (filter.sortBy) {
      const sortOrder = filter.sortOrder === 'desc' ? -1 : 1;
      tasks.sort((a, b) => {
        if (a[filter.sortBy] < b[filter.sortBy]) return -1 * sortOrder;
        if (a[filter.sortBy] > b[filter.sortBy]) return 1 * sortOrder;
        return 0;
      });
    }

    return tasks;
  }

  // ============================================
  // 동기화
  // ============================================

  /**
   * 전체 동기화
   */
  async syncAll() {
    console.log('\n========================================');
    console.log('  Unified Task Hub - Full Sync');
    console.log('========================================\n');

    const results = {};

    for (const [name, adapter] of this.adapters) {
      if (adapter.enabled) {
        results[name] = await this.syncAdapter(name);
      }
    }

    // 동기화 히스토리 기록
    this.data.syncHistory.push({
      timestamp: new Date().toISOString(),
      results
    });

    // 최근 50개만 유지
    if (this.data.syncHistory.length > 50) {
      this.data.syncHistory = this.data.syncHistory.slice(-50);
    }

    this._saveData();

    console.log('\n--- 동기화 결과 ---');
    for (const [name, result] of Object.entries(results)) {
      console.log(`[*] ${name}: ${result.synced}개 동기화 (${result.success ? '성공' : '실패'})`);
    }
    console.log('========================================\n');

    return results;
  }

  /**
   * 특정 어댑터 동기화
   */
  async syncAdapter(adapterName) {
    const adapter = this.adapters.get(adapterName);
    if (!adapter) {
      return { success: false, synced: 0, error: 'Adapter not found' };
    }

    console.log(`[*] ${adapter.name} 동기화 시작...`);

    try {
      let synced = 0;

      // 어댑터별 동기화 로직
      if (adapterName === 'shrimp') {
        synced = await this._syncShrimp(adapter);
      } else if (adapterName === 'planning') {
        synced = await this._syncPlanning(adapter);
      }

      // 어댑터 상태 업데이트
      this.data.adapters[adapterName].lastSync = new Date().toISOString();
      this.data.adapters[adapterName].taskCount = this.data.tasks.filter(t => t.source === adapterName).length;

      return { success: true, synced };
    } catch (error) {
      console.error(`[!] ${adapterName} 동기화 실패:`, error.message);
      return { success: false, synced: 0, error: error.message };
    }
  }

  /**
   * Shrimp 동기화
   */
  async _syncShrimp(adapter) {
    if (!fs.existsSync(adapter.dataPath)) {
      console.log('[*] Shrimp 데이터 파일 없음 - 스킵');
      return 0;
    }

    const raw = fs.readFileSync(adapter.dataPath, 'utf8');
    const shrimpData = JSON.parse(raw);

    let synced = 0;

    for (const shrimpTask of (shrimpData.tasks || [])) {
      const converted = this._convertShrimpTask(shrimpTask);

      const existing = this.data.tasks.find(t => t.externalId === converted.externalId);
      if (existing) {
        // 업데이트
        Object.assign(existing, converted, { updatedAt: new Date().toISOString() });
      } else {
        // 새로 추가
        this.data.tasks.push({
          ...TASK_SCHEMA,
          ...converted,
          id: `hub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      synced++;
    }

    return synced;
  }

  /**
   * Planning 동기화
   */
  async _syncPlanning(adapter) {
    const plansDir = adapter.dataPath;
    if (!fs.existsSync(plansDir)) {
      console.log('[*] Plans 디렉토리 없음 - 스킵');
      return 0;
    }

    let synced = 0;

    // progress.json 파일들 찾기
    const files = fs.readdirSync(plansDir).filter(f => f.endsWith('-progress.json'));

    for (const file of files) {
      const filePath = path.join(plansDir, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      const planData = JSON.parse(raw);

      if (planData.status !== 'active') continue;

      for (const phase of (planData.phases || [])) {
        for (const task of (phase.tasks || [])) {
          const converted = this._convertPlanningTask(task, planData, phase);

          const existing = this.data.tasks.find(t => t.externalId === converted.externalId);
          if (existing) {
            Object.assign(existing, converted, { updatedAt: new Date().toISOString() });
          } else {
            this.data.tasks.push({
              ...TASK_SCHEMA,
              ...converted,
              id: `hub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
          synced++;
        }
      }
    }

    return synced;
  }

  // ============================================
  // 변환 함수
  // ============================================

  /**
   * Shrimp 태스크 변환
   */
  _convertShrimpTask(shrimpTask) {
    const statusMap = {
      'completed': 'completed',
      'done': 'completed',
      'in-progress': 'in_progress',
      'in_progress': 'in_progress',
      'pending': 'pending',
      'planned': 'pending'
    };

    return {
      externalId: `shrimp-${shrimpTask.id}`,
      title: shrimpTask.name || shrimpTask.title,
      description: shrimpTask.description || '',
      status: statusMap[shrimpTask.status] || 'pending',
      priority: shrimpTask.priority || 'medium',
      source: 'shrimp',
      subtasks: (shrimpTask.subtasks || []).map(st => ({
        id: `shrimp-sub-${st.id}`,
        title: st.title || st.name,
        status: statusMap[st.status] || 'pending'
      })),
      metadata: {
        shrimpId: shrimpTask.id,
        implementation: shrimpTask.implementationDetails || shrimpTask.implementation
      }
    };
  }

  /**
   * Planning 태스크 변환
   */
  _convertPlanningTask(task, planData, phase) {
    return {
      externalId: `planning-${planData.planId}-${task.id}`,
      title: task.title || task.name,
      description: task.description || '',
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      source: 'planning',
      phase: phase.id,
      metadata: {
        planId: planData.planId,
        phaseId: phase.id,
        phaseName: phase.name
      }
    };
  }

  /**
   * Shrimp 형식으로 역변환
   */
  _convertToShrimp(hubTask) {
    const statusMap = {
      'completed': 'completed',
      'in_progress': 'in-progress',
      'pending': 'pending'
    };

    return {
      id: hubTask.externalId?.replace('shrimp-', '') || hubTask.id,
      name: hubTask.title,
      description: hubTask.description,
      status: statusMap[hubTask.status] || 'pending',
      priority: hubTask.priority,
      subtasks: (hubTask.subtasks || []).map(st => ({
        id: st.id.replace('shrimp-sub-', ''),
        title: st.title,
        status: statusMap[st.status] || 'pending'
      }))
    };
  }

  /**
   * Planning 형식으로 역변환
   */
  _convertToPlanning(hubTask) {
    return {
      id: hubTask.metadata?.taskId || hubTask.id,
      title: hubTask.title,
      description: hubTask.description,
      status: hubTask.status,
      priority: hubTask.priority
    };
  }

  // ============================================
  // 자동 동기화
  // ============================================

  /**
   * 자동 동기화 시작
   */
  _startAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncAll().catch(err => {
        console.error('[!] 자동 동기화 실패:', err.message);
      });
    }, this.options.syncInterval);

    console.log(`[*] 자동 동기화 활성화 (${this.options.syncInterval / 1000}초 간격)`);
  }

  /**
   * 자동 동기화 중지
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // ============================================
  // 상태 조회
  // ============================================

  /**
   * 전체 상태 조회
   */
  getStatus() {
    return {
      version: this.data.version,
      lastUpdated: this.data.lastUpdated,
      metadata: this.data.metadata,
      adapters: this.data.adapters,
      queueStatus: {
        pending: this.data.queue.pending.length,
        processing: this.data.queue.processing.length,
        completed: this.data.queue.completed.length
      }
    };
  }

  /**
   * 상태 출력
   */
  printStatus() {
    const status = this.getStatus();

    console.log('\n========================================');
    console.log('  Unified Task Hub - Status');
    console.log('========================================\n');

    console.log(`[*] 버전: ${status.version}`);
    console.log(`[*] 마지막 업데이트: ${status.lastUpdated || 'N/A'}`);
    console.log('');
    console.log('--- 태스크 통계 ---');
    console.log(`[*] 전체: ${status.metadata.totalTasks}개`);
    console.log(`[*] 완료: ${status.metadata.completedTasks}개`);
    console.log(`[*] 대기: ${status.metadata.pendingTasks}개`);
    console.log('');
    console.log('--- 소스별 ---');
    for (const [source, count] of Object.entries(status.metadata.sources || {})) {
      console.log(`  [*] ${source}: ${count}개`);
    }
    console.log('');
    console.log('--- 어댑터 ---');
    for (const [name, adapter] of Object.entries(status.adapters)) {
      const enabled = adapter.enabled ? '[+]' : '[-]';
      console.log(`  ${enabled} ${name}: ${adapter.taskCount}개, 마지막: ${adapter.lastSync || 'N/A'}`);
    }
    console.log('');
    console.log('========================================\n');
  }

  /**
   * 리소스 정리
   */
  destroy() {
    this.stopAutoSync();
    this.removeAllListeners();
  }
}

// ============================================
// CLI
// ============================================

function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  const hub = new UnifiedTaskHub({ autoSync: false });

  switch (command) {
    case 'sync':
      hub.syncAll().then(() => process.exit(0));
      break;

    case 'list':
      const filter = {};
      if (args[1]) filter.status = args[1];
      const tasks = hub.listTasks(filter);
      console.log('\n--- 태스크 목록 ---\n');
      tasks.forEach((t, i) => {
        const status = t.status === 'completed' ? '[+]' :
                       t.status === 'in_progress' ? '[*]' : '[-]';
        console.log(`${i + 1}. ${status} [${t.source}] ${t.title}`);
      });
      console.log(`\n총 ${tasks.length}개\n`);
      break;

    case 'add':
      if (args[1]) {
        hub.addTask({ title: args[1], source: 'manual' });
      } else {
        console.log('사용법: node unified-task-hub.js add "태스크 제목"');
      }
      break;

    case 'status':
    default:
      hub.printStatus();
      break;
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = UnifiedTaskHub;

// CLI 실행
if (require.main === module) {
  handleCLI();
}
