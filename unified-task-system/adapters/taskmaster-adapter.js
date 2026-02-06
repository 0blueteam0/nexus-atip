#!/usr/bin/env node
/**
 * TaskMaster AI Adapter
 *
 * 위치: K:/PortableApps/Claude-Code/unified-task-system/adapters/taskmaster-adapter.js
 *
 * 목적:
 * - TaskMaster AI MCP ↔ Unified Task Hub 동기화
 * - PRD 파싱 결과를 Hub 태스크로 변환
 * - 복잡도/의존성 분석 통합
 *
 * TaskMaster AI 도구:
 * - get_tasks: 태스크 목록 조회
 * - next_task: 다음 작업 추천
 * - get_task: 특정 태스크 상세 조회
 * - set_task_status: 상태 변경
 * - update_subtask: 하위 태스크 업데이트
 * - parse_prd: PRD 파싱
 * - expand_task: 태스크 확장
 *
 * 사용법:
 *   const adapter = require('./adapters/taskmaster-adapter');
 *   const tasks = await adapter.fetchTasks();
 *   adapter.pushToTaskmaster(hubTask);
 */

const path = require('path');

// TaskMaster 데이터 경로 (MCP가 관리)
const TASKMASTER_DIR = path.resolve(__dirname, '..', '..', '.taskmaster');
const TASKS_FILE = path.join(TASKMASTER_DIR, 'tasks', 'tasks.json');

/**
 * TaskMaster AI Adapter 클래스
 */
class TaskMasterAdapter {
  constructor(options = {}) {
    this.name = 'taskmaster';
    this.displayName = 'TaskMaster AI';
    this.enabled = options.enabled !== false;
    this.dataPath = options.dataPath || TASKS_FILE;
    this.mcpAvailable = false;

    // MCP 도구 참조 (런타임에 주입)
    this.mcpTools = {
      get_tasks: null,
      next_task: null,
      get_task: null,
      set_task_status: null,
      update_subtask: null,
      parse_prd: null,
      expand_task: null
    };
  }

  /**
   * MCP 도구 연결 설정
   */
  setMcpTools(tools) {
    this.mcpTools = { ...this.mcpTools, ...tools };
    this.mcpAvailable = !!tools.get_tasks;
  }

  /**
   * TaskMaster 태스크 조회
   */
  async fetchTasks() {
    // MCP 사용 가능하면 MCP 통해 조회
    if (this.mcpAvailable && this.mcpTools.get_tasks) {
      try {
        const result = await this.mcpTools.get_tasks();
        return this._parseMcpResult(result);
      } catch (error) {
        console.error('[!] TaskMaster MCP 조회 실패:', error.message);
      }
    }

    // 폴백: 파일 직접 읽기
    return this._readTasksFile();
  }

  /**
   * 파일에서 태스크 읽기
   */
  _readTasksFile() {
    const fs = require('fs');

    if (!fs.existsSync(this.dataPath)) {
      console.log('[*] TaskMaster 데이터 파일 없음');
      return [];
    }

    try {
      const raw = fs.readFileSync(this.dataPath, 'utf8');
      const data = JSON.parse(raw);
      return data.tasks || [];
    } catch (error) {
      console.error('[!] TaskMaster 파일 읽기 실패:', error.message);
      return [];
    }
  }

  /**
   * MCP 결과 파싱
   */
  _parseMcpResult(result) {
    if (!result) return [];

    // 결과 형식에 따라 파싱
    if (Array.isArray(result)) return result;
    if (result.tasks) return result.tasks;
    if (result.content) {
      try {
        const parsed = JSON.parse(result.content);
        return parsed.tasks || [];
      } catch {
        return [];
      }
    }

    return [];
  }

  /**
   * TaskMaster 태스크 → Hub 형식 변환
   */
  convertToHub(tmTask) {
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
        details: st.details || st.description
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
   * Hub 형식 → TaskMaster 태스크 변환
   */
  convertFromHub(hubTask) {
    const statusMap = {
      'completed': 'done',
      'in_progress': 'in-progress',
      'pending': 'pending',
      'blocked': 'blocked'
    };

    // taskmaster- 접두사 제거
    const tmId = hubTask.externalId?.replace('taskmaster-', '') || hubTask.id;

    return {
      id: parseInt(tmId) || tmId,
      title: hubTask.title,
      description: hubTask.description,
      status: statusMap[hubTask.status] || 'pending',
      priority: hubTask.priority,
      dependencies: (hubTask.dependencies || [])
        .filter(d => d.startsWith('taskmaster-'))
        .map(d => parseInt(d.replace('taskmaster-', ''))),
      subtasks: (hubTask.subtasks || []).map(st => ({
        id: parseInt(st.id.replace('taskmaster-sub-', '')),
        title: st.title,
        status: statusMap[st.status] || 'pending',
        details: st.details
      }))
    };
  }

  /**
   * Hub에서 TaskMaster로 상태 동기화
   */
  async pushToTaskmaster(hubTask) {
    if (!this.mcpAvailable || !this.mcpTools.set_task_status) {
      console.log('[*] TaskMaster MCP 미사용 - 파일 직접 수정');
      return this._updateTaskFile(hubTask);
    }

    try {
      const tmTask = this.convertFromHub(hubTask);
      await this.mcpTools.set_task_status({
        id: tmTask.id,
        status: tmTask.status
      });
      return true;
    } catch (error) {
      console.error('[!] TaskMaster 상태 동기화 실패:', error.message);
      return false;
    }
  }

  /**
   * 파일 직접 수정
   */
  _updateTaskFile(hubTask) {
    const fs = require('fs');

    if (!fs.existsSync(this.dataPath)) return false;

    try {
      const raw = fs.readFileSync(this.dataPath, 'utf8');
      const data = JSON.parse(raw);
      const tmTask = this.convertFromHub(hubTask);

      const index = data.tasks.findIndex(t => t.id === tmTask.id);
      if (index >= 0) {
        data.tasks[index] = { ...data.tasks[index], ...tmTask };
        fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2), 'utf8');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[!] TaskMaster 파일 수정 실패:', error.message);
      return false;
    }
  }

  /**
   * PRD 파싱 (MCP 통해)
   */
  async parsePRD(prdContent) {
    if (!this.mcpAvailable || !this.mcpTools.parse_prd) {
      console.log('[!] TaskMaster PRD 파싱 MCP 미사용');
      return null;
    }

    try {
      const result = await this.mcpTools.parse_prd({ prd: prdContent });
      return result;
    } catch (error) {
      console.error('[!] PRD 파싱 실패:', error.message);
      return null;
    }
  }

  /**
   * 다음 작업 추천
   */
  async getNextTask() {
    if (!this.mcpAvailable || !this.mcpTools.next_task) {
      console.log('[!] TaskMaster next_task MCP 미사용');
      return null;
    }

    try {
      return await this.mcpTools.next_task();
    } catch (error) {
      console.error('[!] 다음 작업 추천 실패:', error.message);
      return null;
    }
  }

  /**
   * 전체 동기화 (TaskMaster → Hub)
   */
  async syncToHub(hub) {
    console.log(`[*] ${this.displayName} → Hub 동기화 시작...`);

    const tasks = await this.fetchTasks();
    let synced = 0;

    for (const tmTask of tasks) {
      const converted = this.convertToHub(tmTask);

      const existing = hub.data.tasks.find(t => t.externalId === converted.externalId);
      if (existing) {
        Object.assign(existing, converted, { updatedAt: new Date().toISOString() });
      } else {
        hub.addTask(converted);
      }
      synced++;
    }

    console.log(`[+] ${this.displayName}: ${synced}개 태스크 동기화 완료`);
    return synced;
  }

  /**
   * 상태 확인
   */
  getStatus() {
    return {
      name: this.name,
      displayName: this.displayName,
      enabled: this.enabled,
      mcpAvailable: this.mcpAvailable,
      dataPath: this.dataPath
    };
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = TaskMasterAdapter;

// CLI 실행
if (require.main === module) {
  const adapter = new TaskMasterAdapter();
  console.log('TaskMaster Adapter Status:', adapter.getStatus());
}
