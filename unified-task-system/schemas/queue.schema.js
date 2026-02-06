/**
 * Queue Schema
 * Redis + BullMQ 분산 큐 스키마 정의
 *
 * @module unified-task-system/schemas/queue.schema
 * @version 2.0.0
 */

/**
 * Queue Names
 * 기능별 큐 분리
 */
const QueueNames = {
  PLANNING: 'planning',       // 계획 수립 작업
  EXECUTION: 'execution',     // 실행 작업
  VERIFICATION: 'verification', // 검증 작업
  NOTIFICATION: 'notification', // 알림
  DEAD_LETTER: 'dead-letter'  // 실패 작업 보관
};

/**
 * Job Status
 */
const JobStatus = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DELAYED: 'delayed',
  PAUSED: 'paused'
};


/**
 * Queue Configuration
 * BullMQ 설정
 */
const QueueConfig = {
  connection: {
    host: 'localhost',
    port: 6380,  // 기존 Redis 포트 사용
    maxRetriesPerRequest: null
  },

  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: {
      age: 3600,  // 1시간 후 삭제
      count: 100  // 최대 100개 유지
    },
    removeOnFail: {
      age: 86400  // 24시간 후 삭제
    }
  },

  queues: {
    [QueueNames.PLANNING]: {
      priority: 1,
      concurrency: 1,
      limiter: { max: 5, duration: 60000 }  // 분당 5개
    },


    [QueueNames.EXECUTION]: {
      priority: 2,
      concurrency: 3,
      limiter: { max: 10, duration: 60000 }
    },
    [QueueNames.VERIFICATION]: {
      priority: 3,
      concurrency: 2,
      limiter: { max: 8, duration: 60000 }
    },
    [QueueNames.NOTIFICATION]: {
      priority: 4,
      concurrency: 5,
      limiter: { max: 20, duration: 60000 }
    }
  }
};

/**
 * Job Schema
 * 큐에 추가되는 작업 스키마
 */
const JobSchema = {
  id: { type: 'string', required: true },
  name: { type: 'string', required: true },
  queue: { type: 'string', enum: Object.values(QueueNames), required: true },

  // 페이로드
  data: {
    type: 'object',
    properties: {
      taskId: 'string',
      action: 'string',
      params: 'object',
      context: 'object'
    }
  },


  // 옵션
  opts: {
    type: 'object',
    properties: {
      priority: { type: 'number', default: 0 },
      delay: { type: 'number', default: 0 },
      attempts: { type: 'number', default: 3 },
      timeout: { type: 'number', default: 300000 },  // 5분
      lifo: { type: 'boolean', default: false }
    }
  },

  // 결과
  result: { type: 'object', default: null },
  error: { type: 'string', default: null },

  // 타임스탬프
  created: { type: 'string', format: 'date-time' },
  started: { type: 'string', format: 'date-time' },
  completed: { type: 'string', format: 'date-time' },

  // 메타데이터
  metadata: {
    type: 'object',
    properties: {
      agentId: 'string',
      retryCount: 'number',
      parentJob: 'string',
      childJobs: 'array'
    }
  }
};


/**
 * Job Factory
 * @param {Object} data - 작업 데이터
 * @returns {Object} 작업 객체
 */
function createJob(data) {
  const now = new Date().toISOString();

  return {
    id: data.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: data.name || 'unnamed-job',
    queue: data.queue || QueueNames.EXECUTION,
    data: {
      taskId: data.taskId || null,
      action: data.action || 'execute',
      params: data.params || {},
      context: data.context || {}
    },
    opts: {
      priority: data.priority || 0,
      delay: data.delay || 0,
      attempts: data.attempts || 3,
      timeout: data.timeout || 300000,
      lifo: data.lifo || false
    },
    result: null,
    error: null,
    created: now,
    started: null,
    completed: null,
    metadata: data.metadata || {}
  };
}

module.exports = {
  QueueNames,
  JobStatus,
  QueueConfig,
  JobSchema,
  createJob
};
