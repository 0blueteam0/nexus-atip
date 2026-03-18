/**
 * Renderer - Canvas 2D Pixel Art Rendering Engine
 *
 * Draws the Command Center world: MCP buildings, agents, Docker containers,
 * grid, labels, overlays. Runs at ~60fps via requestAnimationFrame.
 */

/* global PALETTE, SPRITES, MCP_SERVERS, DOCKER_CONTAINERS, CATEGORY_COLORS,
          drawSprite, drawSpriteTinted, world, initWorld, updateWorld,
          getAnimFrame, tickAnimation */

// ========== CANVAS SETUP ==========

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Sidebar width to account for layout
const SIDEBAR_WIDTH = 280;
const HEADER_HEIGHT = 32;
const SPRITE_SCALE = 2;

// Selected entity for click interaction
let selectedEntity = null;

function resizeCanvas() {
  canvas.width = window.innerWidth - SIDEBAR_WIDTH;
  canvas.height = window.innerHeight - HEADER_HEIGHT;
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ========== GRID RENDERING ==========

function drawGrid() {
  const cols = world.gridCols;
  const rows = world.gridRows;
  const size = world.gridSize;

  ctx.strokeStyle = 'rgba(42, 42, 74, 0.3)';
  ctx.lineWidth = 1;

  for (let c = 0; c <= cols; c++) {
    const x = c * size + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rows * size);
    ctx.stroke();
  }

  for (let r = 0; r <= rows; r++) {
    const y = r * size + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cols * size, y);
    ctx.stroke();
  }
}

// ========== CATEGORY ZONE RENDERING ==========

function drawCategoryZones() {
  const size = world.gridSize;
  ctx.globalAlpha = 0.06;

  // File/Code zone (top-left)
  ctx.fillStyle = CATEGORY_COLORS.file;
  ctx.fillRect(1 * size, 1 * size, 6 * size, 4 * size);

  // Web/Crawling zone (top-right)
  ctx.fillStyle = CATEGORY_COLORS.web;
  ctx.fillRect(17 * size, 1 * size, 6 * size, 4 * size);

  // Research zone (mid-left)
  ctx.fillStyle = CATEGORY_COLORS.research;
  ctx.fillRect(1 * size, 7 * size, 6 * size, 4 * size);

  // AI/LLM zone (mid-right)
  ctx.fillStyle = CATEGORY_COLORS.ai;
  ctx.fillRect(17 * size, 7 * size, 6 * size, 4 * size);

  // Database zone (bottom-left)
  ctx.fillStyle = CATEGORY_COLORS.db;
  ctx.fillRect(1 * size, 13 * size, 6 * size, 4 * size);

  // Task/Mgmt zone (bottom-center)
  ctx.fillStyle = CATEGORY_COLORS.task;
  ctx.fillRect(9 * size, 13 * size, 6 * size, 4 * size);

  // Media zone (bottom-right)
  ctx.fillStyle = CATEGORY_COLORS.media;
  ctx.fillRect(17 * size, 13 * size, 6 * size, 4 * size);

  ctx.globalAlpha = 1.0;
}

function drawCategoryLabels() {
  ctx.font = '9px "Courier New", monospace';
  ctx.textAlign = 'left';
  const size = world.gridSize;

  const labels = [
    { text: '// FILE/CODE', color: CATEGORY_COLORS.file, x: 1.5, y: 1.3 },
    { text: '// WEB/CRAWL', color: CATEGORY_COLORS.web, x: 17.5, y: 1.3 },
    { text: '// RESEARCH', color: CATEGORY_COLORS.research, x: 1.5, y: 7.3 },
    { text: '// AI/LLM', color: CATEGORY_COLORS.ai, x: 17.5, y: 7.3 },
    { text: '// DATABASE', color: CATEGORY_COLORS.db, x: 1.5, y: 13.3 },
    { text: '// TASK/MGMT', color: CATEGORY_COLORS.task, x: 9.5, y: 13.3 },
    { text: '// MEDIA', color: CATEGORY_COLORS.media, x: 17.5, y: 13.3 }
  ];

  for (const lbl of labels) {
    ctx.fillStyle = lbl.color;
    ctx.globalAlpha = 0.5;
    ctx.fillText(lbl.text, lbl.x * size, lbl.y * size);
  }
  ctx.globalAlpha = 1.0;
}

// ========== MCP BUILDING RENDERING ==========

function drawMCPBuildings() {
  const size = world.gridSize;

  for (const mcp of MCP_SERVERS) {
    const state = world.mcpStates.get(mcp.id);
    const isActive = state && state.active;
    const sprite = isActive ? SPRITES.mcp.active : SPRITES.mcp.inactive;
    const px = mcp.col * size;
    const py = mcp.row * size;

    drawSprite(ctx, sprite, px, py, SPRITE_SCALE);

    // Glow effect when active
    if (isActive) {
      ctx.save();
      ctx.shadowColor = CATEGORY_COLORS[mcp.category] || '#00ff88';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(px, py, 16 * SPRITE_SCALE, 16 * SPRITE_SCALE);
      ctx.restore();
    }

    // Label below building
    ctx.font = '8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isActive
      ? (CATEGORY_COLORS[mcp.category] || '#00ff88')
      : '#444466';
    ctx.fillText(
      mcp.label,
      px + 8 * SPRITE_SCALE,
      py + 16 * SPRITE_SCALE + 9
    );

    // Use count badge
    if (state && state.useCount > 0) {
      const badgeX = px + 14 * SPRITE_SCALE;
      const badgeY = py - 2;
      ctx.fillStyle = '#1a1a32';
      ctx.fillRect(badgeX - 1, badgeY - 6, 14, 8);
      ctx.font = '7px "Courier New", monospace';
      ctx.fillStyle = '#888888';
      ctx.textAlign = 'right';
      ctx.fillText(String(state.useCount), badgeX + 11, badgeY);
    }

    // Highlight selected
    if (selectedEntity && selectedEntity.type === 'mcp' && selectedEntity.id === mcp.id) {
      ctx.strokeStyle = CATEGORY_COLORS[mcp.category] || '#00ff88';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 2, py - 2, 16 * SPRITE_SCALE + 4, 16 * SPRITE_SCALE + 4);
    }
  }
}

// ========== DOCKER CONTAINER RENDERING ==========

function drawDockerContainers() {
  const size = world.gridSize;

  for (const dc of DOCKER_CONTAINERS) {
    const state = world.dockerStates.get(dc.id);
    const isRunning = state && state.running;
    const px = dc.col * size;
    const py = dc.row * size;

    if (isRunning) {
      drawSprite(ctx, SPRITES.docker.running, px, py, SPRITE_SCALE);
    } else {
      // Draw small inactive marker
      drawSpriteTinted(ctx, SPRITES.docker.stopped, px, py, SPRITE_SCALE, 0x0DB7EDFF, 0.15);
    }

    // Label
    ctx.font = '7px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isRunning ? '#0db7ed' : '#333355';
    ctx.fillText(dc.label, px + 8 * SPRITE_SCALE, py + 16 * SPRITE_SCALE + 8);
  }
}

// ========== AGENT RENDERING ==========

function drawAgents() {
  world.agents.forEach(function(agent, id) {
    const isMain = (id === 'main');
    const px = Math.round(agent.x);
    const py = Math.round(agent.y);

    if (isMain) {
      drawMainAgent(agent, px, py);
    } else {
      drawSubAgent(agent, id, px, py);
    }
  });
}

function drawMainAgent(agent, px, py) {
  const state = agent.state || 'idle';
  // Animation system: get current frame based on state + global timer
  let sprite = getAnimFrame(state);

  // HeartGold-style bob animation (2px vertical oscillation)
  const bobOffset = Math.sin(world.frameCount * 0.06) * 2;
  const drawY = py + Math.round(bobOffset);

  // Soft shadow under agent
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(px + 4, py + 16 * SPRITE_SCALE - 2, 16 * SPRITE_SCALE - 8, 4);

  // State glow halo
  const glowColor = getStateColor(state);
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = state === 'idle' ? 4 : 12;
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(px, drawY, 16 * SPRITE_SCALE, 16 * SPRITE_SCALE);
  ctx.restore();

  // Waiting state gets dim tint; all others use dedicated sprites
  if (state === 'waiting') {
    drawSpriteTinted(ctx, sprite, px, drawY, SPRITE_SCALE, PALETTE.grayMid, 0.4);
  } else {
    drawSprite(ctx, sprite, px, drawY, SPRITE_SCALE);
  }

  // State label above agent
  ctx.font = '8px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = getStateColor(state);
  ctx.fillText(state.toUpperCase(), px + 8 * SPRITE_SCALE, drawY - 4);

  // Agent name
  ctx.font = '9px "Courier New", monospace';
  ctx.fillStyle = '#00ff88';
  ctx.fillText('CLAUDE', px + 8 * SPRITE_SCALE, py - 14);

  // Tool name indicator
  if (agent.toolName) {
    ctx.font = '7px "Courier New", monospace';
    ctx.fillStyle = '#666688';
    ctx.fillText(agent.toolName, px + 8 * SPRITE_SCALE, py + 16 * SPRITE_SCALE + 10);
  }

  // Highlight selected
  if (selectedEntity && selectedEntity.type === 'agent' && selectedEntity.id === 'main') {
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 2, py - 2, 16 * SPRITE_SCALE + 4, 16 * SPRITE_SCALE + 4);
  }

  // Blinking cursor effect near coding agent
  if (state === 'coding' && world.blinkPhase) {
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(px + 18 * SPRITE_SCALE, py + 6 * SPRITE_SCALE, 3, 8);
  }
}

function drawSubAgent(agent, id, px, py) {
  const sprite = SPRITES.subagent.active;

  if (agent.state === 'error') {
    drawSpriteTinted(ctx, sprite, px, py, SPRITE_SCALE, PALETTE.redBright, 0.4);
  } else {
    drawSprite(ctx, sprite, px, py, SPRITE_SCALE);
  }

  // Small label
  ctx.font = '7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#88cc88';

  const shortId = id.length > 8 ? id.substring(0, 8) : id;
  ctx.fillText(shortId, px + 5 * SPRITE_SCALE, py - 2);
}

function getStateColor(state) {
  switch (state) {
    case 'idle': return '#8888aa';
    case 'thinking': return '#cc88cc';
    case 'coding': return '#88cc88';
    case 'searching': return '#cccc88';
    case 'testing': return '#88cccc';
    case 'waiting': return '#aaaaaa';
    case 'error': return '#cc8888';
    default: return '#8888aa';
  }
}

// ========== CONNECTION LINE RENDERING ==========

function drawConnectionLines() {
  world.agents.forEach(function(agent) {
    if (!agent.toolName) return;

    const serverId = mapToolToServer(agent.toolName);
    if (!serverId) return;

    const mcp = MCP_SERVERS.find(function(m) { return m.id === serverId; });
    if (!mcp) return;

    const ax = Math.round(agent.x) + 8 * SPRITE_SCALE;
    const ay = Math.round(agent.y) + 8 * SPRITE_SCALE;
    const bx = mcp.col * world.gridSize + 8 * SPRITE_SCALE;
    const by = mcp.row * world.gridSize + 8 * SPRITE_SCALE;

    // Animated dashed line
    ctx.save();
    ctx.strokeStyle = CATEGORY_COLORS[mcp.category] || '#00ff88';
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -(world.frameCount % 8);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.restore();
  });
}

// ========== OVERLAY: TOKEN HP BAR ==========

function drawTokenBar() {
  const barX = 10;
  const barY = canvas.height - 30;
  const barWidth = 200;
  const barHeight = 12;

  const budget = world.session.tokenBudget;
  const ratio = Math.min(budget.used / budget.total, 1);

  // Background
  ctx.fillStyle = '#1a1a32';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Fill
  let fillColor;
  if (ratio < 0.5) fillColor = '#00cc66';
  else if (ratio < 0.75) fillColor = '#cccc44';
  else fillColor = '#cc3333';

  ctx.fillStyle = fillColor;
  ctx.fillRect(barX, barY, barWidth * ratio, barHeight);

  // Border
  ctx.strokeStyle = '#2a2a4a';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Label
  ctx.font = '8px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8888aa';
  ctx.fillText('CTX: ' + Math.round(ratio * 100) + '%', barX, barY - 3);

  // Token count
  ctx.textAlign = 'right';
  ctx.fillText(
    formatNumber(budget.used) + '/' + formatNumber(budget.total),
    barX + barWidth,
    barY - 3
  );
}

// ========== OVERLAY: SESSION COST ==========

function drawSessionCost() {
  const x = canvas.width - 10;
  const y = canvas.height - 18;

  ctx.font = '9px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#555577';
  ctx.fillText('$' + world.session.cost.toFixed(4), x, y);
}

// ========== OVERLAY: TASK SUMMARY ==========

function drawTaskSummary() {
  if (world.tasks.length === 0) return;

  const x = 10;
  const y = canvas.height - 50;

  ctx.font = '8px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#555577';

  const active = world.tasks.filter(function(t) { return t.status === 'active'; }).length;
  const done = world.tasks.filter(function(t) { return t.status === 'completed'; }).length;
  ctx.fillText('Tasks: ' + active + ' active / ' + done + ' done', x, y);
}

// ========== UTILITY ==========

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

// mapToolToServer is defined in world.js, declaring reference for linting
// (it's a global function from world.js)

// ========== CLICK HANDLING ==========

canvas.addEventListener('click', function(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  selectedEntity = null;

  // Check MCP buildings
  for (const mcp of MCP_SERVERS) {
    const px = mcp.col * world.gridSize;
    const py = mcp.row * world.gridSize;
    const w = 16 * SPRITE_SCALE;
    const h = 16 * SPRITE_SCALE;

    if (mx >= px && mx <= px + w && my >= py && my <= py + h) {
      selectedEntity = { type: 'mcp', id: mcp.id };
      showMCPDetails(mcp);
      return;
    }
  }

  // Check agents
  world.agents.forEach(function(agent, id) {
    const px = Math.round(agent.x);
    const py = Math.round(agent.y);
    const w = (id === 'main') ? 16 * SPRITE_SCALE : 10 * SPRITE_SCALE;
    const h = w;

    if (mx >= px && mx <= px + w && my >= py && my <= py + h) {
      selectedEntity = { type: 'agent', id: id };
      showAgentDetails(agent, id);
    }
  });
});

function showMCPDetails(mcp) {
  const state = world.mcpStates.get(mcp.id);
  const board = document.getElementById('mission-board');
  if (!board) return;

  board.innerHTML =
    '<div style="color:#00ff88;margin-bottom:4px">// ' + escapeHtml(mcp.id) + '</div>' +
    '<div class="task-item">Category: ' + mcp.category + '</div>' +
    '<div class="task-item">Status: ' + (state && state.active ? 'ACTIVE' : 'idle') + '</div>' +
    '<div class="task-item">Uses: ' + (state ? state.useCount : 0) + '</div>' +
    '<div class="task-item">Last tool: ' + (state && state.lastTool ? state.lastTool : '-') + '</div>';
}

function showAgentDetails(agent, id) {
  const board = document.getElementById('mission-board');
  if (!board) return;

  const label = id === 'main' ? 'Claude Main Agent' : id;
  board.innerHTML =
    '<div style="color:#00ff88;margin-bottom:4px">// ' + escapeHtml(label) + '</div>' +
    '<div class="task-item">State: ' + (agent.state || 'idle') + '</div>' +
    '<div class="task-item">Tool: ' + (agent.toolName || '-') + '</div>' +
    '<div class="task-item">Position: (' +
      Math.round(agent.x / world.gridSize) + ', ' +
      Math.round(agent.y / world.gridSize) + ')</div>' +
    '<div class="task-item">Last update: ' + timeSince(agent.lastUpdate) + '</div>';
}

function timeSince(ts) {
  const diff = Date.now() - ts;
  if (diff < 1000) return 'just now';
  if (diff < 60000) return Math.floor(diff / 1000) + 's ago';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  return Math.floor(diff / 3600000) + 'h ago';
}

// escapeHtml is defined in world.js

// ========== SCANLINE EFFECT ==========

function drawScanlines() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  for (let y = 0; y < canvas.height; y += 3) {
    ctx.fillRect(0, y, canvas.width, 1);
  }
}

// ========== VIGNETTE EFFECT ==========

function drawVignette() {
  const w = canvas.width;
  const h = canvas.height;
  const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.75);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

// ========== MAIN RENDER LOOP ==========

function render() {
  // Advance animation frame counter
  tickAnimation();

  // Update world state
  updateWorld();

  // Clear canvas
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Layer 0.5: Star field background
  drawStarField(ctx, world.frameCount);

  // Layer 1: Background
  drawCategoryZones();
  drawGrid();
  drawCategoryLabels();

  // Layer 2: Connection lines (behind entities)
  drawConnectionLines();

  // Layer 3: Static entities
  drawMCPBuildings();
  drawDockerContainers();

  // Layer 3.5: Data flow + trails
  drawTrails(ctx);
  drawDataParticles(ctx);

  // Layer 4: Dynamic entities
  drawAgents();

  // Layer 4.5: Sparks (on top of entities)
  drawSparks(ctx);

  // Layer 5: Overlays
  drawTokenBar();
  drawSessionCost();
  drawTaskSummary();

  // Layer 5.5: Ambient particles
  drawAmbientParticles(ctx);

  // Layer 6: Post-processing
  drawVignette();
  drawScanlines();

  // Next frame
  requestAnimationFrame(render);
}

// ========== INITIALIZATION ==========

initWorld();
render();
