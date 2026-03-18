/**
 * Command Center - Preload Script
 *
 * Exposes safe APIs to the renderer process.
 */

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('commandCenter', {
  // Observer server config
  observerUrl: 'http://localhost:3847',
  wsUrl: 'ws://localhost:3847/ws',

  // Platform info
  platform: process.platform,
  version: '0.1.0'
});
