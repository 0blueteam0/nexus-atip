/**
 * Agent Office View - Pixel Art Agent Canvas
 *
 * Renders AI agents as pixel art characters on a Canvas.
 * Active agents animate, idle agents wait.
 * Dot/pixel art style per user request.
 *
 * @module nexus/monitor/views/agent-office
 */

'use strict';

(function () {
  const canvas = document.getElementById('agent-canvas');
  const ctx = canvas.getContext('2d');
  const PIXEL = 4; // Each sprite pixel = 4x4 screen pixels
  const SPRITE_SIZE = 16;
  const AGENT_W = SPRITE_SIZE * PIXEL; // 64px
  const AGENT_H = SPRITE_SIZE * PIXEL; // 64px

  const agents = {};
  const AGENT_IDS = ['claude-code', 'gemini-cli', 'codex-cli', 'ollama-cpu'];

  // Agent positions (spread across canvas)
  const positions = {
    'claude-code': { x: 120, y: 200 },
    'gemini-cli': { x: 380, y: 200 },
    'codex-cli': { x: 640, y: 200 },
    'ollama-cpu': { x: 900, y: 200 }
  };

  // Initialize agents
  AGENT_IDS.forEach(id => {
    agents[id] = {
      id: id,
      state: 'idle', // idle, working, thinking
      task: null,
      frame: 0,
      lastFrame: 0,
      bobOffset: 0
    };
  });

  function drawSprite(agentId, x, y, bobY) {
    const sprites = window.AGENT_SPRITES;
    if (!sprites || !sprites[agentId]) return;

    const sprite = sprites[agentId];
    const grid = sprite.grid;

    for (let row = 0; row < SPRITE_SIZE; row++) {
      for (let col = 0; col < SPRITE_SIZE; col++) {
        const cell = grid[row][col];
        if (cell === 0) continue;

        ctx.fillStyle = cell === 1 ? sprite.color : sprite.accent;
        ctx.fillRect(
          x + col * PIXEL,
          y + row * PIXEL + bobY,
          PIXEL,
          PIXEL
        );
      }
    }
  }

  function drawAgent(agent) {
    const pos = positions[agent.id];
    if (!pos) return;

    const sprite = window.AGENT_SPRITES && window.AGENT_SPRITES[agent.id];
    if (!sprite) return;

    // Bob animation for working state
    let bobY = 0;
    if (agent.state === 'working') {
      bobY = Math.sin(Date.now() / 200) * 3;
    } else if (agent.state === 'thinking') {
      bobY = Math.sin(Date.now() / 500) * 2;
    }

    // Draw shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(pos.x + AGENT_W / 2, pos.y + AGENT_H + 8, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw sprite
    drawSprite(agent.id, pos.x, pos.y, bobY);

    // Name label
    ctx.fillStyle = sprite.accent;
    ctx.font = '12px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(sprite.name, pos.x + AGENT_W / 2, pos.y + AGENT_H + 24);

    // Status label
    ctx.fillStyle = agent.state === 'working' ? '#3fb950' :
      agent.state === 'thinking' ? '#d29922' : '#8b949e';
    ctx.font = '10px Consolas, monospace';
    ctx.fillText(agent.state.toUpperCase(), pos.x + AGENT_W / 2, pos.y + AGENT_H + 38);

    // Task label (if working)
    if (agent.task && agent.state === 'working') {
      ctx.fillStyle = '#c9d1d9';
      ctx.font = '9px Consolas, monospace';
      const taskText = agent.task.length > 20 ? agent.task.slice(0, 20) + '...' : agent.task;
      ctx.fillText(taskText, pos.x + AGENT_W / 2, pos.y + AGENT_H + 52);
    }

    // Working indicator (spinning dots)
    if (agent.state === 'working') {
      const angle = Date.now() / 300;
      for (let i = 0; i < 3; i++) {
        const a = angle + (i * Math.PI * 2 / 3);
        const dx = Math.cos(a) * 12;
        const dy = Math.sin(a) * 12;
        ctx.fillStyle = sprite.accent;
        ctx.beginPath();
        ctx.arc(pos.x + AGENT_W / 2 + dx, pos.y - 10 + dy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Thinking indicator (dots appearing)
    if (agent.state === 'thinking') {
      const dots = Math.floor((Date.now() / 500) % 4);
      ctx.fillStyle = '#d29922';
      ctx.font = '14px Consolas, monospace';
      ctx.fillText('.'.repeat(dots), pos.x + AGENT_W / 2 + 30, pos.y + AGENT_H / 2);
    }
  }

  function drawBackground() {
    // Clear
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#39d353';
    ctx.font = '14px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Agent Office', 16, 24);

    // Grid dots (floor pattern)
    ctx.fillStyle = '#21262d';
    for (let x = 0; x < canvas.width; x += 20) {
      for (let y = 300; y < canvas.height; y += 20) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Desk line
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 300);
    ctx.lineTo(canvas.width - 60, 300);
    ctx.stroke();

    // Stats
    const working = AGENT_IDS.filter(id => agents[id].state === 'working').length;
    const idle = AGENT_IDS.filter(id => agents[id].state === 'idle').length;
    ctx.fillStyle = '#8b949e';
    ctx.font = '11px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Active: ${working}  Idle: ${idle}`, canvas.width - 16, 24);
  }

  function render() {
    drawBackground();
    AGENT_IDS.forEach(id => drawAgent(agents[id]));
    requestAnimationFrame(render);
  }

  // Event handler chain
  const prevHandler = window.onNexusEvent;
  window.onNexusEvent = function (type, data) {
    if (prevHandler) prevHandler(type, data);

    // Update agent states based on events
    if (type === 'task:routed' && data.provider) {
      const agent = agents[data.provider];
      if (agent) {
        agent.state = 'working';
        agent.task = data.task || data.description || 'Processing...';
      }
    }

    if (type === 'task:completed' && data.provider) {
      const agent = agents[data.provider];
      if (agent) {
        agent.state = 'idle';
        agent.task = null;
      }
    }

    if (type === 'task:failed' && data.provider) {
      const agent = agents[data.provider];
      if (agent) {
        agent.state = 'idle';
        agent.task = null;
      }
    }

    if (type === 'provider:health') {
      const agent = agents[data.provider];
      if (agent && data.status === 'down') {
        agent.state = 'idle';
      }
    }

    // Team events
    if (type === 'team:started') {
      (data.members || []).forEach(m => {
        const agent = agents[m];
        if (agent) {
          agent.state = 'working';
          agent.task = 'Team: ' + (data.goal || '');
        }
      });
    }

    if (type === 'team:completed') {
      (data.members || []).forEach(m => {
        const agent = agents[m];
        if (agent) {
          agent.state = 'idle';
          agent.task = null;
        }
      });
    }

    // Graph events indicate framework activity
    if (type === 'graph:node:start') {
      agents['claude-code'].state = 'thinking';
    }
    if (type === 'graph:node:end') {
      agents['claude-code'].state = 'idle';
    }
  };

  // Start render loop
  render();
})();
