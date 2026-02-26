/**
 * NEXUS Null Adapters - Graceful Degradation
 *
 * Null Object pattern implementations for all 8 ports.
 * When a real adapter is not registered, the null adapter
 * provides safe defaults that prevent crashes.
 *
 * @module nexus/ports/null-adapters
 */

'use strict';

class NullAgentLoop {
  async planTask(task) {
    return { steps: [], provider: 'none', reason: 'No AgentLoop adapter registered' };
  }
  async executeStep(step, context) {
    return { success: false, output: null, reason: 'No AgentLoop adapter registered' };
  }
  async reviewResult(result, plan) {
    return { approved: true, issues: [], reason: 'Auto-approved (no reviewer)' };
  }
  async compoundLearning(review, solutions) {
    return null;
  }
}

class NullModelRouter {
  async route(task) {
    return {
      provider: 'claude-code',
      fallbacks: ['gemini-cli', 'codex-cli'],
      reason: 'default_fallback (NullModelRouter)',
      strategy: 'default'
    };
  }
  async recordResult(result) {}
  getWeights() { return {}; }
  async adjustWeights(feedback) {}
}

class NullToolExecution {
  async execute(toolName, params) {
    return { success: false, error: `No ToolExecution adapter (tool: ${toolName})` };
  }
  listAvailable() { return []; }
  async healthCheck(toolName) {
    return { status: 'unknown', healthy: false, reason: 'No ToolExecution adapter' };
  }
}

class NullMemory {
  async get(key, tier) { return null; }
  async set(key, value, tier) {}
  async search(query, options) { return []; }
  async compact(tier) { return { removed: 0, kept: 0 }; }
}

class NullSkillRegistry {
  register(skill) {}
  find(query) { return []; }
  async execute(skillId, params) {
    return { success: false, error: `No SkillRegistry adapter (skill: ${skillId})` };
  }
  list() { return []; }
}

class NullContextEngine {
  async assemble(task, provider) {
    return { raw: '', scoped: '', formatted: '', budget: { used: 0, max: 0 } };
  }
  async compact(context, budget) { return context; }
  async detectAnomaly(context) { return []; }
}

class NullPolicy {
  async check(action, context) {
    return { allowed: true, reason: 'No Policy adapter (permissive default)' };
  }
  async audit(entry) {}
  getRules() { return []; }
}

class NullEvolution {
  async detectPatterns(history) { return []; }
  async proposeImprovement(pattern) { return null; }
  async applyImprovement(improvement) {
    return { success: false, reason: 'No Evolution adapter' };
  }
  getState() { return { sessions: 0, patterns: [], weights: {} }; }
}

/**
 * Factory: create null adapter for a given port name
 */
function createNullAdapter(portName) {
  switch (portName) {
    case 'AgentLoopPort': return new NullAgentLoop();
    case 'ModelRouterPort': return new NullModelRouter();
    case 'ToolExecutionPort': return new NullToolExecution();
    case 'MemoryPort': return new NullMemory();
    case 'SkillRegistryPort': return new NullSkillRegistry();
    case 'ContextEnginePort': return new NullContextEngine();
    case 'PolicyPort': return new NullPolicy();
    case 'EvolutionPort': return new NullEvolution();
    default: return null;
  }
}

module.exports = {
  NullAgentLoop,
  NullModelRouter,
  NullToolExecution,
  NullMemory,
  NullSkillRegistry,
  NullContextEngine,
  NullPolicy,
  NullEvolution,
  createNullAdapter
};
