/**
 * NEXUS Audit Trail
 *
 * Logs all Port calls for governance and debugging.
 * Entries stored in memory with periodic flush to disk.
 *
 * @module nexus/policy/audit-trail
 */

'use strict';

const fs = require('fs');
const path = require('path');

const AUDIT_LOG_PATH = path.join(__dirname, 'audit-log.json');
const MAX_ENTRIES = 10000;

class AuditTrail {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries || MAX_ENTRIES;
    this.logPath = options.logPath || AUDIT_LOG_PATH;
    this.entries = [];
    this.enabled = options.enabled !== false;
  }

  /**
   * Log an audit entry
   * @param {Object} entry - { port, method, args, result, level, provider }
   */
  log(entry) {
    if (!this.enabled) return;

    this.entries.push({
      timestamp: new Date().toISOString(),
      port: entry.port || 'unknown',
      method: entry.method || 'unknown',
      level: entry.level || 'info',
      provider: entry.provider || null,
      success: entry.success !== false,
      duration: entry.duration || 0,
      error: entry.error || null
    });

    // Enforce max entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  /**
   * Query audit entries
   * @param {Object} filter - { port, method, level, since }
   * @returns {Array}
   */
  query(filter = {}) {
    let results = [...this.entries];

    if (filter.port) {
      results = results.filter(e => e.port === filter.port);
    }
    if (filter.method) {
      results = results.filter(e => e.method === filter.method);
    }
    if (filter.level) {
      results = results.filter(e => e.level === filter.level);
    }
    if (filter.since) {
      const since = new Date(filter.since).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() >= since);
    }

    return results;
  }

  /**
   * Get summary statistics
   */
  getStats() {
    const total = this.entries.length;
    const errors = this.entries.filter(e => !e.success).length;
    const portCounts = {};
    for (const e of this.entries) {
      portCounts[e.port] = (portCounts[e.port] || 0) + 1;
    }

    return {
      total,
      errors,
      successRate: total > 0 ? ((total - errors) / total * 100).toFixed(1) + '%' : 'N/A',
      portCounts,
      oldestEntry: this.entries[0]?.timestamp || null,
      newestEntry: this.entries[this.entries.length - 1]?.timestamp || null
    };
  }

  /**
   * Flush to disk
   */
  flush() {
    try {
      const dir = path.dirname(this.logPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.logPath, JSON.stringify({
        flushedAt: new Date().toISOString(),
        count: this.entries.length,
        entries: this.entries
      }, null, 2), 'utf-8');
    } catch (e) {
      // Non-fatal - audit is best-effort
    }
  }

  /**
   * Clear audit trail
   */
  clear() {
    this.entries = [];
  }
}

module.exports = { AuditTrail };
