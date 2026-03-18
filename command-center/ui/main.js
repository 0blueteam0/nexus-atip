/**
 * Command Center - Electron Main Process
 *
 * Creates the pixel art visualization window.
 * Connects to Observer Server via WebSocket.
 */

const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

// Portable environment: disable GPU cache to avoid access denied errors
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disk-cache-dir', path.join(__dirname, '.cache'));

const isDev = process.argv.includes('--dev');
let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'Command Center',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    // Pixel-perfect rendering
    useContentSize: true,
    autoHideMenuBar: !isDev
  });

  mainWindow.loadFile('index.html');

  // Open DevTools only in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Log renderer console to main process stdout
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const prefix = ['LOG', 'WARN', 'ERR'][level] || 'LOG';
    console.log(`[Renderer:${prefix}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // 16x16 pixel art icon (green dot = active)
  const icon = nativeImage.createFromBuffer(
    createTrayIcon(), { width: 16, height: 16 }
  );

  tray = new Tray(icon);
  tray.setToolTip('Command Center');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Command Center', click: () => mainWindow && mainWindow.show() },
    { type: 'separator' },
    { label: 'Observer: localhost:3847', enabled: false },
    { type: 'separator' },
    {
      label: 'Quit', click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow && mainWindow.show());
}

function createTrayIcon() {
  // 16x16 RGBA pixel art icon
  const size = 16;
  const buf = Buffer.alloc(size * size * 4, 0);

  // Draw a simple green terminal icon
  const pixels = [
    // Border (dark gray)
    [2, 2, 13, 13, 0x40, 0x40, 0x50, 0xFF],
    // Screen (dark blue)
    [3, 3, 12, 12, 0x1a, 0x1a, 0x2e, 0xFF],
    // Cursor blink (green)
    [5, 6, 7, 8, 0x00, 0xFF, 0x88, 0xFF],
    // Text line (dim green)
    [5, 9, 10, 10, 0x00, 0xAA, 0x66, 0x88]
  ];

  for (const [x1, y1, x2, y2, r, g, b, a] of pixels) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const idx = (y * size + x) * 4;
        buf[idx] = r;
        buf[idx + 1] = g;
        buf[idx + 2] = b;
        buf[idx + 3] = a;
      }
    }
  }

  return buf;
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Keep running in tray on all platforms
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
  else mainWindow.show();
});
