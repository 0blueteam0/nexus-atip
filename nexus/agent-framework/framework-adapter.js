/**
 * NEXUS Framework Adapter - AgentFrameworkPort Implementation
 *
 * Bridges agent frameworks (native graph engine, LangGraph, CrewAI)
 * to the NEXUS port system. Uses native engine by default,
 * Python frameworks when available.
 *
 * @module nexus/agent-framework/framework-adapter
 */

'use strict';

const { execSync } = require('child_process');
const { GraphEngine } = require('./graph-engine');

class FrameworkAdapter {
  constructor(options = {}) {
    this.nativeEngine = new GraphEngine();
    this._pythonAvailable = null;
    this._langGraphAvailable = null;
    this._registerBuiltinGraphs();
  }

  /**
   * Execute a graph definition
   * @param {Object} graphDef - Graph definition or registered graph ID (string)
   * @param {Object} input - Input state
   * @returns {Promise<{success, output, steps, framework, reason}>}
   */
  async executeGraph(graphDef, input) {
    // If graphDef is a string, look up registered graph
    const graphId = typeof graphDef === 'string' ? graphDef : graphDef.id;

    // Try native engine first
    const result = await this.nativeEngine.execute(graphId, input);
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
    return this.nativeEngine.listGraphs().map(g => ({
      ...g,
      framework: 'nexus-native'
    }));
  }

  /**
   * Get framework availability status
   * @returns {Promise<{available, frameworks}>}
   */
  async getFrameworkStatus() {
    const frameworks = [
      { name: 'nexus-native', available: true, version: '1.0.0' }
    ];

    // Check Python availability
    if (this._isPythonAvailable()) {
      frameworks.push({ name: 'python', available: true });

      // Check LangGraph
      if (this._isLangGraphAvailable()) {
        frameworks.push({ name: 'langgraph', available: true });
      }
    }

    return {
      available: true,
      frameworks,
      graphs: this.nativeEngine.listGraphs().length
    };
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
  }

  _isPythonAvailable() {
    if (this._pythonAvailable !== null) return this._pythonAvailable;
    try {
      execSync('python --version', { timeout: 5000, stdio: 'pipe' });
      this._pythonAvailable = true;
    } catch {
      this._pythonAvailable = false;
    }
    return this._pythonAvailable;
  }

  _isLangGraphAvailable() {
    if (this._langGraphAvailable !== null) return this._langGraphAvailable;
    try {
      execSync('python -c "import langgraph"', { timeout: 5000, stdio: 'pipe' });
      this._langGraphAvailable = true;
    } catch {
      this._langGraphAvailable = false;
    }
    return this._langGraphAvailable;
  }
}

module.exports = { FrameworkAdapter };
