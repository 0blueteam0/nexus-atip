/**
 * Dashboard Module Entry Point
 * 실시간 태스크 관리 대시보드
 *
 * @module dashboard
 * @version 1.0.0
 */

const { DashboardAPIServer } = require('./api-server');

// 의존성 모듈 (lazy load)
let poolManager = null;
let queueManager = null;

/**
 * 의존성 로드
 */
function loadDependencies() {
  try {
    const { getPoolManager } = require('../agent-pool');
    poolManager = getPoolManager();
  } catch (e) {
    console.warn('[Dashboard] Agent pool not available:', e.message);
  }

  try {
    const { getQueueManager } = require('../task-queue');
    queueManager = getQueueManager();
  } catch (e) {
    console.warn('[Dashboard] Queue manager not available:', e.message);
  }

  return { poolManager, queueManager };
}

/**
 * 대시보드 서버 생성 및 시작
 */
function createDashboard(options = {}) {
  const deps = loadDependencies();

  const server = new DashboardAPIServer(options);
  server.setDependencies({
    poolManager: deps.poolManager,
    queueManager: deps.queueManager,
    stateManager: null // LangGraph state는 별도 연동
  });

  return server;
}

/**
 * 싱글톤 인스턴스
 */
let dashboardInstance = null;

function getDashboard(options = {}) {
  if (!dashboardInstance) {
    dashboardInstance = createDashboard(options);
  }
  return dashboardInstance;
}

module.exports = {
  DashboardAPIServer,
  createDashboard,
  getDashboard,
  loadDependencies
};
