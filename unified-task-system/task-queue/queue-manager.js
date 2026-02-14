#!/usr/bin/env node
/**
 * Task Queue Manager
 *
 * 위치: K:/PortableApps/genai/unified-task-system/task-queue/queue-manager.js
 *
 * 목적:
 * - BullMQ 기반 비동기 태스크 큐 관리
 * - RIPER+ Phase별 우선순위 처리
 * - Redis 연결 및 폴백 처리
 *
 * 사용법:
 *   const qm = require('./task-queue/queue-manager');
 *   await qm.addJob('implement', { task: 'Feature X' });
 *   qm.processJobs();
 */

const EventEmitter = require('events');
const config = require('./config');

/**
 * Task Queue Manager 클래스
 */
class TaskQueueManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      useRedis: options.useRedis !== false,
      ...options
    };

    this.redisAvailable = false;
    this.queues = new Map();
    this.workers = new Map();
    this.memoryQueue = []; // 폴백용

    this._initialized = false;
  }

  /**
   * 초기화
   */
  async init() {
    if (this._initialized) return;

    console.log('[*] Task Queue Manager 초기화 중...');

    // Redis 가용성 확인
    if (this.options.useRedis) {
      this.redisAvailable = await this._checkRedis();
    }

    if (this.redisAvailable) {
      await this._initBullMQ();
      console.log('[+] BullMQ 큐 초기화 완료 (Redis 모드)');
    } else {
      this._initMemoryQueue();
      console.log('[+] 메모리 큐 초기화 완료 (폴백 모드)');
    }

    this._initialized = true;
  }

  /**
   * Redis 연결 확인
   */
  async _checkRedis() {
    try {
      const IORedis = require('ioredis');
      const client = new IORedis({
        ...config.redisConnection,
        lazyConnect: true
      });

      await client.connect();
      const pong = await client.ping();
      await client.quit();

      console.log('[+] Redis 연결 성공');
      return pong === 'PONG';
    } catch (error) {
      console.log('[*] Redis 연결 실패 - 메모리 큐 사용:', error.message);
      return false;
    }
  }

  /**
   * BullMQ 초기화
   */
  async _initBullMQ() {
    const { Queue, Worker } = require('bullmq');
    const IORedis = require('ioredis');

    const connection = new IORedis(config.redisConnection);

    // 각 Phase별 큐 생성
    for (const [phaseName, queueConfig] of Object.entries(config.queues)) {
      const queue = new Queue(queueConfig.name, {
        connection,
        ...queueConfig.options
      });

      this.queues.set(phaseName, queue);

      // 이벤트 연결
      queue.on('error', (err) => {
        this.emit('queue:error', { queue: phaseName, error: err });
      });
    }
  }

  /**
   * 메모리 큐 초기화 (폴백)
   */
  _initMemoryQueue() {
    this.memoryQueue = [];
    this._loadPersistedQueue();
  }

  /**
   * 영구화된 큐 로드
   */
  _loadPersistedQueue() {
    const fs = require('fs');
    const persistPath = config.fallbackConfig.persistPath;

    if (fs.existsSync(persistPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(persistPath, 'utf8'));
        this.memoryQueue = data.jobs || [];
        console.log(`[*] ${this.memoryQueue.length}개 Job 복원됨`);
      } catch (error) {
        console.error('[!] 큐 복원 실패:', error.message);
      }
    }
  }

  /**
   * 메모리 큐 영구화
   */
  _persistQueue() {
    const fs = require('fs');
    const path = require('path');
    const persistPath = config.fallbackConfig.persistPath;

    try {
      const dir = path.dirname(persistPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(persistPath, JSON.stringify({
        lastUpdated: new Date().toISOString(),
        jobs: this.memoryQueue
      }, null, 2), 'utf8');
    } catch (error) {
      console.error('[!] 큐 영구화 실패:', error.message);
    }
  }

  // ============================================
  // Job 관리
  // ============================================

  /**
   * Job 추가
   */
  async addJob(phase, data, options = {}) {
    await this.init();

    const job = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      phase: phase || 'default',
      data,
      options,
      createdAt: new Date().toISOString(),
      status: 'waiting'
    };

    if (this.redisAvailable) {
      return this._addBullMQJob(phase, data, options);
    } else {
      return this._addMemoryJob(job);
    }
  }

  /**
   * BullMQ Job 추가
   */
  async _addBullMQJob(phase, data, options) {
    const queueConfig = config.getQueueByPhase(phase);
    const queue = this.queues.get(phase) || this.queues.get('default');

    if (!queue) {
      throw new Error(`Queue not found for phase: ${phase}`);
    }

    const job = await queue.add(queueConfig.name, data, {
      priority: queueConfig.priority,
      ...options
    });

    console.log(`[+] Job ${job.id} 추가됨 (${phase})`);
    this.emit('job:added', { phase, jobId: job.id });

    return job;
  }

  /**
   * 메모리 Job 추가
   */
  _addMemoryJob(job) {
    // 우선순위에 따라 정렬 삽입
    const queueConfig = config.getQueueByPhase(job.phase);
    job.priority = queueConfig.priority;

    // 이진 삽입으로 정렬 유지
    const insertIndex = this.memoryQueue.findIndex(j => j.priority > job.priority);
    if (insertIndex < 0) {
      this.memoryQueue.push(job);
    } else {
      this.memoryQueue.splice(insertIndex, 0, job);
    }

    // 최대 크기 제한
    if (this.memoryQueue.length > config.fallbackConfig.maxQueueSize) {
      this.memoryQueue = this.memoryQueue.slice(0, config.fallbackConfig.maxQueueSize);
    }

    this._persistQueue();
    console.log(`[+] Job ${job.id} 추가됨 (메모리 큐, ${job.phase})`);
    this.emit('job:added', { phase: job.phase, jobId: job.id });

    return job;
  }

  /**
   * Job 처리 시작
   */
  async processJobs(handler) {
    await this.init();

    if (this.redisAvailable) {
      return this._processBullMQJobs(handler);
    } else {
      return this._processMemoryJobs(handler);
    }
  }

  /**
   * BullMQ Worker 시작
   */
  async _processBullMQJobs(handler) {
    const { Worker } = require('bullmq');
    const IORedis = require('ioredis');

    const connection = new IORedis(config.redisConnection);

    for (const [phaseName, queueConfig] of Object.entries(config.queues)) {
      const worker = new Worker(
        queueConfig.name,
        async (job) => {
          console.log(`[*] Job ${job.id} 처리 중 (${phaseName})...`);
          this.emit('job:processing', { phase: phaseName, jobId: job.id });

          try {
            const result = await handler(job.data, phaseName, job);
            this.emit('job:completed', { phase: phaseName, jobId: job.id, result });
            return result;
          } catch (error) {
            this.emit('job:failed', { phase: phaseName, jobId: job.id, error });
            throw error;
          }
        },
        {
          connection,
          concurrency: queueConfig.concurrency,
          ...config.workerOptions
        }
      );

      // Worker 이벤트
      worker.on('completed', config.eventHandlers.completed);
      worker.on('failed', config.eventHandlers.failed);
      worker.on('progress', config.eventHandlers.progress);
      worker.on('stalled', config.eventHandlers.stalled);
      worker.on('error', config.eventHandlers.error);

      this.workers.set(phaseName, worker);
    }

    console.log('[+] BullMQ Workers 시작됨');
  }

  /**
   * 메모리 큐 처리
   */
  async _processMemoryJobs(handler) {
    console.log('[*] 메모리 큐 처리 시작...');

    const processNext = async () => {
      // 대기 중인 Job 찾기
      const jobIndex = this.memoryQueue.findIndex(j => j.status === 'waiting');
      if (jobIndex < 0) return;

      const job = this.memoryQueue[jobIndex];
      job.status = 'processing';
      job.startedAt = new Date().toISOString();

      console.log(`[*] Job ${job.id} 처리 중 (${job.phase})...`);
      this.emit('job:processing', { phase: job.phase, jobId: job.id });

      try {
        const result = await handler(job.data, job.phase, job);
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.result = result;

        this.emit('job:completed', { phase: job.phase, jobId: job.id, result });
        console.log(`[+] Job ${job.id} 완료`);
      } catch (error) {
        job.status = 'failed';
        job.failedAt = new Date().toISOString();
        job.error = error.message;

        this.emit('job:failed', { phase: job.phase, jobId: job.id, error });
        console.error(`[-] Job ${job.id} 실패: ${error.message}`);
      }

      this._persistQueue();

      // 다음 Job 처리
      setImmediate(processNext);
    };

    processNext();
  }

  // ============================================
  // 상태 조회
  // ============================================

  /**
   * 큐 상태 조회
   */
  async getStatus() {
    await this.init();

    if (this.redisAvailable) {
      return this._getBullMQStatus();
    } else {
      return this._getMemoryStatus();
    }
  }

  /**
   * BullMQ 상태 조회
   */
  async _getBullMQStatus() {
    const status = {
      mode: 'redis',
      queues: {}
    };

    for (const [phaseName, queue] of this.queues) {
      const counts = await queue.getJobCounts();
      status.queues[phaseName] = counts;
    }

    return status;
  }

  /**
   * 메모리 큐 상태 조회
   */
  _getMemoryStatus() {
    const status = {
      mode: 'memory',
      total: this.memoryQueue.length,
      waiting: this.memoryQueue.filter(j => j.status === 'waiting').length,
      processing: this.memoryQueue.filter(j => j.status === 'processing').length,
      completed: this.memoryQueue.filter(j => j.status === 'completed').length,
      failed: this.memoryQueue.filter(j => j.status === 'failed').length
    };

    // Phase별 통계
    status.byPhase = {};
    for (const job of this.memoryQueue) {
      status.byPhase[job.phase] = (status.byPhase[job.phase] || 0) + 1;
    }

    return status;
  }

  /**
   * 큐 비우기
   */
  async clearQueue(phase) {
    await this.init();

    if (this.redisAvailable) {
      const queue = this.queues.get(phase);
      if (queue) {
        await queue.drain();
        console.log(`[+] ${phase} 큐 비움 완료`);
      }
    } else {
      if (phase) {
        this.memoryQueue = this.memoryQueue.filter(j => j.phase !== phase);
      } else {
        this.memoryQueue = [];
      }
      this._persistQueue();
      console.log('[+] 메모리 큐 비움 완료');
    }
  }

  /**
   * 리소스 정리
   */
  async close() {
    if (this.redisAvailable) {
      for (const worker of this.workers.values()) {
        await worker.close();
      }
      for (const queue of this.queues.values()) {
        await queue.close();
      }
    }

    this._persistQueue();
    console.log('[*] Task Queue Manager 종료');
  }
}

// ============================================
// Singleton 인스턴스
// ============================================

let instance = null;

function getInstance(options) {
  if (!instance) {
    instance = new TaskQueueManager(options);
  }
  return instance;
}

// ============================================
// CLI
// ============================================

async function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  const qm = getInstance();
  await qm.init();

  switch (command) {
    case 'status':
      const status = await qm.getStatus();
      console.log('\n--- Task Queue Status ---');
      console.log(JSON.stringify(status, null, 2));
      break;

    case 'add':
      const phase = args[1] || 'default';
      const data = { title: args[2] || 'Test Job' };
      await qm.addJob(phase, data);
      break;

    case 'clear':
      await qm.clearQueue(args[1]);
      break;

    case 'process':
      await qm.processJobs(async (data, phase) => {
        console.log(`Processing: ${JSON.stringify(data)} (${phase})`);
        return { success: true };
      });
      break;

    default:
      console.log('Usage: node queue-manager.js [command]');
      console.log('Commands: status, add [phase] [title], clear [phase], process');
  }

  await qm.close();
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  TaskQueueManager,
  getInstance
};

// CLI 실행
if (require.main === module) {
  handleCLI().catch(console.error);
}
