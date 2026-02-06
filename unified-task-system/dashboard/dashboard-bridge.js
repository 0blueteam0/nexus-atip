#!/usr/bin/env node
/**
 * Dashboard Bridge
 *
 * 위치: K:/PortableApps/Claude-Code/unified-task-system/dashboard/dashboard-bridge.js
 *
 * 목적:
 * - plan-ecosystem-dashboard (localhost:7847)와 Unified Task Hub 연동
 * - 실시간 태스크 상태 업데이트
 * - 큐 메트릭 시각화 데이터 제공
 *
 * 사용법:
 *   const bridge = require('./dashboard/dashboard-bridge');
 *   await bridge.connect();
 *   bridge.pushTaskUpdate(task);
 */

const http = require('http');
const EventEmitter = require('events');

/**
 * Dashboard Bridge 클래스
 */
class DashboardBridge extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      dashboardUrl: options.dashboardUrl || 'http://localhost:7847',
      apiPath: options.apiPath || '/api',
      updateInterval: options.updateInterval || 5000,
      enabled: options.enabled !== false,
      ...options
    };

    this.connected = false;
    this.lastUpdate = null;
    this._intervalId = null;
  }

  /**
   * 대시보드 연결 확인
   */
  async connect() {
    if (!this.options.enabled) {
      console.log('[*] Dashboard Bridge 비활성화');
      return false;
    }

    try {
      const isAlive = await this._checkHealth();
      this.connected = isAlive;

      if (isAlive) {
        console.log(`[+] Dashboard 연결 성공: ${this.options.dashboardUrl}`);
        this.emit('connected');
      } else {
        console.log('[*] Dashboard 응답 없음 - 오프라인 모드');
      }

      return this.connected;
    } catch (error) {
      console.log('[*] Dashboard 연결 실패:', error.message);
      this.connected = false;
      return false;
    }
  }

  /**
   * 대시보드 헬스 체크
   */
  async _checkHealth() {
    return new Promise((resolve) => {
      const url = new URL(this.options.dashboardUrl);

      const req = http.request({
        hostname: url.hostname,
        port: url.port || 80,
        path: '/',
        method: 'GET',
        timeout: 3000
      }, (res) => {
        resolve(res.statusCode < 500);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  /**
   * 태스크 업데이트 푸시
   */
  async pushTaskUpdate(task) {
    if (!this.connected) return false;

    try {
      await this._sendToApi('/tasks/update', {
        method: 'POST',
        body: JSON.stringify(task)
      });

      this.lastUpdate = new Date().toISOString();
      this.emit('task:pushed', task);
      return true;
    } catch (error) {
      console.error('[!] 태스크 업데이트 실패:', error.message);
      return false;
    }
  }

  /**
   * 큐 메트릭 푸시
   */
  async pushQueueMetrics(metrics) {
    if (!this.connected) return false;

    try {
      await this._sendToApi('/queue/metrics', {
        method: 'POST',
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          ...metrics
        })
      });

      return true;
    } catch (error) {
      console.error('[!] 메트릭 푸시 실패:', error.message);
      return false;
    }
  }

  /**
   * 전체 상태 동기화
   */
  async syncFullState(state) {
    if (!this.connected) return false;

    try {
      await this._sendToApi('/state/sync', {
        method: 'POST',
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          tasks: state.tasks || [],
          queue: state.queue || {},
          adapters: state.adapters || []
        })
      });

      console.log('[+] 전체 상태 동기화 완료');
      return true;
    } catch (error) {
      console.error('[!] 상태 동기화 실패:', error.message);
      return false;
    }
  }

  /**
   * API 요청 전송
   */
  async _sendToApi(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.options.dashboardUrl);

      const req = http.request({
        hostname: url.hostname,
        port: url.port || 80,
        path: `${this.options.apiPath}${endpoint}`,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  /**
   * 자동 업데이트 시작
   */
  startAutoUpdate(getStateFn) {
    if (this._intervalId) return;

    this._intervalId = setInterval(async () => {
      if (!this.connected) {
        await this.connect();
      }

      if (this.connected && getStateFn) {
        const state = await getStateFn();
        await this.syncFullState(state);
      }
    }, this.options.updateInterval);

    console.log(`[+] 자동 업데이트 시작 (${this.options.updateInterval}ms)`);
  }

  /**
   * 자동 업데이트 중지
   */
  stopAutoUpdate() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
      console.log('[*] 자동 업데이트 중지');
    }
  }

  /**
   * 연결 상태
   */
  getStatus() {
    return {
      enabled: this.options.enabled,
      connected: this.connected,
      dashboardUrl: this.options.dashboardUrl,
      lastUpdate: this.lastUpdate,
      autoUpdate: !!this._intervalId
    };
  }

  /**
   * 종료
   */
  async close() {
    this.stopAutoUpdate();
    this.connected = false;
    this.emit('disconnected');
  }
}

// ============================================
// Singleton 인스턴스
// ============================================

let instance = null;

function getInstance(options) {
  if (!instance) {
    instance = new DashboardBridge(options);
  }
  return instance;
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  DashboardBridge,
  getInstance
};

// CLI 실행
if (require.main === module) {
  const bridge = getInstance();

  (async () => {
    console.log('[*] Dashboard Bridge 테스트...');
    const connected = await bridge.connect();
    console.log('연결 상태:', bridge.getStatus());

    if (connected) {
      await bridge.pushTaskUpdate({
        id: 'test-task-1',
        title: 'Test Task',
        status: 'pending'
      });
    }

    await bridge.close();
  })();
}
