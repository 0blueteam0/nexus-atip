/**
 * NEXUS Tracer Middleware - Execution Tracing & Logging
 *
 * Records detailed execution traces for every graph node.
 * Provides structured logs for debugging, observability,
 * and the monitoring dashboard.
 *
 * @module nexus/agent-framework/middleware/tracer
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { getEventBus } = require('../../core/event-bus');

const LOG_DIR = path.join(__dirname, '..', '..', 'data', 'logs');

class TracerMiddleware {
  constructor(options = {}) {
    this.bus = getEventBus();
    this._traces = new Map(); // runId -> trace[]
    this._maxTraces = options.maxTraces || 100;
    this._persistLogs = options.persistLogs !== false;
    this._logDir = options.logDir || LOG_DIR;
  }

  /**
   * Record node execution start
   * @param {string} runId
   * @param {string} nodeId
   * @param {Object} state - State entering the node
   */
  onNodeStart(runId, nodeId, state) {
    if (!this._traces.has(runId)) {
      this._traces.set(runId, []);
    }

    const entry = {
      type: 'node_start',
      runId,
      nodeId,
      timestamp: Date.now(),
      stateKeys: Object.keys(state),
      stateSize: JSON.stringify(state).length
    };

    this._traces.get(runId).push(entry);
    this.bus.emit('graph:node:start', entry);
  }

  /**
   * Record node execution end
   * @param {string} runId
   * @param {string} nodeId
   * @param {Object} result - Node output
   * @param {number} durationMs
   * @param {string} [error] - Error message if failed
   */
  onNodeEnd(runId, nodeId, result, durationMs, error) {
    const trace = this._traces.get(runId);
    if (!trace) return;

    const entry = {
      type: error ? 'node_error' : 'node_end',
      runId,
      nodeId,
      timestamp: Date.now(),
      durationMs,
      resultKeys: result ? Object.keys(result) : [],
      error: error || undefined
    };

    trace.push(entry);
    this.bus.emit(error ? 'graph:node:error' : 'graph:node:end', entry);
  }

  /**
   * Record graph execution start
   * @param {string} runId
   * @param {string} graphId
   * @param {Object} input
   */
  onGraphStart(runId, graphId, input) {
    this._traces.set(runId, [{
      type: 'graph_start',
      runId,
      graphId,
      timestamp: Date.now(),
      inputKeys: Object.keys(input)
    }]);

    this.bus.emit('graph:start', { runId, graphId });

    // Prune old traces
    if (this._traces.size > this._maxTraces) {
      const oldest = [...this._traces.keys()][0];
      this._traces.delete(oldest);
    }
  }

  /**
   * Record graph execution end
   * @param {string} runId
   * @param {boolean} success
   * @param {number} totalDurationMs
   * @param {number} stepCount
   */
  onGraphEnd(runId, success, totalDurationMs, stepCount) {
    const trace = this._traces.get(runId);
    if (!trace) return;

    const entry = {
      type: 'graph_end',
      runId,
      timestamp: Date.now(),
      success,
      totalDurationMs,
      stepCount
    };

    trace.push(entry);
    this.bus.emit('graph:end', { runId, success, totalDurationMs, stepCount });

    // Persist to JSONL if enabled
    if (this._persistLogs) {
      this._persistTrace(runId, trace);
    }
  }

  /**
   * Stream intermediate results
   * @param {string} runId
   * @param {string} nodeId
   * @param {*} chunk - Partial result
   */
  onStream(runId, nodeId, chunk) {
    this.bus.emit('graph:stream', { runId, nodeId, chunk, timestamp: Date.now() });
  }

  /**
   * Get trace for a run
   * @param {string} runId
   * @returns {Array}
   */
  getTrace(runId) {
    return this._traces.get(runId) || [];
  }

  /**
   * Get all active run IDs
   */
  getActiveRuns() {
    return [...this._traces.keys()];
  }

  /**
   * Persist trace to JSONL file
   */
  _persistTrace(runId, trace) {
    try {
      if (!fs.existsSync(this._logDir)) {
        fs.mkdirSync(this._logDir, { recursive: true });
      }
      const date = new Date().toISOString().split('T')[0];
      const logPath = path.join(this._logDir, `${date}.jsonl`);
      const lines = trace.map(e => JSON.stringify(e)).join('\n') + '\n';
      fs.appendFileSync(logPath, lines);
    } catch {
      // Non-fatal
    }
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      activeTraces: this._traces.size,
      maxTraces: this._maxTraces,
      persistLogs: this._persistLogs,
      logDir: this._logDir
    };
  }
}

module.exports = { TracerMiddleware };
