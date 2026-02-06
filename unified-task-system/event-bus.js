#!/usr/bin/env node
/**
 * Unified Event Bus
 * 
 * 위치: K:/PortableApps/Claude-Code/unified-task-system/event-bus.js
 * 
 * 목적:
 * - 모든 시스템 간 이벤트 기반 통신
 * - Hub, LangGraph, Dashboard, BullMQ 연동
 * - 실시간 상태 전파
 * 
 * @module unified-task-system/event-bus
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * 이벤트 타입 정의
 */
const EVENTS = {
  // Hub 이벤트
  TASK_CREATED: 'hub:task:created',
  TASK_UPDATED: 'hub:task:updated',
  TASK_COMPLETED: 'hub:task:completed',
  TASK_DELETED: 'hub:task:deleted',
  HUB_SYNCED: 'hub:synced',

  // LangGraph 이벤트
  PHASE_CHANGED: 'langgraph:phase:changed',
  WORKFLOW_STARTED: 'langgraph:workflow:started',
  WORKFLOW_COMPLETED: 'langgraph:workflow:completed',
  WORKFLOW_PAUSED: 'langgraph:workflow:paused',
  WORKFLOW_RESUMED: 'langgraph:workflow:resumed',
  GATE_PASSED: 'langgraph:gate:passed',
  GATE_FAILED: 'langgraph:gate:failed',
  
  // Dashboard 이벤트
  ALERT_TRIGGERED: 'dashboard:alert:triggered',
  SESSION_STARTED: 'dashboard:session:started',
  SESSION_ENDED: 'dashboard:session:ended',
  METRICS_UPDATED: 'dashboard:metrics:updated',
  
  // Queue 이벤트
  JOB_ADDED: 'queue:job:added',
  JOB_COMPLETED: 'queue:job:completed',
  JOB_FAILED: 'queue:job:failed',
  JOB_PROGRESS: 'queue:job:progress',
  
  // Docker 이벤트
  CONTAINER_STARTED: 'docker:container:started',
  CONTAINER_STOPPED: 'docker:container:stopped',
  HEALTH_CHECK: 'docker:health:check',
  
  // n8n 이벤트
  N8N_WORKFLOW_TRIGGERED: 'n8n:workflow:triggered',
  N8N_WORKFLOW_COMPLETED: 'n8n:workflow:completed'
};


/**
 * UnifiedEventBus 클래스
 * Singleton 패턴으로 전역 이벤트 버스 제공
 */
class UnifiedEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // 많은 리스너 허용
    this.subscribers = new Map();
    this.eventLog = [];
    this.maxLogSize = 1000;
    this.dashboardSocket = null;
    this._started = false;
  }

  /**
   * 이벤트 버스 시작
   */
  start() {
    if (this._started) return;
    this._started = true;
    console.log('[+] UnifiedEventBus 시작됨');
    this.emit('bus:started', { timestamp: new Date().toISOString() });
  }

  /**
   * Dashboard Socket.io 연결
   */
  setDashboardSocket(socket) {
    this.dashboardSocket = socket;
    console.log('[+] Dashboard Socket 연결됨');
  }


  /**
   * 구독자 등록 (소스 추적 포함)
   * @param {string} event - 이벤트명
   * @param {Function} handler - 핸들러
   * @param {string} source - 소스 식별자
   */
  subscribe(event, handler, source = 'unknown') {
    const key = `${source}:${event}`;
    this.on(event, handler);
    this.subscribers.set(key, { handler, source, event, registeredAt: new Date().toISOString() });
    return key;
  }

  /**
   * 구독 해제
   * @param {string} key - subscribe에서 반환된 키
   */
  unsubscribe(key) {
    const subscription = this.subscribers.get(key);
    if (subscription) {
      this.off(subscription.event, subscription.handler);
      this.subscribers.delete(key);
      return true;
    }
    return false;
  }

  /**
   * 이벤트 발행 (로깅 + Dashboard 전파)
   * @param {string} event - 이벤트명
   * @param {Object} data - 이벤트 데이터
   * @param {string} source - 소스 식별자
   */
  publish(event, data = {}, source = 'unknown') {
    const payload = {
      ...data,
      source,
      timestamp: new Date().toISOString()
    };

    // 이벤트 로그 기록
    this._logEvent(event, payload);

    // 이벤트 발행
    this.emit(event, payload);

    // Dashboard로 실시간 전파
    if (this.dashboardSocket) {
      this.dashboardSocket.emit('unified-event', { event, data: payload, source });
    }

    return payload;
  }

  /**
   * 이벤트 로깅
   */
  _logEvent(event, payload) {
    this.eventLog.push({ event, payload, timestamp: new Date().toISOString() });
    
    // 최대 크기 유지
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }
  }


  /**
   * 최근 이벤트 조회
   * @param {number} limit - 최대 개수
   * @param {string} filterEvent - 이벤트 필터 (선택)
   */
  getRecentEvents(limit = 50, filterEvent = null) {
    let events = [...this.eventLog];
    
    if (filterEvent) {
      events = events.filter(e => e.event === filterEvent || e.event.startsWith(filterEvent));
    }
    
    return events.slice(-limit).reverse();
  }

  /**
   * 구독자 통계
   */
  getSubscriberStats() {
    const stats = { total: this.subscribers.size, bySource: {}, byEvent: {} };
    
    for (const [key, sub] of this.subscribers) {
      stats.bySource[sub.source] = (stats.bySource[sub.source] || 0) + 1;
      stats.byEvent[sub.event] = (stats.byEvent[sub.event] || 0) + 1;
    }
    
    return stats;
  }

  /**
   * 이벤트 버스 상태
   */
  getStatus() {
    return {
      started: this._started,
      subscribers: this.subscribers.size,
      eventLogSize: this.eventLog.length,
      dashboardConnected: !!this.dashboardSocket,
      recentEvents: this.getRecentEvents(10)
    };
  }

  /**
   * 이벤트 버스 종료
   */
  stop() {
    this.removeAllListeners();
    this.subscribers.clear();
    this._started = false;
    this.dashboardSocket = null;
    console.log('[*] UnifiedEventBus 종료됨');
  }

  /**
   * 이벤트 로그 초기화
   */
  clearLog() {
    this.eventLog = [];
  }
}

// ============================================
// Singleton 인스턴스
// ============================================

let instance = null;


function getInstance() {
  if (!instance) {
    instance = new UnifiedEventBus();
  }
  return instance;
}

// ============================================
// 편의 함수
// ============================================

// 전역 publish
function publish(event, data, source) {
  return getInstance().publish(event, data, source);
}

// 전역 subscribe
function subscribe(event, handler, source) {
  return getInstance().subscribe(event, handler, source);
}

// ============================================
// CLI
// ============================================

function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];
  const bus = getInstance();
  bus.start();

  switch (command) {
    case 'status':
      console.log('\n--- Event Bus Status ---\n');
      console.log(JSON.stringify(bus.getStatus(), null, 2));
      break;

    case 'test':
      console.log('[*] 테스트 이벤트 발행...');
      bus.publish(EVENTS.TASK_CREATED, { id: 'test-1', title: 'Test Task' }, 'cli');
      bus.publish(EVENTS.PHASE_CHANGED, { phase: 'implement', taskId: 'test-1' }, 'cli');
      console.log('[+] 이벤트 발행 완료');
      console.log('\n최근 이벤트:');
      console.log(JSON.stringify(bus.getRecentEvents(5), null, 2));
      break;

    case 'recent':
      const limit = parseInt(args[1]) || 20;
      console.log(`\n--- 최근 ${limit}개 이벤트 ---\n`);
      console.log(JSON.stringify(bus.getRecentEvents(limit), null, 2));
      break;

    default:
      console.log('Usage:');
      console.log('  node event-bus.js status  - 상태 확인');
      console.log('  node event-bus.js test    - 테스트 이벤트 발행');
      console.log('  node event-bus.js recent [n] - 최근 n개 이벤트');
      break;
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  UnifiedEventBus,
  getInstance,
  EVENTS,
  publish,
  subscribe
};

// CLI 실행
if (require.main === module) {
  handleCLI();
}
