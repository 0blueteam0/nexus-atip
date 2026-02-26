/**
 * NEXUS Sync Engine
 *
 * Triple-Store synchronization:
 *   Primary: .ai/ files (always works, portable)
 *   Secondary: SQLite (indexed queries, analytics)
 *   Tertiary: External (Notion sync - future)
 *
 * Sync flow: Primary -> Secondary -> Tertiary
 *
 * @module nexus/store/sync-engine
 */

'use strict';

const { SqliteAdapter } = require('./sqlite-adapter');
const { AiFilesAdapter } = require('./ai-files-adapter');

class SyncEngine {
  constructor(options = {}) {
    this.sqlite = options.sqlite || new SqliteAdapter();
    this.aiFiles = options.aiFiles || new AiFilesAdapter();
    this.initialized = false;
    this.stats = {
      syncs: 0,
      conflicts: 0,
      errors: 0
    };
  }

  /**
   * Initialize both stores
   */
  async init() {
    // AI files always available (just filesystem)
    // SQLite may fail (no binary) - that's OK
    const sqliteOk = await this.sqlite.init();
    this.initialized = true;

    return {
      aiFiles: true,
      sqlite: sqliteOk,
      mode: sqliteOk ? 'full' : 'files-only'
    };
  }

  /**
   * Sync a domain record from .ai/ files to SQLite
   * @param {string} domain - Table/domain name
   * @param {string} id - Record ID
   * @param {Object} data - Record data
   */
  async sync(domain, id, data) {
    this.stats.syncs++;

    // Always write to .ai/ files (primary)
    try {
      this.aiFiles.writeJson(`store/${domain}/${id}.json`, {
        ...data,
        _syncedAt: new Date().toISOString()
      });
    } catch (e) {
      this.stats.errors++;
    }

    // Write to SQLite if available (secondary)
    if (this.sqlite.ready) {
      try {
        this.sqlite.insert(domain, { id, ...data });
      } catch (e) {
        this.stats.errors++;
      }
    }
  }

  /**
   * Read from best available store
   * SQLite first (faster queries), .ai/ fallback
   * @param {string} domain
   * @param {string} id
   * @returns {Object|null}
   */
  read(domain, id) {
    // Try SQLite first
    if (this.sqlite.ready) {
      try {
        const results = this.sqlite.query(domain, { id }, { limit: 1 });
        if (results.length > 0) return results[0];
      } catch (e) { /* fallthrough */ }
    }

    // Fallback to .ai/ files
    return this.aiFiles.readJson(`store/${domain}/${id}.json`);
  }

  /**
   * Query from best available store
   * @param {string} domain
   * @param {Object} where
   * @param {Object} options
   * @returns {Array}
   */
  query(domain, where = {}, options = {}) {
    if (this.sqlite.ready) {
      try {
        return this.sqlite.query(domain, where, options);
      } catch (e) { /* fallthrough */ }
    }

    // Fallback: scan .ai/ files (slower)
    const files = this.aiFiles.list(`store/${domain}`);
    let results = files
      .map(f => this.aiFiles.readJson(`store/${domain}/${f}`))
      .filter(Boolean);

    // Apply filters
    for (const [k, v] of Object.entries(where)) {
      results = results.filter(r => r[k] === v);
    }

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      sqliteReady: this.sqlite.ready,
      aiFilesStats: this.aiFiles.getStats(),
      syncStats: { ...this.stats }
    };
  }

  /**
   * Persist and close
   */
  close() {
    this.sqlite.close();
  }
}

module.exports = { SyncEngine };
