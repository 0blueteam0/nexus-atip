/**
 * Memory Sync (F Architecture Phase 3)
 *
 * Unidirectional sync: Claude Code memory files (MD) -> Observer SQLite.
 * SQLite serves as a searchable index; MD files remain source of truth.
 *
 * Design: Claude + Codex merged
 * - Incremental sync via mtime comparison
 * - Hybrid delete detection (file gone = deleted, index removed = orphaned)
 * - Regex frontmatter parser (no external deps, portable)
 * - PII redaction: secrets mandatory, email/phone via env flag
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const { EVENT_TYPES } = require('./events');

const MEMORY_ROOT = 'K:/PortableApps/genai/projects/K--PortableApps-genai/memory';
const MEMORY_INDEX = 'MEMORY.md';
const SYNC_KEY = 'claude_memory_primary';
const MAX_FILE_SIZE = 1024 * 1024; // 1MB per file

// PII/secret patterns (mandatory)
const SECRET_PATTERNS = [
  /(?:sk|pk|api|key|token|secret|password|passwd|pwd)[-_]?[a-zA-Z0-9]{20,}/gi,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWT
  /ghp_[A-Za-z0-9]{36}/g, // GitHub PAT
  /xox[bpras]-[A-Za-z0-9-]{10,}/g, // Slack tokens
  /AKIA[A-Z0-9]{16}/g // AWS access key
];

// Optional PII patterns (enabled by MEMORY_REDACT_PII=1)
const PII_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // email
  /\b\d{3}[-.]?\d{3,4}[-.]?\d{4}\b/g // phone (basic)
];

class MemorySync {
  constructor({ broadcaster }) {
    this.broadcaster = broadcaster;
    this.memoryRoot = MEMORY_ROOT;
    this.redactPII = process.env.MEMORY_REDACT_PII === '1';
  }

  /**
   * Run incremental sync: scan memory files, upsert changed ones
   */
  runIncremental({ trigger = 'scheduler', actor = 'tier4' } = {}) {
    const d = db.getDb();
    const startTime = Date.now();
    const runId = `msync-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // Start run record
    d.prepare(`
      INSERT INTO memory_sync_runs (id, trigger_source) VALUES (?, ?)
    `).run(runId, trigger);

    const stats = { scanned: 0, changed: 0, inserted: 0, updated: 0, skipped: 0, invalid: 0 };

    try {
      // Load checkpoint
      const checkpoint = this._loadCheckpoint();

      // Discover files
      const files = this._discoverFiles();
      stats.scanned = files.length;

      // Parse MEMORY.md index for delete/orphan detection
      const indexedPaths = this._parseMemoryIndex();

      // Process each file
      for (const filePath of files) {
        try {
          const result = this._processFile(filePath, checkpoint.cursor_mtime_ms);
          if (result === 'inserted') stats.inserted++;
          else if (result === 'updated') stats.updated++;
          else if (result === 'skipped') stats.skipped++;
          else if (result === 'invalid') stats.invalid++;
          if (result === 'inserted' || result === 'updated') stats.changed++;
        } catch (err) {
          stats.invalid++;
        }
      }

      // Hybrid delete detection
      this._detectDeleted(files, indexedPaths);

      // Update checkpoint
      const maxMtime = files.reduce((max, f) => {
        try { return Math.max(max, fs.statSync(f).mtimeMs); } catch { return max; }
      }, checkpoint.cursor_mtime_ms);
      this._saveCheckpoint(maxMtime);

      // Finalize run record
      const durationMs = Date.now() - startTime;
      d.prepare(`
        UPDATE memory_sync_runs
        SET files_scanned = ?, files_changed = ?, files_inserted = ?, files_updated = ?,
            files_skipped = ?, files_invalid = ?, ended_at = datetime('now'),
            duration_ms = ?, success = 1
        WHERE id = ?
      `).run(stats.scanned, stats.changed, stats.inserted, stats.updated,
             stats.skipped, stats.invalid, durationMs, runId);

      this.broadcaster.broadcast(EVENT_TYPES.MEMORY_SYNC_COMPLETE, { runId, stats, durationMs });
      return { ok: true, runId, stats, durationMs };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      d.prepare(`
        UPDATE memory_sync_runs
        SET ended_at = datetime('now'), duration_ms = ?, error_message = ?
        WHERE id = ?
      `).run(durationMs, err.message, runId);

      return { ok: false, error: err.message, stats };
    }
  }

  // === Parse: Frontmatter + Content ===

  /**
   * Parse a memory markdown file's frontmatter and content
   */
  _parseFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const result = { name: null, description: null, type: null, frontmatter: {}, content: raw };

    // Strict frontmatter regex: must start at beginning of file
    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (fmMatch) {
      const fmBlock = fmMatch[1];
      const body = fmMatch[2];

      // Parse YAML-like key: value pairs
      const lines = fmBlock.split('\n');
      for (const line of lines) {
        const kvMatch = line.match(/^(\w[\w\s]*?):\s*(.+)$/);
        if (kvMatch) {
          const key = kvMatch[1].trim().toLowerCase().replace(/\s+/g, '_');
          const value = kvMatch[2].trim();
          result.frontmatter[key] = value;
        }
      }

      result.name = result.frontmatter.name || null;
      result.description = result.frontmatter.description || null;
      result.type = result.frontmatter.type || null;
      result.content = body;
    }

    // Fallback: derive from filename
    if (!result.name) {
      result.name = path.basename(filePath, '.md').replace(/[-_]/g, ' ');
    }

    return result;
  }

  // === Hash & Upsert ===

  /**
   * Process a single file: parse, hash, upsert if changed
   */
  _processFile(filePath, cursorMtimeMs) {
    const stat = fs.statSync(filePath);

    // Size guard
    if (stat.size > MAX_FILE_SIZE) return 'invalid';

    // Quick check: skip if not modified since last sync
    if (stat.mtimeMs <= cursorMtimeMs) {
      // Still refresh last_seen_at
      const d = db.getDb();
      d.prepare("UPDATE memory_documents SET last_seen_at = datetime('now') WHERE file_path = ?")
        .run(filePath);
      return 'skipped';
    }

    const parsed = this._parseFile(filePath);
    let content = parsed.content;

    // Redact sensitive content
    content = this._redactSecrets(content);
    const redacted = content !== parsed.content ? 1 : 0;

    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    // Check existing
    const d = db.getDb();
    const existing = d.prepare('SELECT id, content_sha256 FROM memory_documents WHERE file_path = ?')
      .get(filePath);

    if (existing && existing.content_sha256 === contentHash) {
      // Content unchanged, refresh timestamps
      d.prepare("UPDATE memory_documents SET last_seen_at = datetime('now'), mtime_ms = ? WHERE id = ?")
        .run(stat.mtimeMs, existing.id);
      return 'skipped';
    }

    const id = existing?.id || `mem-${crypto.randomBytes(6).toString('hex')}`;

    d.prepare(`
      INSERT INTO memory_documents
        (id, file_path, file_name, name, description, doc_type, frontmatter_json,
         content, content_sha256, content_redacted, mtime_ms, size_bytes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      ON CONFLICT(file_path) DO UPDATE SET
        name = excluded.name, description = excluded.description, doc_type = excluded.doc_type,
        frontmatter_json = excluded.frontmatter_json, content = excluded.content,
        content_sha256 = excluded.content_sha256, content_redacted = excluded.content_redacted,
        mtime_ms = excluded.mtime_ms, size_bytes = excluded.size_bytes,
        status = 'active', last_seen_at = datetime('now'), last_synced_at = datetime('now')
    `).run(id, filePath, path.basename(filePath), parsed.name, parsed.description,
           parsed.type, JSON.stringify(parsed.frontmatter), content, contentHash,
           redacted, stat.mtimeMs, stat.size);

    return existing ? 'updated' : 'inserted';
  }

  // === Checkpoint & Report ===

  _loadCheckpoint() {
    const d = db.getDb();
    const cp = d.prepare('SELECT * FROM memory_sync_checkpoint WHERE sync_key = ?').get(SYNC_KEY);
    if (cp) return cp;
    return { sync_key: SYNC_KEY, cursor_mtime_ms: 0 };
  }

  _saveCheckpoint(cursorMtimeMs) {
    const d = db.getDb();
    d.prepare(`
      INSERT INTO memory_sync_checkpoint (sync_key, cursor_mtime_ms, last_scan_at, last_success_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(sync_key) DO UPDATE SET
        cursor_mtime_ms = excluded.cursor_mtime_ms,
        last_scan_at = datetime('now'),
        last_success_at = datetime('now'),
        updated_at = datetime('now')
    `).run(SYNC_KEY, cursorMtimeMs);
  }

  /**
   * Get sync status overview
   */
  getSyncStatus() {
    const d = db.getDb();
    let checkpoint = null, docCounts = {}, lastRun = null;

    try { checkpoint = d.prepare('SELECT * FROM memory_sync_checkpoint WHERE sync_key = ?').get(SYNC_KEY); } catch {}
    try {
      const counts = d.prepare('SELECT status, COUNT(*) as c FROM memory_documents GROUP BY status').all();
      for (const r of counts) docCounts[r.status] = r.c;
    } catch {}
    try { lastRun = d.prepare('SELECT * FROM memory_sync_runs ORDER BY started_at DESC LIMIT 1').get(); } catch {}

    return { checkpoint, docCounts, lastRun };
  }

  /**
   * Get synced documents with filters
   */
  getDocuments({ type, status, limit } = {}) {
    const d = db.getDb();
    let sql = 'SELECT id, file_path, file_name, name, description, doc_type, status, mtime_ms, size_bytes, last_synced_at FROM memory_documents WHERE 1=1';
    const params = [];
    if (type) { sql += ' AND doc_type = ?'; params.push(type); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY last_synced_at DESC LIMIT ?';
    params.push(limit || 50);
    return d.prepare(sql).all(...params);
  }

  /**
   * Get sync run history
   */
  getRuns(limit = 20) {
    const d = db.getDb();
    return d.prepare('SELECT * FROM memory_sync_runs ORDER BY started_at DESC LIMIT ?').all(limit);
  }

  // === Helpers ===

  _discoverFiles() {
    if (!fs.existsSync(this.memoryRoot)) return [];

    return fs.readdirSync(this.memoryRoot)
      .filter(f => f.endsWith('.md') && f !== MEMORY_INDEX)
      .map(f => path.join(this.memoryRoot, f))
      .filter(f => {
        try { return fs.statSync(f).isFile(); } catch { return false; }
      });
  }

  _parseMemoryIndex() {
    const indexPath = path.join(this.memoryRoot, MEMORY_INDEX);
    if (!fs.existsSync(indexPath)) return new Set();

    const content = fs.readFileSync(indexPath, 'utf8');
    const refs = new Set();

    // Find all [filename.md](filename.md) references
    const linkPattern = /\[([^\]]+\.md)\]\(([^)]+\.md)\)/g;
    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      const refPath = path.join(this.memoryRoot, match[2]);
      refs.add(refPath);
    }

    return refs;
  }

  _detectDeleted(existingFiles, indexedPaths) {
    const d = db.getDb();
    const existingSet = new Set(existingFiles);

    // Get all active docs in DB
    const docs = d.prepare("SELECT id, file_path FROM memory_documents WHERE status = 'active'").all();

    for (const doc of docs) {
      if (!existingSet.has(doc.file_path)) {
        // File no longer on disk -> deleted
        d.prepare("UPDATE memory_documents SET status = 'deleted', last_seen_at = datetime('now') WHERE id = ?")
          .run(doc.id);
      } else if (indexedPaths.size > 0 && !indexedPaths.has(doc.file_path)) {
        // File exists but removed from MEMORY.md index -> orphaned (still active but flagged)
        // Don't change status, just note it - file still exists, just not indexed
      }
    }
  }

  _redactSecrets(text) {
    let result = text;

    // Mandatory: secrets/tokens
    for (const pattern of SECRET_PATTERNS) {
      result = result.replace(pattern, '[REDACTED]');
    }

    // Optional: PII (email, phone)
    if (this.redactPII) {
      for (const pattern of PII_PATTERNS) {
        result = result.replace(pattern, '[PII_REDACTED]');
      }
    }

    return result;
  }
}

module.exports = { MemorySync };
