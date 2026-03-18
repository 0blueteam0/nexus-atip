/**
 * pixi-app.js - PixiJS v8 Entry Point
 *
 * Initializes PixiJS Application with pixel-art settings,
 * creates textures, sets up scene, runs game loop.
 */

import { Application } from 'pixi.js';
import { createAllTextures } from './sprites.js';
import { initWorld, updateWorld, world } from './world.js';
import {
  createRenderLayers, setupScene, renderFrame,
  handleResize, setupInteraction
} from './pixi-renderer.js';

// ========== CONSTANTS ==========

const SIDEBAR_WIDTH  = 280;
const HEADER_HEIGHT  = 32;
const BG_COLOR       = 0x0f0f1a;

// ========== BOOTSTRAP ==========

async function main() {
  // Calculate canvas size
  const canvasW = window.innerWidth - SIDEBAR_WIDTH;
  const canvasH = window.innerHeight - HEADER_HEIGHT;

  // Create PixiJS Application (v8 async init)
  const app = new Application();
  await app.init({
    width: canvasW,
    height: canvasH,
    backgroundColor: BG_COLOR,
    antialias: false,
    roundPixels: true,
    resolution: 1,
    autoDensity: false
  });

  // Pixel-art rendering on the canvas element
  app.canvas.style.imageRendering = 'pixelated';
  app.canvas.style.display = 'block';

  // Insert canvas into page
  const container = document.getElementById('game-container');
  if (container) {
    container.appendChild(app.canvas);
  } else {
    // Fallback: append after header
    document.body.insertBefore(app.canvas, document.getElementById('sidebar'));
  }

  // Create sprite textures (scale=2 for 32px sprites)
  const textures = createAllTextures(2);

  // Initialize world state + WebSocket connection
  initWorld(canvasW, canvasH);

  // Build render layers (10 layers on stage)
  const layers = createRenderLayers(app.stage);

  // Setup full scene with pre-created objects
  const scene = setupScene(layers, textures, canvasW, canvasH);

  // Setup click interaction
  setupInteraction(app, scene);

  // ========== GAME LOOP ==========

  app.ticker.add(() => {
    // Advance world state (canvasW/canvasH for particle spawning)
    updateWorld(scene.canvasW, scene.canvasH);

    // Render all layers
    renderFrame(scene, world.frameCount);
  });

  // ========== RESIZE HANDLER ==========

  window.addEventListener('resize', () => {
    const w = window.innerWidth - SIDEBAR_WIDTH;
    const h = window.innerHeight - HEADER_HEIGHT;

    app.renderer.resize(w, h);
    handleResize(scene, w, h);
  });

  console.log('[+] Command Center: PixiJS v8 initialized');
}

// Launch
main().catch(err => {
  console.error('[-] Command Center init failed:', err);
});
