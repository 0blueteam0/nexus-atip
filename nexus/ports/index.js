/**
 * NEXUS Port Interfaces - Hexagonal Architecture
 *
 * 8 Port interfaces that define the boundary contracts between
 * NEXUS Core and its external adapters.
 *
 * Core Domain code depends ONLY on these interfaces, never on
 * concrete implementations. Adapters implement these interfaces
 * and are injected via the DI Container.
 *
 * @module nexus/ports
 */

'use strict';

/**
 * Port interface definitions.
 * Each port declares its methods with expected signatures.
 * The DI container and port-validator use these to verify contracts.
 */

const AgentLoopPort = {
  name: 'AgentLoopPort',
  description: 'Manages the plan/work/review/compound agent loop',
  methods: {
    planTask: { args: ['task'], returns: 'Promise<Plan>' },
    executeStep: { args: ['step', 'context'], returns: 'Promise<Result>' },
    reviewResult: { args: ['result', 'plan'], returns: 'Promise<Review>' },
    compoundLearning: { args: ['review', 'solutions'], returns: 'Promise<Solution>' }
  }
};

const ModelRouterPort = {
  name: 'ModelRouterPort',
  description: 'Routes tasks to optimal AI provider based on complexity/type',
  methods: {
    route: { args: ['task'], returns: 'Promise<RoutingDecision>' },
    recordResult: { args: ['result'], returns: 'Promise<void>' },
    getWeights: { args: [], returns: 'Object' },
    adjustWeights: { args: ['feedback'], returns: 'Promise<void>' }
  }
};

const ToolExecutionPort = {
  name: 'ToolExecutionPort',
  description: 'Executes tools (MCP, CLI, etc.) in sandboxed environment',
  methods: {
    execute: { args: ['toolName', 'params'], returns: 'Promise<ToolResult>' },
    listAvailable: { args: [], returns: 'Array<ToolInfo>' },
    healthCheck: { args: ['toolName'], returns: 'Promise<HealthStatus>' }
  }
};

const MemoryPort = {
  name: 'MemoryPort',
  description: 'Persistent memory across sessions (3-tier: hot/warm/cold)',
  methods: {
    get: { args: ['key', 'tier'], returns: 'Promise<any>' },
    set: { args: ['key', 'value', 'tier'], returns: 'Promise<void>' },
    search: { args: ['query', 'options'], returns: 'Promise<Array>' },
    compact: { args: ['tier'], returns: 'Promise<CompactResult>' }
  }
};

const SkillRegistryPort = {
  name: 'SkillRegistryPort',
  description: 'Discovers and manages available skills/workflows',
  methods: {
    register: { args: ['skill'], returns: 'void' },
    find: { args: ['query'], returns: 'Array<Skill>' },
    execute: { args: ['skillId', 'params'], returns: 'Promise<Result>' },
    list: { args: [], returns: 'Array<SkillInfo>' }
  }
};

const ContextEnginePort = {
  name: 'ContextEnginePort',
  description: '3-stage context compilation: gather/scope/format',
  methods: {
    assemble: { args: ['task', 'provider'], returns: 'Promise<Context>' },
    compact: { args: ['context', 'budget'], returns: 'Promise<Context>' },
    detectAnomaly: { args: ['context'], returns: 'Promise<Array<Anomaly>>' }
  }
};

const PolicyPort = {
  name: 'PolicyPort',
  description: 'Cross-cutting governance: permissions, rate limits, audit',
  methods: {
    check: { args: ['action', 'context'], returns: 'Promise<PolicyDecision>' },
    audit: { args: ['entry'], returns: 'Promise<void>' },
    getRules: { args: [], returns: 'Array<PolicyRule>' }
  }
};

const EvolutionPort = {
  name: 'EvolutionPort',
  description: 'Self-improvement: pattern detection, weight adjustment, schema evolution',
  methods: {
    detectPatterns: { args: ['history'], returns: 'Promise<Array<Pattern>>' },
    proposeImprovement: { args: ['pattern'], returns: 'Promise<Improvement>' },
    applyImprovement: { args: ['improvement'], returns: 'Promise<Result>' },
    getState: { args: [], returns: 'Object' }
  }
};

/**
 * All port definitions indexed by name
 */
const PORTS = {
  AgentLoopPort,
  ModelRouterPort,
  ToolExecutionPort,
  MemoryPort,
  SkillRegistryPort,
  ContextEnginePort,
  PolicyPort,
  EvolutionPort
};

/**
 * Get port definition by name
 * @param {string} name - Port name
 * @returns {Object|null} Port definition
 */
function getPort(name) {
  return PORTS[name] || null;
}

/**
 * Get all port names
 * @returns {string[]}
 */
function getPortNames() {
  return Object.keys(PORTS);
}

/**
 * Check if an object satisfies a port interface
 * @param {Object} adapter - Adapter instance to check
 * @param {string} portName - Port name to check against
 * @returns {{ valid: boolean, missing: string[], extra: string[] }}
 */
function checkPort(adapter, portName) {
  const port = PORTS[portName];
  if (!port) {
    return { valid: false, missing: [], extra: [], error: `Unknown port: ${portName}` };
  }

  const required = Object.keys(port.methods);
  const actual = Object.keys(adapter).filter(k => typeof adapter[k] === 'function');

  const missing = required.filter(m => typeof adapter[m] !== 'function');
  const extra = actual.filter(m => !required.includes(m));

  return {
    valid: missing.length === 0,
    missing,
    extra
  };
}

module.exports = {
  PORTS,
  getPort,
  getPortNames,
  checkPort,
  // Individual exports for convenience
  AgentLoopPort,
  ModelRouterPort,
  ToolExecutionPort,
  MemoryPort,
  SkillRegistryPort,
  ContextEnginePort,
  PolicyPort,
  EvolutionPort
};
