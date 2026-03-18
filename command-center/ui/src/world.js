/**
 * World - Game State and Entity Management (ESM Module)
 *
 * Manages all entities (agents, MCP buildings, Docker containers),
 * WebSocket connection to Observer Server, and world state updates.
 */

import {
  initStarField,
  updateParticles,
  spawnDataParticle,
  spawnTrailParticle,
  spawnSpark,
  getStateParticleColor
} from './particles.js';

// ========== MCP SERVER LAYOUT ==========
// 38 MCP servers organized in clusters around the map

export const MCP_SERVERS = [
  // File/Code cluster (top-left)
  { id: 'desktop-commander', label: 'DC', category: 'file', col: 2, row: 2 },
  { id: 'edit-file-lines', label: 'EFL', category: 'file', col: 4, row: 2 },
  { id: 'git-mcp', label: 'Git', category: 'file', col: 6, row: 2 },
  { id: 'github', label: 'GH', category: 'file', col: 2, row: 4 },
  { id: 'filesystem', label: 'FS', category: 'file', col: 4, row: 4 },
  { id: 'serena', label: 'SRN', category: 'file', col: 6, row: 4 },

  // Web/Crawling cluster (top-right)
  { id: 'firecrawl', label: 'FC', category: 'web', col: 18, row: 2 },
  { id: 'one-search', label: '1S', category: 'web', col: 20, row: 2 },
  { id: 'crawl4ai-lite', label: 'C4A', category: 'web', col: 22, row: 2 },
  { id: 'playwright', label: 'PW', category: 'web', col: 18, row: 4 },
  { id: 'websearch', label: 'WS', category: 'web', col: 20, row: 4 },
  { id: 'youtube-data', label: 'YT', category: 'web', col: 22, row: 4 },

  // Research cluster (mid-left)
  { id: 'deep-research-mcp', label: 'DR', category: 'research', col: 2, row: 8 },
  { id: 'paper-search-mcp', label: 'PS', category: 'research', col: 4, row: 8 },
  { id: 'context7', label: 'C7', category: 'research', col: 6, row: 8 },
  { id: 'hfspace', label: 'HF', category: 'research', col: 2, row: 10 },

  // AI/LLM cluster (mid-right)
  { id: 'multi-ai-orchestration', label: 'MAI', category: 'ai', col: 18, row: 8 },
  { id: 'llm-council', label: 'LC', category: 'ai', col: 20, row: 8 },
  { id: 'sequential-thinking', label: 'ST', category: 'ai', col: 22, row: 8 },
  { id: 'pal', label: 'PAL', category: 'ai', col: 18, row: 10 },
  { id: 'e2b', label: 'E2B', category: 'ai', col: 20, row: 10 },

  // Database cluster (bottom-left)
  { id: 'sqlite-mcp', label: 'SQL', category: 'db', col: 2, row: 14 },
  { id: 'supabase', label: 'SB', category: 'db', col: 4, row: 14 },
  { id: 'memory', label: 'MEM', category: 'db', col: 6, row: 14 },
  { id: 'kiro-memory', label: 'KM', category: 'db', col: 2, row: 16 },

  // Task/Mgmt cluster (bottom-center)
  { id: 'shrimp-task', label: 'ST', category: 'task', col: 10, row: 14 },
  { id: 'vibekanban', label: 'VK', category: 'task', col: 12, row: 14 },
  { id: 'task-master-ai', label: 'TM', category: 'task', col: 14, row: 14 },
  { id: 'notion', label: 'NTN', category: 'task', col: 10, row: 16 },
  { id: 'n8n', label: 'N8N', category: 'task', col: 12, row: 16 },

  // Media cluster (bottom-right)
  { id: 'image-recognition', label: 'IR', category: 'media', col: 18, row: 14 },
  { id: 'paddleocr-mcp', label: 'OCR', category: 'media', col: 20, row: 14 },
  { id: 'marker-mcp', label: 'MK', category: 'media', col: 22, row: 14 },
  { id: 'antv-chart', label: 'CHR', category: 'media', col: 18, row: 16 },
  { id: 'mcp-installer', label: 'INS', category: 'media', col: 20, row: 16 },
  { id: 'runpod-jupyter', label: 'RP', category: 'media', col: 22, row: 16 },

  // Misc (scattered)
  { id: 'figma', label: 'FIG', category: 'misc', col: 14, row: 4 },
  { id: 'hugging-face', label: 'HF2', category: 'misc', col: 14, row: 8 }
];

// Docker containers
export const DOCKER_CONTAINERS = [
  { id: 'firecrawl-api-1', label: 'FC-API', col: 19, row: 3 },
  { id: 'searxng', label: 'SNG', col: 21, row: 3 },
  { id: 'crawl4ai', label: 'C4A-D', col: 23, row: 3 },
  { id: 'n8n-automation', label: 'N8N-D', col: 13, row: 17 },
  { id: 'redis-security', label: 'REDIS', col: 11, row: 17 }
];

// Category colors for zone rendering (hex numeric for PixiJS)
export const CATEGORY_COLORS = {
  file:     0x00FF88,
  web:      0x4488FF,
  research: 0xCC88FF,
  ai:       0xFFCC44,
  db:       0x44CCCC,
  task:     0xFF8844,
  media:    0xFF4488,
  misc:     0x888888
};

// CSS color strings for DOM-based UI (sidebar)
export const CATEGORY_CSS_COLORS = {
  file:     '#00ff88',
  web:      '#4488ff',
  research: '#cc88ff',
  ai:       '#ffcc44',
  db:       '#44cccc',
  task:     '#ff8844',
  media:    '#ff4488',
  misc:     '#888888'
};

// ========== WORLD STATE ==========

export const world = {
  // Grid config
  gridSize: 32,        // pixels per grid cell
  gridCols: 25,
  gridRows: 19,

  // Agents
  agents: new Map(),   // agentId -> { x, y, state, toolName, lastUpdate }

  // MCP servers state
  mcpStates: new Map(), // serverId -> { active, lastTool, useCount }

  // Docker states
  dockerStates: new Map(), // containerId -> { running }

  // Session state
  session: {
    id: null,
    startTime: Date.now(),
    eventCount: 0,
    connected: false,
    tokenBudget: { used: 0, total: 200000 },
    cost: 0
  },

  // Events log (ring buffer)
  events: [],
  maxEvents: 50,

  // Tasks (mission board)
  tasks: [],

  // WebSocket
  ws: null,
  wsReconnectTimer: null,

  // Animation
  frameCount: 0,
  blinkPhase: false
};

// ========== WORLD INITIALIZATION ==========

export function initWorld(canvasW, canvasH) {
  // Init MCP server states
  for (const mcp of MCP_SERVERS) {
    world.mcpStates.set(mcp.id, {
      active: false,
      lastTool: null,
      useCount: 0,
      lastUpdate: 0
    });
  }

  // Init Docker states
  for (const dc of DOCKER_CONTAINERS) {
    world.dockerStates.set(dc.id, { running: false });
  }

  // Init main agent at center
  world.agents.set('main', {
    x: 12 * world.gridSize,
    y: 9 * world.gridSize,
    targetX: 12 * world.gridSize,
    targetY: 9 * world.gridSize,
    state: 'idle',
    toolName: null,
    lastUpdate: Date.now()
  });

  // Update UI with initial state
  updateAgentCountUI();
  updateAgentListUI();
  updateSessionTimeUI();

  // Init star field background
  initStarField(canvasW, canvasH);

  // Connect WebSocket
  connectWS();
}

// ========== WEBSOCKET CONNECTION ==========

export function connectWS() {
  const url = (window.commandCenter && window.commandCenter.wsUrl)
    || 'ws://localhost:3847/ws';

  try {
    world.ws = new WebSocket(url);
  } catch (e) {
    scheduleReconnect();
    return;
  }

  world.ws.onopen = function() {
    world.session.connected = true;
    updateConnectionUI(true);
    addEvent('system', 'Connected to Observer');
  };

  world.ws.onclose = function() {
    world.session.connected = false;
    updateConnectionUI(false);
    scheduleReconnect();
  };

  world.ws.onerror = function() {
    world.session.connected = false;
    updateConnectionUI(false);
  };

  world.ws.onmessage = function(evt) {
    try {
      const msg = JSON.parse(evt.data);
      handleWSMessage(msg);
    } catch (e) {
      // skip malformed
    }
  };
}

function scheduleReconnect() {
  if (world.wsReconnectTimer) return;
  world.wsReconnectTimer = setTimeout(function() {
    world.wsReconnectTimer = null;
    connectWS();
  }, 3000);
}

function updateConnectionUI(connected) {
  const dot = document.getElementById('ws-dot');
  const status = document.getElementById('ws-status');
  if (dot) {
    dot.className = connected ? 'dot connected' : 'dot';
  }
  if (status) {
    status.textContent = connected ? 'Connected' : 'Disconnected';
  }
}

// ========== MESSAGE HANDLING ==========

function handleWSMessage(msg) {
  switch (msg.type) {
    case 'state':
      handleFullState(msg.data);
      break;
    case 'transcript_event':
      handleTranscriptEvent(msg.data);
      break;
    case 'hook_event':
      handleHookEvent(msg.data);
      break;
    case 'agent_update':
      handleAgentUpdate(msg.data);
      break;
    case 'pong':
      break;
    default:
      if (msg.data) {
        addEvent('ws', msg.type);
      }
  }

  world.session.eventCount++;
  updateEventCountUI();
}

function handleFullState(data) {
  if (!data) return;

  if (data.agents) {
    for (const [id, agentData] of Object.entries(data.agents)) {
      updateAgent(id, agentData);
    }
  }

  if (data.sessionId) {
    world.session.id = data.sessionId;
  }
}

function handleTranscriptEvent(data) {
  if (!data) return;

  const agentId = data.agentId || 'main';

  switch (data.type) {
    case 'tool_use':
      updateAgent(agentId, { state: data.state || 'coding', toolName: data.toolName });
      activateMCP(data.toolName);
      addEvent('tool', agentId + ': ' + (data.toolName || 'unknown'));

      // Spawn data flow particles: agent -> MCP building
      {
        const agentSrc = world.agents.get(agentId);
        if (agentSrc && data.toolName) {
          const mcpPos = findMCPPosition(data.toolName);
          if (mcpPos) {
            const pColor = getStateParticleColor(data.state || 'coding');
            for (let pi = 0; pi < 3; pi++) {
              spawnDataParticle(
                agentSrc.x + 16, agentSrc.y + 16,
                mcpPos.x + 16, mcpPos.y + 16,
                pColor
              );
            }
          }
        }
      }
      break;

    case 'tool_result':
      if (data.error) {
        updateAgent(agentId, { state: 'error' });
        addEvent('error', agentId + ': tool error');
      }
      break;

    case 'text_output':
      updateAgent(agentId, { state: 'thinking' });
      break;

    case 'user_input':
      updateAgent(agentId, { state: 'idle' });
      addEvent('input', 'User message');
      break;

    case 'agent_spawn':
      spawnSubAgent(data.subAgentId || 'sub-' + Date.now(), data.subAgentType);
      addEvent('agent', 'Spawned: ' + (data.subAgentType || 'agent'));
      break;

    case 'agent_complete':
      removeSubAgent(data.subAgentId);
      addEvent('agent', 'Sub-agent complete');
      break;
  }
}

function handleHookEvent(data) {
  if (!data) return;
  addEvent('hook', data.event || 'hook');

  if (data.event === 'ToolUse') {
    const toolName = data.toolName || data.tool_name;
    updateAgent('main', { state: 'coding', toolName: toolName });
    activateMCP(toolName);
  }
}

function handleAgentUpdate(data) {
  if (!data) return;
  updateAgent(data.agentId || 'main', data);
}

// ========== ENTITY UPDATES ==========

export function updateAgent(id, data) {
  let agent = world.agents.get(id);
  if (!agent) {
    agent = {
      x: 12 * world.gridSize,
      y: 9 * world.gridSize,
      targetX: 12 * world.gridSize,
      targetY: 9 * world.gridSize,
      state: 'idle',
      toolName: null,
      lastUpdate: Date.now()
    };
    world.agents.set(id, agent);
  }

  if (data.state) agent.state = data.state;
  if (data.toolName !== undefined) agent.toolName = data.toolName;
  agent.lastUpdate = Date.now();

  // Move agent toward relevant MCP building
  if (data.toolName) {
    const target = findMCPPosition(data.toolName);
    if (target) {
      agent.targetX = target.x;
      agent.targetY = target.y;
    }
  }

  updateAgentCountUI();
  updateAgentListUI();
}

export function spawnSubAgent(id, type) {
  const mainAgent = world.agents.get('main');
  const offsetX = (Math.random() - 0.5) * 128;
  const offsetY = (Math.random() - 0.5) * 128;

  world.agents.set(id, {
    x: (mainAgent ? mainAgent.x : 400) + offsetX,
    y: (mainAgent ? mainAgent.y : 300) + offsetY,
    targetX: (mainAgent ? mainAgent.x : 400) + offsetX,
    targetY: (mainAgent ? mainAgent.y : 300) + offsetY,
    state: 'thinking',
    toolName: null,
    type: type || 'sub',
    lastUpdate: Date.now()
  });

  updateAgentCountUI();
  updateAgentListUI();
}

function removeSubAgent(id) {
  if (id && id !== 'main') {
    world.agents.delete(id);
    updateAgentCountUI();
    updateAgentListUI();
  }
}

export function activateMCP(toolName) {
  if (!toolName) return;

  const serverId = mapToolToServer(toolName);
  if (!serverId) return;

  const state = world.mcpStates.get(serverId);
  if (state) {
    state.active = true;
    state.lastTool = toolName;
    state.useCount++;
    state.lastUpdate = Date.now();

    // Spawn sparks at MCP building on activation
    const mcpServer = MCP_SERVERS.find(function(s) { return s.id === serverId; });
    if (mcpServer) {
      const sparkX = mcpServer.col * world.gridSize + 16;
      const sparkY = mcpServer.row * world.gridSize + 16;
      // Convert category color to particle format (0xRRGGBBAA)
      const catColor = CATEGORY_COLORS[mcpServer.category] || 0x00FF88;
      const sparkColor = catColor * 256 + 0xFF;
      spawnSpark(sparkX, sparkY, sparkColor, 5);
    }

    // Auto-deactivate after 5 seconds
    setTimeout(function() {
      state.active = false;
    }, 5000);
  }
}

export function mapToolToServer(toolName) {
  if (!toolName) return null;
  const lower = toolName.toLowerCase();

  // Direct tool name mappings
  const mappings = {
    'read': 'desktop-commander',
    'write': 'desktop-commander',
    'edit': 'desktop-commander',
    'glob': 'desktop-commander',
    'grep': 'desktop-commander',
    'bash': 'desktop-commander',
    'agent': null,
    'read_file': 'desktop-commander',
    'write_file': 'desktop-commander',
    'edit_block': 'desktop-commander',
    'list_directory': 'desktop-commander',
    'search_code': 'desktop-commander',
    'search_files': 'desktop-commander',
    'edit_file_lines': 'edit-file-lines',
    'get_file_lines': 'edit-file-lines',
    'search_file': 'edit-file-lines'
  };

  if (mappings[lower] !== undefined) return mappings[lower];

  // MCP prefix matching: mcp__servername__toolname
  if (lower.startsWith('mcp__')) {
    const parts = lower.split('__');
    if (parts.length >= 2) {
      const serverPart = parts[1];
      for (const mcp of MCP_SERVERS) {
        if (mcp.id === serverPart || mcp.id.includes(serverPart) || serverPart.includes(mcp.id.replace('-mcp', ''))) {
          return mcp.id;
        }
      }
    }
  }

  return null;
}

export function findMCPPosition(toolName) {
  const serverId = mapToolToServer(toolName);
  if (!serverId) return null;

  const mcp = MCP_SERVERS.find(function(m) { return m.id === serverId; });
  if (!mcp) return null;

  return {
    x: mcp.col * world.gridSize,
    y: mcp.row * world.gridSize
  };
}

// ========== UI UPDATES ==========

function updateAgentCountUI() {
  const el = document.getElementById('agent-count');
  if (el) el.textContent = world.agents.size;
}

function updateEventCountUI() {
  const el = document.getElementById('event-count');
  if (el) el.textContent = world.session.eventCount;
}

function updateSessionTimeUI() {
  const el = document.getElementById('session-time');
  if (!el) return;

  const elapsed = Date.now() - world.session.startTime;
  const hours = Math.floor(elapsed / 3600000);
  const mins = Math.floor((elapsed % 3600000) / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);

  el.textContent =
    String(hours).padStart(2, '0') + ':' +
    String(mins).padStart(2, '0') + ':' +
    String(secs).padStart(2, '0');
}

function updateAgentListUI() {
  const container = document.getElementById('agent-list');
  if (!container) return;

  let html = '';
  world.agents.forEach(function(agent, id) {
    const stateClass = 'state-' + (agent.state || 'idle');
    const label = id === 'main' ? 'Claude Main' : id;
    const tool = agent.toolName ? agent.toolName : '-';

    html += '<div class="agent-card">' +
      '<span class="name">' + escapeHtml(label) + '</span>' +
      '<span class="state ' + stateClass + '">' + (agent.state || 'idle') + '</span>' +
      '<div class="tool">Tool: ' + escapeHtml(tool) + '</div>' +
      '</div>';
  });

  container.innerHTML = html;
}

export function addEvent(type, text) {
  const now = new Date();
  const timeStr = String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0');

  world.events.unshift({ type: type, text: text, time: timeStr });
  if (world.events.length > world.maxEvents) {
    world.events.pop();
  }

  updateEventLogUI();
}

function updateEventLogUI() {
  const container = document.getElementById('event-log');
  if (!container) return;

  let html = '';
  for (let i = 0; i < Math.min(world.events.length, 20); i++) {
    const evt = world.events[i];
    html += '<div class="event-item">' +
      '<span class="time">' + evt.time + '</span> ' +
      '<span class="type">[' + evt.type + ']</span> ' +
      escapeHtml(evt.text) +
      '</div>';
  }

  container.innerHTML = html;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ========== WORLD UPDATE (per-frame) ==========

export function updateWorld(canvasW, canvasH) {
  world.frameCount++;
  world.blinkPhase = Math.floor(world.frameCount / 30) % 2 === 0;

  // Update session timer every 60 frames (~1s)
  if (world.frameCount % 60 === 0) {
    updateSessionTimeUI();
  }

  // Update particle system
  updateParticles(canvasW, canvasH, world.frameCount);

  // Smooth agent movement (lerp)
  world.agents.forEach(function(agent) {
    const dx = agent.targetX - agent.x;
    const dy = agent.targetY - agent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 2) {
      agent.x += dx * 0.08;
      agent.y += dy * 0.08;

      // Spawn trail particles during movement
      if (world.frameCount % 3 === 0) {
        const trailColor = getStateParticleColor(agent.state);
        spawnTrailParticle(agent.x + 16, agent.y + 16, trailColor);
      }
    }

    // Auto-idle after 30s inactivity
    if (Date.now() - agent.lastUpdate > 30000 && agent.state !== 'idle') {
      agent.state = 'idle';
      agent.toolName = null;
    }
  });
}
