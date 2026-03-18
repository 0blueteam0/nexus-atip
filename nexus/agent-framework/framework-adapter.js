/**
 * NEXUS Framework Adapter - AgentFrameworkPort Implementation
 *
 * Bridges agent frameworks (native graph engine, LangGraph.js)
 * to the NEXUS port system. Supports dual-engine architecture:
 * - Native GraphEngine: always available, lightweight
 * - LangGraph.js Engine: when @langchain/langgraph is installed
 *
 * Auto-selects the best engine based on availability and graph needs.
 *
 * @module nexus/agent-framework/framework-adapter
 */

'use strict';

const { GraphEngine } = require('./graph-engine');
const { LangGraphEngine, langGraphAvailable } = require('./langgraph-engine');
const { CheckpointStore } = require('./checkpoint-store');
const { HITLMiddleware } = require('./middleware/hitl');
const { SummarizerMiddleware } = require('./middleware/summarizer');
const { TracerMiddleware } = require('./middleware/tracer');

class FrameworkAdapter {
  constructor(options = {}) {
    // Native engine (always available)
    this.nativeEngine = new GraphEngine();

    // LangGraph engine (optional)
    this.langGraphEngine = new LangGraphEngine();

    // Middleware stack
    this.checkpointStore = new CheckpointStore(options.checkpoint || {});
    this.hitl = new HITLMiddleware(options.hitl || { autoApprove: true });
    this.summarizer = new SummarizerMiddleware(options.summarizer || {});
    this.tracer = new TracerMiddleware(options.tracer || {});

    // Wire middleware to native engine
    this.nativeEngine.setCheckpointStore(this.checkpointStore);
    this.nativeEngine.setMiddleware('hitl', this.hitl);
    this.nativeEngine.setMiddleware('summarizer', this.summarizer);
    this.nativeEngine.setMiddleware('tracer', this.tracer);

    // Preferred engine selection
    this._preferLangGraph = options.preferLangGraph || false;

    this._registerBuiltinGraphs();
  }

  /**
   * Execute a graph definition
   * @param {Object|string} graphDef - Graph definition or registered graph ID (string)
   * @param {Object} input - Input state
   * @param {Object} [options] - { engine, runId, branch, resumeFromCheckpoint, threadId }
   * @returns {Promise<{success, output, steps, framework, reason, runId}>}
   */
  async executeGraph(graphDef, input, options = {}) {
    const graphId = typeof graphDef === 'string' ? graphDef : graphDef.id;
    const engineChoice = options.engine || this._selectEngine(graphId);

    // Try LangGraph if preferred and available
    if (engineChoice === 'langgraph' && this.langGraphEngine.isAvailable()) {
      const lgResult = await this.langGraphEngine.execute(graphId, input, {
        threadId: options.threadId
      });
      if (lgResult.success) {
        return { ...lgResult, reason: 'langgraph_execution' };
      }
      // Fall through to native on LangGraph failure
    }

    // Native engine execution (with full middleware)
    const result = await this.nativeEngine.execute(graphId, input, {
      runId: options.runId,
      branch: options.branch,
      resumeFromCheckpoint: options.resumeFromCheckpoint
    });

    return {
      ...result,
      framework: 'nexus-native',
      reason: result.success ? 'native_execution' : result.error
    };
  }

  /**
   * List available graphs
   * @returns {Array<{id, name, nodeCount, framework}>}
   */
  listGraphs() {
    const native = this.nativeEngine.listGraphs().map(g => ({
      ...g,
      framework: 'nexus-native'
    }));

    const lg = this.langGraphEngine.isAvailable()
      ? this.langGraphEngine.getStatus().graphIds.map(id => ({
          id,
          framework: 'langgraph'
        }))
      : [];

    return [...native, ...lg];
  }

  /**
   * Get framework availability status
   * @returns {Promise<{available, frameworks}>}
   */
  async getFrameworkStatus() {
    const frameworks = [
      { name: 'nexus-native', available: true, version: '2.0.0' }
    ];

    if (this.langGraphEngine.isAvailable()) {
      frameworks.push({ name: 'langgraph', available: true, version: '1.0.x' });
    }

    const middlewareStatus = {
      checkpointing: this.checkpointStore.getStats(),
      hitl: this.hitl.getStatus(),
      summarizer: this.summarizer.getStatus(),
      tracer: this.tracer.getStatus()
    };

    return {
      available: true,
      frameworks,
      graphs: this.nativeEngine.listGraphs().length,
      middleware: middlewareStatus
    };
  }

  /**
   * Get checkpoint store for external access
   */
  getCheckpointStore() {
    return this.checkpointStore;
  }

  /**
   * Get tracer for external access
   */
  getTracer() {
    return this.tracer;
  }

  /**
   * Auto-select engine based on graph characteristics
   */
  _selectEngine(graphId) {
    if (this._preferLangGraph && this.langGraphEngine.isAvailable()) {
      const lgStatus = this.langGraphEngine.getStatus();
      if (lgStatus.graphIds.includes(graphId)) {
        return 'langgraph';
      }
    }
    return 'native';
  }

  /**
   * Register built-in graph templates
   * @private
   */
  _registerBuiltinGraphs() {
    // Plan-Execute-Review graph
    this.nativeEngine.register({
      id: 'plan-execute-review',
      name: 'Plan-Execute-Review Loop',
      entrypoint: 'plan',
      maxSteps: 10,
      nodes: [
        {
          id: 'plan',
          fn: async (state) => ({
            plan: state.plan || `Plan for: ${state.task || 'unknown'}`,
            phase: 'planned'
          }),
          edges: 'execute'
        },
        {
          id: 'execute',
          fn: async (state) => ({
            result: `Executed: ${state.plan}`,
            phase: 'executed'
          }),
          edges: 'review'
        },
        {
          id: 'review',
          fn: async (state) => ({
            review: 'approved',
            phase: 'reviewed'
          }),
          edges: (state) => state.review === 'retry' ? 'plan' : null
        }
      ]
    });

    // Research-Synthesize graph
    this.nativeEngine.register({
      id: 'research-synthesize',
      name: 'Research and Synthesize',
      entrypoint: 'gather',
      maxSteps: 10,
      nodes: [
        {
          id: 'gather',
          fn: async (state) => ({ sources: state.sources || [], phase: 'gathered' }),
          edges: 'analyze'
        },
        {
          id: 'analyze',
          fn: async (state) => ({
            analysis: `Analyzed ${state.sources.length} sources`,
            phase: 'analyzed'
          }),
          edges: 'synthesize'
        },
        {
          id: 'synthesize',
          fn: async (state) => ({
            synthesis: `Synthesis of: ${state.analysis}`,
            phase: 'synthesized'
          }),
          edges: null
        }
      ]
    });

    // Deep Agent graph (Phase 8 new)
    this.nativeEngine.register({
      id: 'deep-agent-loop',
      name: 'Deep Agent: Plan-Execute-Verify',
      entrypoint: 'decompose',
      maxSteps: 20,
      nodes: [
        {
          id: 'decompose',
          fn: async (state) => ({
            subtasks: state.subtasks || [`Subtask for: ${state.task || 'unknown'}`],
            currentSubtask: 0,
            phase: 'decomposed'
          }),
          edges: 'execute_subtask'
        },
        {
          id: 'execute_subtask',
          fn: async (state) => {
            const idx = state.currentSubtask || 0;
            const subtask = (state.subtasks || [])[idx] || 'no subtask';
            return {
              results: [...(state.results || []), `Result of: ${subtask}`],
              currentSubtask: idx + 1,
              phase: 'executing'
            };
          },
          edges: (state) => {
            const idx = state.currentSubtask || 0;
            const total = (state.subtasks || []).length;
            if (idx < total) return 'execute_subtask';
            return 'verify';
          }
        },
        {
          id: 'verify',
          fn: async (state) => ({
            verified: true,
            phase: 'verified'
          }),
          edges: null
        }
      ]
    });
  }
}

module.exports = { FrameworkAdapter };
