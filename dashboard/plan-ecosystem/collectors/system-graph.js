/**
 * System Graph Collector
 * Phase 9: 시스템 연결성 시각화
 *
 * K드라이브 Claude Code 생태계의 시스템 연결 관계를 그래프로 표현
 */
const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/Claude-Code';

// 시스템 노드 정의
const SYSTEM_NODES = {
    // Core Systems
    'Plans': {
        type: 'data',
        category: 'core',
        description: '플랜 파일 관리',
        path: 'plans/',
        color: '#14b8a6'
    },
    'Planning System': {
        type: 'service',
        category: 'core',
        description: '플랜 상태 관리 (checkpoint, restore)',
        path: 'planning-system/',
        color: '#14b8a6'
    },
    'Planning Log': {
        type: 'data',
        category: 'core',
        description: '일일 작업 로그',
        path: 'planning-log/',
        color: '#0ea5e9'
    },

    // Task Systems
    'Shrimp Tasks': {
        type: 'data',
        category: 'tasks',
        description: 'Shrimp Task Manager 데이터',
        path: 'ShrimpData/tasks/',
        color: '#f59e0b'
    },
    'Unified Tasks': {
        type: 'data',
        category: 'tasks',
        description: '통합 작업 시스템',
        path: 'unified-task-system/',
        color: '#3b82f6'
    },
    'Task Master': {
        type: 'data',
        category: 'tasks',
        description: 'Task Master AI 데이터',
        path: 'data/tasks.json',
        color: '#8b5cf6'
    },

    // ATOS System
    'ATOS': {
        type: 'service',
        category: 'orchestration',
        description: 'Autonomous Tool Orchestration',
        path: 'atos/',
        color: '#ec4899'
    },
    'Tool Registry': {
        type: 'data',
        category: 'orchestration',
        description: '도구 레지스트리',
        path: 'atos/tool-registry.json',
        color: '#ec4899'
    },
    'Usage Stats': {
        type: 'data',
        category: 'orchestration',
        description: '도구 사용 통계',
        path: 'atos/usage-stats.json',
        color: '#ec4899'
    },

    // Skills & Rules
    'Skills': {
        type: 'config',
        category: 'config',
        description: '스킬 정의',
        path: '.claude/skills/',
        color: '#6366f1'
    },
    'Rules': {
        type: 'config',
        category: 'config',
        description: '자동 로드 규칙',
        path: '.claude/rules/',
        color: '#6366f1'
    },
    'CLAUDE.md': {
        type: 'config',
        category: 'config',
        description: '글로벌 지침',
        path: 'CLAUDE.md',
        color: '#6366f1'
    },

    // Dashboard
    'Dashboard': {
        type: 'ui',
        category: 'ui',
        description: 'Plan Ecosystem Dashboard',
        path: 'dashboard/plan-ecosystem/',
        color: '#f43f5e'
    },
    'WebSocket': {
        type: 'service',
        category: 'ui',
        description: '실시간 통신',
        path: null,
        color: '#f43f5e'
    },

    // MCP Servers
    'MCP Servers': {
        type: 'service',
        category: 'mcp',
        description: 'MCP 서버 모음',
        path: 'mcp-servers/',
        color: '#22c55e'
    },
    'Desktop Commander': {
        type: 'mcp',
        category: 'mcp',
        description: '파일 작업 도구 (P1)',
        path: 'desktop-commander-mcp/',
        color: '#22c55e'
    },
    'Firecrawl': {
        type: 'mcp',
        category: 'mcp',
        description: '웹 스크래핑',
        path: 'mcp-servers/firecrawl-self-hosted/',
        color: '#22c55e'
    },

    // Memory
    'Memory': {
        type: 'data',
        category: 'memory',
        description: 'kiro-memory MCP 데이터',
        path: 'data/memory/',
        color: '#a855f7'
    }
};

// 시스템 간 연결 정의
const SYSTEM_CONNECTIONS = [
    // Plans <-> Planning System
    { from: 'Plans', to: 'Planning System', type: 'managed_by', label: 'checkpoint/restore' },
    { from: 'Planning System', to: 'Planning Log', type: 'writes', label: 'daily logs' },

    // Plans <-> Dashboard
    { from: 'Plans', to: 'Dashboard', type: 'monitored_by', label: 'real-time' },

    // Task Systems <-> Dashboard
    { from: 'Shrimp Tasks', to: 'Dashboard', type: 'monitored_by', label: 'real-time' },
    { from: 'Unified Tasks', to: 'Dashboard', type: 'monitored_by', label: 'real-time' },
    { from: 'Task Master', to: 'Dashboard', type: 'monitored_by', label: 'real-time' },

    // Task Systems <-> Unified
    { from: 'Shrimp Tasks', to: 'Unified Tasks', type: 'syncs_with', label: 'adapter' },
    { from: 'Task Master', to: 'Unified Tasks', type: 'syncs_with', label: 'adapter' },

    // ATOS
    { from: 'ATOS', to: 'Tool Registry', type: 'uses', label: 'tool lookup' },
    { from: 'ATOS', to: 'Usage Stats', type: 'writes', label: 'statistics' },
    { from: 'Usage Stats', to: 'Dashboard', type: 'monitored_by', label: 'real-time' },

    // ATOS <-> Skills
    { from: 'ATOS', to: 'Skills', type: 'triggers', label: 'keyword detection' },

    // Dashboard
    { from: 'Dashboard', to: 'WebSocket', type: 'uses', label: 'Socket.io' },
    { from: 'Planning Log', to: 'Dashboard', type: 'monitored_by', label: 'file watch' },

    // Config
    { from: 'CLAUDE.md', to: 'Rules', type: 'loads', label: 'auto-load' },
    { from: 'Rules', to: 'ATOS', type: 'configures', label: 'tool priority' },

    // MCP
    { from: 'MCP Servers', to: 'Desktop Commander', type: 'contains', label: 'P1 tool' },
    { from: 'MCP Servers', to: 'Firecrawl', type: 'contains', label: 'web scraping' },
    { from: 'ATOS', to: 'MCP Servers', type: 'orchestrates', label: 'tool selection' },

    // Memory
    { from: 'Memory', to: 'Dashboard', type: 'monitored_by', label: 'optional' },
    { from: 'Unified Tasks', to: 'Memory', type: 'backs_up_to', label: 'session state' }
];

/**
 * 시스템 그래프 데이터 수집
 */
function collectSystemGraph() {
    const nodes = [];
    const edges = [];

    // 노드 상태 확인
    for (const [name, config] of Object.entries(SYSTEM_NODES)) {
        const node = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            label: name,
            type: config.type,
            category: config.category,
            description: config.description,
            color: config.color,
            active: checkNodeActive(config.path)
        };
        nodes.push(node);
    }

    // 엣지 생성
    for (const conn of SYSTEM_CONNECTIONS) {
        const edge = {
            source: conn.from.toLowerCase().replace(/\s+/g, '-'),
            target: conn.to.toLowerCase().replace(/\s+/g, '-'),
            type: conn.type,
            label: conn.label
        };
        edges.push(edge);
    }

    return { nodes, edges };
}

/**
 * 노드 활성 상태 확인
 */
function checkNodeActive(nodePath) {
    if (!nodePath) return true; // 가상 노드는 항상 활성

    const fullPath = path.join(BASE_PATH, nodePath);
    try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            const files = fs.readdirSync(fullPath);
            return files.length > 0;
        }
        return stat.size > 0;
    } catch {
        return false;
    }
}

/**
 * 카테고리별 노드 그룹화
 */
function getNodesByCategory() {
    const categories = {};

    for (const [name, config] of Object.entries(SYSTEM_NODES)) {
        if (!categories[config.category]) {
            categories[config.category] = [];
        }
        categories[config.category].push({
            name,
            ...config,
            active: checkNodeActive(config.path)
        });
    }

    return categories;
}

/**
 * 특정 노드의 연결 관계 조회
 */
function getNodeConnections(nodeId) {
    const nodeName = Object.keys(SYSTEM_NODES).find(
        n => n.toLowerCase().replace(/\s+/g, '-') === nodeId
    );

    if (!nodeName) return { incoming: [], outgoing: [] };

    const incoming = SYSTEM_CONNECTIONS
        .filter(c => c.to === nodeName)
        .map(c => ({
            from: c.from,
            type: c.type,
            label: c.label
        }));

    const outgoing = SYSTEM_CONNECTIONS
        .filter(c => c.from === nodeName)
        .map(c => ({
            to: c.to,
            type: c.type,
            label: c.label
        }));

    return { incoming, outgoing };
}

/**
 * 시스템 상태 요약
 */
function getSystemStatus() {
    const nodes = Object.entries(SYSTEM_NODES);
    const activeCount = nodes.filter(([_, config]) => checkNodeActive(config.path)).length;

    return {
        totalNodes: nodes.length,
        activeNodes: activeCount,
        inactiveNodes: nodes.length - activeCount,
        totalConnections: SYSTEM_CONNECTIONS.length,
        categories: Object.keys(getNodesByCategory()),
        lastChecked: new Date().toISOString()
    };
}

/**
 * Mermaid 다이어그램 생성 (텍스트)
 */
function generateMermaidDiagram() {
    let mermaid = 'graph LR\n';

    // 스타일 정의
    const categoryStyles = {
        core: 'fill:#14b8a6,color:#fff',
        tasks: 'fill:#f59e0b,color:#fff',
        orchestration: 'fill:#ec4899,color:#fff',
        config: 'fill:#6366f1,color:#fff',
        ui: 'fill:#f43f5e,color:#fff',
        mcp: 'fill:#22c55e,color:#fff',
        memory: 'fill:#a855f7,color:#fff'
    };

    // 노드 정의
    for (const [name, config] of Object.entries(SYSTEM_NODES)) {
        const id = name.replace(/\s+/g, '_');
        mermaid += `    ${id}["${name}"]\n`;
    }

    mermaid += '\n';

    // 연결 정의
    for (const conn of SYSTEM_CONNECTIONS) {
        const fromId = conn.from.replace(/\s+/g, '_');
        const toId = conn.to.replace(/\s+/g, '_');
        mermaid += `    ${fromId} -->|${conn.label}| ${toId}\n`;
    }

    // 스타일 적용
    mermaid += '\n';
    for (const [name, config] of Object.entries(SYSTEM_NODES)) {
        const id = name.replace(/\s+/g, '_');
        const style = categoryStyles[config.category] || 'fill:#6b7280,color:#fff';
        mermaid += `    style ${id} ${style}\n`;
    }

    return mermaid;
}

/**
 * D3.js용 그래프 데이터
 */
function getD3GraphData() {
    const graph = collectSystemGraph();

    // D3 force layout 형식으로 변환
    return {
        nodes: graph.nodes.map(node => ({
            id: node.id,
            label: node.label,
            group: node.category,
            color: node.color,
            active: node.active,
            description: node.description
        })),
        links: graph.edges.map(edge => ({
            source: edge.source,
            target: edge.target,
            type: edge.type,
            label: edge.label
        }))
    };
}

module.exports = {
    collectSystemGraph,
    getNodesByCategory,
    getNodeConnections,
    getSystemStatus,
    generateMermaidDiagram,
    getD3GraphData,
    SYSTEM_NODES,
    SYSTEM_CONNECTIONS
};
