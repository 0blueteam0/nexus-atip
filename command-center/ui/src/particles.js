/**
 * Particles - Particle System Engine (ESM + PixiJS v8)
 *
 * 4 particle subsystems + star field background.
 * Spawn/update logic preserved from Canvas 2D version.
 * Rendering via PixiJS Graphics (pixel-art rectangles).
 *
 * Color format: 0xRRGGBBAA
 *   PixiJS color = (c >> 8) & 0xFFFFFF
 *   PixiJS alpha  = (c & 0xFF) / 255
 */

import { Graphics } from 'pixi.js';

// ========== COLOR HELPERS ==========

function extractRGB(c) {
  return (c >> 8) & 0xFFFFFF;
}

function extractAlpha(c) {
  return (c & 0xFF) / 255;
}

// ========== PARTICLE POOL ==========

export const particles = {
  data: [],       // data flow particles (agent -> MCP)
  ambient: [],    // floating ambient particles (dust, motes)
  sparks: [],     // spark/flash effects
  trails: [],     // agent movement trails
  maxData: 150,
  maxAmbient: 100,
  maxSparks: 60,
  maxTrails: 120
};

// ========== STATE COLOR MAPPING ==========

export const STATE_PARTICLE_COLORS = {
  idle:       0x8888AAFF,
  thinking:   0xCC88FFFF,
  coding:     0x00FF88FF,
  searching:  0xFFCC44FF,
  testing:    0x44CCCCFF,
  waiting:    0xAAAAAAFF,
  error:      0xFF4444FF,
  recovering: 0xFFAA44FF
};

export function getStateParticleColor(state) {
  return STATE_PARTICLE_COLORS[state] || STATE_PARTICLE_COLORS.idle;
}

// ========== STAR FIELD ==========

export const starField = [];
export const STAR_COUNT = 220;

// Multi-color star palette (NDS style: warm whites, cool blues, rare gold)
const STAR_COLORS = [
  0x8899CC, // cool blue (common)
  0x6478B4, // dim blue (common)
  0xAABBDD, // bright blue-white (uncommon)
  0xCCCCEE, // near-white (uncommon)
  0xEEDDAA, // warm gold (rare)
  0xBB99CC, // faint purple (rare)
];

export function initStarField(canvasW, canvasH) {
  starField.length = 0;
  for (let i = 0; i < STAR_COUNT; i++) {
    const r = Math.random();
    // 60% small, 25% medium, 10% large, 5% cross-shaped
    const type = r < 0.60 ? 'dot' : r < 0.85 ? 'medium' : r < 0.95 ? 'large' : 'cross';
    const colorIdx = Math.random() < 0.5 ? (Math.random() < 0.7 ? 0 : 1)
      : Math.random() < 0.6 ? 2 : Math.random() < 0.5 ? 3
      : Math.random() < 0.5 ? 4 : 5;
    starField.push({
      x: Math.random() * canvasW,
      y: Math.random() * canvasH,
      size: type === 'dot' ? 1 : type === 'medium' ? 2 : type === 'large' ? 3 : 1,
      type,
      color: STAR_COLORS[colorIdx],
      brightness: type === 'dot' ? 0.12 + Math.random() * 0.25
        : type === 'cross' ? 0.3 + Math.random() * 0.4
        : 0.15 + Math.random() * 0.35,
      twinkleSpeed: 0.4 + Math.random() * 2.5,
      twinkleOffset: Math.random() * Math.PI * 2
    });
  }
}

// ========== DATA FLOW PARTICLES ==========

export function spawnDataParticle(fromX, fromY, toX, toY, color) {
  if (particles.data.length >= particles.maxData) {
    particles.data.shift();
  }

  const speed = 1.5 + Math.random() * 1.5;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 10) return;

  particles.data.push({
    x: fromX + (Math.random() - 0.5) * 4,
    y: fromY + (Math.random() - 0.5) * 4,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    targetX: toX,
    targetY: toY,
    life: dist / speed,
    maxLife: dist / speed,
    color: color || 0x00FF88FF,
    size: 2 + Math.random() * 2
  });
}

export function updateDataParticles() {
  for (let i = particles.data.length - 1; i >= 0; i--) {
    const p = particles.data[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    if (p.life <= 0) {
      spawnSpark(p.targetX, p.targetY, p.color, 3);
      particles.data.splice(i, 1);
    }
  }
}

// ========== AMBIENT PARTICLES ==========

export function spawnAmbientParticle(canvasW, canvasH) {
  if (particles.ambient.length >= particles.maxAmbient) return;

  const edge = Math.floor(Math.random() * 4);
  let x, y, vx, vy;

  switch (edge) {
    case 0: x = Math.random() * canvasW; y = -5; vx = (Math.random() - 0.5) * 0.3; vy = 0.1 + Math.random() * 0.3; break;
    case 1: x = canvasW + 5; y = Math.random() * canvasH; vx = -0.1 - Math.random() * 0.3; vy = (Math.random() - 0.5) * 0.3; break;
    case 2: x = Math.random() * canvasW; y = canvasH + 5; vx = (Math.random() - 0.5) * 0.3; vy = -0.1 - Math.random() * 0.3; break;
    default: x = -5; y = Math.random() * canvasH; vx = 0.1 + Math.random() * 0.3; vy = (Math.random() - 0.5) * 0.3; break;
  }

  const colors = [
    0x2244AAFF, 0x22AA66FF, 0x664488FF, 0x448888FF,
    0x3366BBFF, 0x33BB77FF, 0x8866AAFF, 0x558899FF
  ];

  particles.ambient.push({
    x, y, vx, vy,
    life: 400 + Math.random() * 400,
    maxLife: 400 + Math.random() * 400,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 1 + Math.random() * 2.5
  });
}

export function updateAmbientParticles() {
  for (let i = particles.ambient.length - 1; i >= 0; i--) {
    const p = particles.ambient[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    if (p.life <= 0) {
      particles.ambient.splice(i, 1);
    }
  }
}

// ========== SPARK EFFECTS ==========

export function spawnSpark(x, y, color, count) {
  count = count || 5;
  for (let i = 0; i < count; i++) {
    if (particles.sparks.length >= particles.maxSparks) {
      particles.sparks.shift();
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;

    particles.sparks.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 15 + Math.random() * 20,
      maxLife: 15 + Math.random() * 20,
      color: color || 0x00FF88FF,
      size: 1 + Math.random() * 2
    });
  }
}

export function updateSparks() {
  for (let i = particles.sparks.length - 1; i >= 0; i--) {
    const p = particles.sparks[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.life--;

    if (p.life <= 0) {
      particles.sparks.splice(i, 1);
    }
  }
}

// ========== AGENT TRAILS ==========

export function spawnTrailParticle(x, y, color) {
  if (particles.trails.length >= particles.maxTrails) {
    particles.trails.shift();
  }

  particles.trails.push({
    x: x + (Math.random() - 0.5) * 4,
    y: y + (Math.random() - 0.5) * 4,
    life: 20 + Math.random() * 15,
    maxLife: 20 + Math.random() * 15,
    color: color || 0x00FF88FF,
    size: 1 + Math.random()
  });
}

export function updateTrails() {
  for (let i = particles.trails.length - 1; i >= 0; i--) {
    particles.trails[i].life--;
    if (particles.trails[i].life <= 0) {
      particles.trails.splice(i, 1);
    }
  }
}

// ========== MASTER UPDATE ==========

export function updateParticles(canvasW, canvasH, frameCount) {
  updateDataParticles();
  updateAmbientParticles();
  updateSparks();
  updateTrails();

  // Spawn ambient particles periodically (2 per cycle for denser field)
  if (frameCount % 5 === 0) {
    spawnAmbientParticle(canvasW, canvasH);
    if (Math.random() < 0.4) spawnAmbientParticle(canvasW, canvasH);
  }
}

// ========== PIXI GRAPHICS FACTORY ==========

/**
 * Create Graphics objects for each particle layer.
 * Add these to appropriate render containers in pixi-renderer.
 */
export function createParticleGraphics() {
  return {
    stars:   new Graphics(),
    ambient: new Graphics(),
    trails:  new Graphics(),
    data:    new Graphics(),
    sparks:  new Graphics()
  };
}

// ========== PIXI RENDERING ==========

/**
 * Render all particle systems into their Graphics objects.
 * Called once per frame from the game loop.
 */
export function renderParticles(gfx, frameCount) {
  renderStarField(gfx.stars, frameCount);
  renderAmbientParticles(gfx.ambient);
  renderTrails(gfx.trails);
  renderDataParticles(gfx.data);
  renderSparks(gfx.sparks);
}

// ---------- Star Field ----------

function renderStarField(g, frameCount) {
  g.clear();

  for (const star of starField) {
    const twinkle = Math.sin(frameCount * 0.02 * star.twinkleSpeed + star.twinkleOffset);
    const alpha = star.brightness + twinkle * 0.18;
    if (alpha <= 0.02) continue;
    const a = Math.max(0, alpha);

    const sx = Math.round(star.x);
    const sy = Math.round(star.y);
    const col = star.color;

    if (star.type === 'cross') {
      // NDS-style cross sparkle (4 arms + center)
      g.rect(sx, sy, 1, 1).fill({ color: col, alpha: a });
      g.rect(sx - 1, sy, 1, 1).fill({ color: col, alpha: a * 0.5 });
      g.rect(sx + 1, sy, 1, 1).fill({ color: col, alpha: a * 0.5 });
      g.rect(sx, sy - 1, 1, 1).fill({ color: col, alpha: a * 0.5 });
      g.rect(sx, sy + 1, 1, 1).fill({ color: col, alpha: a * 0.5 });
    } else if (star.type === 'large') {
      // 3px star with soft halo
      g.rect(sx - 1, sy - 1, 3, 3).fill({ color: col, alpha: a * 0.25 });
      g.rect(sx, sy, 1, 1).fill({ color: 0xFFFFFF, alpha: a * 0.7 });
    } else {
      g.rect(sx, sy, star.size, star.size)
        .fill({ color: col, alpha: a });
    }
  }
}

// ---------- Data Flow Particles ----------

function renderDataParticles(g) {
  g.clear();

  for (const p of particles.data) {
    const lifeAlpha = Math.min(1, p.life / (p.maxLife * 0.3));
    const rgb = extractRGB(p.color);
    const px = Math.round(p.x);
    const py = Math.round(p.y);
    const sz = Math.round(p.size);

    // Glow halo (larger, dimmer)
    g.rect(px - 2, py - 2, sz + 4, sz + 4)
      .fill({ color: rgb, alpha: lifeAlpha * 0.3 });

    // Core pixel
    g.rect(px, py, sz, sz)
      .fill({ color: rgb, alpha: lifeAlpha * 0.9 });

    // Bright center highlight
    const innerSz = Math.max(1, sz - 2);
    g.rect(px + 1, py + 1, innerSz, innerSz)
      .fill({ color: 0xFFFFFF, alpha: lifeAlpha * 0.5 });
  }
}

// ---------- Ambient Particles ----------

function renderAmbientParticles(g) {
  g.clear();

  for (const p of particles.ambient) {
    const fadeIn = Math.min(1, (p.maxLife - p.life) / 60);
    const fadeOut = Math.min(1, p.life / 60);
    const alpha = Math.min(fadeIn, fadeOut) * 0.55;
    if (alpha <= 0) continue;

    const rgb = extractRGB(p.color);

    g.rect(
      Math.round(p.x),
      Math.round(p.y),
      Math.round(p.size),
      Math.round(p.size)
    ).fill({ color: rgb, alpha });
  }
}

// ---------- Spark Effects ----------

function renderSparks(g) {
  g.clear();

  for (const p of particles.sparks) {
    const alpha = p.life / p.maxLife;
    if (alpha <= 0) continue;

    const rgb = extractRGB(p.color);
    const s = Math.max(1, Math.round(p.size * alpha));

    g.rect(Math.round(p.x), Math.round(p.y), s, s)
      .fill({ color: rgb, alpha });
  }
}

// ---------- Agent Trails ----------

function renderTrails(g) {
  g.clear();

  for (const p of particles.trails) {
    const alpha = (p.life / p.maxLife) * 0.65;
    if (alpha <= 0) continue;

    const rgb = extractRGB(p.color);

    g.rect(
      Math.round(p.x),
      Math.round(p.y),
      Math.round(p.size),
      Math.round(p.size)
    ).fill({ color: rgb, alpha });
  }
}
