/**
 * NEXUS Obsidian Memory Bridge
 *
 * Bidirectional sync between Claude auto-memory and Obsidian Knowledge notes.
 * - NEXUS -> Obsidian: Evolution patterns, routing insights auto-sync
 * - Obsidian -> NEXUS: Manual knowledge notes influence routing hints
 *
 * @module nexus/obsidian/memory-bridge
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { getEventBus } = require('../core/event-bus');
const { templates, isoDate, frontmatter } = require('./templates');

const AUTO_MEMORY_DIR = path.join(__dirname, '..', '..', 'projects', 'K--PortableApps-genai', 'memory');

class MemoryBridge {
  /**
   * @param {import('./bridge').ObsidianBridge} bridge - Obsidian bridge instance
   * @param {Object} options
   * @param {string} options.memoryDir - Claude auto-memory directory
   * @param {string} options.basePath - Obsidian base path for NEXUS
   */
  constructor(bridge, options = {}) {
    this._bridge = bridge;
    this._bus = getEventBus();
    this._memoryDir = options.memoryDir || AUTO_MEMORY_DIR;
    this._basePath = options.basePath || 'NEXUS';
    this._syncedKeys = new Set();
    this._stats = { memoryToObsidian: 0, obsidianToMemory: 0, errors: 0 };
  }

  /**
   * Sync Claude auto-memory -> Obsidian Knowledge
   * Reads memory files and creates corresponding Obsidian notes
   * @returns {Promise<{synced: number}>}
   */
  async syncMemoryToObsidian() {
    let synced = 0;

    try {
      if (!fs.existsSync(this._memoryDir)) return { synced: 0 };

      const files = fs.readdirSync(this._memoryDir).filter(f => f.endsWith('.md'));

      for (const file of files) {
        const key = `memory:${file}`;
        if (this._syncedKeys.has(key)) continue;

        const filePath = path.join(this._memoryDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const name = path.basename(file, '.md');

        // Create a knowledge note in Obsidian
        const notePath = `${this._basePath}/Knowledge/Memory-${sanitize(name)}.md`;
        const noteContent = this._wrapMemoryAsNote(name, content);

        await this._bridge.putNote(notePath, noteContent);
        this._syncedKeys.add(key);
        synced++;
      }
    } catch (e) {
      this._stats.errors++;
    }

    this._stats.memoryToObsidian += synced;
    return { synced };
  }

  /**
   * Sync Obsidian Knowledge -> Claude routing hints
   * Reads Obsidian knowledge notes and extracts routing hints
   * @returns {Promise<{hints: Array}>}
   */
  async syncObsidianToHints() {
    const hints = [];

    try {
      // Read knowledge notes from Obsidian
      const knowledgePath = `${this._basePath}/Knowledge`;

      // Try to read pattern notes
      const patternFiles = await this._listVaultFolder(knowledgePath);

      for (const file of patternFiles) {
        if (!file.endsWith('.md')) continue;

        const result = await this._bridge.getNote(`${knowledgePath}/${file}`);
        if (!result.ok) continue;

        // Extract hints from frontmatter
        const fm = this._parseFrontmatter(result.content);
        if (fm.type === 'pattern' && fm.confidence > 0.7) {
          hints.push({
            taskType: fm.pattern_type,
            provider: fm.provider,
            confidence: fm.confidence,
            source: 'obsidian'
          });
        }
      }
    } catch {
      // Graceful - no hints if Obsidian unavailable
    }

    this._stats.obsidianToMemory += hints.length;
    return { hints };
  }

  /**
   * Sync evolution state to both memory and Obsidian
   * @param {Object} evolutionState - { patterns, weights, sessions }
   */
  async syncEvolution(evolutionState) {
    if (!evolutionState) return { synced: 0 };

    let synced = 0;

    // Sync patterns to Obsidian
    if (evolutionState.patterns) {
      for (const pattern of evolutionState.patterns) {
        const patternId = pattern.id || `p-${Date.now()}-${synced}`;
        const notePath = `${this._basePath}/Knowledge/Pattern-${sanitize(patternId)}.md`;

        const content = templates.pattern({
          patternId,
          type: pattern.type || pattern.taskType,
          provider: pattern.provider,
          practice: pattern.practice || pattern.description,
          confidence: pattern.confidence,
          observations: pattern.observations,
          discoveredAt: pattern.discoveredAt || Date.now()
        });

        await this._bridge.putNote(notePath, content);
        synced++;
      }
    }

    // Sync weight summary to memory file
    if (evolutionState.weights) {
      this._writeWeightSummary(evolutionState.weights);
      synced++;
    }

    return { synced };
  }

  /**
   * Full bidirectional sync
   */
  async fullSync() {
    const m2o = await this.syncMemoryToObsidian();
    const o2h = await this.syncObsidianToHints();

    this._bus.emit('obsidian:sync:completed', {
      memoryToObsidian: m2o.synced,
      hints: o2h.hints.length
    });

    return {
      memoryToObsidian: m2o.synced,
      obsidianHints: o2h.hints.length
    };
  }

  /**
   * Get bridge status
   */
  getStatus() {
    return {
      memoryDir: this._memoryDir,
      syncedKeys: this._syncedKeys.size,
      stats: { ...this._stats }
    };
  }

  // ─── Private ─────────────────────────────────

  _wrapMemoryAsNote(name, content) {
    const fm = frontmatter({
      type: 'memory',
      source: 'claude_auto_memory',
      name,
      date: isoDate(),
      tags: ['nexus/memory', 'auto-sync']
    });

    return fm + '\n\n' + content;
  }

  _writeWeightSummary(weights) {
    try {
      const summaryPath = path.join(this._memoryDir, 'nexus-weights.md');
      const lines = ['# NEXUS Routing Weights (Auto-Synced)', '', `Updated: ${isoDate()}`, ''];

      for (const [taskType, providers] of Object.entries(weights)) {
        const sorted = Object.entries(providers).sort((a, b) => b[1] - a[1]);
        const best = sorted[0];
        lines.push(`- **${taskType}**: ${best[0]} (${(best[1] * 100).toFixed(0)}%)`);
      }

      if (!fs.existsSync(this._memoryDir)) {
        fs.mkdirSync(this._memoryDir, { recursive: true });
      }
      fs.writeFileSync(summaryPath, lines.join('\n'), 'utf8');
    } catch {
      this._stats.errors++;
    }
  }

  async _listVaultFolder(folderPath) {
    // Try REST API
    try {
      const res = await this._bridge.getNote(folderPath + '/');
      if (res.ok && res.content) {
        // Parse directory listing if available
        return res.content.split('\n').filter(l => l.endsWith('.md'));
      }
    } catch {
      // Fallback: not available
    }

    // Try direct file access
    if (this._bridge._vaultPath) {
      try {
        const fullPath = path.join(this._bridge._vaultPath, folderPath);
        if (fs.existsSync(fullPath)) {
          return fs.readdirSync(fullPath).filter(f => f.endsWith('.md'));
        }
      } catch {
        // Non-fatal
      }
    }

    return [];
  }

  _parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const fm = {};
    const lines = match[1].split('\n');
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();

      // Parse basic types
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (/^\d+(\.\d+)?$/.test(value)) value = parseFloat(value);
      else if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      } else {
        value = value.replace(/^"|"$/g, '');
      }

      fm[key] = value;
    }
    return fm;
  }
}

function sanitize(str) {
  return String(str).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100);
}

module.exports = { MemoryBridge };
