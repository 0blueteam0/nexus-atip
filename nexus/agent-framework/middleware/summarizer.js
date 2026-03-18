/**
 * NEXUS Summarizer Middleware - Context Window Protection
 *
 * Automatically summarizes accumulated graph state when it
 * exceeds a configurable threshold. Prevents context window
 * overflow in long-running agent graphs.
 *
 * @module nexus/agent-framework/middleware/summarizer
 */

'use strict';

const { getEventBus } = require('../../core/event-bus');

class SummarizerMiddleware {
  constructor(options = {}) {
    this.bus = getEventBus();
    this._maxStateSize = options.maxStateSizeChars || 50000;
    this._summaryRatio = options.summaryRatio || 0.3; // Reduce to 30%
    this._protectedKeys = new Set(options.protectedKeys || ['task', 'phase', 'plan', '_metadata']);
    this._summaryCount = 0;
  }

  /**
   * Check state size and summarize if needed
   * Called by GraphEngine after each node execution.
   *
   * @param {Object} state - Current graph state
   * @returns {Object} Possibly summarized state
   */
  process(state) {
    const stateStr = JSON.stringify(state);
    if (stateStr.length <= this._maxStateSize) return state;

    this._summaryCount++;
    this.bus.emit('middleware:summarize', {
      originalSize: stateStr.length,
      threshold: this._maxStateSize,
      summaryNum: this._summaryCount
    });

    return this._summarize(state, stateStr.length);
  }

  /**
   * Summarize state by compressing large values
   */
  _summarize(state, originalSize) {
    const summarized = {};
    const targetSize = Math.floor(originalSize * this._summaryRatio);

    // Pass 1: Keep protected keys as-is
    for (const key of this._protectedKeys) {
      if (key in state) {
        summarized[key] = state[key];
      }
    }

    // Pass 2: Process remaining keys
    const remaining = Object.entries(state)
      .filter(([k]) => !this._protectedKeys.has(k))
      .sort((a, b) => {
        // Prioritize shorter values
        const sizeA = JSON.stringify(a[1]).length;
        const sizeB = JSON.stringify(b[1]).length;
        return sizeA - sizeB;
      });

    let currentSize = JSON.stringify(summarized).length;

    for (const [key, value] of remaining) {
      const valueStr = JSON.stringify(value);

      if (currentSize + valueStr.length > targetSize) {
        // Compress this value
        summarized[key] = this._compressValue(key, value);
      } else {
        summarized[key] = value;
      }
      currentSize = JSON.stringify(summarized).length;
    }

    // Add summary metadata
    summarized._summarized = {
      at: Date.now(),
      originalSize,
      compressedSize: JSON.stringify(summarized).length,
      count: this._summaryCount
    };

    return summarized;
  }

  /**
   * Compress a single value
   */
  _compressValue(key, value) {
    if (typeof value === 'string') {
      if (value.length > 200) {
        return `[Summary] ${value.slice(0, 100)}... (${value.length} chars total)`;
      }
      return value;
    }

    if (Array.isArray(value)) {
      if (value.length > 5) {
        return `[Array: ${value.length} items, first: ${JSON.stringify(value[0]).slice(0, 80)}]`;
      }
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);
      if (keys.length > 10 || JSON.stringify(value).length > 500) {
        return `[Object: ${keys.length} keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}]`;
      }
      return value;
    }

    return value;
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      maxStateSize: this._maxStateSize,
      summaryRatio: this._summaryRatio,
      summaryCount: this._summaryCount,
      protectedKeys: [...this._protectedKeys]
    };
  }
}

module.exports = { SummarizerMiddleware };
