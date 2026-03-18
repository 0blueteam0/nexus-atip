/**
 * NEXUS Graph Engine - Lightweight Node.js Graph Executor
 *
 * Simple directed graph execution engine (no Python dependency).
 * Supports node-based workflows with conditional edges.
 *
 * v3.0 Phase 8 upgrades:
 * - Checkpointing (auto-save after each node)
 * - Middleware pipeline (HITL, summarizer, tracer)
 * - Streaming (EventBus-based intermediate results)
 *
 * @module nexus/agent-framework/graph-engine
 */

'use strict';

const { getEventBus } = require('../core/event-bus');

class GraphEngine {
  constructor(options = {}) {
    this._graphs = new Map();
    this.bus = getEventBus();
    this._checkpointStore = null;
    this._middlewares = {
      hitl: null,
      summarizer: null,
      tracer: null
    };
  }

  /**
   * Attach checkpoint store for state persistence
   * @param {CheckpointStore} store
   */
  setCheckpointStore(store) {
    this._checkpointStore = store;
  }

  /**
   * Attach middleware
   * @param {string} name - 'hitl' | 'summarizer' | 'tracer'
   * @param {Object} middleware - Middleware instance
   */
  setMiddleware(name, middleware) {
    if (name in this._middlewares) {
      this._middlewares[name] = middleware;
    }
  }

  /**
   * Register a graph definition
   * @param {Object} graphDef - { id, name, nodes: [{id, fn, edges}], entrypoint }
   */
  register(graphDef) {
    this._graphs.set(graphDef.id, graphDef);
  }

  /**
   * Execute a registered graph with full middleware support
   * @param {string} graphId
   * @param {Object} input - Initial state
   * @param {Object} [options]
   * @param {string} [options.runId] - Custom run ID
   * @param {string} [options.branch] - Branch name for checkpoints
   * @param {string} [options.resumeFromCheckpoint] - Checkpoint ID to resume from
   * @returns {Promise<{success, output, steps, runId, error}>}
   */
  async execute(graphId, input, options = {}) {
    const graph = this._graphs.get(graphId);
    if (!graph) {
      return { success: false, output: null, error: `Graph not found: ${graphId}` };
    }

    const runId = options.runId || `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const branch = options.branch || 'main';
    const nodes = new Map(graph.nodes.map(n => [n.id, n]));
    let currentNodeId = graph.entrypoint;
    let state = { ...input };
    const steps = [];
    const maxSteps = graph.maxSteps || 50;
    let stepCount = 0;
    let lastCheckpointId = null;

    // Resume from checkpoint if specified
    if (options.resumeFromCheckpoint && this._checkpointStore) {
      const restored = this._checkpointStore.restore(options.resumeFromCheckpoint);
      if (restored.restored) {
        state = { ...state, ...restored.state };
        currentNodeId = restored.nodeId;
        stepCount = restored.step;
        lastCheckpointId = options.resumeFromCheckpoint;
        this.bus.emit('graph:resumed', { runId, graphId, fromCheckpoint: options.resumeFromCheckpoint });
      }
    }

    // Tracer: graph start
    if (this._middlewares.tracer) {
      this._middlewares.tracer.onGraphStart(runId, graphId, input);
    }

    this.bus.emit('graph:start', { runId, graphId, entrypoint: currentNodeId });

    while (currentNodeId && stepCount < maxSteps) {
      const node = nodes.get(currentNodeId);
      if (!node) {
        return { success: false, output: state, steps, runId, error: `Node not found: ${currentNodeId}` };
      }

      stepCount++;
      const startTime = Date.now();

      // HITL: check approval before node execution
      if (this._middlewares.hitl) {
        const approval = await this._middlewares.hitl.checkApproval(currentNodeId, state);
        if (!approval.approved) {
          steps.push({ nodeId: node.id, duration: 0, skipped: true, reason: approval.feedback || 'HITL rejected' });
          return {
            success: false, output: state, steps, runId,
            error: `HITL rejected at node: ${currentNodeId}`,
            feedback: approval.feedback
          };
        }
      }

      // Tracer: node start
      if (this._middlewares.tracer) {
        this._middlewares.tracer.onNodeStart(runId, currentNodeId, state);
      }

      try {
        // Execute node function
        const result = await node.fn(state);
        state = { ...state, ...result };
        const duration = Date.now() - startTime;

        steps.push({
          nodeId: node.id,
          duration,
          output: result
        });

        // Tracer: node end
        if (this._middlewares.tracer) {
          this._middlewares.tracer.onNodeEnd(runId, currentNodeId, result, duration);
        }

        // Stream intermediate result
        this.bus.emit('graph:stream', { runId, nodeId: currentNodeId, result, step: stepCount });

        // Summarizer: compress state if too large
        if (this._middlewares.summarizer) {
          state = this._middlewares.summarizer.process(state);
        }

        // Checkpoint: save state after node
        if (this._checkpointStore) {
          const cp = this._checkpointStore.save({
            graphId, runId, nodeId: currentNodeId,
            step: stepCount, state,
            parentId: lastCheckpointId, branch
          });
          lastCheckpointId = cp.id;
        }

        // Determine next node
        if (node.edges) {
          if (typeof node.edges === 'function') {
            currentNodeId = node.edges(state);
          } else if (typeof node.edges === 'string') {
            currentNodeId = node.edges;
          } else {
            currentNodeId = null;
          }
        } else {
          currentNodeId = null;
        }
      } catch (e) {
        const duration = Date.now() - startTime;
        steps.push({ nodeId: node.id, duration, error: e.message });

        if (this._middlewares.tracer) {
          this._middlewares.tracer.onNodeEnd(runId, currentNodeId, null, duration, e.message);
        }

        // Save error checkpoint
        if (this._checkpointStore) {
          this._checkpointStore.save({
            graphId, runId, nodeId: currentNodeId,
            step: stepCount, state: { ...state, _error: e.message },
            parentId: lastCheckpointId, branch
          });
        }

        const totalDuration = Date.now() - (steps[0]?.duration || startTime);
        if (this._middlewares.tracer) {
          this._middlewares.tracer.onGraphEnd(runId, false, totalDuration, stepCount);
        }

        return { success: false, output: state, steps, runId, error: e.message };
      }
    }

    if (stepCount >= maxSteps) {
      if (this._middlewares.tracer) {
        this._middlewares.tracer.onGraphEnd(runId, false, Date.now() - steps[0]?.duration, stepCount);
      }
      return { success: false, output: state, steps, runId, error: 'Max steps reached' };
    }

    // Tracer: graph end
    const totalDuration = steps.reduce((sum, s) => sum + (s.duration || 0), 0);
    if (this._middlewares.tracer) {
      this._middlewares.tracer.onGraphEnd(runId, true, totalDuration, stepCount);
    }

    this.bus.emit('graph:end', { runId, graphId, success: true, steps: stepCount });

    return { success: true, output: state, steps, runId };
  }

  /**
   * List registered graphs
   * @returns {Array<{id, name, nodeCount}>}
   */
  listGraphs() {
    return [...this._graphs.values()].map(g => ({
      id: g.id,
      name: g.name,
      nodeCount: g.nodes.length,
      entrypoint: g.entrypoint
    }));
  }
}

module.exports = { GraphEngine };
