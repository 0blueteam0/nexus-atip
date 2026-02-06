#!/usr/bin/env node
/**
 * Shrimp-TaskMaster Bridge
 *
 * 위치: K:/PortableApps/Claude-Code/unified-task-system/bridges/shrimp-taskmaster-bridge.js
 *
 * 목적:
 * - Shrimp Task Manager ↔ TaskMaster AI 양방향 동기화
 * - Hub를 통한 간접 연동
 * - 충돌 해결 전략 제공
 *
 * 동기화 전략:
 * - Shrimp는 실행 상세 정보 담당
 * - TaskMaster는 PRD/의존성 분석 담당
 * - Hub가 Single Source of Truth
 */

const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

// 경로
const SHRIMP_TASKS = path.resolve(__dirname, '..', '..', 'ShrimpData', 'tasks', 'current-tasks.json');
const TASKMASTER_TASKS = path.resolve(__dirname, '..', '..', '.taskmaster', 'tasks', 'tasks.json');

/**
 * Shrimp-TaskMaster Bridge
 */
class ShrimpTaskMasterBridge extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      shrimpPath: options.shrimpPath || SHRIMP_TASKS,
      taskmasterPath: options.taskmasterPath || TASKMASTER_TASKS,
      conflictStrategy: options.conflictStrategy || 'newest',
      ...options
    };

    this.hub = null;
    this._initialized = false;
  }

  /**
   * 초기화
   */
  async init(hub) {
    if (this._initialized) return;

    const UnifiedTaskHub = require('../unified-task-hub');
    this.hub = hub || new UnifiedTaskHub({ autoSync: false });

    this._initialized = true;
    console.log('[+] Shrimp-TaskMaster Bridge 초기화 완료');
  }

  /**
   * 양방향 동기화 실행
   */
  async syncAll() {
    if (!this._initialized) {
      await this.init();
    }

    console.log('[*] Shrimp-TaskMaster 양방향 동기화 시작...');

    const results = {
      shrimp: { synced: 0, errors: [] },
      taskmaster: { synced: 0, errors: [] },
      conflicts: []
    };

    try {
      // 1. Shrimp → Hub
      const shrimpResult = await this._syncShrimpToHub();
      results.shrimp = shrimpResult;

      // 2. TaskMaster → Hub
      const tmResult = await this._syncTaskMasterToHub();
      results.taskmaster = tmResult;

      // 3. 충돌 감지 및 해결
      const conflicts = await this._detectAndResolveConflicts();
      results.conflicts = conflicts;

      console.log(`[+] 동기화 완료: Shrimp ${results.shrimp.synced}개, TaskMaster ${results.taskmaster.synced}개`);
      if (conflicts.length > 0) {
        console.log(`[!] ${conflicts.length}개 충돌 해결됨`);
      }

      this.emit('sync:complete', results);
      return results;
    } catch (error) {
      console.error('[!] 양방향 동기화 실패:', error.message);
      this.emit('sync:error', error);
      throw error;
    }
  }

  /**
   * Shrimp → Hub 동기화
   */
  async _syncShrimpToHub() {
    const result = { synced: 0, errors: [] };

    if (!fs.existsSync(this.options.shrimpPath)) {
      console.log('[*] Shrimp 데이터 파일 없음');
      return result;
    }

    try {
      const raw = fs.readFileSync(this.options.shrimpPath, 'utf8');
      const data = JSON.parse(raw);
      const tasks = data.tasks || [];

      for (const shrimpTask of tasks) {
        try {
          const hubTask = this._convertShrimpToHub(shrimpTask);
          const existing = this.hub.data.tasks.find(
            t => t.externalId === hubTask.externalId
          );

          if (existing) {
            // 업데이트 (Shrimp는 실행 상세 정보만 업데이트)
            this.hub.updateTask(existing.id, {
              status: hubTask.status,
              subtasks: hubTask.subtasks,
              metadata: {
                ...existing.metadata,
                ...hubTask.metadata,
                shrimpUpdatedAt: new Date().toISOString()
              }
            });
          } else {
            this.hub.addTask(hubTask);
          }

          result.synced++;
        } catch (error) {
          result.errors.push({ task: shrimpTask.id, error: error.message });
        }
      }
    } catch (error) {
      console.error('[!] Shrimp 동기화 실패:', error.message);
    }

    return result;
  }

  /**
   * TaskMaster → Hub 동기화
   */
  async _syncTaskMasterToHub() {
    const result = { synced: 0, errors: [] };

    if (!fs.existsSync(this.options.taskmasterPath)) {
      console.log('[*] TaskMaster 데이터 파일 없음');
      return result;
    }

    try {
      const raw = fs.readFileSync(this.options.taskmasterPath, 'utf8');
      const data = JSON.parse(raw);
      const tasks = data.tasks || [];

      for (const tmTask of tasks) {
        try {
          const hubTask = this._convertTaskMasterToHub(tmTask);
          const existing = this.hub.data.tasks.find(
            t => t.externalId === hubTask.externalId
          );

          if (existing) {
            // TaskMaster는 의존성/복잡도 정보만 업데이트
            this.hub.updateTask(existing.id, {
              dependencies: hubTask.dependencies,
              priority: hubTask.priority,
              metadata: {
                ...existing.metadata,
                ...hubTask.metadata,
                taskmasterUpdatedAt: new Date().toISOString()
              }
            });
          } else {
            this.hub.addTask(hubTask);
          }

          result.synced++;
        } catch (error) {
          result.errors.push({ task: tmTask.id, error: error.message });
        }
      }
    } catch (error) {
      console.error('[!] TaskMaster 동기화 실패:', error.message);
    }

    return result;
  }

  /**
   * 충돌 감지 및 해결
   */
  async _detectAndResolveConflicts() {
    const conflicts = [];

    // 동일 제목 다른 소스 태스크 찾기
    const tasks = this.hub.listTasks();
    const titleMap = new Map();

    for (const task of tasks) {
      const normalizedTitle = task.title.toLowerCase().trim();

      if (titleMap.has(normalizedTitle)) {
        const existing = titleMap.get(normalizedTitle);

        if (existing.source !== task.source) {
          conflicts.push({
            title: task.title,
            task1: { id: existing.id, source: existing.source },
            task2: { id: task.id, source: task.source },
            resolved: false
          });

          // 충돌 해결
          await this._resolveConflict(existing, task, conflicts[conflicts.length - 1]);
        }
      } else {
        titleMap.set(normalizedTitle, task);
      }
    }

    return conflicts;
  }

  /**
   * 충돌 해결
   */
  async _resolveConflict(task1, task2, conflictRecord) {
    switch (this.options.conflictStrategy) {
      case 'newest':
        // 최신 것 유지
        const date1 = new Date(task1.updatedAt || task1.createdAt);
        const date2 = new Date(task2.updatedAt || task2.createdAt);

        if (date2 > date1) {
          // task2 유지, task1 병합
          this.hub.updateTask(task2.id, {
            metadata: {
              ...task2.metadata,
              mergedFrom: task1.id,
              mergedSource: task1.source
            }
          });
          this.hub.deleteTask(task1.id);
          conflictRecord.resolved = true;
          conflictRecord.winner = task2.id;
        } else {
          // task1 유지
          this.hub.updateTask(task1.id, {
            metadata: {
              ...task1.metadata,
              mergedFrom: task2.id,
              mergedSource: task2.source
            }
          });
          this.hub.deleteTask(task2.id);
          conflictRecord.resolved = true;
          conflictRecord.winner = task1.id;
        }
        break;

      case 'shrimp':
        // Shrimp 우선
        if (task1.source === 'shrimp') {
          this.hub.deleteTask(task2.id);
          conflictRecord.winner = task1.id;
        } else {
          this.hub.deleteTask(task1.id);
          conflictRecord.winner = task2.id;
        }
        conflictRecord.resolved = true;
        break;

      case 'taskmaster':
        // TaskMaster 우선
        if (task1.source === 'taskmaster') {
          this.hub.deleteTask(task2.id);
          conflictRecord.winner = task1.id;
        } else {
          this.hub.deleteTask(task1.id);
          conflictRecord.winner = task2.id;
        }
        conflictRecord.resolved = true;
        break;

      case 'merge':
        // 병합 (더 많은 정보 포함)
        const merged = {
          ...task1,
          ...task2,
          metadata: { ...task1.metadata, ...task2.metadata },
          dependencies: [...new Set([
            ...(task1.dependencies || []),
            ...(task2.dependencies || [])
          ])],
          subtasks: [...(task1.subtasks || []), ...(task2.subtasks || [])]
        };

        this.hub.updateTask(task1.id, merged);
        this.hub.deleteTask(task2.id);
        conflictRecord.resolved = true;
        conflictRecord.winner = task1.id;
        break;

      default:
        // 수동 해결 필요
        console.log(`[!] 충돌 수동 해결 필요: ${task1.title}`);
    }
  }

  /**
   * Shrimp 태스크 → Hub 형식
   */
  _convertShrimpToHub(shrimpTask) {
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
        implementation: shrimpTask.implementationDetails || shrimpTask.implementation,
        reflection: shrimpTask.reflection
      }
    };
  }

  /**
   * TaskMaster 태스크 → Hub 형식
   */
  _convertTaskMasterToHub(tmTask) {
    const statusMap = {
      'done': 'completed',
      'in-progress': 'in_progress',
      'pending': 'pending',
      'blocked': 'blocked',
      'deferred': 'pending'
    };

    const priorityMap = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };

    return {
      externalId: `taskmaster-${tmTask.id}`,
      title: tmTask.title || tmTask.name,
      description: tmTask.description || '',
      status: statusMap[tmTask.status] || 'pending',
      priority: priorityMap[tmTask.priority] || 'medium',
      source: 'taskmaster',
      dependencies: (tmTask.dependencies || []).map(d => `taskmaster-${d}`),
      subtasks: (tmTask.subtasks || []).map(st => ({
        id: `taskmaster-sub-${st.id}`,
        title: st.title,
        status: statusMap[st.status] || 'pending',
        details: st.details
      })),
      metadata: {
        taskmasterId: tmTask.id,
        complexity: tmTask.complexity,
        prd: tmTask.prd,
        testStrategy: tmTask.testStrategy,
        reasoning: tmTask.reasoning
      }
    };
  }

  /**
   * 상태 조회
   */
  getStatus() {
    return {
      initialized: this._initialized,
      shrimpPath: this.options.shrimpPath,
      taskmasterPath: this.options.taskmasterPath,
      shrimpExists: fs.existsSync(this.options.shrimpPath),
      taskmasterExists: fs.existsSync(this.options.taskmasterPath),
      conflictStrategy: this.options.conflictStrategy
    };
  }

  /**
   * 종료
   */
  destroy() {
    this.removeAllListeners();
    this._initialized = false;
  }
}

// ============================================
// Singleton
// ============================================

let instance = null;

function getInstance(options) {
  if (!instance) {
    instance = new ShrimpTaskMasterBridge(options);
  }
  return instance;
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  ShrimpTaskMasterBridge,
  getInstance
};

// CLI
if (require.main === module) {
  const bridge = getInstance();

  (async () => {
    await bridge.init();
    console.log('Status:', bridge.getStatus());

    const args = process.argv.slice(2);

    if (args[0] === 'sync') {
      await bridge.syncAll();
    } else {
      console.log('Usage: node shrimp-taskmaster-bridge.js sync');
    }

    bridge.destroy();
  })().catch(console.error);
}
