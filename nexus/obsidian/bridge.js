/**
 * NEXUS Obsidian Bridge - Local REST API Client
 *
 * Connects NEXUS to an Obsidian vault via the Local REST API plugin.
 * Handles note creation, reading, and batch sync with graceful degradation.
 *
 * Requires: Obsidian + Local REST API plugin (port 27124)
 *
 * @module nexus/obsidian/bridge
 */

'use strict';

const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');

const DEFAULT_PORT = 27124;
const DEFAULT_HOST = '127.0.0.1';
const BATCH_FLUSH_INTERVAL_MS = 5000;

class ObsidianBridge {
  /**
   * @param {Object} options
   * @param {number} options.port - REST API port (default: 27124)
   * @param {string} options.host - REST API host
   * @param {string} options.apiKey - REST API bearer token
   * @param {string} options.vaultPath - Local vault path (for direct file fallback)
   * @param {string} options.basePath - Base path within vault for NEXUS notes
   * @param {boolean} options.insecure - Skip TLS verification (self-signed cert)
   */
  constructor(options = {}) {
    this._port = options.port || DEFAULT_PORT;
    this._host = options.host || DEFAULT_HOST;
    this._apiKey = options.apiKey || '';
    this._vaultPath = options.vaultPath || '';
    this._basePath = options.basePath || 'NEXUS';
    this._insecure = options.insecure !== false; // Default true for local self-signed
    this._available = null; // null = unchecked
    this._queue = [];
    this._flushTimer = null;
    this._batchMode = true;
    this._stats = { written: 0, failed: 0, skipped: 0 };
  }

  /**
   * Check if Obsidian REST API is reachable
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const res = await this._request('GET', '/');
      this._available = res.status >= 200 && res.status < 500;
    } catch {
      this._available = false;
    }
    return this._available;
  }

  /**
   * Write (create/update) a note in the vault
   * @param {string} notePath - Path relative to vault root (e.g., 'NEXUS/Tasks/task-001.md')
   * @param {string} content - Full markdown content
   * @returns {Promise<{ok: boolean, path: string}>}
   */
  async putNote(notePath, content) {
    if (this._batchMode) {
      this._queue.push({ path: notePath, content });
      this._scheduleFlush();
      return { ok: true, path: notePath, queued: true };
    }
    return this._writeNote(notePath, content);
  }

  /**
   * Read a note from the vault
   * @param {string} notePath - Path relative to vault root
   * @returns {Promise<{ok: boolean, content: string}>}
   */
  async getNote(notePath) {
    try {
      const res = await this._request('GET', `/vault/${encodeURIPath(notePath)}`, null, {
        'Accept': 'text/markdown'
      });
      if (res.status === 200) {
        return { ok: true, content: res.body };
      }
      return { ok: false, content: '', status: res.status };
    } catch (e) {
      return this._fileFallbackRead(notePath) || { ok: false, content: '', error: e.message };
    }
  }

  /**
   * Flush all queued notes to Obsidian
   * @returns {Promise<{written: number, failed: number}>}
   */
  async flush() {
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }

    const batch = [...this._queue];
    this._queue = [];

    if (batch.length === 0) return { written: 0, failed: 0 };

    let written = 0;
    let failed = 0;

    for (const item of batch) {
      const result = await this._writeNote(item.path, item.content);
      if (result.ok) {
        written++;
      } else {
        failed++;
      }
    }

    this._stats.written += written;
    this._stats.failed += failed;

    return { written, failed };
  }

  /**
   * Initialize vault folder structure for NEXUS
   * @returns {Promise<{ok: boolean, folders: string[]}>}
   */
  async initVault() {
    const folders = [
      this._basePath,
      `${this._basePath}/Sessions`,
      `${this._basePath}/Tasks`,
      `${this._basePath}/Knowledge`,
      `${this._basePath}/Checkpoints`,
      `${this._basePath}/Providers`,
      `${this._basePath}/Costs`,
      `${this._basePath}/Events`,
      'Templates'
    ];

    const created = [];
    for (const folder of folders) {
      // Create a .gitkeep file in each folder to ensure it exists
      const keepPath = `${folder}/.gitkeep`;
      const result = await this.putNote(keepPath, '');
      if (result.ok || result.queued) created.push(folder);
    }

    // Flush immediately for init
    if (this._batchMode) await this.flush();

    return { ok: created.length > 0, folders: created };
  }

  /**
   * Set batch/realtime mode
   * @param {boolean} batch - true for batch, false for realtime
   */
  setBatchMode(batch) {
    this._batchMode = batch;
  }

  /**
   * Get bridge status
   */
  getStatus() {
    return {
      available: this._available,
      host: this._host,
      port: this._port,
      basePath: this._basePath,
      batchMode: this._batchMode,
      queueSize: this._queue.length,
      stats: { ...this._stats }
    };
  }

  // ─── Private ─────────────────────────────────────

  async _writeNote(notePath, content) {
    try {
      const res = await this._request(
        'PUT',
        `/vault/${encodeURIPath(notePath)}`,
        content,
        { 'Content-Type': 'text/markdown' }
      );
      if (res.status >= 200 && res.status < 300) {
        return { ok: true, path: notePath };
      }
      // Fallback to direct file write
      return this._fileFallbackWrite(notePath, content);
    } catch {
      return this._fileFallbackWrite(notePath, content);
    }
  }

  _scheduleFlush() {
    if (this._flushTimer) return;
    this._flushTimer = setTimeout(() => {
      this._flushTimer = null;
      this.flush().catch(() => {});
    }, BATCH_FLUSH_INTERVAL_MS);
  }

  /**
   * Direct file write fallback (when REST API unavailable)
   */
  _fileFallbackWrite(notePath, content) {
    if (!this._vaultPath) {
      this._stats.skipped++;
      return { ok: false, error: 'No vault path for fallback' };
    }

    try {
      const fullPath = path.join(this._vaultPath, notePath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, content, 'utf8');
      return { ok: true, path: notePath, fallback: true };
    } catch (e) {
      this._stats.failed++;
      return { ok: false, error: e.message };
    }
  }

  /**
   * Direct file read fallback
   */
  _fileFallbackRead(notePath) {
    if (!this._vaultPath) return null;

    try {
      const fullPath = path.join(this._vaultPath, notePath);
      if (fs.existsSync(fullPath)) {
        return { ok: true, content: fs.readFileSync(fullPath, 'utf8'), fallback: true };
      }
    } catch {
      // Non-fatal
    }
    return null;
  }

  /**
   * HTTP(S) request to Obsidian Local REST API
   */
  _request(method, urlPath, body, extraHeaders = {}) {
    return new Promise((resolve, reject) => {
      const headers = {
        ...extraHeaders
      };

      if (this._apiKey) {
        headers['Authorization'] = `Bearer ${this._apiKey}`;
      }

      if (body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      const options = {
        hostname: this._host,
        port: this._port,
        path: urlPath,
        method,
        headers,
        rejectUnauthorized: !this._insecure,
        timeout: 5000
      };

      // Use https for Obsidian Local REST API (default uses self-signed cert)
      const proto = this._insecure ? https : https;
      const req = proto.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  }

  /**
   * Cleanup: flush queue and clear timers
   */
  async destroy() {
    await this.flush();
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }
  }
}

/**
 * Encode path segments for URL (preserve /)
 */
function encodeURIPath(p) {
  return p.split('/').map(s => encodeURIComponent(s)).join('/');
}

module.exports = { ObsidianBridge };
