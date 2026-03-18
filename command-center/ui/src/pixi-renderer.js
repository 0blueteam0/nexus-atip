/**
 * pixi-renderer.js - PixiJS v8 Render Engine (Enhanced)
 *
 * 10-layer render pipeline with Pokemon HeartGold (NDS 2009)
 * quality pixel-art aesthetic. Full visual polish pass.
 *
 * Layers (back-to-front):
 *   0 stars       - star field twinkle
 *   1 zones       - category zone fills + grid + labels
 *   2 connections - animated dual-line glow connections
 *   3 buildings   - MCP server sprites + pulsing glow + labels
 *   4 docker      - Docker container sprites + labels
 *   5 trails      - agent trail particles + data flow
 *   6 agents      - agent sprites + shadow + multi-glow + labels
 *   7 sparks      - spark particle effects
 *   8 hud         - token bar + cost + task summary + labels
 *   9 post        - ambient particles + scanlines + vignette
 */

import { Container, Graphics, Text, Sprite, Texture } from 'pixi.js';
import { world, MCP_SERVERS, DOCKER_CONTAINERS, CATEGORY_COLORS } from './world.js';
import { getAnimTexture } from './sprites.js';
import {
  createParticleGraphics, renderParticles,
  initStarField
} from './particles.js';

// ========== CONSTANTS ==========

const GRID_SIZE    = 32;
const GRID_COLS    = 25;
const GRID_ROWS    = 19;
const SPRITE_SCALE = 2;
const SPRITE_PX    = 16 * SPRITE_SCALE; // 32

const GRID_COLOR     = 0x2A2A4A;
const GRID_ALPHA     = 0.30;
const GRID_DOT_ALPHA = 0.45;
const ZONE_ALPHA     = 0.18;
const ZONE_BORDER_ALPHA = 0.40;
const SCANLINE_ALPHA = 0.05;

// Category zone positions { col, row, w, h }
const ZONES = [
  { cat: 'file',     col: 1,  row: 1,  w: 6, h: 4 },
  { cat: 'web',      col: 17, row: 1,  w: 6, h: 4 },
  { cat: 'research', col: 1,  row: 7,  w: 6, h: 4 },
  { cat: 'ai',       col: 17, row: 7,  w: 6, h: 4 },
  { cat: 'db',       col: 1,  row: 13, w: 6, h: 4 },
  { cat: 'task',     col: 9,  row: 13, w: 6, h: 4 },
  { cat: 'media',    col: 17, row: 13, w: 6, h: 4 }
];

const CATEGORY_LABELS = {
  file: '// FILE/CODE', web: '// WEB/CRAWL', research: '// RESEARCH',
  ai: '// AI/LLM', db: '// DATABASE', task: '// TASK MGT', media: '// MEDIA'
};

const STATE_COLORS = {
  idle: 0x8888AA, thinking: 0xCC88FF, coding: 0x00FF88,
  searching: 0xFFCC44, testing: 0x44CCCC, waiting: 0xAAAAAA,
  error: 0xFF4444, recovering: 0xFFAA44
};

const STATE_LABELS = {
  idle: 'IDLE', thinking: 'THINKING...', coding: 'CODING',
  searching: 'SEARCHING', testing: 'TESTING', waiting: 'WAITING',
  error: 'ERROR', recovering: 'RECOVERING'
};

// ========== LAYER CREATION ==========

export function createRenderLayers(stage) {
  const names = [
    'stars', 'zones', 'connections', 'buildings', 'docker',
    'trails', 'agents', 'sparks', 'hud', 'post'
  ];
  const layers = {};
  for (const name of names) {
    const c = new Container();
    c.label = name;
    stage.addChild(c);
    layers[name] = c;
  }
  return layers;
}

// ========== SCENE SETUP ==========

export function setupScene(layers, textures, canvasW, canvasH) {
  const scene = {
    layers, textures, canvasW, canvasH,
    // Graphics objects
    zoneGfx: null, zoneBorderGfx: null, gridGfx: null,
    connectionGfx: null, connectionGlowGfx: null,
    scanlineGfx: null, vignetteSprite: null,
    // Particle graphics
    particleGfx: null,
    // MCP building entries
    mcpEntries: new Map(),
    // Docker entries
    dockerEntries: new Map(),
    // Agent entries
    agentEntries: new Map(),
    // HUD
    tokenBarGfx: null, tokenLabel: null, tokenPctText: null,
    costText: null, taskText: null,
    // Zone labels
    zoneLabelTexts: []
  };

  // --- Layer 0: Stars ---
  scene.particleGfx = createParticleGraphics();
  layers.stars.addChild(scene.particleGfx.stars);

  // --- Layer 1: Zones + Grid + Labels ---
  scene.zoneGfx = new Graphics();
  layers.zones.addChild(scene.zoneGfx);
  drawZones(scene.zoneGfx);

  scene.zoneBorderGfx = new Graphics();
  layers.zones.addChild(scene.zoneBorderGfx);

  scene.gridGfx = new Graphics();
  layers.zones.addChild(scene.gridGfx);
  drawGrid(scene.gridGfx, canvasW, canvasH);

  // Category labels with background panels
  for (const z of ZONES) {
    const labelText = CATEGORY_LABELS[z.cat] || `// ${z.cat.toUpperCase()}`;

    // Background panel
    const panelGfx = new Graphics();
    const labelX = z.col * GRID_SIZE + 3;
    const labelY = z.row * GRID_SIZE + 2;
    panelGfx.roundRect(labelX - 2, labelY - 1, labelText.length * 6.4 + 8, 14, 2)
      .fill({ color: 0x0A0A18, alpha: 0.8 });
    layers.zones.addChild(panelGfx);

    const txt = new Text({
      text: labelText,
      style: { fontFamily: 'Courier New', fontSize: 11, fill: CATEGORY_COLORS[z.cat] || 0xFFFFFF }
    });
    txt.alpha = 0.9;
    txt.x = labelX;
    txt.y = labelY;
    layers.zones.addChild(txt);
    scene.zoneLabelTexts.push(txt);
  }

  // --- Layer 2: Connections ---
  scene.connectionGlowGfx = new Graphics();
  layers.connections.addChild(scene.connectionGlowGfx);
  scene.connectionGfx = new Graphics();
  layers.connections.addChild(scene.connectionGfx);

  // --- Layer 3: MCP Buildings ---
  setupMCPBuildings(scene, textures);

  // --- Layer 4: Docker Containers ---
  setupDockerContainers(scene, textures);

  // --- Layer 5: Trails + Data particles ---
  layers.trails.addChild(scene.particleGfx.trails);
  layers.trails.addChild(scene.particleGfx.data);

  // --- Layer 6: Agents (dynamic) ---

  // --- Layer 7: Sparks ---
  layers.sparks.addChild(scene.particleGfx.sparks);

  // --- Layer 8: HUD ---
  scene.tokenBarGfx = new Graphics();
  layers.hud.addChild(scene.tokenBarGfx);

  scene.tokenLabel = new Text({
    text: 'TOKEN BUDGET',
    style: { fontFamily: 'Courier New', fontSize: 10, fill: 0x667799 }
  });
  layers.hud.addChild(scene.tokenLabel);

  scene.tokenPctText = new Text({
    text: '',
    style: { fontFamily: 'Courier New', fontSize: 10, fill: 0xCCCCEE }
  });
  layers.hud.addChild(scene.tokenPctText);

  scene.costText = new Text({
    text: '',
    style: { fontFamily: 'Courier New', fontSize: 11, fill: 0x7788AA }
  });
  layers.hud.addChild(scene.costText);

  scene.taskText = new Text({
    text: '',
    style: { fontFamily: 'Courier New', fontSize: 11, fill: 0x7788AA }
  });
  layers.hud.addChild(scene.taskText);

  // --- Layer 9: Post-processing ---
  layers.post.addChild(scene.particleGfx.ambient);

  scene.scanlineGfx = new Graphics();
  layers.post.addChild(scene.scanlineGfx);
  drawScanlines(scene.scanlineGfx, canvasW, canvasH);

  scene.vignetteSprite = createVignetteSprite(canvasW, canvasH);
  layers.post.addChild(scene.vignetteSprite);

  // Init star field
  initStarField(canvasW, canvasH);

  return scene;
}

// ========== STATIC DRAWING ==========

function drawZones(g) {
  g.clear();
  const TILE = 16; // NDS-style 16px floor tile size
  for (const z of ZONES) {
    const color = CATEGORY_COLORS[z.cat] || 0x888888;
    const x = z.col * GRID_SIZE;
    const y = z.row * GRID_SIZE;
    const w = z.w * GRID_SIZE;
    const h = z.h * GRID_SIZE;

    // Base fill
    g.rect(x, y, w, h).fill({ color, alpha: ZONE_ALPHA });

    // NDS-style tiled floor: subtle checkerboard with alternating shades
    for (let ty = 0; ty < h; ty += TILE) {
      for (let tx = 0; tx < w; tx += TILE) {
        const isEven = ((tx / TILE) + (ty / TILE)) % 2 === 0;
        if (isEven) {
          g.rect(x + tx, y + ty, TILE, TILE)
            .fill({ color, alpha: 0.06 });
        } else {
          g.rect(x + tx, y + ty, TILE, TILE)
            .fill({ color: 0x000000, alpha: 0.04 });
        }
      }
    }

    // Tile grid lines within zone (very subtle)
    for (let tx = TILE; tx < w; tx += TILE) {
      g.moveTo(x + tx, y).lineTo(x + tx, y + h)
        .stroke({ color, alpha: 0.08, width: 1 });
    }
    for (let ty = TILE; ty < h; ty += TILE) {
      g.moveTo(x, y + ty).lineTo(x + w, y + ty)
        .stroke({ color, alpha: 0.08, width: 1 });
    }

    // Tile intersection diamonds (NDS floor detail)
    for (let ty = TILE; ty < h; ty += TILE) {
      for (let tx = TILE; tx < w; tx += TILE) {
        g.rect(x + tx, y + ty, 1, 1)
          .fill({ color, alpha: 0.25 });
      }
    }

    // Top inner highlight strip (light source from top-left)
    g.rect(x + 1, y + 1, w - 2, 3)
      .fill({ color, alpha: ZONE_ALPHA * 0.8 });
    // Left inner highlight strip
    g.rect(x + 1, y + 1, 2, h - 2)
      .fill({ color, alpha: ZONE_ALPHA * 0.4 });
    // Bottom shadow edge (darker)
    g.rect(x, y + h - 3, w, 3)
      .fill({ color: 0x000000, alpha: 0.12 });
    // Right shadow edge
    g.rect(x + w - 2, y, 2, h)
      .fill({ color: 0x000000, alpha: 0.08 });
  }
}

function drawZoneBorders(g, frameCount) {
  g.clear();
  for (const z of ZONES) {
    const color = CATEGORY_COLORS[z.cat] || 0x888888;
    const x = z.col * GRID_SIZE;
    const y = z.row * GRID_SIZE;
    const w = z.w * GRID_SIZE;
    const h = z.h * GRID_SIZE;

    // Animated border pulse
    const pulse = 0.5 + Math.sin(frameCount * 0.02 + z.col * 0.3) * 0.25;
    const borderAlpha = ZONE_BORDER_ALPHA * pulse;

    // Outer glow border (2px, soft)
    g.rect(x - 2, y - 2, w + 4, h + 4)
      .stroke({ color, alpha: borderAlpha * 0.2, width: 1 });
    g.rect(x - 1, y - 1, w + 2, h + 2)
      .stroke({ color, alpha: borderAlpha * 0.4, width: 2 });
    // Inner border (1px, brighter)
    g.rect(x, y, w, h)
      .stroke({ color, alpha: borderAlpha * 0.8, width: 1 });

    // === NDS-style double corner brackets (prominent) ===
    const cornerLen = 8;
    const cornerInner = 5;
    const ca = borderAlpha * 1.4;
    const caInner = borderAlpha * 0.7;

    // Outer corners (bright, wider)
    // Top-left
    g.moveTo(x, y + cornerLen).lineTo(x, y).lineTo(x + cornerLen, y)
      .stroke({ color, alpha: ca, width: 2 });
    // Top-right
    g.moveTo(x + w - cornerLen, y).lineTo(x + w, y).lineTo(x + w, y + cornerLen)
      .stroke({ color, alpha: ca, width: 2 });
    // Bottom-left
    g.moveTo(x, y + h - cornerLen).lineTo(x, y + h).lineTo(x + cornerLen, y + h)
      .stroke({ color, alpha: ca, width: 2 });
    // Bottom-right
    g.moveTo(x + w - cornerLen, y + h).lineTo(x + w, y + h).lineTo(x + w, y + h - cornerLen)
      .stroke({ color, alpha: ca, width: 2 });

    // Inner corner accents (dimmer, offset 2px)
    // Top-left inner
    g.moveTo(x + 2, y + 2 + cornerInner).lineTo(x + 2, y + 2).lineTo(x + 2 + cornerInner, y + 2)
      .stroke({ color, alpha: caInner, width: 1 });
    // Top-right inner
    g.moveTo(x + w - 2 - cornerInner, y + 2).lineTo(x + w - 2, y + 2).lineTo(x + w - 2, y + 2 + cornerInner)
      .stroke({ color, alpha: caInner, width: 1 });
    // Bottom-left inner
    g.moveTo(x + 2, y + h - 2 - cornerInner).lineTo(x + 2, y + h - 2).lineTo(x + 2 + cornerInner, y + h - 2)
      .stroke({ color, alpha: caInner, width: 1 });
    // Bottom-right inner
    g.moveTo(x + w - 2 - cornerInner, y + h - 2).lineTo(x + w - 2, y + h - 2).lineTo(x + w - 2, y + h - 2 - cornerInner)
      .stroke({ color, alpha: caInner, width: 1 });

    // === Corner pixel dots (NDS HUD decoration) ===
    g.rect(x + 1, y + 1, 2, 2).fill({ color, alpha: ca * 0.8 });
    g.rect(x + w - 3, y + 1, 2, 2).fill({ color, alpha: ca * 0.8 });
    g.rect(x + 1, y + h - 3, 2, 2).fill({ color, alpha: ca * 0.8 });
    g.rect(x + w - 3, y + h - 3, 2, 2).fill({ color, alpha: ca * 0.8 });

    // === Edge midpoint tick marks (subtle, NDS panel decoration) ===
    const midX = x + w / 2;
    const midY = y + h / 2;
    const tickLen = 3;
    const tickAlpha = borderAlpha * 0.5;
    // Top edge midpoint
    g.moveTo(midX, y).lineTo(midX, y + tickLen)
      .stroke({ color, alpha: tickAlpha, width: 1 });
    // Bottom edge midpoint
    g.moveTo(midX, y + h).lineTo(midX, y + h - tickLen)
      .stroke({ color, alpha: tickAlpha, width: 1 });
    // Left edge midpoint
    g.moveTo(x, midY).lineTo(x + tickLen, midY)
      .stroke({ color, alpha: tickAlpha, width: 1 });
    // Right edge midpoint
    g.moveTo(x + w, midY).lineTo(x + w - tickLen, midY)
      .stroke({ color, alpha: tickAlpha, width: 1 });

    // === Scanning line (animated, sweeps across zone) ===
    const scanCycle = 180; // frames per sweep
    const scanT = ((frameCount + z.col * 30) % scanCycle) / scanCycle;
    const scanY = y + scanT * h;
    g.moveTo(x + 2, scanY).lineTo(x + w - 2, scanY)
      .stroke({ color, alpha: 0.06 + borderAlpha * 0.15, width: 1 });
  }
}

function drawGrid(g, w, h) {
  g.clear();
  const maxX = GRID_COLS * GRID_SIZE;
  const maxY = GRID_ROWS * GRID_SIZE;

  // Grid lines (subtle, NDS floor grid)
  for (let x = 0; x <= GRID_COLS; x++) {
    // Every 4th line slightly brighter (sub-grid hierarchy)
    const lineAlpha = (x % 4 === 0) ? GRID_ALPHA * 1.5 : GRID_ALPHA;
    g.moveTo(x * GRID_SIZE, 0).lineTo(x * GRID_SIZE, maxY)
      .stroke({ color: GRID_COLOR, alpha: lineAlpha, width: 1 });
  }
  for (let y = 0; y <= GRID_ROWS; y++) {
    const lineAlpha = (y % 4 === 0) ? GRID_ALPHA * 1.5 : GRID_ALPHA;
    g.moveTo(0, y * GRID_SIZE).lineTo(maxX, y * GRID_SIZE)
      .stroke({ color: GRID_COLOR, alpha: lineAlpha, width: 1 });
  }

  // Intersection dots (pixel-art highlight, brighter at sub-grid crossings)
  for (let x = 0; x <= GRID_COLS; x++) {
    for (let y = 0; y <= GRID_ROWS; y++) {
      const isMajor = (x % 4 === 0) && (y % 4 === 0);
      const dotSize = isMajor ? 2 : 1;
      const dotAlpha = isMajor ? GRID_DOT_ALPHA * 2.0 : GRID_DOT_ALPHA;
      const dotColor = isMajor ? 0x6666CC : 0x4444AA;
      g.rect(x * GRID_SIZE, y * GRID_SIZE, dotSize, dotSize)
        .fill({ color: dotColor, alpha: Math.min(dotAlpha, 0.6) });
    }
  }
}

function drawScanlines(g, w, h) {
  g.clear();
  for (let y = 0; y < h; y += 2) {
    g.rect(0, y, w, 1).fill({ color: 0x000000, alpha: SCANLINE_ALPHA });
  }
}

function createVignetteSprite(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const cx = w * 0.5;
  const cy = h * 0.5;
  const innerR = w * 0.25;
  const outerR = w * 0.8;

  // Main vignette
  const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.1)');
  grad.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle blue tint at edges (CRT feel)
  const grad2 = ctx.createRadialGradient(cx, cy, outerR * 0.6, cx, cy, outerR);
  grad2.addColorStop(0, 'rgba(20,20,60,0)');
  grad2.addColorStop(1, 'rgba(10,10,40,0.15)');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, w, h);

  const tex = Texture.from(canvas);
  const sprite = new Sprite(tex);
  sprite.x = 0;
  sprite.y = 0;
  return sprite;
}

// ========== MCP BUILDINGS ==========

function setupMCPBuildings(scene, textures) {
  const { layers } = scene;

  for (const srv of MCP_SERVERS) {
    const px = srv.col * GRID_SIZE;
    const py = srv.row * GRID_SIZE;

    // Glow graphics (behind sprite)
    const glowGfx = new Graphics();
    layers.buildings.addChild(glowGfx);

    // Sprite (category-specific texture)
    const catTex = textures.mcp[srv.category] || textures.mcp.misc;
    const sprite = new Sprite(catTex.inactive);
    sprite.x = px;
    sprite.y = py;
    sprite.width = SPRITE_PX;
    sprite.height = SPRITE_PX;
    layers.buildings.addChild(sprite);

    // Label (centered below sprite)
    const shortName = srv.id.length > 8 ? srv.id.slice(0, 7) + '.' : srv.id;

    // Label background
    const labelBg = new Graphics();
    layers.buildings.addChild(labelBg);

    const label = new Text({
      text: shortName,
      style: { fontFamily: 'Courier New', fontSize: 10, fill: 0xCCCCEE }
    });
    label.alpha = 0.9;
    label.anchor.set(0.5, 0);
    label.x = px + SPRITE_PX / 2;
    label.y = py + SPRITE_PX + 3;
    layers.buildings.addChild(label);

    // Badge (use count)
    const badge = new Text({
      text: '',
      style: { fontFamily: 'Courier New', fontSize: 8, fill: 0x00FF88 }
    });
    badge.anchor.set(1, 0);
    badge.x = px + SPRITE_PX + 2;
    badge.y = py - 2;
    layers.buildings.addChild(badge);

    scene.mcpEntries.set(srv.id, { sprite, glowGfx, label, labelBg, badge, srv });
  }
}

// ========== DOCKER CONTAINERS ==========

function setupDockerContainers(scene, textures) {
  const { layers } = scene;

  for (const dc of DOCKER_CONTAINERS) {
    const px = dc.col * GRID_SIZE;
    const py = dc.row * GRID_SIZE;

    // Glow
    const glowGfx = new Graphics();
    layers.docker.addChild(glowGfx);

    const sprite = new Sprite(textures.docker.running);
    sprite.x = px;
    sprite.y = py;
    sprite.width = SPRITE_PX;
    sprite.height = SPRITE_PX;
    layers.docker.addChild(sprite);

    const shortName = dc.id.length > 8 ? dc.id.slice(0, 7) + '.' : dc.id;
    const label = new Text({
      text: shortName,
      style: { fontFamily: 'Courier New', fontSize: 9, fill: 0x0DB7ED }
    });
    label.alpha = 0.9;
    label.anchor.set(0.5, 0);
    label.x = px + SPRITE_PX / 2;
    label.y = py + SPRITE_PX + 2;
    layers.docker.addChild(label);

    scene.dockerEntries.set(dc.id, { sprite, glowGfx, label, dc });
  }
}

// ========== DASHED LINE HELPER ==========

function drawDashedLine(g, x0, y0, x1, y1, dashLen, gapLen, offset, color, alpha, width) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return;

  const ux = dx / dist;
  const uy = dy / dist;
  const cycle = dashLen + gapLen;
  let pos = ((offset % cycle) + cycle) % cycle;

  while (pos < dist) {
    const segStart = pos;
    const segEnd = Math.min(pos + dashLen, dist);
    if (segEnd > segStart) {
      g.moveTo(x0 + ux * segStart, y0 + uy * segStart)
        .lineTo(x0 + ux * segEnd, y0 + uy * segEnd)
        .stroke({ color, alpha, width });
    }
    pos += cycle;
  }
}

// ========== GLOW HELPER (Enhanced) ==========

function drawGlow(g, x, y, w, h, color, intensity, pulsePhase) {
  // 5-layer expanding rects for richer glow
  const p = pulsePhase !== undefined ? pulsePhase : 0;
  const breathe = 1.0 + Math.sin(p) * 0.15;
  const levels = [
    { expand: 10, alpha: intensity * 0.06 * breathe },
    { expand: 8,  alpha: intensity * 0.10 * breathe },
    { expand: 6,  alpha: intensity * 0.15 * breathe },
    { expand: 4,  alpha: intensity * 0.22 * breathe },
    { expand: 2,  alpha: intensity * 0.32 * breathe }
  ];
  for (const lv of levels) {
    const e = lv.expand;
    g.rect(x - e, y - e, w + e * 2, h + e * 2)
      .fill({ color, alpha: Math.min(lv.alpha, 0.5) });
  }
}

// Rim highlight on top edge of sprite (NDS specular style)
function drawRimHighlight(g, x, y, w, color, alpha) {
  g.rect(x + 2, y, w - 4, 1).fill({ color: 0xFFFFFF, alpha: alpha * 0.4 });
  g.rect(x + 1, y + 1, w - 2, 1).fill({ color, alpha: alpha * 0.25 });
}

// ========== PER-FRAME RENDERING ==========

export function renderFrame(scene, frameCount) {
  // Zone animated borders
  drawZoneBorders(scene.zoneBorderGfx, frameCount);

  // Render particle graphics
  renderParticles(scene.particleGfx, frameCount);

  // Render dynamic elements
  renderConnections(scene, frameCount);
  renderMCPBuildings(scene, frameCount);
  renderDockerContainers(scene, frameCount);
  renderAgents(scene, frameCount);
  renderTokenBar(scene, frameCount);
  renderSessionCost(scene);
  renderTaskSummary(scene);
}

// ---------- Connections (Enhanced: data packets + dual-line glow) ----------

function renderConnections(scene, frameCount) {
  const gGlow = scene.connectionGlowGfx;
  const g = scene.connectionGfx;
  gGlow.clear();
  g.clear();

  const mainAgent = world.agents.get('main');
  if (!mainAgent) return;

  const agentCx = mainAgent.x + SPRITE_PX / 2;
  const agentCy = mainAgent.y + SPRITE_PX / 2;
  const dashOffset = -(frameCount % 12);

  for (const srv of MCP_SERVERS) {
    const state = world.mcpStates.get(srv.id);
    if (!state || !state.active) continue;

    const srvCx = srv.col * GRID_SIZE + SPRITE_PX / 2;
    const srvCy = srv.row * GRID_SIZE + SPRITE_PX / 2;
    const color = CATEGORY_COLORS[srv.category] || 0x888888;
    const dx = srvCx - agentCx;
    const dy = srvCy - agentCy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) continue;

    // Pulse brightness along connection
    const pulse = 0.5 + Math.sin(frameCount * 0.08 + srv.col * 0.5) * 0.3;

    // Outer glow line (wider, dimmer)
    drawDashedLine(gGlow, agentCx, agentCy, srvCx, srvCy,
      6, 4, dashOffset, color, 0.25 * pulse, 3);

    // Core line (thin, bright)
    drawDashedLine(g, agentCx, agentCy, srvCx, srvCy,
      5, 3, dashOffset, color, 0.70 * pulse, 1);

    // === NDS-style data packet dots traveling along connection ===
    // Outgoing packets (agent -> server): bright, 3 dots staggered
    const packetSpeed = 0.012 + (state.useCount || 0) * 0.002; // faster with more use
    const numPackets = 3;
    for (let i = 0; i < numPackets; i++) {
      const phase = ((frameCount * packetSpeed) + (i / numPackets)) % 1.0;
      const px = agentCx + dx * phase;
      const py = agentCy + dy * phase;
      // Packet fades near endpoints (bell curve)
      const edgeFade = Math.sin(phase * Math.PI);
      const packetAlpha = 0.85 * pulse * edgeFade;

      // Core dot (bright)
      g.circle(px, py, 2).fill({ color, alpha: packetAlpha });
      // Outer halo
      gGlow.circle(px, py, 4).fill({ color, alpha: packetAlpha * 0.3 });
    }

    // Return packets (server -> agent): dimmer, 2 dots, slightly slower
    const returnSpeed = 0.009 + (state.useCount || 0) * 0.001;
    for (let i = 0; i < 2; i++) {
      const phase = ((frameCount * returnSpeed) + 0.5 + (i / 2)) % 1.0;
      const px = srvCx - dx * phase;
      const py = srvCy - dy * phase;
      const edgeFade = Math.sin(phase * Math.PI);
      const retAlpha = 0.5 * pulse * edgeFade;

      g.circle(px, py, 1.5).fill({ color: 0xFFFFFF, alpha: retAlpha * 0.7 });
      gGlow.circle(px, py, 3).fill({ color, alpha: retAlpha * 0.2 });
    }

    // Endpoint glow ring at MCP server (pulsing)
    const ringPulse = 0.6 + Math.sin(frameCount * 0.1 + srv.row) * 0.3;
    g.circle(srvCx, srvCy, 4).stroke({ color, alpha: 0.5 * ringPulse, width: 1 });
    g.circle(srvCx, srvCy, 2).fill({ color, alpha: 0.8 * ringPulse });

    // Agent-side small departure flash
    const flashPhase = (frameCount * 0.15 + srv.col) % (Math.PI * 2);
    const flashAlpha = Math.max(0, Math.sin(flashPhase)) * 0.3 * pulse;
    if (flashAlpha > 0.05) {
      gGlow.circle(agentCx, agentCy, 5).fill({ color, alpha: flashAlpha });
    }
  }
}

// ---------- MCP Buildings (Enhanced: pulsing glow + rim) ----------

function renderMCPBuildings(scene, frameCount) {
  for (const [id, entry] of scene.mcpEntries) {
    const state = world.mcpStates.get(id);
    const active = state && state.active;
    const px = entry.srv.col * GRID_SIZE;
    const py = entry.srv.row * GRID_SIZE;
    const color = CATEGORY_COLORS[entry.srv.category] || 0x00FF88;

    // Update sprite texture (category-specific)
    const catTex = scene.textures.mcp[entry.srv.category] || scene.textures.mcp.misc;
    entry.sprite.texture = active ? catTex.active : catTex.inactive;

    entry.glowGfx.clear();

    // === Ground shadow (all buildings, NDS perspective illusion) ===
    const shadowAlpha = active ? 0.18 : 0.10;
    entry.glowGfx.ellipse(px + SPRITE_PX / 2, py + SPRITE_PX + 1,
      SPRITE_PX / 2 + 2, 3)
      .fill({ color: 0x000000, alpha: shadowAlpha });

    if (active) {
      // Enhanced glow with pulse
      const pulsePhase = frameCount * 0.05 + entry.srv.col * 0.7;
      drawGlow(entry.glowGfx, px, py, SPRITE_PX, SPRITE_PX, color, 0.7, pulsePhase);
      drawRimHighlight(entry.glowGfx, px, py, SPRITE_PX, color, 0.6);

      // === Window light flicker (2 small windows on building face) ===
      // Window positions relative to sprite: roughly center-left and center-right
      const winW = 3, winH = 2;
      const win1x = px + 5, win1y = py + 8;
      const win2x = px + SPRITE_PX - 8, win2y = py + 8;
      // Flicker: each window has independent random-ish phase
      const flicker1 = 0.6 + Math.sin(frameCount * 0.12 + id.length * 1.7) * 0.35;
      const flicker2 = 0.5 + Math.sin(frameCount * 0.15 + id.length * 2.3) * 0.4;
      // Warm yellow-white light
      entry.glowGfx.rect(win1x, win1y, winW, winH)
        .fill({ color: 0xFFEE88, alpha: flicker1 * 0.7 });
      entry.glowGfx.rect(win2x, win2y, winW, winH)
        .fill({ color: 0xFFDD66, alpha: flicker2 * 0.6 });
      // Light spill beneath windows
      entry.glowGfx.rect(win1x - 1, win1y + winH, winW + 2, 1)
        .fill({ color: 0xFFEE88, alpha: flicker1 * 0.2 });
      entry.glowGfx.rect(win2x - 1, win2y + winH, winW + 2, 1)
        .fill({ color: 0xFFDD66, alpha: flicker2 * 0.15 });

      // === LED activity indicator (top-right corner, blinking) ===
      const ledPhase = (frameCount * 0.2 + id.length) % (Math.PI * 2);
      const ledOn = Math.sin(ledPhase) > 0;
      if (ledOn) {
        // Bright LED dot
        entry.glowGfx.circle(px + SPRITE_PX - 3, py + 3, 1.5)
          .fill({ color: 0x00FF44, alpha: 0.9 });
        // LED glow halo
        entry.glowGfx.circle(px + SPRITE_PX - 3, py + 3, 3)
          .fill({ color: 0x00FF44, alpha: 0.15 });
      } else {
        // Dim LED (off state)
        entry.glowGfx.circle(px + SPRITE_PX - 3, py + 3, 1)
          .fill({ color: 0x004422, alpha: 0.5 });
      }

      // === Antenna signal waves (every 3rd building, subtle) ===
      if (entry.srv.col % 3 === 0) {
        const waveT = (frameCount * 0.04) % 1.0;
        const waveR = 4 + waveT * 8;
        const waveAlpha = (1.0 - waveT) * 0.15;
        entry.glowGfx.circle(px + SPRITE_PX / 2, py - 2, waveR)
          .stroke({ color, alpha: waveAlpha, width: 1 });
      }
    } else {
      // Subtle idle glow for inactive servers
      entry.glowGfx.rect(px - 2, py - 2, SPRITE_PX + 4, SPRITE_PX + 4)
        .fill({ color: 0x222244, alpha: 0.25 });

      // Dim window (off, dark blue tint)
      entry.glowGfx.rect(px + 5, py + 8, 3, 2)
        .fill({ color: 0x223344, alpha: 0.3 });
      entry.glowGfx.rect(px + SPRITE_PX - 8, py + 8, 3, 2)
        .fill({ color: 0x223344, alpha: 0.25 });
    }

    // Badge
    const useCount = state ? state.useCount : 0;
    if (useCount > 0) {
      entry.badge.text = `x${useCount}`;
      entry.badge.visible = true;
    } else {
      entry.badge.visible = false;
    }

    // Selection highlight
    if (world.selectedMCP === id) {
      const selPulse = 0.6 + Math.sin(frameCount * 0.1) * 0.3;
      entry.glowGfx.rect(px - 2, py - 2, SPRITE_PX + 4, SPRITE_PX + 4)
        .stroke({ color: 0xFFFFFF, alpha: selPulse, width: 1 });
      entry.glowGfx.rect(px - 3, py - 3, SPRITE_PX + 6, SPRITE_PX + 6)
        .stroke({ color: 0xFFFFFF, alpha: selPulse * 0.3, width: 1 });
    }
  }
}

// ---------- Docker Containers (Enhanced) ----------

function renderDockerContainers(scene, frameCount) {
  for (const [id, entry] of scene.dockerEntries) {
    const state = world.dockerStates.get(id);
    const running = state ? state.running : false;
    const px = entry.dc.col * GRID_SIZE;
    const py = entry.dc.row * GRID_SIZE;

    entry.sprite.texture = running
      ? scene.textures.docker.running
      : scene.textures.docker.stopped;

    entry.glowGfx.clear();

    // Ground shadow (all containers)
    entry.glowGfx.ellipse(px + SPRITE_PX / 2, py + SPRITE_PX + 1,
      SPRITE_PX / 2 + 1, 2)
      .fill({ color: 0x000000, alpha: running ? 0.15 : 0.08 });

    if (!running) {
      entry.sprite.tint = 0x4488AA;
      entry.sprite.alpha = 0.35;
      entry.label.alpha = 0.5;

      // Stopped indicator: red X overlay
      entry.glowGfx.moveTo(px + 4, py + 4)
        .lineTo(px + SPRITE_PX - 4, py + SPRITE_PX - 4)
        .stroke({ color: 0xFF4444, alpha: 0.25, width: 1 });
      entry.glowGfx.moveTo(px + SPRITE_PX - 4, py + 4)
        .lineTo(px + 4, py + SPRITE_PX - 4)
        .stroke({ color: 0xFF4444, alpha: 0.25, width: 1 });
    } else {
      entry.sprite.tint = 0xFFFFFF;
      entry.sprite.alpha = 1;
      entry.label.alpha = 0.85;

      // Running glow (Docker blue)
      const pulse = frameCount * 0.04 + entry.dc.col * 0.5;
      drawGlow(entry.glowGfx, px, py, SPRITE_PX, SPRITE_PX, 0x0DB7ED, 0.55, pulse);
      drawRimHighlight(entry.glowGfx, px, py, SPRITE_PX, 0x0DB7ED, 0.5);

      // Container status LED (top-right, green steady)
      const ledBreath = 0.7 + Math.sin(frameCount * 0.08 + entry.dc.col) * 0.2;
      entry.glowGfx.circle(px + SPRITE_PX - 3, py + 3, 1.5)
        .fill({ color: 0x44FF66, alpha: ledBreath });
      entry.glowGfx.circle(px + SPRITE_PX - 3, py + 3, 3)
        .fill({ color: 0x44FF66, alpha: ledBreath * 0.15 });

      // Network activity sparkle (intermittent)
      const sparkPhase = (frameCount * 0.18 + entry.dc.row * 3) % (Math.PI * 2);
      if (Math.sin(sparkPhase) > 0.7) {
        const sparkX = px + 2 + Math.abs(Math.sin(sparkPhase * 2.3)) * (SPRITE_PX - 4);
        entry.glowGfx.circle(sparkX, py + SPRITE_PX - 3, 1)
          .fill({ color: 0x88DDFF, alpha: 0.7 });
      }
    }
  }
}

// ---------- Agents (Enhanced: multi-layer glow, state effects) ----------

function renderAgents(scene, frameCount) {
  // Sync scene entries with world.agents
  for (const [id, agent] of world.agents) {
    if (!scene.agentEntries.has(id)) {
      createAgentEntry(scene, id, agent);
    }
    updateAgentEntry(scene, id, agent, frameCount);
  }

  // Remove stale entries
  for (const [id, entry] of scene.agentEntries) {
    if (!world.agents.has(id)) {
      entry.container.destroy({ children: true });
      scene.agentEntries.delete(id);
    }
  }
}

function createAgentEntry(scene, id, agent) {
  const { layers, textures } = scene;
  const container = new Container();
  container.label = `agent-${id}`;

  // Shadow
  const shadow = new Graphics();
  container.addChild(shadow);

  // Aura ring (outer ambient glow)
  const auraGfx = new Graphics();
  container.addChild(auraGfx);

  // Glow
  const glowGfx = new Graphics();
  container.addChild(glowGfx);

  // Sprite
  const tex = id === 'main'
    ? (textures.agent[agent.state] || textures.agent.idle)
    : (textures.subagent.active || textures.agent.idle);
  const sprite = new Sprite(tex);
  sprite.width = SPRITE_PX;
  sprite.height = SPRITE_PX;
  container.addChild(sprite);

  // State label (above sprite) with background
  const stateBg = new Graphics();
  container.addChild(stateBg);

  const stateLabel = new Text({
    text: '',
    style: { fontFamily: 'Courier New', fontSize: 9, fill: 0xFFFFFF }
  });
  stateLabel.anchor.set(0.5, 1);
  container.addChild(stateLabel);

  // Name label (below sprite)
  const nameLabel = new Text({
    text: id === 'main' ? 'CLAUDE' : id.slice(0, 6),
    style: { fontFamily: 'Courier New', fontSize: id === 'main' ? 11 : 8, fill: 0x88CC88 }
  });
  nameLabel.anchor.set(0.5, 0);
  container.addChild(nameLabel);

  // Tool label (below name)
  const toolLabel = new Text({
    text: '',
    style: { fontFamily: 'Courier New', fontSize: 7, fill: 0xAAAACC }
  });
  toolLabel.anchor.set(0.5, 0);
  container.addChild(toolLabel);

  // Blink cursor (coding state)
  const cursorGfx = new Graphics();
  container.addChild(cursorGfx);

  // State effect graphics (thinking particles, etc.)
  const effectGfx = new Graphics();
  container.addChild(effectGfx);

  layers.agents.addChild(container);
  scene.agentEntries.set(id, {
    container, sprite, shadow, auraGfx, glowGfx,
    stateBg, stateLabel, nameLabel, toolLabel,
    cursorGfx, effectGfx
  });
}

function updateAgentEntry(scene, id, agent, frameCount) {
  const entry = scene.agentEntries.get(id);
  if (!entry) return;

  const isMain = id === 'main';
  const state = agent.state || 'idle';

  // Bob animation (HeartGold style - gentle sine wave with breathing)
  const breathe = isMain ? Math.sin(frameCount * 0.025) * 0.5 : 0;
  const bob = isMain
    ? Math.sin(frameCount * 0.06) * 2.5 + breathe
    : Math.sin(frameCount * 0.04 + 1) * 1.2;

  // Position
  const px = Math.round(agent.x);
  const py = Math.round(agent.y + bob);

  entry.container.x = 0;
  entry.container.y = 0;

  // Sprite position & texture
  entry.sprite.x = px;
  entry.sprite.y = py;

  if (isMain) {
    const tex = getAnimTexture(scene.textures, state, frameCount);
    entry.sprite.texture = tex || scene.textures.agent.idle;
    entry.sprite.tint = 0xFFFFFF;
    // Scale pulse for active states (HeartGold character emphasis)
    const scalePulse = (state !== 'idle' && state !== 'waiting')
      ? 1.0 + Math.sin(frameCount * 0.08) * 0.015 : 1.0;
    entry.sprite.scale.set(SPRITE_SCALE * scalePulse);
  } else {
    entry.sprite.texture = scene.textures.subagent.active || scene.textures.agent.idle;
    entry.sprite.tint = state === 'error' ? 0xFF4444 : 0xFFFFFF;
  }

  // Shadow (elliptical, multi-layer for depth)
  entry.shadow.clear();
  const shadowW = isMain ? SPRITE_PX - 2 : SPRITE_PX - 8;
  const shadowH = isMain ? 6 : 3;
  const shadowY = Math.round(agent.y) + SPRITE_PX - 1;
  // Outer soft shadow
  if (isMain) {
    entry.shadow.ellipse(px + SPRITE_PX / 2, shadowY + shadowH / 2 + 1,
      shadowW / 2 + 3, shadowH / 2 + 2)
      .fill({ color: 0x000000, alpha: 0.12 });
  }
  // Core shadow
  entry.shadow.ellipse(px + SPRITE_PX / 2, shadowY + shadowH / 2, shadowW / 2, shadowH / 2)
    .fill({ color: 0x000000, alpha: isMain ? 0.35 : 0.25 });
  // Shadow highlight (faint reflection from ground)
  if (isMain) {
    entry.shadow.ellipse(px + SPRITE_PX / 2, shadowY + shadowH / 2 - 1,
      shadowW / 4, 1)
      .fill({ color: STATE_COLORS[state] || 0x8888AA, alpha: 0.06 });
  }

  // Aura ring (ambient multi-ring glow, HeartGold overworld style)
  entry.auraGfx.clear();
  if (isMain) {
    const stateCol = STATE_COLORS[state] || 0x8888AA;
    const cx = px + SPRITE_PX / 2;
    const cy = py + SPRITE_PX / 2;
    // Outer ambient ring (large, very soft)
    const auraPhase1 = frameCount * 0.02;
    const auraAlpha1 = 0.025 + Math.sin(auraPhase1) * 0.015;
    entry.auraGfx.circle(cx, cy, SPRITE_PX * 1.8)
      .fill({ color: stateCol, alpha: auraAlpha1 });
    // Mid ring (pulsing)
    const auraPhase2 = frameCount * 0.04;
    const auraAlpha2 = 0.04 + Math.sin(auraPhase2) * 0.025;
    entry.auraGfx.circle(cx, cy, SPRITE_PX * 1.2)
      .fill({ color: stateCol, alpha: auraAlpha2 });
    // Inner bright core ring
    const auraAlpha3 = 0.06 + Math.sin(frameCount * 0.06) * 0.03;
    entry.auraGfx.circle(cx, cy, SPRITE_PX * 0.7)
      .fill({ color: stateCol, alpha: auraAlpha3 });
    // Ground aura reflection
    entry.auraGfx.ellipse(cx, shadowY + 3, SPRITE_PX * 0.6, 3)
      .fill({ color: stateCol, alpha: auraAlpha2 * 0.5 });
  }

  // Glow (enhanced multi-layer with pulse)
  entry.glowGfx.clear();
  const stateColor = STATE_COLORS[state] || 0x8888AA;
  const baseIntensity = (state === 'idle' || state === 'waiting') ? 0.3 : 0.9;
  const pulsePhase = frameCount * 0.07;
  drawGlow(entry.glowGfx, px, py, SPRITE_PX, SPRITE_PX, stateColor, baseIntensity, pulsePhase);

  // Rim highlight on sprite (always for main, brighter when active)
  if (isMain) {
    const rimAlpha = (state !== 'idle' && state !== 'waiting') ? 0.6 : 0.2;
    drawRimHighlight(entry.glowGfx, px, py, SPRITE_PX, stateColor, rimAlpha);
  }

  // State label with background panel
  if (isMain) {
    const labelText = STATE_LABELS[state] || state.toUpperCase();
    entry.stateLabel.text = labelText;
    entry.stateLabel.style.fill = stateColor;
    entry.stateLabel.x = px + SPRITE_PX / 2;
    entry.stateLabel.y = py - 6;
    entry.stateLabel.visible = true;

    // Background panel for state label
    entry.stateBg.clear();
    const tw = labelText.length * 5 + 6;
    const tx = px + SPRITE_PX / 2 - tw / 2;
    const ty = py - 17;
    entry.stateBg.roundRect(tx, ty, tw, 11, 2)
      .fill({ color: 0x0A0A18, alpha: 0.65 });
  } else {
    entry.stateLabel.visible = false;
    entry.stateBg.clear();
  }

  // Name label
  entry.nameLabel.x = px + SPRITE_PX / 2;
  entry.nameLabel.y = py + SPRITE_PX + 4;

  // Tool label
  if (isMain && agent.toolName) {
    entry.toolLabel.text = agent.toolName;
    entry.toolLabel.x = px + SPRITE_PX / 2;
    entry.toolLabel.y = py + SPRITE_PX + 16;
    entry.toolLabel.visible = true;
  } else {
    entry.toolLabel.visible = false;
  }

  // State-specific effects
  entry.effectGfx.clear();
  entry.cursorGfx.clear();

  if (isMain) {
    const cx = px + SPRITE_PX / 2;
    const cy = py + SPRITE_PX / 2;

    switch (state) {
      case 'coding':
        // -- Terminal screen glow behind agent --
        {
          const screenW = SPRITE_PX + 12;
          const screenH = SPRITE_PX + 8;
          const screenX = cx - screenW / 2;
          const screenY = py - 2;
          const screenPulse = 0.12 + Math.sin(frameCount * 0.04) * 0.04;
          entry.effectGfx.roundRect(screenX, screenY, screenW, screenH, 2)
            .fill({ color: 0x003322, alpha: screenPulse });
          entry.effectGfx.roundRect(screenX, screenY, screenW, screenH, 2)
            .stroke({ color: 0x00FF88, alpha: 0.15, width: 1 });
        }
        // -- Blinking cursor with glow --
        if (world.blinkPhase) {
          const curX = px + SPRITE_PX + 5;
          const curY = py + SPRITE_PX / 2 - 4;
          // Cursor glow
          entry.cursorGfx.rect(curX - 1, curY - 1, 4, 10)
            .fill({ color: 0x00FF88, alpha: 0.2 });
          // Cursor body
          entry.cursorGfx.rect(curX, curY, 2, 8)
            .fill({ color: 0x00FF88, alpha: 0.95 });
        }
        // -- Floating code fragments (multiple, staggered) --
        for (let p = 0; p < 3; p++) {
          const seed = (frameCount + p * 17) % 36;
          const lifeT = seed / 36;
          const ox = (Math.sin(p * 2.7 + frameCount * 0.02) * 12);
          const oy = -lifeT * 20 - 4;
          const fadeAlpha = (1 - lifeT) * 0.5;
          if (fadeAlpha > 0.05) {
            // Code line (varied widths)
            const lineW = 3 + (p % 3) * 2;
            entry.effectGfx.rect(cx + ox - lineW / 2, py + oy, lineW, 1)
              .fill({ color: 0x00FF88, alpha: fadeAlpha });
          }
        }
        // -- Typing sparkle at cursor tip --
        if (world.blinkPhase && frameCount % 8 < 4) {
          const sparkX = px + SPRITE_PX + 7 + Math.random() * 3;
          const sparkY = py + SPRITE_PX / 2 - 3 + Math.random() * 6;
          entry.effectGfx.rect(sparkX, sparkY, 1, 1)
            .fill({ color: 0x88FFBB, alpha: 0.7 });
        }
        break;

      case 'thinking':
        // -- Thought bubble (pixel art "..." above head) --
        {
          const bubbleY = py - 22;
          const bubbleX = cx + 6;
          // Bubble background
          entry.effectGfx.roundRect(bubbleX - 8, bubbleY - 4, 20, 10, 3)
            .fill({ color: 0x2A2040, alpha: 0.7 });
          entry.effectGfx.roundRect(bubbleX - 8, bubbleY - 4, 20, 10, 3)
            .stroke({ color: 0xCC88FF, alpha: 0.35, width: 1 });
          // Bubble tail (2 small dots)
          entry.effectGfx.circle(bubbleX - 4, bubbleY + 8, 1.5)
            .fill({ color: 0x2A2040, alpha: 0.5 });
          entry.effectGfx.circle(bubbleX - 6, bubbleY + 11, 1)
            .fill({ color: 0x2A2040, alpha: 0.35 });
          // Animated dots inside bubble
          const dotPhase = Math.floor(frameCount / 15) % 4;
          for (let d = 0; d < 3; d++) {
            const dotOn = d < dotPhase;
            entry.effectGfx.circle(bubbleX - 3 + d * 5, bubbleY + 1, 1.2)
              .fill({ color: 0xCC88FF, alpha: dotOn ? 0.8 : 0.15 });
          }
        }
        // -- Orbiting thought particles with comet trails --
        for (let i = 0; i < 3; i++) {
          const angle = frameCount * 0.07 + (i * Math.PI * 2 / 3);
          const orbitR = 22 + Math.sin(frameCount * 0.03 + i) * 3;
          const dotX = cx + Math.cos(angle) * orbitR;
          const dotY = cy + Math.sin(angle) * orbitR * 0.45;
          const dotAlpha = 0.45 + Math.sin(angle + frameCount * 0.05) * 0.25;
          // Comet trail (5 segments)
          for (let t = 1; t <= 5; t++) {
            const ta = angle - t * 0.12;
            const tr = orbitR + t * 0.3;
            const tx2 = cx + Math.cos(ta) * tr;
            const ty2 = cy + Math.sin(ta) * tr * 0.45;
            entry.effectGfx.circle(tx2, ty2, 1.2 - t * 0.15)
              .fill({ color: 0xBB77EE, alpha: (dotAlpha - t * 0.08) * 0.5 });
          }
          // Head dot
          entry.effectGfx.circle(dotX, dotY, 2)
            .fill({ color: 0xCC88FF, alpha: dotAlpha });
          // Bright core
          entry.effectGfx.circle(dotX, dotY, 0.8)
            .fill({ color: 0xEECCFF, alpha: dotAlpha * 0.8 });
        }
        // -- Pulsing thought aura ring --
        {
          const thinkPulse = 0.08 + Math.sin(frameCount * 0.05) * 0.04;
          entry.effectGfx.circle(cx, cy, 26)
            .stroke({ color: 0xCC88FF, alpha: thinkPulse, width: 1 });
        }
        break;

      case 'searching':
        // -- Radar circle outline --
        {
          const radarR = 22;
          const radarAlpha = 0.12 + Math.sin(frameCount * 0.04) * 0.04;
          entry.effectGfx.circle(cx, cy, radarR)
            .stroke({ color: 0xFFCC44, alpha: radarAlpha, width: 1 });
          // Inner circle
          entry.effectGfx.circle(cx, cy, radarR * 0.5)
            .stroke({ color: 0xFFCC44, alpha: radarAlpha * 0.6, width: 0.5 });
          // Cross-hairs
          entry.effectGfx.moveTo(cx - radarR, cy).lineTo(cx + radarR, cy)
            .stroke({ color: 0xFFCC44, alpha: radarAlpha * 0.3, width: 0.5 });
          entry.effectGfx.moveTo(cx, cy - radarR).lineTo(cx, cy + radarR)
            .stroke({ color: 0xFFCC44, alpha: radarAlpha * 0.3, width: 0.5 });
        }
        // -- Radar sweep beam --
        {
          const sweepAngle = frameCount * 0.055;
          const beamLen = 22;
          // Swept area (fading arc rendered as trail segments)
          for (let t = 0; t < 12; t++) {
            const ta = sweepAngle - t * 0.08;
            const tx2 = cx + Math.cos(ta) * beamLen;
            const ty2 = cy + Math.sin(ta) * beamLen;
            const tAlpha = (0.35 - t * 0.028);
            if (tAlpha > 0) {
              entry.effectGfx.moveTo(cx, cy).lineTo(tx2, ty2)
                .stroke({ color: 0xFFCC44, alpha: tAlpha, width: 1 });
            }
          }
          // Sweep head dot (bright)
          const headX = cx + Math.cos(sweepAngle) * beamLen;
          const headY = cy + Math.sin(sweepAngle) * beamLen;
          entry.effectGfx.circle(headX, headY, 2.5)
            .fill({ color: 0xFFDD66, alpha: 0.8 });
          entry.effectGfx.circle(headX, headY, 1)
            .fill({ color: 0xFFFFAA, alpha: 0.9 });
        }
        // -- "Ping" blips at discovered positions --
        for (let p = 0; p < 2; p++) {
          const pingAge = (frameCount + p * 30) % 60;
          if (pingAge < 30) {
            const pingAngle = (p * 2.1 + 0.5);
            const pingR = 10 + p * 7;
            const pingX = cx + Math.cos(pingAngle) * pingR;
            const pingY = cy + Math.sin(pingAngle) * pingR;
            const pingAlpha = (1 - pingAge / 30) * 0.6;
            entry.effectGfx.circle(pingX, pingY, 1.5 + pingAge * 0.05)
              .fill({ color: 0xFFEE88, alpha: pingAlpha });
          }
        }
        break;

      case 'error':
        // -- Dramatic warning flash with double border --
        {
          const errPhase = Math.sin(frameCount * 0.18);
          const errFlash = errPhase > 0;
          const errIntensity = Math.abs(errPhase);
          if (errFlash) {
            // Inner red border
            entry.effectGfx.rect(px - 1, py - 1, SPRITE_PX + 2, SPRITE_PX + 2)
              .stroke({ color: 0xFF4444, alpha: 0.5 * errIntensity, width: 1 });
            // Outer pulsing border
            entry.effectGfx.rect(px - 3, py - 3, SPRITE_PX + 6, SPRITE_PX + 6)
              .stroke({ color: 0xFF2222, alpha: 0.25 * errIntensity, width: 1 });
          }
          // -- Red ambient glow --
          const errGlow = 0.06 + Math.abs(Math.sin(frameCount * 0.1)) * 0.08;
          entry.effectGfx.roundRect(px - 6, py - 6, SPRITE_PX + 12, SPRITE_PX + 12, 3)
            .fill({ color: 0xFF0000, alpha: errGlow });
          // -- Warning "X" marks (corners) --
          const xAlpha = 0.3 + errIntensity * 0.3;
          const xOff = 4;
          // Top-left X
          entry.effectGfx.moveTo(px - xOff - 2, py - xOff - 2).lineTo(px - xOff + 2, py - xOff + 2)
            .stroke({ color: 0xFF4444, alpha: xAlpha, width: 1 });
          entry.effectGfx.moveTo(px - xOff + 2, py - xOff - 2).lineTo(px - xOff - 2, py - xOff + 2)
            .stroke({ color: 0xFF4444, alpha: xAlpha, width: 1 });
          // Top-right X
          entry.effectGfx.moveTo(px + SPRITE_PX + xOff - 2, py - xOff - 2).lineTo(px + SPRITE_PX + xOff + 2, py - xOff + 2)
            .stroke({ color: 0xFF4444, alpha: xAlpha, width: 1 });
          entry.effectGfx.moveTo(px + SPRITE_PX + xOff + 2, py - xOff - 2).lineTo(px + SPRITE_PX + xOff - 2, py - xOff + 2)
            .stroke({ color: 0xFF4444, alpha: xAlpha, width: 1 });
          // -- Red error particles falling --
          for (let ep = 0; ep < 2; ep++) {
            const epSeed = (frameCount + ep * 23) % 40;
            const epLife = epSeed / 40;
            const epX = cx + Math.sin(ep * 3.7 + frameCount * 0.03) * 8;
            const epY = py - 4 + epLife * 28;
            const epAlpha2 = (1 - epLife) * 0.4;
            if (epAlpha2 > 0.05) {
              entry.effectGfx.rect(epX, epY, 1, 1)
                .fill({ color: 0xFF6644, alpha: epAlpha2 });
            }
          }
        }
        break;

      case 'testing':
        // -- Mini progress bar --
        {
          const barW = 24;
          const barH = 4;
          const barX2 = px + SPRITE_PX + 5;
          const barY2 = py + SPRITE_PX / 2 - barH / 2;
          const testProgress = (frameCount % 120) / 120;
          // Bar background
          entry.effectGfx.rect(barX2, barY2, barW, barH)
            .fill({ color: 0x0A0A18, alpha: 0.6 });
          entry.effectGfx.rect(barX2, barY2, barW, barH)
            .stroke({ color: 0x44CCCC, alpha: 0.25, width: 0.5 });
          // Fill (animated)
          const fillW = barW * testProgress;
          const barColor = testProgress > 0.8 ? 0x44FF88 : 0x44CCCC;
          entry.effectGfx.rect(barX2, barY2, fillW, barH)
            .fill({ color: barColor, alpha: 0.7 });
          // Bright leading edge
          if (fillW > 1) {
            entry.effectGfx.rect(barX2 + fillW - 1, barY2, 1, barH)
              .fill({ color: 0xAAFFFF, alpha: 0.9 });
          }
          // Segment markers
          for (let s = 1; s < 4; s++) {
            const sx2 = barX2 + (barW * s / 4);
            entry.effectGfx.rect(sx2, barY2, 0.5, barH)
              .fill({ color: 0x0A0A18, alpha: 0.4 });
          }
        }
        // -- Cycling status dots (pass/fail indicators) --
        {
          const dotCount = 5;
          const activeDot = Math.floor(frameCount / 12) % dotCount;
          for (let d = 0; d < dotCount; d++) {
            const dotX2 = px + SPRITE_PX + 6 + d * 5;
            const dotY2 = py + SPRITE_PX / 2 + 6;
            const done = d < activeDot;
            const current = d === activeDot;
            const dotColor2 = done ? 0x44FF88 : (current ? 0x44CCCC : 0x222244);
            const dotA2 = done ? 0.7 : (current ? 0.9 : 0.2);
            entry.effectGfx.rect(dotX2, dotY2, 2, 2)
              .fill({ color: dotColor2, alpha: dotA2 });
          }
        }
        // -- Checkmark sparkle on cycle complete --
        {
          const cyclePos = frameCount % 120;
          if (cyclePos > 100 && cyclePos < 115) {
            const sparkAlpha = (1 - (cyclePos - 100) / 15) * 0.7;
            // Small checkmark
            entry.effectGfx.moveTo(px + SPRITE_PX + 8, py + SPRITE_PX / 2 + 14)
              .lineTo(px + SPRITE_PX + 10, py + SPRITE_PX / 2 + 16)
              .lineTo(px + SPRITE_PX + 14, py + SPRITE_PX / 2 + 11)
              .stroke({ color: 0x44FF88, alpha: sparkAlpha, width: 1 });
          }
        }
        break;
    }
  }

  // Selection highlight
  if (world.selectedAgent === id) {
    const selPulse = 0.6 + Math.sin(frameCount * 0.1) * 0.3;
    entry.glowGfx.rect(px - 2, py - 2, SPRITE_PX + 4, SPRITE_PX + 4)
      .stroke({ color: 0xFFFFFF, alpha: selPulse, width: 1 });
    entry.glowGfx.rect(px - 4, py - 4, SPRITE_PX + 8, SPRITE_PX + 8)
      .stroke({ color: 0xFFFFFF, alpha: selPulse * 0.25, width: 1 });
  }
}

// ---------- HUD: Token Bar (Enhanced) ----------

function renderTokenBar(scene, frameCount) {
  const g = scene.tokenBarGfx;
  g.clear();

  const budget = world.session.tokenBudget;
  if (!budget || budget.total <= 0) {
    scene.tokenLabel.visible = false;
    scene.tokenPctText.visible = false;
    return;
  }

  const barX = 10;
  const barY = scene.canvasH - 32;
  const barW = 240;
  const barH = 16;
  const ratio = Math.min(1, budget.used / budget.total);

  // Bar outer frame (dark panel)
  g.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 2)
    .fill({ color: 0x0A0A18, alpha: 0.8 });

  // Background
  g.rect(barX, barY, barW, barH).fill({ color: 0x1A1A32, alpha: 1 });

  // Fill color (green -> yellow -> red with smooth transition)
  let fillColor;
  if (ratio < 0.5) fillColor = 0x00FF88;
  else if (ratio < 0.75) fillColor = 0xFFCC44;
  else fillColor = 0xFF4444;

  if (ratio > 0) {
    const fillW = (barW - 2) * ratio;
    // Fill glow (slightly wider)
    g.rect(barX + 1, barY, fillW, barH)
      .fill({ color: fillColor, alpha: 0.15 });
    // Fill core
    g.rect(barX + 1, barY + 1, fillW, barH - 2)
      .fill({ color: fillColor, alpha: 0.75 });
    // Fill highlight (top stripe)
    g.rect(barX + 1, barY + 1, fillW, 2)
      .fill({ color: 0xFFFFFF, alpha: 0.15 });
  }

  // Segment marks at 25%, 50%, 75%
  for (const pct of [0.25, 0.5, 0.75]) {
    const mx = barX + barW * pct;
    g.moveTo(mx, barY).lineTo(mx, barY + barH)
      .stroke({ color: 0x333355, alpha: 0.5, width: 1 });
  }

  // Border
  g.rect(barX, barY, barW, barH)
    .stroke({ color: 0x444466, alpha: 0.8, width: 1 });

  // Warning pulse when high usage
  if (ratio > 0.8) {
    const warnPulse = 0.15 + Math.sin(frameCount * 0.1) * 0.1;
    g.rect(barX - 1, barY - 1, barW + 2, barH + 2)
      .stroke({ color: 0xFF4444, alpha: warnPulse, width: 1 });
  }

  // "TOKEN BUDGET" label
  scene.tokenLabel.text = 'TOKEN BUDGET';
  scene.tokenLabel.x = barX;
  scene.tokenLabel.y = barY - 14;
  scene.tokenLabel.visible = true;

  // Percentage text
  const pct = Math.round(ratio * 100);
  scene.tokenPctText.text = `${pct}% (${formatNumber(budget.used)}/${formatNumber(budget.total)})`;
  scene.tokenPctText.style.fill = fillColor;
  scene.tokenPctText.x = barX + barW + 6;
  scene.tokenPctText.y = barY + 1;
  scene.tokenPctText.visible = true;
}

// ---------- HUD: Session Cost (Enhanced) ----------

function renderSessionCost(scene) {
  const cost = world.session.cost || 0;
  const costStr = cost >= 1 ? `$${cost.toFixed(2)}` : `$${cost.toFixed(4)}`;
  scene.costText.text = `COST: ${costStr}`;
  scene.costText.x = scene.canvasW - scene.costText.width - 10;
  scene.costText.y = scene.canvasH - 22;
}

// ---------- HUD: Task Summary (Enhanced) ----------

function renderTaskSummary(scene) {
  const tasks = world.tasks;
  if (!tasks) {
    scene.taskText.visible = false;
    return;
  }
  scene.taskText.visible = true;
  const done = tasks.done || 0;
  const total = tasks.total || 0;
  scene.taskText.text = `TASKS: ${done}/${total}`;
  if (done === total && total > 0) {
    scene.taskText.style.fill = 0x00FF88;
  } else {
    scene.taskText.style.fill = 0x666688;
  }
  scene.taskText.x = 10;
  scene.taskText.y = scene.canvasH - 50;
}

// ========== RESIZE ==========

export function handleResize(scene, w, h) {
  scene.canvasW = w;
  scene.canvasH = h;

  // Redraw static elements
  drawZones(scene.zoneGfx);
  drawGrid(scene.gridGfx, w, h);
  drawScanlines(scene.scanlineGfx, w, h);

  // Recreate vignette
  if (scene.vignetteSprite) {
    scene.vignetteSprite.destroy();
  }
  scene.vignetteSprite = createVignetteSprite(w, h);
  scene.layers.post.addChild(scene.vignetteSprite);

  // Reinit star field
  initStarField(w, h);
}

// ========== INTERACTION ==========

export function setupInteraction(app, scene) {
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  app.stage.on('pointerdown', (e) => {
    const pos = e.global;
    const mx = pos.x;
    const my = pos.y;

    // Check agents
    for (const [id, agent] of world.agents) {
      const ax = agent.x;
      const ay = agent.y;
      if (mx >= ax && mx <= ax + SPRITE_PX && my >= ay && my <= ay + SPRITE_PX) {
        world.selectedAgent = id;
        world.selectedMCP = null;
        showAgentDetails(id, agent);
        return;
      }
    }

    // Check MCP servers
    for (const srv of MCP_SERVERS) {
      const sx = srv.col * GRID_SIZE;
      const sy = srv.row * GRID_SIZE;
      if (mx >= sx && mx <= sx + SPRITE_PX && my >= sy && my <= sy + SPRITE_PX) {
        world.selectedMCP = srv.id;
        world.selectedAgent = null;
        showMCPDetails(srv.id, srv);
        return;
      }
    }

    // Deselect
    world.selectedMCP = null;
    world.selectedAgent = null;
    hideDetails();
  });
}

// ========== DOM DETAIL PANELS ==========

function showAgentDetails(id, agent) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;
  const state = agent.state || 'idle';
  panel.innerHTML = `
    <div class="detail-header">Agent: ${escapeHtml(id)}</div>
    <div class="detail-row">State: <span style="color:${cssStateColor(state)}">${escapeHtml(state)}</span></div>
    <div class="detail-row">Tool: ${escapeHtml(agent.toolName || 'none')}</div>
    <div class="detail-row">Position: (${Math.round(agent.x)}, ${Math.round(agent.y)})</div>
  `;
  panel.style.display = 'block';
}

function showMCPDetails(id, srv) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;
  const state = world.mcpStates.get(id);
  panel.innerHTML = `
    <div class="detail-header">MCP: ${escapeHtml(srv.id)}</div>
    <div class="detail-row">Category: ${escapeHtml(srv.category)}</div>
    <div class="detail-row">Active: ${state ? state.active : false}</div>
    <div class="detail-row">Uses: ${state ? state.useCount : 0}</div>
    <div class="detail-row">Last tool: ${escapeHtml(state ? state.lastTool || 'none' : 'none')}</div>
    ${state && state.lastUpdate ? `<div class="detail-row">Last: ${timeSince(state.lastUpdate)}</div>` : ''}
  `;
  panel.style.display = 'block';
}

function hideDetails() {
  const panel = document.getElementById('detail-panel');
  if (panel) panel.style.display = 'none';
}

// ========== UTILITIES ==========

const CSS_STATE_COLORS = {
  idle: '#8888AA', thinking: '#CC88FF', coding: '#00FF88',
  searching: '#FFCC44', testing: '#44CCCC', waiting: '#AAAAAA',
  error: '#FF4444', recovering: '#FFAA44'
};

function cssStateColor(state) {
  return CSS_STATE_COLORS[state] || '#8888AA';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function timeSince(date) {
  const sec = Math.floor((Date.now() - date) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}
