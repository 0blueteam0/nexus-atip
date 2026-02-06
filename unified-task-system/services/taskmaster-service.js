#!/usr/bin/env node
/**
 * TaskMaster Integration Service
 *
 * 위치: K:/PortableApps/Claude-Code/unified-task-system/services/taskmaster-service.js
 *
 * 목적:
 * - TaskMaster AI MCP와 Unified Task Hub 통합
 * - PRD 파싱 → Hub 태스크 변환 워크플로우
 * - 양방향 동기화 관리
 *
 * 사용법:
 *   const service = require('./services/taskmaster-service');
 *   await service.syncFromTaskMaster();
 *   await service.parsePRD(content);
 */

const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

// 경로
const TASKMASTER_DIR = path.resolve(__dirname, '..', '..', '.taskmaster');
const TASKS_FILE = path.join(TASKMASTER_DIR, 'tasks', 'tasks.json');

/**
 * TaskMaster Integration Service
 */
class TaskMasterService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      taskmasterDir: options.taskmasterDir || TASKMASTER_DIR,
      tasksFile: options.tasksFile || TASKS_FILE,
      autoSync: options.autoSync !== false,
      syncInterval: options.syncInterval || 60000,
      ...options
    };

    this.hub = null;
    this.adapter = null;
    this._syncTimer = null;
    this._initialized = false;
  }

  /**
   * 서비스 초기화
   */
  async init(hub) {
    if (this._initialized) return;

    const UnifiedTaskHub = require('../unified-task-hub');
    const TaskMasterAdapter = require('../adapters/taskmaster-adapter');

    this.hub = hub || new UnifiedTaskHub({ autoSync: false });
    this.adapter = new TaskMasterAdapter({
      dataPath: this.options.tasksFile
    });

    // Hub에 어댑터 등록
    this.hub.registerAdapter('taskmaster', this.adapter);

    // 자동 동기화 설정
    if (this.options.autoSync) {
      this._startAutoSync();
    }

    this._initialized = true;
    console.log('[+] TaskMaster Service 초기화 완료');
  }

  /**
   * TaskMaster → Hub 동기화
   */
  async syncFromTaskMaster() {
    if (!this._initialized) {
      await this.init();
    }

    console.log('[*] TaskMaster → Hub 동기화 시작...');

    try {
      const tasks = await this.adapter.fetchTasks();

      if (!tasks || tasks.length === 0) {
        console.log('[*] TaskMaster에 태스크 없음');
        return { synced: 0, errors: [] };
      }

      let synced = 0;
      const errors = [];

      for (const tmTask of tasks) {
        try {
          const hubTask = this.adapter.convertToHub(tmTask);

          // 기존 태스크 확인
          const existing = this.hub.data.tasks.find(
            t => t.externalId === hubTask.externalId
          );

          if (existing) {
            // 업데이트
            this.hub.updateTask(existing.id, {
              ...hubTask,
              updatedAt: new Date().toISOString()
            });
          } else {
            // 새로 추가
            this.hub.addTask(hubTask);
          }

          synced++;
        } catch (error) {
          errors.push({ task: tmTask.id, error: error.message });
        }
      }

      // 어댑터 상태 업데이트
      this.hub.data.adapters.taskmaster = {
        enabled: true,
        lastSync: new Date().toISOString(),
        taskCount: synced
      };

      console.log(`[+] ${synced}개 태스크 동기화 완료`);
      this.emit('sync:complete', { synced, errors });

      return { synced, errors };
    } catch (error) {
      console.error('[!] TaskMaster 동기화 실패:', error.message);
      this.emit('sync:error', error);
      throw error;
    }
  }

  /**
   * Hub → TaskMaster 동기화
   */
  async syncToTaskMaster() {
    if (!this._initialized) {
      await this.init();
    }

    console.log('[*] Hub → TaskMaster 동기화 시작...');

    try {
      // Hub에서 TaskMaster 소스 태스크 조회
      const hubTasks = this.hub.listTasks({ source: 'taskmaster' });

      let synced = 0;
      const errors = [];

      for (const hubTask of hubTasks) {
        try {
          const success = await this.adapter.pushToTaskmaster(hubTask);
          if (success) synced++;
        } catch (error) {
          errors.push({ task: hubTask.id, error: error.message });
        }
      }

      console.log(`[+] ${synced}개 태스크 역동기화 완료`);
      return { synced, errors };
    } catch (error) {
      console.error('[!] TaskMaster 역동기화 실패:', error.message);
      throw error;
    }
  }

  /**
   * PRD 파싱 및 태스크 생성
   */
  async parsePRD(prdContent, options = {}) {
    if (!this._initialized) {
      await this.init();
    }

    console.log('[*] PRD 파싱 시작...');

    try {
      // MCP 사용 가능한 경우 MCP 통해 파싱
      if (this.adapter.mcpAvailable && this.adapter.mcpTools.parse_prd) {
        const result = await this.adapter.mcpTools.parse_prd({
          prd: prdContent
        });

        if (result && result.tasks) {
          // 파싱된 태스크들을 Hub에 추가
          const added = [];
          for (const task of result.tasks) {
            const hubTask = this.adapter.convertToHub(task);
            hubTask.metadata.prdSource = options.source || 'manual';
            hubTask.metadata.prdParsedAt = new Date().toISOString();

            const created = this.hub.addTask(hubTask);
            added.push(created);
          }

          console.log(`[+] PRD에서 ${added.length}개 태스크 생성됨`);
          return { success: true, tasks: added };
        }
      }

      // MCP 미사용 시 로컬 파싱
      return this._localParsePRD(prdContent, options);
    } catch (error) {
      console.error('[!] PRD 파싱 실패:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 로컬 PRD 파싱 (MCP 폴백)
   */
  _localParsePRD(prdContent, options = {}) {
    const tasks = [];
    const lines = prdContent.split('\n');

    let currentSection = null;
    let taskIndex = 1;

    for (const line of lines) {
      // 섹션 헤더 감지
      if (line.match(/^#{1,3}\s+/)) {
        currentSection = line.replace(/^#+\s+/, '').trim();
        continue;
      }

      // 체크박스 아이템 감지 (태스크 후보)
      const checkboxMatch = line.match(/^[-*]\s*\[([ xX])\]\s*(.+)/);
      if (checkboxMatch) {
        const completed = checkboxMatch[1].toLowerCase() === 'x';
        const title = checkboxMatch[2].trim();

        tasks.push({
          id: `prd-${Date.now()}-${taskIndex++}`,
          title: title,
          description: `PRD Section: ${currentSection || 'General'}`,
          status: completed ? 'completed' : 'pending',
          priority: 'medium',
          source: 'manual',
          phase: this._detectPhase(title, currentSection),
          metadata: {
            prdSection: currentSection,
            prdSource: options.source || 'manual',
            prdParsedAt: new Date().toISOString()
          }
        });
      }

      // 번호 목록 감지
      const numberedMatch = line.match(/^\d+\.\s+(.+)/);
      if (numberedMatch && currentSection) {
        const title = numberedMatch[1].trim();

        tasks.push({
          id: `prd-${Date.now()}-${taskIndex++}`,
          title: title,
          description: `PRD Section: ${currentSection}`,
          status: 'pending',
          priority: 'medium',
          source: 'manual',
          phase: this._detectPhase(title, currentSection),
          metadata: {
            prdSection: currentSection,
            prdSource: options.source || 'manual',
            prdParsedAt: new Date().toISOString()
          }
        });
      }
    }

    // Hub에 추가
    const added = tasks.map(t => this.hub.addTask(t));

    console.log(`[+] 로컬 파싱: ${added.length}개 태스크 생성됨`);
    return { success: true, tasks: added, method: 'local' };
  }

  /**
   * RIPER+ Phase 감지
   */
  _detectPhase(title, section) {
    const text = `${title} ${section || ''}`.toLowerCase();

    if (text.match(/요구사항|spec|requirement|goal|scope/)) return 'specify';
    if (text.match(/탐색|explore|research|분석|analysis/)) return 'explore';
    if (text.match(/계획|plan|설계|design|아키텍처|architecture/)) return 'plan';
    if (text.match(/구현|implement|개발|develop|코드|code/)) return 'implement';
    if (text.match(/검증|verify|테스트|test|qa|review/)) return 'verify';
    if (text.match(/릴리스|release|배포|deploy|출시/)) return 'release';

    return null;
  }

  /**
   * 다음 작업 추천
   */
  async getNextTask() {
    if (!this._initialized) {
      await this.init();
    }

    // MCP 통해 추천 (가능한 경우)
    if (this.adapter.mcpAvailable && this.adapter.mcpTools.next_task) {
      try {
        return await this.adapter.mcpTools.next_task();
      } catch (error) {
        console.log('[*] MCP 추천 실패, 로컬 추천 사용');
      }
    }

    // 로컬 추천 로직
    const pendingTasks = this.hub.listTasks({ status: 'pending' });

    if (pendingTasks.length === 0) {
      return null;
    }

    // 의존성 없는 태스크 중 우선순위 높은 것
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    const available = pendingTasks
      .filter(t => !t.blockedBy || t.blockedBy.length === 0)
      .sort((a, b) => {
        const pa = priorityOrder[a.priority] || 2;
        const pb = priorityOrder[b.priority] || 2;
        return pa - pb;
      });

    return available[0] || pendingTasks[0];
  }

  /**
   * 자동 동기화 시작
   */
  _startAutoSync() {
    if (this._syncTimer) {
      clearInterval(this._syncTimer);
    }

    this._syncTimer = setInterval(async () => {
      try {
        await this.syncFromTaskMaster();
      } catch (error) {
        console.error('[!] 자동 동기화 실패:', error.message);
      }
    }, this.options.syncInterval);

    console.log(`[*] 자동 동기화 활성화 (${this.options.syncInterval / 1000}초)`);
  }

  /**
   * 자동 동기화 중지
   */
  stopAutoSync() {
    if (this._syncTimer) {
      clearInterval(this._syncTimer);
      this._syncTimer = null;
    }
  }

  /**
   * 상태 조회
   */
  getStatus() {
    return {
      initialized: this._initialized,
      taskmasterDir: this.options.taskmasterDir,
      tasksFile: this.options.tasksFile,
      fileExists: fs.existsSync(this.options.tasksFile),
      autoSync: this.options.autoSync,
      syncInterval: this.options.syncInterval,
      adapter: this.adapter?.getStatus()
    };
  }

  /**
   * 종료
   */
  destroy() {
    this.stopAutoSync();
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
    instance = new TaskMasterService(options);
  }
  return instance;
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  TaskMasterService,
  getInstance
};

// CLI
if (require.main === module) {
  const service = getInstance({ autoSync: false });

  (async () => {
    await service.init();
    console.log('Status:', service.getStatus());

    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'sync':
        await service.syncFromTaskMaster();
        break;

      case 'next':
        const next = await service.getNextTask();
        console.log('Next task:', next);
        break;

      case 'parse':
        if (args[1] && fs.existsSync(args[1])) {
          const content = fs.readFileSync(args[1], 'utf8');
          await service.parsePRD(content, { source: args[1] });
        } else {
          console.log('Usage: node taskmaster-service.js parse [prd-file]');
        }
        break;

      default:
        console.log('Commands: sync, next, parse [file]');
    }

    service.destroy();
  })().catch(console.error);
}
