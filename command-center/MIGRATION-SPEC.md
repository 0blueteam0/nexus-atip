# PixiJS v8 Migration Spec - Command Center

## Overview
Migrate pixel-art Electron app from Canvas 2D to PixiJS v8.
Goal: Pokemon HeartGold (NDS 2009) quality pixel art graphics.

## Source Files (all in command-center/ui/src/)
- `sprites.js` (486 lines) - Pixel arrays, palette, animation
- `renderer.js` (583 lines) - Canvas 2D render engine (8 layers)
- `world.js` (621 lines) - Game state, WebSocket, MCP server data
- `particles.js` (299 lines) - 5 particle subsystems
- `../index.html` (200 lines) - Electron HTML entry

## PixiJS v8 is installed at: command-center/ui/node_modules/pixi.js/
- ESM-only: dist/pixi.mjs

## PixiJS v8 API Key Facts
- `import { Application, Container, Sprite, Graphics, Texture, Text, TextStyle } from 'pixi.js';`
- `const app = new Application(); await app.init({...});` (NOT new Application(options))
- `app.canvas` (NOT app.view)
- `Texture.from(canvas)` then `texture.source.scaleMode = 'nearest'`
- `graphics.rect(x,y,w,h).fill({color: 0xRRGGBB, alpha: 0.5})`
- `graphics.circle(x,y,r).fill({color, alpha})`
- `graphics.moveTo(x,y).lineTo(x,y).stroke({color, width, alpha})`
- `sprite.eventMode = 'static'; sprite.on('pointerdown', fn)`
- `antialias: false, roundPixels: true, resolution: 1` for pixel art

## Module Strategy
Use import map in index.html:
```html
<script type="importmap">{"imports":{"pixi.js":"./node_modules/pixi.js/dist/pixi.mjs"}}</script>
<script type="module" src="src/pixi-app.js"></script>
```

## Files to Create/Modify

### 1. index.html (MODIFY)
- Remove `<canvas id="game-canvas">`, add `<div id="game-container">`
- Add importmap + single module script tag
- Keep sidebar, header, all CSS intact

### 2. pixi-app.js (NEW - Entry Point)
- Import from pixi.js, sprites.js, world.js, particles.js, pixi-renderer.js
- Init Application with pixel art settings, background 0x0f0f1a
- Append app.canvas to #game-container
- Create textures, init world, create layers, game loop
- Handle resize

### 3. sprites.js (MODIFY to ESM)
- Keep ALL pixel array data unchanged
- Add exports for PALETTE, SPRITES, ANIM_FRAMES, ANIM_SPEEDS
- Add pixelArrayToTexture(pixelArray) -> PIXI Texture (canvas -> Texture.from)
- Add createAllTextures() -> texture map
- Add getAnimTexture(textures, state) -> current frame texture
- Remove old Canvas 2D drawSprite/drawSpriteTinted functions
- Color format: 0xRRGGBBAA, decode: R=(>>24)&0xFF, G=(>>16)&0xFF, B=(>>8)&0xFF, A=(&0xFF)

### 4. world.js (MODIFY to ESM)
- Add export to: MCP_SERVERS, DOCKER_CONTAINERS, CATEGORY_COLORS, world, initWorld, updateWorld, activateMCP, etc
- Import spawn functions from particles.js
- Keep ALL logic unchanged (WebSocket, state, DOM updates)

### 5. particles.js (MODIFY to ESM)
- Add exports for all spawn/update functions
- Add createParticleContainers(app, layers) - creates PixiJS Graphics objects
- Add renderParticles(frameCount) - draws all particles via Graphics
- Remove old Canvas 2D draw functions
- Convert CSS color strings to 0xRRGGBB numeric format

### 6. pixi-renderer.js (NEW - PixiJS Render Engine)
- createRenderLayers(app, textures) -> Container hierarchy
- renderFrame(app, layers, textures, world) -> per-frame updates
- handleResize(w, h, layers)
- setupClickHandlers(app, layers)
- Layers: background, starField, connections, buildings, docker, agents, particles, hud, postProcess
- Constants: SPRITE_SCALE=2, gridSize=32, 25x19 grid

## Key Constants
- SIDEBAR_WIDTH = 280, HEADER_HEIGHT = 32
- SPRITE_SCALE = 2 (each pixel = 2x2)
- Grid: 32px cells, 25 cols x 19 rows
- Agent bob: Math.sin(frameCount * 0.06) * 2
- Star field: 120 stars, sin-based twinkle
- Background: 0x0f0f1a
