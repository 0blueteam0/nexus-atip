/**
 * NEXUS Context Filesystem - Large Context Offloading
 *
 * LangChain Deep Agents "filesystem context" pattern:
 * - Offloads large data to filesystem instead of agent context window
 * - Retrieves relevant chunks on demand
 * - Protects main agent from context overflow
 *
 * @module nexus/deep-agent/context-fs
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { getEventBus } = require('../core/event-bus');

const CONTEXT_DIR = path.join(__dirname, '..', 'data', 'context-store');

class ContextFS {
  constructor(options = {}) {
    this.bus = getEventBus();
    this._baseDir = options.baseDir || CONTEXT_DIR;
    this._maxFileSize = options.maxFileSizeBytes || 1048576; // 1MB
    this._index = new Map();
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(this._baseDir)) {
      fs.mkdirSync(this._baseDir, { recursive: true });
    }
  }

  /**
   * Store a context chunk to filesystem
   * @param {string} key - Unique identifier
   * @param {*} data - Data to store
   * @param {Object} [meta] - Metadata (tags, source, etc.)
   * @returns {{stored: boolean, key: string, sizeBytes: number}}
   */
  store(key, data, meta = {}) {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    if (serialized.length > this._maxFileSize) {
      return { stored: false, key, error: 'Exceeds max file size' };
    }

    const filePath = path.join(this._baseDir, `${this._sanitize(key)}.json`);
    const envelope = {
      key,
      meta: { ...meta, storedAt: Date.now() },
      dataType: typeof data,
      data
    };

    fs.writeFileSync(filePath, JSON.stringify(envelope, null, 2));

    this._index.set(key, {
      path: filePath,
      size: serialized.length,
      meta,
      storedAt: Date.now()
    });

    this.bus.emit('context-fs:stored', { key, sizeBytes: serialized.length });

    return { stored: true, key, sizeBytes: serialized.length };
  }

  /**
   * Retrieve a context chunk
   * @param {string} key
   * @returns {*} Original data, or null if not found
   */
  retrieve(key) {
    const filePath = path.join(this._baseDir, `${this._sanitize(key)}.json`);

    try {
      if (!fs.existsSync(filePath)) return null;
      const envelope = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.bus.emit('context-fs:retrieved', { key });
      return envelope.data;
    } catch {
      return null;
    }
  }

  /**
   * Retrieve with metadata
   * @param {string} key
   * @returns {Object|null} { data, meta }
   */
  retrieveFull(key) {
    const filePath = path.join(this._baseDir, `${this._sanitize(key)}.json`);
    try {
      if (!fs.existsSync(filePath)) return null;
      const envelope = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { data: envelope.data, meta: envelope.meta };
    } catch {
      return null;
    }
  }

  /**
   * Check if a key exists
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    const filePath = path.join(this._baseDir, `${this._sanitize(key)}.json`);
    return fs.existsSync(filePath);
  }

  /**
   * Delete a context chunk
   * @param {string} key
   */
  remove(key) {
    const filePath = path.join(this._baseDir, `${this._sanitize(key)}.json`);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      this._index.delete(key);
    } catch {
      // Non-fatal
    }
  }

  /**
   * List all stored context keys
   * @returns {Array<{key, size, storedAt}>}
   */
  list() {
    try {
      const files = fs.readdirSync(this._baseDir).filter(f => f.endsWith('.json'));
      return files.map(f => {
        try {
          const full = path.join(this._baseDir, f);
          const stat = fs.statSync(full);
          const envelope = JSON.parse(fs.readFileSync(full, 'utf8'));
          return {
            key: envelope.key,
            size: stat.size,
            storedAt: envelope.meta?.storedAt || stat.mtimeMs
          };
        } catch {
          return { key: f.replace('.json', ''), size: 0, storedAt: 0 };
        }
      });
    } catch {
      return [];
    }
  }

  /**
   * Get a summary of stored data (for agent context)
   * Returns keys and metadata without full data.
   */
  getSummary() {
    const items = this.list();
    return {
      totalItems: items.length,
      totalSizeBytes: items.reduce((sum, i) => sum + i.size, 0),
      keys: items.map(i => i.key)
    };
  }

  /**
   * Sanitize key for filesystem
   */
  _sanitize(key) {
    return key.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
  }
}

module.exports = { ContextFS };
