/**
 * Obsidian Bridge (F Architecture Phase 7)
 *
 * Bi-directional sync between Observer and Obsidian vault via filesystem.
 * No REST API dependency - direct file R/W (works even when Obsidian is closed).
 *
 * Pull: Obsidian notes -> Observer SQLite (index, links, tags)
 * Push: Observer insights -> Obsidian structured notes
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

const VAULT_ROOT = process.env.OBSIDIAN_VAULT || 'K:/Obsidian';
const OBSERVER_FOLDER = '_Observer'; // Auto-generated notes go here
const MAX_FILE_SIZE = 512 * 1024; // 512KB per note

class ObsidianBridge {
  constructor({ broadcaster }) {
    this.broadcaster = broadcaster;
    this.vaultRoot = VAULT_ROOT;

    // Ensure Observer folder exists in vault
    const obsDir = path.join(this.vaultRoot, OBSERVER_FOLDER);
    try { fs.mkdirSync(obsDir, { recursive: true }); } catch {}
  }

  // ========== PULL: Obsidian -> Observer ==========

  /**
   * Scan vault and index all notes into SQLite
   */
  pull({ trigger = 'manual' } = {}) {
    const d = db.getDb();
    const runId = `obsync-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const startTime = Date.now();
    const stats = { scanned: 0, new: 0, updated: 0, deleted: 0 };

    d.prepare(`INSERT INTO obsidian_sync_runs (id, direction, trigger_source) VALUES (?, 'pull', ?)`).run(runId, trigger);

    try {
      const files = this._scanVault();
      stats.scanned = files.length;
      const existingPaths = new Set();

      for (const filePath of files) {
        try {
          const result = this._indexNote(filePath);
          if (result === 'new') stats.new++;
          else if (result === 'updated') stats.updated++;
          existingPaths.add(filePath);
        } catch { /* skip bad files */ }
      }

      // Mark deleted notes
      const dbNotes = d.prepare("SELECT file_path FROM obsidian_notes WHERE status = 'active'").all();
      for (const note of dbNotes) {
        if (!existingPaths.has(note.file_path)) {
          d.prepare("UPDATE obsidian_notes SET status = 'deleted', last_synced_at = datetime('now') WHERE file_path = ?").run(note.file_path);
          stats.deleted++;
        }
      }

      const durationMs = Date.now() - startTime;
      d.prepare(`
        UPDATE obsidian_sync_runs
        SET notes_scanned = ?, notes_new = ?, notes_updated = ?, notes_deleted = ?,
            duration_ms = ?, success = 1, ended_at = datetime('now')
        WHERE id = ?
      `).run(stats.scanned, stats.new, stats.updated, stats.deleted, durationMs, runId);

      this.broadcaster.broadcast('obsidian.sync.complete', { runId, direction: 'pull', stats, durationMs });
      return { ok: true, runId, stats, durationMs };
    } catch (err) {
      d.prepare(`UPDATE obsidian_sync_runs SET error_message = ?, ended_at = datetime('now') WHERE id = ?`).run(err.message, runId);
      return { ok: false, error: err.message, stats };
    }
  }

  // ========== PUSH: Observer -> Obsidian ==========

  /**
   * Write a structured note to the vault
   */
  pushNote({ title, content, folder, tags, frontmatter }) {
    const targetFolder = folder ? path.join(this.vaultRoot, folder) : path.join(this.vaultRoot, OBSERVER_FOLDER);
    try { fs.mkdirSync(targetFolder, { recursive: true }); } catch {}

    const safeName = title.replace(/[<>:"/\\|?*]/g, '-').slice(0, 100);
    const filePath = path.join(targetFolder, `${safeName}.md`);

    // Build note with frontmatter
    let noteContent = '';
    if (frontmatter || tags) {
      const fm = { ...(frontmatter || {}), tags: tags || [], created: new Date().toISOString(), source: 'observer' };
      noteContent += '---\n';
      for (const [key, val] of Object.entries(fm)) {
        if (Array.isArray(val)) {
          noteContent += `${key}:\n${val.map(v => `  - ${v}`).join('\n')}\n`;
        } else {
          noteContent += `${key}: ${val}\n`;
        }
      }
      noteContent += '---\n\n';
    }
    noteContent += content;

    fs.writeFileSync(filePath, noteContent, 'utf8');

    // Index the pushed note
    this._indexNote(filePath);

    return { ok: true, path: filePath };
  }

  /**
   * Push an Evolution Report to Obsidian
   */
  pushEvolutionReport(report) {
    const date = new Date().toISOString().slice(0, 10);
    const content = `# Evolution Report - ${date}

## Summary
${report.summary || 'Automated evolution package run'}

## Discovered Tools
${(report.tools || []).map(t => `- **${t.name}**: ${t.description} ([${t.source}](${t.url}))`).join('\n') || 'None'}

## Installed
${(report.installed || []).map(t => `- [+] ${t}`).join('\n') || 'None'}

## Test Results
${report.testResults || 'N/A'}

## Metrics Delta
${report.metricsDelta || 'N/A'}

## Observer Stats
- Endpoints: ${report.endpoints || '?'}
- DB Tables: ${report.dbTables || '?'}
- Test Pass Rate: ${report.testPassRate || '?'}
`;

    return this.pushNote({
      title: `Evolution Report ${date}`,
      content,
      folder: `${OBSERVER_FOLDER}/Evolution`,
      tags: ['evolution', 'auto-generated', 'observer'],
      frontmatter: { type: 'evolution-report', date }
    });
  }

  /**
   * Push a session summary to Obsidian
   */
  pushSessionSummary({ sessionId, summary, toolsUsed, duration }) {
    const date = new Date().toISOString().slice(0, 10);
    const content = `# Session Summary

## Session ID
\`${sessionId}\`

## Summary
${summary}

## Tools Used
${(toolsUsed || []).map(t => `- ${t}`).join('\n') || 'None recorded'}

## Duration
${duration || 'Unknown'}
`;

    return this.pushNote({
      title: `Session ${sessionId.slice(0, 12)} - ${date}`,
      content,
      folder: `${OBSERVER_FOLDER}/Sessions`,
      tags: ['session', 'auto-generated'],
      frontmatter: { type: 'session-summary', sessionId, date }
    });
  }

  // ========== SEARCH & STATUS ==========

  /**
   * Search indexed notes
   */
  search({ query, folder, tags, limit } = {}) {
    const d = db.getDb();
    let sql = "SELECT * FROM obsidian_notes WHERE status = 'active'";
    const params = [];

    if (query) { sql += ' AND (title LIKE ? OR file_path LIKE ?)'; params.push(`%${query}%`, `%${query}%`); }
    if (folder) { sql += ' AND folder = ?'; params.push(folder); }
    if (tags) { sql += ' AND tags_json LIKE ?'; params.push(`%${tags}%`); }
    sql += ' ORDER BY last_synced_at DESC LIMIT ?';
    params.push(limit || 50);

    return d.prepare(sql).all(...params);
  }

  /**
   * Get sync status
   */
  getStatus() {
    const d = db.getDb();
    let noteCounts = {}, lastRun = null, totalNotes = 0;

    try {
      const counts = d.prepare('SELECT status, COUNT(*) as c FROM obsidian_notes GROUP BY status').all();
      for (const r of counts) { noteCounts[r.status] = r.c; totalNotes += r.c; }
    } catch {}
    try { lastRun = d.prepare('SELECT * FROM obsidian_sync_runs ORDER BY started_at DESC LIMIT 1').get(); } catch {}

    return {
      vaultRoot: this.vaultRoot,
      observerFolder: OBSERVER_FOLDER,
      vaultExists: fs.existsSync(this.vaultRoot),
      totalNotes,
      noteCounts,
      lastRun
    };
  }

  // ========== PRIVATE ==========

  _scanVault(dir) {
    dir = dir || this.vaultRoot;
    let results = [];

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue; // Skip hidden
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          results = results.concat(this._scanVault(fullPath));
        } else if (entry.name.endsWith('.md')) {
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size <= MAX_FILE_SIZE) results.push(fullPath);
          } catch {}
        }
      }
    } catch {}

    return results;
  }

  _indexNote(filePath) {
    const d = db.getDb();
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);

    // Check existing
    const existing = d.prepare('SELECT id, content_hash FROM obsidian_notes WHERE file_path = ?').get(filePath);
    if (existing && existing.content_hash === hash) {
      d.prepare("UPDATE obsidian_notes SET last_synced_at = datetime('now'), status = 'active' WHERE id = ?").run(existing.id);
      return 'unchanged';
    }

    // Extract metadata
    const title = path.basename(filePath, '.md');
    const folder = path.relative(this.vaultRoot, path.dirname(filePath)).replace(/\\/g, '/') || '/';
    const links = this._extractLinks(content);
    const tags = this._extractTags(content);
    const frontmatter = this._extractFrontmatter(content);

    const id = existing?.id || `obs-${crypto.randomBytes(6).toString('hex')}`;

    d.prepare(`
      INSERT INTO obsidian_notes (id, file_path, title, content_hash, mtime_ms, size_bytes, links_json, tags_json, frontmatter_json, folder, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      ON CONFLICT(file_path) DO UPDATE SET
        title = excluded.title, content_hash = excluded.content_hash, mtime_ms = excluded.mtime_ms,
        size_bytes = excluded.size_bytes, links_json = excluded.links_json, tags_json = excluded.tags_json,
        frontmatter_json = excluded.frontmatter_json, folder = excluded.folder,
        status = 'active', last_synced_at = datetime('now')
    `).run(id, filePath, title, hash, stat.mtimeMs, stat.size,
           JSON.stringify(links), JSON.stringify(tags), JSON.stringify(frontmatter), folder);

    return existing ? 'updated' : 'new';
  }

  _extractLinks(content) {
    const links = [];
    const pattern = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      links.push(match[1].trim());
    }
    return [...new Set(links)];
  }

  _extractTags(content) {
    const tags = [];
    // Frontmatter tags
    const fmMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---/);
    if (fmMatch) {
      const tagLine = fmMatch[0].match(/tags:\s*\[([^\]]+)\]/);
      if (tagLine) {
        tags.push(...tagLine[1].split(',').map(t => t.trim().replace(/['"]/g, '')));
      }
      const tagList = fmMatch[0].match(/tags:\n((?:\s+-\s+.+\n?)+)/);
      if (tagList) {
        tags.push(...tagList[1].match(/^\s+-\s+(.+)/gm).map(t => t.replace(/^\s+-\s+/, '').trim()));
      }
    }
    // Inline tags
    const inlinePattern = /(?:^|\s)#([a-zA-Z\u3131-\uD79D][a-zA-Z0-9\u3131-\uD79D_/-]*)/g;
    let match;
    while ((match = inlinePattern.exec(content)) !== null) {
      if (!match[1].match(/^\d+$/)) tags.push(match[1]);
    }
    return [...new Set(tags)];
  }

  _extractFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return {};
    const fm = {};
    const lines = match[1].split('\n');
    for (const line of lines) {
      const kv = line.match(/^(\w[\w\s]*?):\s*(.+)$/);
      if (kv) fm[kv[1].trim()] = kv[2].trim();
    }
    return fm;
  }
}

module.exports = { ObsidianBridge };
