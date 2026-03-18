/**
 * Factory Floor View - NEXUS v3.0 Full System Visualization
 *
 * Pixel art canvas rendering ALL NEXUS subsystems:
 * - Agent Workstations (4 AI providers with desks/monitors)
 * - Task Pipeline (conveyor belt with moving task items)
 * - MCP Gateway L7 (server rack, 10 categories, 39 servers)
 * - A2A Hub (agent-to-agent communication lines)
 * - RAG Pipeline L5 (document indexing, Qdrant vectors)
 * - Agent Framework L3 (LangGraph-style node graph + Deep Agent)
 * - Evolution Lab (Bayesian weights, pattern learning)
 * - Observability L6 (cost meters, quality gauge, task stats)
 *
 * @module nexus/monitor/views/factory-floor
 */

'use strict';

(function () {
  const canvas = document.getElementById('factory-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const PIXEL = 4;
  const SPRITE_SIZE = 16;
  const AGENT_W = SPRITE_SIZE * PIXEL; // 64
  const AGENT_H = SPRITE_SIZE * PIXEL; // 64

  // ========== STATE ==========

  const AGENT_IDS = ['claude-code', 'gemini-cli', 'codex-cli', 'ollama-cpu'];
  const agents = {};

  AGENT_IDS.forEach(id => {
    agents[id] = {
      id: id,
      state: 'idle',   // idle | working | thinking
      task: null,
      tasksCompleted: 0
    };
  });

  // Zone layout (canvas 1300x760)
  const Z = {
    workstations:   { x: 20,  y: 60,  w: 340, h: 330, label: 'WORKSTATIONS' },
    a2aHub:         { x: 380, y: 36,  w: 220, h: 126, label: 'A2A HUB' },
    conveyor:       { x: 380, y: 178, w: 560, h: 56,  label: 'TASK PIPELINE' },
    mcpGateway:     { x: 960, y: 30,  w: 320, h: 260, label: 'MCP GATEWAY [L7]' },
    ragPipeline:    { x: 20,  y: 420, w: 340, h: 320, label: 'RAG PIPELINE [L5]' },
    agentFramework: { x: 380, y: 400, w: 350, h: 340, label: 'AGENT FRAMEWORK [L3]' },
    evolutionLab:   { x: 750, y: 400, w: 200, h: 340, label: 'EVOLUTION LAB' },
    observability:  { x: 970, y: 310, w: 310, h: 430, label: 'OBSERVABILITY [L6]' }
  };

  // Agent workstation positions within zone
  const deskPos = {
    'claude-code': { x: 48,  y: 100 },
    'gemini-cli':  { x: 208, y: 100 },
    'codex-cli':   { x: 48,  y: 260 },
    'ollama-cpu':  { x: 208, y: 260 }
  };

  // --- Conveyor state ---
  const conveyorItems = [];

  // --- MCP Gateway state ---
  const mcpCats = [
    { name: 'File/Code',  count: 6, color: '#3fb950', active: false },
    { name: 'Web Crawl',  count: 6, color: '#58a6ff', active: false },
    { name: 'Research',   count: 4, color: '#d29922', active: false },
    { name: 'AI/LLM',     count: 5, color: '#bc8cff', active: false },
    { name: 'Database',   count: 2, color: '#f0883e', active: false },
    { name: 'Memory',     count: 2, color: '#39d353', active: false },
    { name: 'Task Mgmt',  count: 3, color: '#58a6ff', active: false },
    { name: 'Media',      count: 5, color: '#f85149', active: false },
    { name: 'Automation', count: 3, color: '#d29922', active: false },
    { name: 'Other',      count: 2, color: '#8b949e', active: false }
  ];
  let mcpActiveRoutes = 0;

  // --- RAG state ---
  const rag = { documents: 0, vectors: 0, indexing: false, queries: 0, lastQuery: '' };

  // --- Graph / Agent Framework state ---
  const graph = { activeNode: null, executing: false };

  // --- Evolution state ---
  const evo = {
    weights: { 'claude-code': 0.45, 'gemini-cli': 0.25, 'codex-cli': 0.15, 'ollama-cpu': 0.15 },
    learningRate: 0.05,
    patterns: 0,
    generations: 0,
    adjusting: false
  };

  // --- Observability state ---
  const obs = {
    costDay: 0, costWeek: 0, costMonth: 0,
    budgetDay: 5, budgetWeek: 25, budgetMonth: 80,
    quality: 0.85,
    tasksOK: 0, tasksFail: 0,
    avgMs: 0
  };

  // ========== DRAWING HELPERS ==========

  function drawZone(z) {
    ctx.fillStyle = 'rgba(22,27,34,0.7)';
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(z.x + 0.5, z.y + 0.5, z.w - 1, z.h - 1);
    ctx.setLineDash([]);
    ctx.fillStyle = '#484f58';
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(z.label, z.x + 6, z.y + 12);
  }

  function drawSprite(agentId, x, y, bobY) {
    var sprites = window.AGENT_SPRITES;
    if (!sprites || !sprites[agentId]) return;
    var s = sprites[agentId];
    var g = s.grid;
    for (var r = 0; r < SPRITE_SIZE; r++) {
      for (var c = 0; c < SPRITE_SIZE; c++) {
        var cell = g[r][c];
        if (cell === 0) continue;
        ctx.fillStyle = cell === 1 ? s.color : s.accent;
        ctx.fillRect(x + c * PIXEL, y + r * PIXEL + (bobY || 0), PIXEL, PIXEL);
      }
    }
  }

  // ========== ZONE RENDERERS ==========

  // 1. WORKSTATIONS - 4 agents at pixel desks with monitors
  function renderWorkstations() {
    drawZone(Z.workstations);

    AGENT_IDS.forEach(function (id) {
      var a = agents[id];
      var dp = deskPos[id];
      if (!dp) return;
      var sp = window.AGENT_SPRITES && window.AGENT_SPRITES[id];
      if (!sp) return;

      // Desk surface
      ctx.fillStyle = '#30363d';
      ctx.fillRect(dp.x - 6, dp.y + AGENT_H - 6, AGENT_W + 12, 8);
      // Desk legs
      ctx.fillStyle = '#21262d';
      ctx.fillRect(dp.x, dp.y + AGENT_H + 2, 4, 16);
      ctx.fillRect(dp.x + AGENT_W - 4, dp.y + AGENT_H + 2, 4, 16);

      // Monitor on desk
      var screenColor = a.state === 'working' ? '#1a4b2e'
                      : a.state === 'thinking' ? '#2a2a1a' : '#1a1a2a';
      ctx.fillStyle = screenColor;
      ctx.fillRect(dp.x + 14, dp.y + AGENT_H - 28, 36, 22);
      ctx.fillStyle = '#30363d';
      ctx.fillRect(dp.x + 28, dp.y + AGENT_H - 6, 8, 6);

      // Screen glow
      if (a.state === 'working') {
        ctx.fillStyle = '#3fb950';
        ctx.globalAlpha = 0.12 + Math.sin(Date.now() / 300) * 0.08;
        ctx.fillRect(dp.x + 16, dp.y + AGENT_H - 26, 32, 18);
        ctx.globalAlpha = 1;
        // Scan lines
        ctx.fillStyle = '#3fb950';
        ctx.globalAlpha = 0.15;
        for (var sl = 0; sl < 9; sl++) {
          ctx.fillRect(dp.x + 16, dp.y + AGENT_H - 26 + sl * 2, 32, 1);
        }
        ctx.globalAlpha = 1;
      }

      // Bob
      var bobY = 0;
      if (a.state === 'working') bobY = Math.sin(Date.now() / 200) * 3;
      else if (a.state === 'thinking') bobY = Math.sin(Date.now() / 500) * 2;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(dp.x + AGENT_W / 2, dp.y + AGENT_H, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sprite
      drawSprite(id, dp.x, dp.y, bobY);

      // Name + state
      ctx.fillStyle = sp.accent;
      ctx.font = '10px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sp.name, dp.x + AGENT_W / 2, dp.y + AGENT_H + 28);

      ctx.fillStyle = a.state === 'working' ? '#3fb950'
                    : a.state === 'thinking' ? '#d29922' : '#484f58';
      ctx.font = '8px Consolas, monospace';
      ctx.fillText(a.state.toUpperCase(), dp.x + AGENT_W / 2, dp.y + AGENT_H + 38);

      // Completed count
      ctx.fillStyle = '#484f58';
      ctx.fillText('x' + a.tasksCompleted, dp.x + AGENT_W / 2, dp.y + AGENT_H + 48);

      // Working spinner
      if (a.state === 'working') {
        var angle = Date.now() / 300;
        for (var i = 0; i < 3; i++) {
          var ra = angle + (i * Math.PI * 2 / 3);
          ctx.fillStyle = sp.accent;
          ctx.beginPath();
          ctx.arc(dp.x + AGENT_W / 2 + Math.cos(ra) * 10,
                  dp.y - 8 + Math.sin(ra) * 10, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Thinking dots
      if (a.state === 'thinking') {
        var dots = Math.floor((Date.now() / 500) % 4);
        ctx.fillStyle = '#d29922';
        ctx.font = '12px Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('.'.repeat(dots), dp.x + AGENT_W + 4, dp.y + AGENT_H / 2);
      }
      // Task label
      if (a.task && a.state === 'working') {
        ctx.fillStyle = '#6e7681';
        ctx.font = '7px Consolas, monospace';
        ctx.textAlign = 'center';
        var tl = a.task.length > 16 ? a.task.slice(0, 16) + '..' : a.task;
        ctx.fillText(tl, dp.x + AGENT_W / 2, dp.y - 14);
      }
    });
  }

  // 2. CONVEYOR BELT - animated task items
  function renderConveyor() {
    var z = Z.conveyor;

    // Belt track
    ctx.fillStyle = '#1a1e24';
    ctx.fillRect(z.x, z.y + 16, z.w, 24);

    // Belt teeth animation
    var off = (Date.now() / 40) % 16;
    ctx.fillStyle = '#30363d';
    for (var t = 0; t < z.w; t += 16) {
      ctx.fillRect(z.x + ((t + off) % z.w), z.y + 18, 8, 2);
      ctx.fillRect(z.x + ((t + off) % z.w), z.y + 36, 8, 2);
    }

    // Rollers at ends
    ctx.fillStyle = '#484f58';
    ctx.beginPath(); ctx.arc(z.x + 8, z.y + 28, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(z.x + z.w - 8, z.y + 28, 8, 0, Math.PI * 2); ctx.fill();

    // Label
    ctx.fillStyle = '#484f58';
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('>>> TASK PIPELINE >>>', z.x + z.w / 2, z.y + 12);

    // Items
    for (var i = conveyorItems.length - 1; i >= 0; i--) {
      var item = conveyorItems[i];
      // Package
      ctx.fillStyle = item.color;
      ctx.fillRect(item.x, z.y + 6, 20, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(item.x + 2, z.y + 8, 16, 8);
      // Label
      ctx.fillStyle = '#c9d1d9';
      ctx.font = '6px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, item.x + 10, z.y + 46);

      // Move
      item.x += 0.4;
      if (item.x > z.x + z.w + 20) conveyorItems.splice(i, 1);
    }
  }

  // 3. MCP GATEWAY - server rack with LEDs
  function renderMCPGateway() {
    drawZone(Z.mcpGateway);
    var z = Z.mcpGateway;

    // Rack frame
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(z.x + 10, z.y + 20, z.w - 20, z.h - 30);
    ctx.strokeStyle = '#484f58';
    ctx.lineWidth = 1;
    ctx.strokeRect(z.x + 10, z.y + 20, z.w - 20, z.h - 30);

    // Rack title
    ctx.fillStyle = '#58a6ff';
    ctx.font = '8px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('39 MCP Servers', z.x + z.w / 2, z.y + 32);

    // Category slots
    mcpCats.forEach(function (cat, i) {
      var sx = z.x + 18;
      var sy = z.y + 40 + i * 21;
      var sw = z.w - 36;

      // Slot background
      ctx.fillStyle = '#161b22';
      ctx.fillRect(sx, sy, sw, 17);

      // LED
      ctx.fillStyle = cat.active ? cat.color : '#21262d';
      ctx.beginPath();
      ctx.arc(sx + 8, sy + 9, 3, 0, Math.PI * 2);
      ctx.fill();
      // LED glow
      if (cat.active) {
        ctx.fillStyle = cat.color;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(sx + 8, sy + 9, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Label + count
      ctx.fillStyle = cat.active ? '#c9d1d9' : '#484f58';
      ctx.font = '8px Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(cat.name, sx + 18, sy + 12);
      ctx.textAlign = 'right';
      ctx.fillText(cat.count + '', sx + sw - 4, sy + 12);
    });

    // Active counter
    ctx.fillStyle = '#8b949e';
    ctx.font = '8px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(mcpActiveRoutes + ' routes', z.x + z.w - 14, z.y + z.h - 8);
  }

  // 4. A2A HUB - agent communication topology
  function renderA2AHub() {
    drawZone(Z.a2aHub);
    var z = Z.a2aHub;
    var cx = z.x + z.w / 2;
    var cy = z.y + z.h / 2 + 8;

    // Central hub
    ctx.fillStyle = '#1a2332';
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#58a6ff';
    ctx.font = '8px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('A2A', cx, cy + 3);

    // Nodes around hub
    var nodes = [
      { x: cx - 65, y: cy - 28, id: 'claude-code' },
      { x: cx + 65, y: cy - 28, id: 'gemini-cli' },
      { x: cx - 65, y: cy + 28, id: 'codex-cli' },
      { x: cx + 65, y: cy + 28, id: 'ollama-cpu' }
    ];

    nodes.forEach(function (n) {
      var sp = window.AGENT_SPRITES && window.AGENT_SPRITES[n.id];
      var col = sp ? sp.accent : '#8b949e';
      var active = agents[n.id] && agents[n.id].state === 'working';

      // Connection line
      ctx.strokeStyle = active ? col : '#30363d';
      ctx.lineWidth = active ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(n.x, n.y);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Pulse dot on active line
      if (active) {
        var t = (Date.now() % 800) / 800;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(n.x + (cx - n.x) * t, n.y + (cy - n.y) * t, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node dot
      ctx.fillStyle = active ? col : '#484f58';
      ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, Math.PI * 2); ctx.fill();

      // Short name
      ctx.fillStyle = '#8b949e';
      ctx.font = '7px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sp ? sp.name : n.id.split('-')[0], n.x, n.y + (n.y < cy ? -8 : 14));
    });
  }

  // 5. RAG PIPELINE - document flow -> chunk -> embed -> Qdrant
  function renderRAGPipeline() {
    drawZone(Z.ragPipeline);
    var z = Z.ragPipeline;

    // --- Document stack ---
    for (var d = 0; d < 3; d++) {
      ctx.fillStyle = d === 2 ? '#374151' : '#1f2937';
      ctx.fillRect(z.x + 20 + d * 2, z.y + 30 - d * 3, 48, 56);
    }
    // Text lines
    ctx.fillStyle = '#6b7280';
    for (var ln = 0; ln < 5; ln++) {
      ctx.fillRect(z.x + 28, z.y + 32 + ln * 9, 32, 2);
    }
    ctx.fillStyle = '#8b949e';
    ctx.font = '8px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DOCS', z.x + 48, z.y + 96);

    // --- Arrow ---
    ctx.strokeStyle = rag.indexing ? '#3fb950' : '#30363d';
    ctx.lineWidth = 1;
    ctx.setLineDash(rag.indexing ? [] : [3, 3]);
    drawArrow(z.x + 76, z.y + 55, z.x + 110, z.y + 55);
    ctx.setLineDash([]);

    // --- Chunker/Embedder box ---
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(z.x + 110, z.y + 32, 65, 46);
    ctx.strokeStyle = '#30363d';
    ctx.strokeRect(z.x + 110, z.y + 32, 65, 46);
    ctx.fillStyle = '#58a6ff';
    ctx.font = '8px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CHUNK', z.x + 142, z.y + 50);
    ctx.fillText('EMBED', z.x + 142, z.y + 66);

    // --- Arrow ---
    ctx.strokeStyle = rag.indexing ? '#3fb950' : '#30363d';
    ctx.setLineDash(rag.indexing ? [] : [3, 3]);
    drawArrow(z.x + 180, z.y + 55, z.x + 214, z.y + 55);
    ctx.setLineDash([]);

    // --- Qdrant vector DB ---
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(z.x + 214, z.y + 26, 90, 60);
    ctx.strokeStyle = '#bc8cff';
    ctx.lineWidth = 1;
    ctx.strokeRect(z.x + 214, z.y + 26, 90, 60);

    // Vector dots
    ctx.fillStyle = '#bc8cff';
    for (var vi = 0; vi < 15; vi++) {
      var vx = z.x + 224 + (vi % 5) * 14;
      var vy = z.y + 36 + Math.floor(vi / 5) * 14;
      ctx.globalAlpha = 0.2 + ((Math.sin(Date.now() / 400 + vi) + 1) / 2) * 0.6;
      ctx.beginPath(); ctx.arc(vx, vy, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#bc8cff';
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Qdrant VectorDB', z.x + 259, z.y + 100);

    // --- Stats ---
    ctx.fillStyle = '#8b949e';
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Docs: ' + rag.documents, z.x + 20, z.y + 130);
    ctx.fillText('Vectors: ' + rag.vectors, z.x + 20, z.y + 146);
    ctx.fillText('Queries: ' + rag.queries, z.x + 20, z.y + 162);
    if (rag.indexing) {
      ctx.fillStyle = '#3fb950';
      ctx.fillText('[INDEXING]', z.x + 150, z.y + 130);
    }

    // --- Retrieval section ---
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(z.x + 20, z.y + 185, z.w - 40, 50);
    ctx.strokeStyle = '#30363d';
    ctx.strokeRect(z.x + 20, z.y + 185, z.w - 40, 50);
    ctx.fillStyle = '#d29922';
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RETRIEVAL ENGINE', z.x + z.w / 2, z.y + 204);
    if (rag.lastQuery) {
      ctx.fillStyle = '#6e7681';
      ctx.font = '7px Consolas, monospace';
      var qq = rag.lastQuery.length > 30 ? rag.lastQuery.slice(0, 30) + '..' : rag.lastQuery;
      ctx.fillText('"' + qq + '"', z.x + z.w / 2, z.y + 222);
    }

    // --- Pipeline flow arrow (decorative) ---
    ctx.fillStyle = '#30363d';
    ctx.font = '7px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Ingest -> Chunk -> Embed -> Store -> Retrieve', z.x + z.w / 2, z.y + z.h - 10);
  }

  // 6. AGENT FRAMEWORK - graph nodes + Deep Agent
  function renderAgentFramework() {
    drawZone(Z.agentFramework);
    var z = Z.agentFramework;

    // Graph node definitions (LangGraph style)
    var gNodes = [
      { id: 'start',    label: 'START',    x: z.x + 30,       y: z.y + 60,  color: '#3fb950' },
      { id: 'analyze',  label: 'Analyze',  x: z.x + 100,      y: z.y + 40,  color: '#58a6ff' },
      { id: 'plan',     label: 'Plan',     x: z.x + 100,      y: z.y + 85,  color: '#d29922' },
      { id: 'execute',  label: 'Execute',  x: z.x + 200,      y: z.y + 60,  color: '#f0883e' },
      { id: 'validate', label: 'Validate', x: z.x + 280,      y: z.y + 60,  color: '#bc8cff' },
      { id: 'end',      label: 'END',      x: z.x + z.w - 30, y: z.y + 60,  color: '#3fb950' }
    ];

    var gEdges = [
      ['start', 'analyze'], ['start', 'plan'],
      ['analyze', 'execute'], ['plan', 'execute'],
      ['execute', 'validate'], ['validate', 'end']
    ];

    // Edges
    gEdges.forEach(function (e) {
      var f = gNodes.find(function (n) { return n.id === e[0]; });
      var t = gNodes.find(function (n) { return n.id === e[1]; });
      if (!f || !t) return;
      var active = graph.activeNode === f.id || graph.activeNode === t.id;
      ctx.strokeStyle = active ? '#58a6ff' : '#30363d';
      ctx.lineWidth = active ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(t.x, t.y); ctx.stroke();
      // Arrow tip
      drawArrowTip(f.x, f.y, t.x, t.y, active ? '#58a6ff' : '#30363d');
    });

    // Nodes
    gNodes.forEach(function (n) {
      var active = graph.activeNode === n.id;
      ctx.fillStyle = active ? n.color : '#21262d';
      ctx.beginPath(); ctx.arc(n.x, n.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = n.color;
      ctx.lineWidth = active ? 2 : 1;
      ctx.stroke();
      if (active) {
        ctx.strokeStyle = n.color;
        ctx.globalAlpha = 0.25 + Math.sin(Date.now() / 200) * 0.15;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(n.x, n.y, 17, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = active ? '#fff' : '#8b949e';
      ctx.font = '7px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y + 22);
    });

    // Status
    ctx.fillStyle = graph.executing ? '#3fb950' : '#484f58';
    ctx.font = '8px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(graph.executing ? 'RUNNING' : 'STANDBY', z.x + z.w - 12, z.y + 30);

    // --- Deep Agent section ---
    var daY = z.y + 130;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(z.x + 16, daY, z.w - 32, 190);
    ctx.strokeStyle = '#f0883e';
    ctx.lineWidth = 1;
    ctx.strokeRect(z.x + 16, daY, z.w - 32, 190);

    ctx.fillStyle = '#f0883e';
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DEEP AGENT', z.x + 26, daY + 18);

    // Deep agent pipeline boxes
    var daParts = [
      { label: 'Planner',       desc: 'Task decomposition',   color: '#d29922' },
      { label: 'Context-FS',    desc: 'File system context',   color: '#58a6ff' },
      { label: 'SubAgent Mgr',  desc: 'Spawn & coordinate',   color: '#3fb950' }
    ];

    daParts.forEach(function (p, i) {
      var bx = z.x + 28;
      var by = daY + 32 + i * 50;
      var bw = z.w - 58;

      ctx.fillStyle = '#161b22';
      ctx.fillRect(bx, by, bw, 38);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, 38);

      ctx.fillStyle = p.color;
      ctx.font = '9px Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p.label, bx + 8, by + 14);
      ctx.fillStyle = '#6e7681';
      ctx.font = '7px Consolas, monospace';
      ctx.fillText(p.desc, bx + 8, by + 28);

      // Connect arrows between parts
      if (i < daParts.length - 1) {
        ctx.strokeStyle = '#30363d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx + bw / 2, by + 38);
        ctx.lineTo(bx + bw / 2, by + 50);
        ctx.stroke();
        // Arrow
        ctx.fillStyle = '#30363d';
        ctx.beginPath();
        ctx.moveTo(bx + bw / 2, by + 50);
        ctx.lineTo(bx + bw / 2 - 3, by + 46);
        ctx.lineTo(bx + bw / 2 + 3, by + 46);
        ctx.fill();
      }
    });
  }

  // 7. EVOLUTION LAB - weights, learning, Bayesian
  function renderEvolutionLab() {
    drawZone(Z.evolutionLab);
    var z = Z.evolutionLab;

    // Rotating gear (decorative)
    var gx = z.x + z.w - 28;
    var gy = z.y + 28;
    ctx.strokeStyle = '#d29922';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(gx, gy, 8, 0, Math.PI * 2); ctx.stroke();
    var ga = Date.now() / 1500;
    for (var gi = 0; gi < 6; gi++) {
      var ta = ga + gi * Math.PI / 3;
      ctx.fillStyle = '#d29922';
      ctx.fillRect(gx + Math.cos(ta) * 9 - 2, gy + Math.sin(ta) * 9 - 2, 4, 4);
    }

    // Provider weight bars
    ctx.fillStyle = '#c9d1d9';
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Weights', z.x + 10, z.y + 30);

    AGENT_IDS.forEach(function (id, i) {
      var sp = window.AGENT_SPRITES && window.AGENT_SPRITES[id];
      var w = evo.weights[id] || 0;
      var bx = z.x + 10;
      var by = z.y + 46 + i * 32;
      var bw = z.w - 20;

      // Bar bg
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(bx, by, bw, 12);
      // Bar fill
      ctx.fillStyle = sp ? sp.color : '#484f58';
      ctx.fillRect(bx, by, bw * w, 12);

      // Label
      ctx.fillStyle = '#8b949e';
      ctx.font = '7px Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(sp ? sp.name : id, bx, by + 22);
      ctx.textAlign = 'right';
      ctx.fillText((w * 100).toFixed(0) + '%', bx + bw, by + 22);
    });

    // Stats
    var sy = z.y + 195;
    ctx.fillStyle = '#8b949e';
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LR: ' + evo.learningRate, z.x + 10, sy);
    ctx.fillText('Patterns: ' + evo.patterns, z.x + 10, sy + 18);
    ctx.fillText('Gen: ' + evo.generations, z.x + 10, sy + 36);

    if (evo.adjusting) {
      ctx.fillStyle = '#d29922';
      ctx.fillText('[EVOLVING]', z.x + 10, sy + 54);
    }

    // Decorative formula
    ctx.fillStyle = '#30363d';
    ctx.font = '7px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P(w|d) ~ P(d|w)*P(w)', z.x + z.w / 2, z.y + z.h - 14);
    ctx.fillText('decay=' + (0.95).toFixed(2), z.x + z.w / 2, z.y + z.h - 4);
  }

  // 8. OBSERVABILITY - cost, quality, task stats
  function renderObservability() {
    drawZone(Z.observability);
    var z = Z.observability;

    // Live indicator
    var blinkOn = Math.floor(Date.now() / 800) % 2 === 0;
    ctx.fillStyle = blinkOn ? '#3fb950' : '#21262d';
    ctx.beginPath(); ctx.arc(z.x + z.w - 14, z.y + 14, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#484f58';
    ctx.font = '7px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('LIVE', z.x + z.w - 22, z.y + 17);

    // --- COST TRACKING ---
    ctx.fillStyle = '#c9d1d9';
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Cost Tracking', z.x + 10, z.y + 30);

    var meters = [
      { label: 'Day',   val: obs.costDay,   max: obs.budgetDay },
      { label: 'Week',  val: obs.costWeek,  max: obs.budgetWeek },
      { label: 'Month', val: obs.costMonth, max: obs.budgetMonth }
    ];

    meters.forEach(function (m, i) {
      var mx = z.x + 10;
      var my = z.y + 46 + i * 44;
      var mw = z.w - 20;
      var ratio = Math.min(m.val / m.max, 1);

      ctx.fillStyle = '#8b949e';
      ctx.font = '8px Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(m.label + ': $' + m.val.toFixed(2) + ' / $' + m.max, mx, my);

      // Bar
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(mx, my + 5, mw, 12);
      ctx.fillStyle = ratio > 0.8 ? '#f85149' : ratio > 0.5 ? '#d29922' : '#3fb950';
      ctx.fillRect(mx, my + 5, mw * ratio, 12);

      // Percentage
      ctx.fillStyle = '#c9d1d9';
      ctx.font = '7px Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText((ratio * 100).toFixed(0) + '%', mx + mw, my + 30);
    });

    // --- QUALITY SCORE ---
    var qy = z.y + 190;
    ctx.fillStyle = '#c9d1d9';
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Quality Score', z.x + 10, qy);

    var qw = z.w - 20;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(z.x + 10, qy + 8, qw, 18);
    ctx.fillStyle = obs.quality > 0.7 ? '#3fb950' : obs.quality > 0.4 ? '#d29922' : '#f85149';
    ctx.fillRect(z.x + 10, qy + 8, qw * obs.quality, 18);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText((obs.quality * 100).toFixed(0) + '%', z.x + z.w / 2, qy + 22);

    // --- TASK STATS ---
    var ts = qy + 42;
    ctx.fillStyle = '#8b949e';
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Completed: ' + obs.tasksOK, z.x + 10, ts);
    ctx.fillStyle = obs.tasksFail > 0 ? '#f85149' : '#8b949e';
    ctx.fillText('Failed: ' + obs.tasksFail, z.x + 10, ts + 18);
    ctx.fillStyle = '#8b949e';
    ctx.fillText('Avg Latency: ' + obs.avgMs + 'ms', z.x + 10, ts + 36);

    // --- MINI TASK CHART (last 10 bar chart) ---
    var cy = ts + 56;
    ctx.fillStyle = '#c9d1d9';
    ctx.font = '8px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Throughput', z.x + 10, cy);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(z.x + 10, cy + 6, qw, 40);
    // Placeholder bars
    for (var bi = 0; bi < 10; bi++) {
      var bh = 5 + Math.random() * 30;
      ctx.fillStyle = '#3fb950';
      ctx.globalAlpha = 0.4;
      ctx.fillRect(z.x + 14 + bi * (qw / 10 - 1), cy + 46 - bh, (qw / 10) - 4, bh);
    }
    ctx.globalAlpha = 1;
  }

  // ========== ARROW HELPERS ==========

  function drawArrow(x1, y1, x2, y2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    drawArrowTip(x1, y1, x2, y2, ctx.strokeStyle);
  }

  function drawArrowTip(x1, y1, x2, y2, color) {
    var a = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.4) * 6, y2 - Math.sin(a - 0.4) * 6);
    ctx.lineTo(x2 - Math.cos(a + 0.4) * 6, y2 - Math.sin(a + 0.4) * 6);
    ctx.fill();
  }

  // ========== PIPES (zone connections) ==========

  function drawPipes() {
    ctx.strokeStyle = '#1a2332';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    // Workstations -> Conveyor
    ctx.beginPath();
    ctx.moveTo(Z.workstations.x + Z.workstations.w, 206);
    ctx.lineTo(Z.conveyor.x, 206);
    ctx.stroke();

    // Conveyor -> MCP Gateway
    ctx.beginPath();
    ctx.moveTo(Z.conveyor.x + Z.conveyor.w, 206);
    ctx.lineTo(Z.mcpGateway.x, 206);
    ctx.stroke();

    // Workstations -> RAG Pipeline
    ctx.beginPath();
    ctx.moveTo(Z.workstations.x + Z.workstations.w / 2,
               Z.workstations.y + Z.workstations.h);
    ctx.lineTo(Z.ragPipeline.x + Z.ragPipeline.w / 2,
               Z.ragPipeline.y);
    ctx.stroke();

    // A2A Hub -> Agent Framework
    ctx.beginPath();
    ctx.moveTo(Z.a2aHub.x + Z.a2aHub.w / 2,
               Z.a2aHub.y + Z.a2aHub.h);
    ctx.lineTo(Z.agentFramework.x + Z.agentFramework.w / 2,
               Z.agentFramework.y);
    ctx.stroke();

    // Agent Framework -> Evolution Lab
    ctx.beginPath();
    ctx.moveTo(Z.agentFramework.x + Z.agentFramework.w,
               Z.agentFramework.y + 80);
    ctx.lineTo(Z.evolutionLab.x,
               Z.evolutionLab.y + 80);
    ctx.stroke();

    // Evolution Lab -> Observability
    ctx.beginPath();
    ctx.moveTo(Z.evolutionLab.x + Z.evolutionLab.w,
               Z.evolutionLab.y + 80);
    ctx.lineTo(Z.observability.x,
               Z.observability.y + 80);
    ctx.stroke();

    // MCP Gateway -> Observability
    ctx.beginPath();
    ctx.moveTo(Z.mcpGateway.x + Z.mcpGateway.w / 2,
               Z.mcpGateway.y + Z.mcpGateway.h);
    ctx.lineTo(Z.observability.x + Z.observability.w / 2,
               Z.observability.y);
    ctx.stroke();
  }

  // ========== MAIN RENDER LOOP ==========

  function drawBackground() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Floor grid dots
    ctx.fillStyle = '#161b22';
    for (var gx = 0; gx < canvas.width; gx += 20) {
      for (var gy = 0; gy < canvas.height; gy += 20) {
        ctx.fillRect(gx, gy, 1, 1);
      }
    }

    // Title
    ctx.fillStyle = '#39d353';
    ctx.font = '14px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('NEXUS Factory Floor', 16, 24);
    ctx.fillStyle = '#484f58';
    ctx.font = '10px Consolas, monospace';
    ctx.fillText('v3.0', 190, 24);

    // Global stats
    var working = AGENT_IDS.filter(function (id) { return agents[id].state === 'working'; }).length;
    var thinking = AGENT_IDS.filter(function (id) { return agents[id].state === 'thinking'; }).length;
    var idle = AGENT_IDS.filter(function (id) { return agents[id].state === 'idle'; }).length;
    ctx.fillStyle = '#8b949e';
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Working:' + working + '  Thinking:' + thinking + '  Idle:' + idle,
                 canvas.width - 16, 24);
  }

  function render() {
    drawBackground();
    drawPipes();
    renderWorkstations();
    renderConveyor();
    renderMCPGateway();
    renderA2AHub();
    renderRAGPipeline();
    renderAgentFramework();
    renderEvolutionLab();
    renderObservability();
    requestAnimationFrame(render);
  }

  // ========== SSE EVENT HANDLERS ==========

  var prevHandler = window.onNexusEvent;
  window.onNexusEvent = function (type, data) {
    if (prevHandler) prevHandler(type, data);

    // --- Task routing ---
    if (type === 'task:routed' && data.provider) {
      var agent = agents[data.provider];
      if (agent) {
        agent.state = 'working';
        agent.task = data.task || data.description || 'Processing...';
      }
      var sp = window.AGENT_SPRITES && window.AGENT_SPRITES[data.provider];
      conveyorItems.push({
        x: Z.conveyor.x,
        label: (data.task || 'task').slice(0, 6),
        color: sp ? sp.color : '#58a6ff'
      });
      // Activate random MCP category
      var ci = Math.floor(Math.random() * mcpCats.length);
      mcpCats[ci].active = true;
      setTimeout(function () { mcpCats[ci].active = false; }, 2000);
      mcpActiveRoutes = Math.min(mcpActiveRoutes + 1, 39);
    }

    if (type === 'task:completed' && data.provider) {
      var ac = agents[data.provider];
      if (ac) { ac.state = 'idle'; ac.task = null; ac.tasksCompleted++; }
      obs.tasksOK++;
    }

    if (type === 'task:failed' && data.provider) {
      var af = agents[data.provider];
      if (af) { af.state = 'idle'; af.task = null; }
      obs.tasksFail++;
    }

    if (type === 'provider:health') {
      var ap = agents[data.provider];
      if (ap && data.status === 'down') ap.state = 'idle';
    }

    // --- Team events ---
    if (type === 'team:started') {
      (data.members || []).forEach(function (m) {
        var at = agents[m];
        if (at) { at.state = 'working'; at.task = 'Team: ' + (data.goal || ''); }
      });
    }
    if (type === 'team:completed') {
      (data.members || []).forEach(function (m) {
        var at = agents[m];
        if (at) { at.state = 'idle'; at.task = null; }
      });
    }

    // --- Graph / Framework ---
    if (type === 'graph:node:start') {
      graph.activeNode = data.node || data.nodeId || 'execute';
      graph.executing = true;
      agents['claude-code'].state = 'thinking';
    }
    if (type === 'graph:node:end') {
      graph.activeNode = null;
      graph.executing = false;
      agents['claude-code'].state = 'idle';
    }
    if (type === 'graph:start') { graph.executing = true; }
    if (type === 'graph:end') { graph.executing = false; graph.activeNode = null; }

    // --- Evolution ---
    if (type === 'evolution:weight') {
      if (data.weights) Object.assign(evo.weights, data.weights);
      evo.adjusting = true;
      evo.generations++;
      setTimeout(function () { evo.adjusting = false; }, 3000);
    }
    if (type === 'evolution:pattern') { evo.patterns++; }

    // --- Deep Agent ---
    if (type === 'deep-agent:plan:created') {
      graph.executing = true;
      agents['claude-code'].state = 'thinking';
    }
    if (type === 'deep-agent:subtask:completed') { obs.tasksOK++; }

    // --- Subagent ---
    if (type === 'subagent:spawned') {
      var pid = data.provider || 'claude-code';
      var as = agents[pid];
      if (as) { as.state = 'working'; as.task = 'Sub: ' + (data.task || '').slice(0, 12); }
    }
    if (type === 'subagent:completed') {
      var pid2 = data.provider || 'claude-code';
      var as2 = agents[pid2];
      if (as2) { as2.state = 'idle'; as2.task = null; }
    }

    // --- Cost tracking ---
    if (data && typeof data.cost === 'number') {
      obs.costDay += data.cost;
      obs.costWeek += data.cost;
      obs.costMonth += data.cost;
    }
    if (data && typeof data.latency === 'number') {
      var total = obs.tasksOK || 1;
      obs.avgMs = Math.round((obs.avgMs * (total - 1) + data.latency) / total);
    }
    if (data && typeof data.quality === 'number') {
      obs.quality = data.quality;
    }
  };

  // Start render loop
  render();
})();
