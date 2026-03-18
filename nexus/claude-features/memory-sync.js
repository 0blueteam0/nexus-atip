/**
 * NEXUS Memory Sync - Auto-Memory Integration
 *
 * Synchronizes NEXUS evolution patterns and knowledge
 * with Claude Code's auto-memory system (v2.1.59+).
 * Ensures session-spanning knowledge persists.
 *
 * @module nexus/claude-features/memory-sync
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { getEventBus } = require('../core/event-bus');

const MEMORY_DIR = path.join(__dirname, '..', '..', 'projects', 'K--PortableApps-genai', 'memory');

class MemorySync {
  constructor(options = {}) {
    this.bus = getEventBus();
    this._memoryDir = options.memoryDir || MEMORY_DIR;
    this._autoSync = options.autoSync !== false;
    this._syncedPatterns = new Set();
  }

  /**
   * Sync a NEXUS evolution pattern to auto-memory
   * @param {Object} pattern - { id, type, provider, practice, confidence }
   */
  syncPattern(pattern) {
    if (this._syncedPatterns.has(pattern.id)) return { synced: false, reason: 'Already synced' };

    const memoryFile = path.join(this._memoryDir, 'nexus-patterns.md');
    const entry = `- [${pattern.type}] ${pattern.provider}: ${pattern.practice || pattern.type} (confidence: ${((pattern.confidence || 0) * 100).toFixed(0)}%)`;

    this._appendToFile(memoryFile, entry, '# NEXUS Evolution Patterns');
    this._syncedPatterns.add(pattern.id);

    this.bus.emit('memory:pattern:synced', { patternId: pattern.id });
    return { synced: true };
  }

  /**
   * Sync routing insight to memory
   * @param {Object} insight - { taskType, bestProvider, reason, confidence }
   */
  syncRoutingInsight(insight) {
    const memoryFile = path.join(this._memoryDir, 'nexus-routing.md');
    const entry = `- ${insight.taskType} -> ${insight.bestProvider} (${insight.reason}, conf: ${((insight.confidence || 0) * 100).toFixed(0)}%)`;

    this._appendToFile(memoryFile, entry, '# NEXUS Routing Insights');
    return { synced: true };
  }

  /**
   * Read current memory state
   */
  readMemory() {
    const files = ['nexus-patterns.md', 'nexus-routing.md'];
    const memory = {};

    for (const file of files) {
      const filePath = path.join(this._memoryDir, file);
      try {
        if (fs.existsSync(filePath)) {
          memory[file] = fs.readFileSync(filePath, 'utf8');
        }
      } catch {
        // Non-fatal
      }
    }

    return memory;
  }

  /**
   * Auto-sync from evolution state
   * @param {Object} evolutionState - NEXUS evolution state
   */
  autoSync(evolutionState) {
    if (!this._autoSync) return { synced: 0 };

    let synced = 0;

    // Sync patterns
    if (evolutionState?.patterns) {
      for (const pattern of evolutionState.patterns) {
        const result = this.syncPattern(pattern);
        if (result.synced) synced++;
      }
    }

    // Sync high-confidence routing weights as insights
    if (evolutionState?.weights) {
      for (const [taskType, providers] of Object.entries(evolutionState.weights)) {
        const best = Object.entries(providers).sort((a, b) => b[1] - a[1])[0];
        if (best && best[1] > 0.7) {
          this.syncRoutingInsight({
            taskType,
            bestProvider: best[0],
            reason: 'high_weight',
            confidence: best[1]
          });
          synced++;
        }
      }
    }

    return { synced };
  }

  /**
   * Append entry to a markdown file
   */
  _appendToFile(filePath, entry, header) {
    try {
      if (!fs.existsSync(this._memoryDir)) {
        fs.mkdirSync(this._memoryDir, { recursive: true });
      }

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes(entry)) {
          fs.appendFileSync(filePath, '\n' + entry);
        }
      } else {
        fs.writeFileSync(filePath, `${header}\n\n${entry}\n`);
      }
    } catch {
      // Non-fatal
    }
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      autoSync: this._autoSync,
      syncedPatterns: this._syncedPatterns.size,
      memoryDir: this._memoryDir
    };
  }
}

module.exports = { MemorySync };
