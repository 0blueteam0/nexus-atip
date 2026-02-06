/**
 * Dashboard API Server
 * 실시간 태스크 관리 API
 *
 * @module dashboard/api-server
 * @version 1.0.0
 */

const http = require('http');
const { URL } = require('url');

/**
 * Dashboard API Server
 */
class DashboardAPIServer {
  constructor(options = {}) {
    this.port = options.port || 7848;
    this.server = null;

    // 의존성 (lazy load)
    this.poolManager = null;
    this.queueManager = null;
    this.stateManager = null;
  }

  /**
   * 의존성 주입
   */
  setDependencies({ poolManager, queueManager, stateManager }) {
    this.poolManager = poolManager;
    this.queueManager = queueManager;
    this.stateManager = stateManager;
  }

  /**
   * 서버 시작
   */
  start() {
    this.server = http.createServer((req, res) => this.handleRequest(req, res));

    this.server.listen(this.port, () => {
      console.log(`[Dashboard API] Server running on http://localhost:${this.port}`);
    });

    return this;
  }


  /**
   * 요청 처리
   */
  async handleRequest(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${this.port}`);
    const path = url.pathname;

    try {
      let data;

      switch (path) {
        case '/api/status':
          data = await this.getSystemStatus();
          break;
        case '/api/agents':
          data = await this.getAgentStatus();
          break;
        case '/api/queues':
          data = await this.getQueueStatus();
          break;
        case '/api/tasks':
          data = await this.getTaskStatus();
          break;
        case '/api/health':
          data = { status: 'ok', timestamp: new Date().toISOString() };
          break;
        default:
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not found' }));
          return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data, null, 2));

    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  }


  /**
   * 시스템 전체 상태
   */
  async getSystemStatus() {
    return {
      timestamp: new Date().toISOString(),
      agents: this.poolManager ? this.poolManager.getStatus() : null,
      queues: this.queueManager ? await this.queueManager.getAllStatus() : null,
      state: this.stateManager ? this.stateManager.getState() : null
    };
  }

  /**
   * 에이전트 상태
   */
  async getAgentStatus() {
    if (!this.poolManager) {
      return { error: 'Pool manager not initialized' };
    }

    const agents = this.poolManager.getAllAgents();
    return {
      pools: this.poolManager.getStatus(),
      agents: agents.map(a => a.getStatus())
    };
  }

  /**
   * 큐 상태
   */
  async getQueueStatus() {
    if (!this.queueManager) {
      return { error: 'Queue manager not initialized' };
    }

    return await this.queueManager.getAllStatus();
  }

  /**
   * 태스크 상태
   */
  async getTaskStatus() {
    const fs = require('fs');
    const path = require('path');

    try {
      const tasksFile = path.join(__dirname, '../unified-task-system/tasks.json');
      const data = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      return { tasks: data.tasks || [], lastSync: data.lastSync };
    } catch (error) {
      return { tasks: [], error: error.message };
    }
  }

  /**
   * 서버 중지
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[Dashboard API] Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = { DashboardAPIServer };
