/**
 * Task Queue Configuration
 *
 * 위치: K:/PortableApps/Claude-Code/unified-task-system/task-queue/config.js
 *
 * 목적:
 * - BullMQ 기반 태스크 큐 설정
 * - 기존 Redis 인프라 활용 (포트 6380)
 * - RIPER+ Phase별 우선순위 큐
 *
 * Redis 설정:
 * - Docker: redis-security 컨테이너 (포트 6380)
 * - 폴백: localhost:6379
 */

const path = require('path');

/**
 * Redis 연결 설정
 */
const redisConnection = {
  // 기본: Docker redis-security (포트 6380)
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6380,

  // 인증 (필요시)
  password: process.env.REDIS_PASSWORD || undefined,

  // 연결 옵션
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,

  // 재연결 전략
  retryStrategy: (times) => {
    if (times > 10) {
      console.error('[!] Redis 연결 실패 - 최대 재시도 초과');
      return null;
    }
    return Math.min(times * 200, 3000);
  }
};

/**
 * 큐 정의 - RIPER+ Phase 기반
 */
const queues = {
  // Phase 1: SPECIFY - 요구사항 분석
  specify: {
    name: 'task-specify',
    priority: 1,
    concurrency: 1,
    options: {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 50
      }
    }
  },

  // Phase 2: EXPLORE - 코드베이스 탐색
  explore: {
    name: 'task-explore',
    priority: 2,
    concurrency: 3,
    options: {
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 2000 },
        removeOnComplete: 50,
        removeOnFail: 30
      }
    }
  },

  // Phase 3: PLAN - 계획 수립
  plan: {
    name: 'task-plan',
    priority: 3,
    concurrency: 1,
    options: {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 50
      }
    }
  },

  // Phase 4: IMPLEMENT - 구현
  implement: {
    name: 'task-implement',
    priority: 4,
    concurrency: 5,
    options: {
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 3000 },
        removeOnComplete: 200,
        removeOnFail: 100
      }
    }
  },

  // Phase 5: VERIFY - 검증
  verify: {
    name: 'task-verify',
    priority: 5,
    concurrency: 3,
    options: {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 50
      }
    }
  },

  // Phase 6: RELEASE - 릴리스
  release: {
    name: 'task-release',
    priority: 6,
    concurrency: 1,
    options: {
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 50,
        removeOnFail: 20
      }
    }
  },

  // 기본 큐 (Phase 미지정 태스크)
  default: {
    name: 'task-default',
    priority: 10,
    concurrency: 3,
    options: {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'fixed', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 50
      }
    }
  }
};

/**
 * Worker 설정
 */
const workerOptions = {
  // 동시 처리 수 (큐별로 재정의 가능)
  concurrency: 3,

  // 락 지속 시간 (ms)
  lockDuration: 30000,

  // 락 갱신 간격 (ms)
  lockRenewTime: 15000,

  // 스톨 체크 간격 (ms)
  stalledInterval: 30000,

  // 스톨 최대 체크 횟수
  maxStalledCount: 2,

  // 메트릭 수집
  metrics: {
    maxDataPoints: 100
  }
};

/**
 * 스케줄러 설정
 */
const schedulerOptions = {
  // 스케줄러 락 키
  prefix: 'unified-task',

  // 지연 큐 폴링 간격 (ms)
  stalledInterval: 5000,

  // 반복 작업 지원
  maxStalledCount: 1
};

/**
 * 이벤트 핸들러 정의
 */
const eventHandlers = {
  // Job 완료
  completed: (job, result) => {
    console.log(`[+] Job ${job.id} 완료: ${job.name}`);
  },

  // Job 실패
  failed: (job, err) => {
    console.error(`[-] Job ${job.id} 실패: ${err.message}`);
  },

  // Job 진행
  progress: (job, progress) => {
    console.log(`[*] Job ${job.id} 진행: ${progress}%`);
  },

  // Job 스톨
  stalled: (jobId) => {
    console.warn(`[!] Job ${jobId} 스톨 감지`);
  },

  // Worker 에러
  error: (err) => {
    console.error(`[!] Worker 에러: ${err.message}`);
  }
};

/**
 * Dashboard 연동 설정
 */
const dashboardConfig = {
  enabled: true,
  url: 'http://localhost:7847',
  apiPath: '/api/queue',
  updateInterval: 5000
};

/**
 * 폴백 설정 (Redis 미사용 시)
 */
const fallbackConfig = {
  // 메모리 큐 사용
  useMemoryQueue: true,

  // 파일 기반 영구화
  persistPath: path.join(__dirname, '..', 'queue-data.json'),

  // 최대 큐 크기
  maxQueueSize: 1000
};

// ============================================
// 내보내기
// ============================================

module.exports = {
  redisConnection,
  queues,
  workerOptions,
  schedulerOptions,
  eventHandlers,
  dashboardConfig,
  fallbackConfig,

  // 유틸리티
  getQueueByPhase: (phase) => {
    const phaseLower = (phase || 'default').toLowerCase();
    return queues[phaseLower] || queues.default;
  },

  isRedisAvailable: async () => {
    try {
      const Redis = require('ioredis');
      const client = new Redis(redisConnection);
      await client.ping();
      await client.quit();
      return true;
    } catch {
      return false;
    }
  }
};
