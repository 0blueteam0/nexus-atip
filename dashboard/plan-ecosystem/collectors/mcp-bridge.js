/**
 * MCP Bridge Collector
 *
 * 위치: K:/PortableApps/genai/dashboard/plan-ecosystem/collectors/mcp-bridge.js
 *
 * 목적:
 * - vibekanban SQLite 데이터 수집
 * - kiro-memory SQLite 데이터 수집
 * - 통합 태스크 뷰 제공
 *
 * @module collectors/mcp-bridge
 * @version 1.0.0
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/genai';

// Database paths - Docker 환경에서는 /data 기반으로 마운트됨
const VIBEKANBAN_DB = process.env.BASE_PATH
  ? path.join(BASE_PATH, 'mcp-servers/vibekanban/instance/kanban.sqlite')
  : 'K:/PortableApps/genai/mcp-servers/vibekanban/instance/kanban.sqlite';

const KIRO_MEMORY_DB = process.env.BASE_PATH
  ? path.join(BASE_PATH, 'data/kiro-memory/mcp_memory.db')
  : 'K:/PortableApps/genai/data/kiro-memory/mcp_memory.db';

/**
 * 안전하게 SQLite 데이터베이스 열기
 */
function openDatabase(dbPath) {
  try {
    if (fs.existsSync(dbPath)) {
      return new Database(dbPath, { readonly: true });
    }
  } catch (error) {
    console.error(`[!] Failed to open database ${dbPath}:`, error.message);
  }
  return null;
}

// ============================================
// Vibekanban Integration
// ============================================

/**
 * Vibekanban 프로젝트 목록 조회
 */
function getVibekanbanProjects() {
  const db = openDatabase(VIBEKANBAN_DB);
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT id, name, description, created_at, updated_at
      FROM project
      ORDER BY updated_at DESC
    `);
    return stmt.all();
  } catch (error) {
    console.error('[!] Vibekanban projects query error:', error.message);
    return [];
  } finally {
    db.close();
  }
}

/**
 * Vibekanban 티켓 목록 조회
 */
function getVibekanbanTickets(projectId = null) {
  const db = openDatabase(VIBEKANBAN_DB);
  if (!db) return [];

  try {
    let query = `
      SELECT
        t.id, t.title, t.description, t.state, t.priority,
        t.project_id, t.created_at, t.updated_at,
        p.name as project_name
      FROM ticket t
      LEFT JOIN project p ON t.project_id = p.id
    `;

    if (projectId) {
      query += ` WHERE t.project_id = ?`;
    }
    query += ` ORDER BY t.updated_at DESC`;

    const stmt = db.prepare(query);
    const tickets = projectId ? stmt.all(projectId) : stmt.all();

    // 상태 정규화
    return tickets.map(t => ({
      ...t,
      source: 'vibekanban',
      status: normalizeStatus(t.state),
      priority: t.priority || 'medium'
    }));
  } catch (error) {
    console.error('[!] Vibekanban tickets query error:', error.message);
    return [];
  } finally {
    db.close();
  }
}

/**
 * Vibekanban 칸반 상태 조회
 */
function getVibekanbanKanbanStatus(projectId) {
  const db = openDatabase(VIBEKANBAN_DB);
  if (!db) return null;

  try {
    const ticketStmt = db.prepare(`
      SELECT state, COUNT(*) as count
      FROM ticket
      WHERE project_id = ?
      GROUP BY state
    `);
    const stateCount = ticketStmt.all(projectId);

    const projectStmt = db.prepare(`
      SELECT id, name, description
      FROM project
      WHERE id = ?
    `);
    const project = projectStmt.get(projectId);

    return {
      project,
      columns: stateCount.map(s => ({
        name: s.state,
        count: s.count
      })),
      totalTickets: stateCount.reduce((sum, s) => sum + s.count, 0)
    };
  } catch (error) {
    console.error('[!] Vibekanban kanban status error:', error.message);
    return null;
  } finally {
    db.close();
  }
}

// ============================================
// Kiro Memory Integration
// ============================================

/**
 * Kiro Memory 태스크 목록 조회
 */
function getKiroMemoryTasks() {
  const db = openDatabase(KIRO_MEMORY_DB);
  if (!db) return [];

  try {
    // Check if tasks table exists
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='tasks'
    `).get();

    if (!tableCheck) {
      return [];
    }

    const stmt = db.prepare(`
      SELECT id, title, description, status, priority,
             created_at, completed_at, metadata
      FROM tasks
      ORDER BY created_at DESC
    `);

    const tasks = stmt.all();
    return tasks.map(t => ({
      ...t,
      source: 'kiro-memory',
      status: normalizeStatus(t.status),
      priority: t.priority || 'medium',
      metadata: t.metadata ? JSON.parse(t.metadata) : {}
    }));
  } catch (error) {
    console.error('[!] Kiro memory tasks query error:', error.message);
    return [];
  } finally {
    db.close();
  }
}

/**
 * Kiro Memory 프로젝트 요약 조회
 */
function getKiroProjectSummary() {
  const db = openDatabase(KIRO_MEMORY_DB);
  if (!db) return null;

  try {
    // Check if project_summary table exists
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='project_summary'
    `).get();

    if (!tableCheck) {
      return null;
    }

    const stmt = db.prepare(`
      SELECT * FROM project_summary
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return stmt.get();
  } catch (error) {
    console.error('[!] Kiro project summary error:', error.message);
    return null;
  } finally {
    db.close();
  }
}

/**
 * Kiro Memory Thinking Chains 조회
 */
function getKiroThinkingChains(limit = 10) {
  const db = openDatabase(KIRO_MEMORY_DB);
  if (!db) return [];

  try {
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='thinking_chains'
    `).get();

    if (!tableCheck) {
      return [];
    }

    const stmt = db.prepare(`
      SELECT id, topic, status, steps, created_at, completed_at
      FROM thinking_chains
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const chains = stmt.all(limit);
    return chains.map(c => ({
      ...c,
      steps: c.steps ? JSON.parse(c.steps) : []
    }));
  } catch (error) {
    console.error('[!] Kiro thinking chains error:', error.message);
    return [];
  } finally {
    db.close();
  }
}

// ============================================
// Unified Integration
// ============================================

/**
 * 모든 MCP 소스에서 태스크 통합 수집
 */
function collectMCPTasks() {
  const vibekanbanTickets = getVibekanbanTickets();
  const kiroTasks = getKiroMemoryTasks();

  const allTasks = [
    ...vibekanbanTickets.map(t => ({
      id: `vk-${t.id}`,
      name: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      source: 'vibekanban',
      projectName: t.project_name,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    })),
    ...kiroTasks.map(t => ({
      id: `km-${t.id}`,
      name: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      source: 'kiro-memory',
      createdAt: t.created_at,
      completedAt: t.completed_at
    }))
  ];

  const stats = {
    vibekanban: vibekanbanTickets.length,
    kiroMemory: kiroTasks.length,
    total: allTasks.length,
    byStatus: {
      pending: allTasks.filter(t => t.status === 'pending').length,
      'in-progress': allTasks.filter(t => t.status === 'in-progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length
    }
  };

  return { tasks: allTasks, stats };
}

/**
 * MCP 서버 상태 확인
 */
function getMCPStatus() {
  const vibekanbanAvailable = fs.existsSync(VIBEKANBAN_DB);
  const kiroMemoryAvailable = fs.existsSync(KIRO_MEMORY_DB);

  let vibekanbanStats = null;
  let kiroStats = null;

  if (vibekanbanAvailable) {
    const projects = getVibekanbanProjects();
    const tickets = getVibekanbanTickets();
    vibekanbanStats = {
      projects: projects.length,
      tickets: tickets.length
    };
  }

  if (kiroMemoryAvailable) {
    const tasks = getKiroMemoryTasks();
    const chains = getKiroThinkingChains(100);
    kiroStats = {
      tasks: tasks.length,
      thinkingChains: chains.length
    };
  }

  return {
    vibekanban: {
      available: vibekanbanAvailable,
      dbPath: VIBEKANBAN_DB,
      stats: vibekanbanStats
    },
    kiroMemory: {
      available: kiroMemoryAvailable,
      dbPath: KIRO_MEMORY_DB,
      stats: kiroStats
    }
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * 상태 정규화
 */
function normalizeStatus(status) {
  if (!status) return 'pending';

  const normalized = status.toLowerCase();

  if (['done', 'completed', 'closed', 'resolved'].includes(normalized)) {
    return 'completed';
  }
  if (['in-progress', 'in_progress', 'active', 'doing', 'started'].includes(normalized)) {
    return 'in-progress';
  }
  if (['pending', 'todo', 'open', 'backlog', 'new'].includes(normalized)) {
    return 'pending';
  }

  return normalized;
}

// ============================================
// Module Exports
// ============================================

module.exports = {
  // Vibekanban
  getVibekanbanProjects,
  getVibekanbanTickets,
  getVibekanbanKanbanStatus,

  // Kiro Memory
  getKiroMemoryTasks,
  getKiroProjectSummary,
  getKiroThinkingChains,

  // Unified
  collectMCPTasks,
  getMCPStatus
};
