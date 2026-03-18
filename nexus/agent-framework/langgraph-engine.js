/**
 * NEXUS LangGraph Engine - @langchain/langgraph Integration
 *
 * Wraps the LangGraph.js StateGraph for native Node.js execution.
 * Falls back gracefully to the native GraphEngine if LangGraph
 * is not available or encounters errors.
 *
 * Uses the already-installed @langchain/langgraph package.
 *
 * @module nexus/agent-framework/langgraph-engine
 */

'use strict';

const { getEventBus } = require('../core/event-bus');

let StateGraph = null;
let Annotation = null;
let MemorySaver = null;
let langGraphAvailable = false;

// Attempt to load LangGraph.js
try {
  const lg = require('@langchain/langgraph');
  StateGraph = lg.StateGraph;
  Annotation = lg.Annotation;
  MemorySaver = lg.MemorySaver;
  langGraphAvailable = true;
} catch {
  // LangGraph not available - will use native engine
}

class LangGraphEngine {
  constructor(options = {}) {
    this.bus = getEventBus();
    this._compiledGraphs = new Map();
    this._memorySaver = langGraphAvailable && MemorySaver ? new MemorySaver() : null;
    this._available = langGraphAvailable;
  }

  /**
   * Check if LangGraph.js is available
   * @returns {boolean}
   */
  isAvailable() {
    return this._available;
  }

  /**
   * Create and compile a LangGraph StateGraph
   *
   * @param {Object} graphDef - NEXUS graph definition
   * @param {string} graphDef.id
   * @param {string} graphDef.name
   * @param {Array} graphDef.nodes - [{id, fn, edges}]
   * @param {string} graphDef.entrypoint
   * @returns {{compiled: boolean, graphId: string}}
   */
  compile(graphDef) {
    if (!this._available) {
      return { compiled: false, reason: 'LangGraph.js not available' };
    }

    try {
      // Build state annotation from graph definition
      // Use a simple reducer that merges objects
      const GraphState = Annotation.Root({
        ...Object.fromEntries(
          graphDef.stateKeys
            ? graphDef.stateKeys.map(k => [k, Annotation({ reducer: (a, b) => b !== undefined ? b : a, default: () => null })])
            : [['data', Annotation({ reducer: (a, b) => ({ ...a, ...b }), default: () => ({}) })]]
        )
      });

      const builder = new StateGraph(GraphState);

      // Add nodes
      for (const node of graphDef.nodes) {
        builder.addNode(node.id, async (state) => {
          this.bus.emit('graph:node:start', { graphId: graphDef.id, nodeId: node.id });
          const start = Date.now();
          try {
            const result = await node.fn(state);
            this.bus.emit('graph:node:end', { graphId: graphDef.id, nodeId: node.id, durationMs: Date.now() - start });
            return result;
          } catch (e) {
            this.bus.emit('graph:node:error', { graphId: graphDef.id, nodeId: node.id, error: e.message });
            throw e;
          }
        });
      }

      // Set entry point
      builder.addEdge('__start__', graphDef.entrypoint);

      // Add edges
      for (const node of graphDef.nodes) {
        if (!node.edges) {
          builder.addEdge(node.id, '__end__');
        } else if (typeof node.edges === 'string') {
          builder.addEdge(node.id, node.edges);
        } else if (typeof node.edges === 'function') {
          // Conditional edge
          const possibleTargets = graphDef.nodes.map(n => n.id);
          builder.addConditionalEdges(node.id, node.edges, possibleTargets);
        }
      }

      // Compile with checkpointer
      const compiled = builder.compile({
        checkpointer: this._memorySaver
      });

      this._compiledGraphs.set(graphDef.id, compiled);

      return { compiled: true, graphId: graphDef.id };
    } catch (e) {
      return { compiled: false, reason: e.message };
    }
  }

  /**
   * Execute a compiled LangGraph
   *
   * @param {string} graphId
   * @param {Object} input - Initial state
   * @param {Object} [options]
   * @param {string} [options.threadId] - Thread ID for checkpointing
   * @returns {Promise<{success, output, steps, framework}>}
   */
  async execute(graphId, input, options = {}) {
    const compiled = this._compiledGraphs.get(graphId);
    if (!compiled) {
      return { success: false, error: `Graph not compiled: ${graphId}`, framework: 'langgraph' };
    }

    const threadId = options.threadId || `thread-${Date.now()}`;
    const config = { configurable: { thread_id: threadId } };
    const steps = [];
    const startTime = Date.now();

    try {
      // Stream execution for step tracking
      const stream = await compiled.stream(input, config);

      for await (const event of stream) {
        const nodeId = Object.keys(event)[0];
        if (nodeId) {
          steps.push({
            nodeId,
            duration: Date.now() - startTime,
            output: event[nodeId]
          });
        }
      }

      // Get final state
      const finalState = await compiled.getState(config);

      return {
        success: true,
        output: finalState.values,
        steps,
        framework: 'langgraph',
        threadId
      };
    } catch (e) {
      return {
        success: false,
        output: null,
        steps,
        error: e.message,
        framework: 'langgraph'
      };
    }
  }

  /**
   * Get state history for a thread (time-travel)
   * @param {string} graphId
   * @param {string} threadId
   * @returns {Promise<Array>}
   */
  async getStateHistory(graphId, threadId) {
    const compiled = this._compiledGraphs.get(graphId);
    if (!compiled || !this._memorySaver) return [];

    try {
      const config = { configurable: { thread_id: threadId } };
      const history = [];
      for await (const state of compiled.getStateHistory(config)) {
        history.push({
          values: state.values,
          next: state.next,
          config: state.config,
          createdAt: state.createdAt
        });
      }
      return history;
    } catch {
      return [];
    }
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      available: this._available,
      compiledGraphs: this._compiledGraphs.size,
      hasCheckpointer: !!this._memorySaver,
      graphIds: [...this._compiledGraphs.keys()]
    };
  }
}

module.exports = { LangGraphEngine, langGraphAvailable };
