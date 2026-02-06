/**
 * Agent Schema
 * 역할 기반 에이전트 풀 정의
 *
 * @module unified-task-system/schemas/agent.schema
 * @version 2.0.0
 */

const { AgentRole } = require('./task.schema');

/**
 * Agent Status Enum
 */
const AgentStatus = {
  IDLE: 'idle',
  BUSY: 'busy',
  WAITING: 'waiting',
  ERROR: 'error',
  OFFLINE: 'offline'
};

/**
 * Agent Profile Definition
 * 각 역할별 에이전트 프로필
 */
const AgentProfiles = {
  [AgentRole.RESEARCHER]: {
    role: AgentRole.RESEARCHER,
    description: '조사/탐색 전문 에이전트',
    capabilities: ['web_search', 'code_exploration', 'documentation_lookup'],


    tools: [
      'mcp__firecrawl__firecrawl_search',
      'mcp__firecrawl__firecrawl_scrape',
      'mcp__context7__resolve-library-id',
      'mcp__context7__query-docs',
      'mcp__paper-search-mcp__search_arxiv',
      'mcp__one-search__one_search',
      'Glob', 'Grep', 'Read'
    ],
    contextBudget: 0.25,
    priority: 1,
    concurrency: 2,  // 동시 실행 가능 수
    model: 'sonnet'
  },

  [AgentRole.CODER]: {
    role: AgentRole.CODER,
    description: '코드 작성/수정 전문 에이전트',
    capabilities: ['code_writing', 'code_editing', 'refactoring'],
    tools: [
      'mcp__desktop-commander__write_file',
      'mcp__desktop-commander__edit_block',
      'mcp__desktop-commander__read_file',
      'mcp__edit-file-lines__edit_file_lines',
      'mcp__git-mcp__git_add',
      'mcp__git-mcp__git_commit',
      'Read', 'Edit', 'Write'
    ],
    contextBudget: 0.35,
    priority: 2,
    concurrency: 1,  // 코드 작성은 순차적으로
    model: 'sonnet'
  },


  [AgentRole.TESTER]: {
    role: AgentRole.TESTER,
    description: '테스트/검증 전문 에이전트',
    capabilities: ['test_execution', 'validation', 'e2e_testing'],
    tools: [
      'mcp__playwright__playwright_navigate',
      'mcp__playwright__playwright_click',
      'mcp__playwright__playwright_screenshot',
      'mcp__e2b__run_code',
      'Bash'
    ],
    contextBudget: 0.15,
    priority: 3,
    concurrency: 2,
    model: 'haiku'
  },

  [AgentRole.REVIEWER]: {
    role: AgentRole.REVIEWER,
    description: '리뷰/품질 전문 에이전트',
    capabilities: ['code_review', 'quality_check', 'security_scan'],
    tools: [
      'mcp__llm-council__council_ask',
      'mcp__sequential-thinking__sequentialthinking',
      'mcp__github__create_pull_request_review',
      'Read', 'Grep'
    ],
    contextBudget: 0.15,
    priority: 2,
    concurrency: 1,
    model: 'sonnet'
  },


  [AgentRole.ORCHESTRATOR]: {
    role: AgentRole.ORCHESTRATOR,
    description: '조율/관리 전문 에이전트',
    capabilities: ['task_coordination', 'planning', 'decision_making'],
    tools: [
      'mcp__shrimp-task__plan_task',
      'mcp__shrimp-task__split_tasks',
      'mcp__shrimp-task__execute_task',
      'mcp__sequential-thinking__sequentialthinking',
      'TaskCreate', 'TaskUpdate', 'TaskList'
    ],
    contextBudget: 0.10,
    priority: 0,  // 최우선
    concurrency: 1,
    model: 'sonnet'
  }
};

/**
 * Agent Instance Schema
 */
const AgentSchema = {
  id: { type: 'string', required: true },
  role: { type: 'string', enum: Object.values(AgentRole), required: true },
  status: { type: 'string', enum: Object.values(AgentStatus), default: AgentStatus.IDLE },
  currentTask: { type: 'string', default: null },
  taskHistory: { type: 'array', items: 'object', default: [] },
  stats: {
    type: 'object',
    properties: {
      tasksCompleted: { type: 'number', default: 0 },
      tasksFailed: { type: 'number', default: 0 },
      avgDuration: { type: 'number', default: 0 },
      lastActive: { type: 'string', format: 'date-time' }
    }
  },


  created: { type: 'string', format: 'date-time' },
  metadata: { type: 'object', default: {} }
};

/**
 * Agent Factory
 * @param {string} role - 에이전트 역할
 * @param {Object} options - 추가 옵션
 * @returns {Object} 에이전트 인스턴스
 */
function createAgent(role, options = {}) {
  const profile = AgentProfiles[role];
  if (!profile) {
    throw new Error(`Unknown agent role: ${role}`);
  }

  const now = new Date().toISOString();

  return {
    id: options.id || `agent-${role}-${Date.now()}`,
    role: role,
    status: AgentStatus.IDLE,
    currentTask: null,
    taskHistory: [],
    stats: {
      tasksCompleted: 0,
      tasksFailed: 0,
      avgDuration: 0,
      lastActive: now
    },
    created: now,
    metadata: {
      profile: profile,
      ...options.metadata
    }
  };
}


/**
 * Agent Pool Factory
 * @returns {Object} 전체 에이전트 풀
 */
function createAgentPool() {
  const pool = {};

  for (const role of Object.values(AgentRole)) {
    const profile = AgentProfiles[role];
    pool[role] = {
      profile: profile,
      instances: [],
      queue: []
    };

    // 동시성 설정에 따라 인스턴스 생성
    for (let i = 0; i < profile.concurrency; i++) {
      pool[role].instances.push(createAgent(role, { id: `${role}-${i}` }));
    }
  }

  return pool;
}

/**
 * Get Available Agent
 * @param {Object} pool - 에이전트 풀
 * @param {string} role - 요청 역할
 * @returns {Object|null} 가용 에이전트 또는 null
 */
function getAvailableAgent(pool, role) {
  const rolePool = pool[role];
  if (!rolePool) return null;

  return rolePool.instances.find(agent => agent.status === AgentStatus.IDLE) || null;
}


module.exports = {
  AgentStatus,
  AgentProfiles,
  AgentSchema,
  createAgent,
  createAgentPool,
  getAvailableAgent
};
