/**
 * NEXUS Graph Engine - Lightweight Node.js Graph Executor
 *
 * Simple directed graph execution engine (no Python dependency).
 * Supports node-based workflows with conditional edges.
 * Alternative to LangGraph when Python is unavailable.
 *
 * @module nexus/agent-framework/graph-engine
 */

'use strict';

class GraphEngine {
  constructor() {
    this._graphs = new Map();
  }

  /**
   * Register a graph definition
   * @param {Object} graphDef - { id, name, nodes: [{id, fn, edges}], entrypoint }
   */
  register(graphDef) {
    this._graphs.set(graphDef.id, graphDef);
  }

  /**
   * Execute a registered graph
   * @param {string} graphId
   * @param {Object} input - Initial state
   * @returns {Promise<{success, output, steps, error}>}
   */
  async execute(graphId, input) {
    const graph = this._graphs.get(graphId);
    if (!graph) {
      return { success: false, output: null, error: `Graph not found: ${graphId}` };
    }

    const nodes = new Map(graph.nodes.map(n => [n.id, n]));
    let currentNodeId = graph.entrypoint;
    let state = { ...input };
    const steps = [];
    const maxSteps = graph.maxSteps || 50;
    let stepCount = 0;

    while (currentNodeId && stepCount < maxSteps) {
      const node = nodes.get(currentNodeId);
      if (!node) {
        return { success: false, output: state, steps, error: `Node not found: ${currentNodeId}` };
      }

      stepCount++;
      const startTime = Date.now();

      try {
        // Execute node function
        const result = await node.fn(state);
        state = { ...state, ...result };

        steps.push({
          nodeId: node.id,
          duration: Date.now() - startTime,
          output: result
        });

        // Determine next node
        if (node.edges) {
          if (typeof node.edges === 'function') {
            currentNodeId = node.edges(state);
          } else if (typeof node.edges === 'string') {
            currentNodeId = node.edges;
          } else {
            currentNodeId = null; // End
          }
        } else {
          currentNodeId = null; // No edges = terminal node
        }
      } catch (e) {
        steps.push({ nodeId: node.id, duration: Date.now() - startTime, error: e.message });
        return { success: false, output: state, steps, error: e.message };
      }
    }

    if (stepCount >= maxSteps) {
      return { success: false, output: state, steps, error: 'Max steps reached' };
    }

    return { success: true, output: state, steps };
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
