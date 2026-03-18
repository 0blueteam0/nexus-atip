/**
 * NEXUS Orchestrator - Main Entry Point
 *
 * Lifecycle: init() -> route() -> learn()
 *
 * Coordinates all NEXUS layers:
 * - Layer 1: Config (Architect.md via config-parser)
 * - Layer 2: Providers (adapters/)
 * - Layer 3: Workflows (workflows/)
 * - Layer 4: Evolution (evolution/)
 * - Layer 5: Knowledge (knowledge/)
 * - Layer 6: Self-Evolution (self-evolution/)
 * - Layer 7: Auto-Research (self-evolution/auto-researcher)
 *
 * @module nexus/core/orchestrator
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { loadConfig, getEnabledProviders, getRoutingRule, getComplexityRoute, NEXUS_ROOT } = require('./config-parser');
const { getEventBus } = require('./event-bus');
const { getContainer } = require('./container');

// Lazy-loaded bridge modules (to avoid circular deps / missing modules during early phases)
let fileLock = null;
let complexityDetector = null;
let thinkingAdvisor = null;
let teamOrchestrator = null;

function getFileLock() {
  if (!fileLock) {
    try {
      fileLock = require('../../atos/file-lock');
    } catch (e) {
      fileLock = { readJSONWithLock: async (p, d) => d, writeJSONWithLock: async () => {} };
    }
  }
  return fileLock;
}

function getComplexityDetector() {
  if (!complexityDetector) {
    try {
      complexityDetector = require('../../atos/complexity-detector');
    } catch (e) {
      complexityDetector = { analyze: () => ({ score: 5, action: 'suggest', level: 'medium' }) };
    }
  }
  return complexityDetector;
}

function getThinkingAdvisor() {
  if (!thinkingAdvisor) {
    try {
      const { ThinkingAdvisor } = require('../claude-features/thinking-advisor');
      thinkingAdvisor = new ThinkingAdvisor();
    } catch {
      thinkingAdvisor = null;
    }
  }
  return thinkingAdvisor;
}

function getTeamOrchestrator(configOverride) {
  if (!teamOrchestrator) {
    try {
      const { TeamOrchestrator } = require('../claude-features/team-orchestrator');
      // Load config from nexus.config.json claude_features.agent_teams
      let teamConfig = configOverride || {};
      if (!configOverride) {
        try {
          const cfg = JSON.parse(fs.readFileSync(path.join(NEXUS_ROOT, 'nexus.config.json'), 'utf8'));
          const at = cfg.claude_features?.agent_teams;
          if (at) {
            teamConfig = { enabled: at.enabled, maxTeamSize: at.max_members, timeoutMs: at.timeout_ms };
          }
        } catch { /* use defaults */ }
      }
      teamOrchestrator = new TeamOrchestrator(teamConfig);
    } catch {
      teamOrchestrator = null;
    }
  }
  return teamOrchestrator;
}

const SESSION_STATE_PATH = path.join(NEXUS_ROOT, 'session-state.json');
const EVOLUTION_STATE_PATH = path.join(NEXUS_ROOT, 'evolution', 'evolution-state.json');

class Orchestrator {
  /**
   * @param {Container} [container] - Optional DI container. If omitted, uses global singleton.
   */
  constructor(container) {
    this.container = container || getContainer();
    this.config = null;
    this.bus = getEventBus();
    this.session = {
      id: `nexus-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      startTime: Date.now(),
      routingLog: [],
      taskCount: 0,
      successCount: 0,
      failureCount: 0
    };
    this.adapters = new Map();
    this.evolutionState = null;
    this.initialized = false;
  }

  // ===========================================================================
  // INIT - Session start
  // ===========================================================================

  /**
   * Initialize NEXUS for this session
   */
  async init() {
    this.bus.emit('system:init', { sessionId: this.session.id });

    // 1. Load config from Architect.md
    this.config = loadConfig();
    if (!this.config) {
      console.error('[-] NEXUS: Failed to load Architect.md config');
      return false;
    }

    // 2. Load evolution state
    await this._loadEvolutionState();

    // 3. Initialize provider adapters (lazy - they register themselves when Phase 2 is built)
    const providers = getEnabledProviders(this.config);
    for (const provider of providers) {
      this.adapters.set(provider.id, {
        config: provider,
        status: 'unknown',
        metrics: { calls: 0, successes: 0, failures: 0, avgLatency: 0 }
      });
    }

    // 4. Run health checks
    await this._healthCheckAll();

    // 5. Emit container status for diagnostics
    const containerStatus = this.container.getStatus();
    this.bus.emit('system:container', {
      ports: containerStatus,
      registered: this.container.getRegistered()
    });

    this.initialized = true;
    this.bus.emit('system:ready', {
      sessionId: this.session.id,
      providers: providers.map(p => p.id),
      providerCount: providers.length
    });

    return true;
  }

  // ===========================================================================
  // ROUTE - Task routing
  // ===========================================================================

  /**
   * Route a task to the optimal provider
   * @param {Object} task - { type, prompt, context, options }
   * @returns {Object} Routing decision
   */
  async route(task) {
    if (!this.initialized) {
      await this.init();
    }

    const startTime = Date.now();
    this.session.taskCount++;

    this.bus.emit('task:received', { task, sessionTaskNum: this.session.taskCount });

    // 1. Analyze complexity
    const complexity = getComplexityDetector().analyze(task.prompt || task.type || '');

    // 2. Determine provider based on routing rules
    let decision = this._selectProvider(task, complexity);

    // 2b. Optional: assemble context via ContextEnginePort
    if (!this.container.isNull('ContextEnginePort')) {
      try {
        const contextEngine = this.container.resolve('ContextEnginePort');
        decision._context = await contextEngine.assemble(task, decision?.provider);
      } catch (e) {
        // Context assembly failure is non-fatal
        this.bus.emit('system:warning', { source: 'ContextEnginePort', error: e.message });
      }
    }

    // 3. Apply evolution weights
    if (this.evolutionState?.weights) {
      decision = this._applyEvolutionWeights(decision, task.type, complexity);
    }

    // 3b. Thinking advisor - recommend thinking mode for complex tasks
    const advisor = getThinkingAdvisor();
    if (advisor) {
      try {
        const thinking = advisor.advise({ prompt: task.prompt || task.type || '', complexity: complexity.score });
        decision.thinkingMode = thinking.mode;
        if (thinking.mode !== 'none') {
          decision.reason += ` [thinking: ${thinking.mode}]`;
          this.bus.emit('thinking:advised', { mode: thinking.mode, score: complexity.score });
        }
      } catch { /* thinking advisor is optional */ }
    }

    // 3c. Team routing - for complex tasks, consider Agent Teams
    if (complexity.score >= 13 && task.options?.allowTeam !== false) {
      const team = getTeamOrchestrator();
      if (team && team._enabled) {
        decision.teamMode = true;
        decision.reason += ' [team eligible]';

        // Auto-compose team based on routing decision
        const teamMembers = this._composeTeamMembers(task, decision, complexity);
        if (teamMembers.length > 0) {
          const teamResult = team.startTeam({
            name: `auto-${task.type || 'general'}-${Date.now()}`,
            task: task.prompt || task.type,
            members: teamMembers
          });
          if (teamResult.started) {
            decision.teamId = teamResult.teamId;
            decision.teamMembers = teamMembers.length;
            decision.reason += ` [team:${teamResult.teamId}]`;
          }
        }
      }
    }

    // 3d. Ensure selected provider is available (auto-fallback)
    decision = this._ensureAvailable(decision);

    // 4. Record routing decision
    const routingEntry = {
      taskType: task.type,
      complexity: complexity.score,
      provider: decision.provider,
      reason: decision.reason,
      fallbacks: decision.fallbacks,
      timestamp: Date.now(),
      latency: Date.now() - startTime
    };

    this.session.routingLog.push(routingEntry);
    this.bus.emit('task:routed', routingEntry);

    return decision;
  }

  /**
   * Select provider based on config rules
   */
  _selectProvider(task, complexity) {
    // 1. Try explicit task-type routing first (highest priority)
    const taskRoute = getRoutingRule(this.config, task.type);
    if (taskRoute) {
      const fallbacks = [taskRoute.secondary, taskRoute.tertiary].filter(Boolean).filter(f => f !== '-');
      return {
        provider: taskRoute.primary,
        fallbacks,
        reason: `task_type: ${task.type}`,
        strategy: 'task_match'
      };
    }

    // 2. Then complexity-based routing (for unmatched task types)
    const complexRoute = getComplexityRoute(this.config, complexity.score);
    if (complexRoute?.provider) {
      const provider = complexRoute.provider;
      const providers = provider.includes('+')
        ? provider.split(/\s*\+\s*/)
        : [provider];

      return {
        provider: providers[0],
        fallbacks: providers.slice(1),
        reason: `complexity_${complexRoute.complexity} (score: ${complexity.score})`,
        strategy: 'complexity'
      };
    }

    // Default routing
    return {
      provider: 'claude-code',
      fallbacks: ['gemini-cli', 'codex-cli'],
      reason: 'default_fallback',
      strategy: 'default'
    };
  }

  /**
   * Compose team members based on task, routing decision, and complexity
   * @private
   */
  _composeTeamMembers(task, decision, complexity) {
    const members = [];
    const primary = decision.provider;
    const fallbacks = decision.fallbacks || [];

    // Primary agent always leads
    members.push({
      role: 'lead',
      agentType: primary,
      subtask: task.prompt || task.type
    });

    // For complex tasks, add reviewers from fallback chain
    if (complexity.score >= 15 && fallbacks.length > 0) {
      members.push({
        role: 'reviewer',
        agentType: fallbacks[0],
        subtask: `Review and verify: ${task.prompt || task.type}`
      });
    }

    // For very complex tasks, add a specialist
    if (complexity.score >= 18 && fallbacks.length > 1) {
      members.push({
        role: 'specialist',
        agentType: fallbacks[1],
        subtask: `Deep analysis: ${task.prompt || task.type}`
      });
    }

    return members;
  }

  /**
   * Check if a provider is currently available, auto-fallback if not
   * @private
   */
  _ensureAvailable(decision) {
    const adapter = this.adapters.get(decision.provider);
    if (adapter && adapter.status === 'unavailable' && decision.fallbacks.length > 0) {
      const fallback = decision.fallbacks.find(fb => {
        const a = this.adapters.get(fb);
        return a && a.status !== 'unavailable';
      });
      if (fallback) {
        return {
          ...decision,
          provider: fallback,
          fallbacks: decision.fallbacks.filter(f => f !== fallback),
          reason: `${decision.reason} -> fallback (${decision.provider} unavailable)`,
          strategy: decision.strategy + '_fallback'
        };
      }
    }
    return decision;
  }

  /**
   * Apply evolution-learned weights to routing decision
   */
  _applyEvolutionWeights(decision, taskType, complexity) {
    const weights = this.evolutionState?.weights;
    if (!weights || !weights[taskType]) return decision;

    const taskWeights = weights[taskType];
    const currentWeight = taskWeights[decision.provider] || 0.5;

    // If current provider has very low weight, consider switching
    const alternatives = Object.entries(taskWeights)
      .filter(([id, w]) => id !== decision.provider && w > currentWeight + 0.15)
      .sort((a, b) => b[1] - a[1]);

    if (alternatives.length > 0) {
      const [betterProvider, betterWeight] = alternatives[0];
      // Only switch if the adapter is available
      const adapter = this.adapters.get(betterProvider);
      if (adapter && adapter.status !== 'unavailable') {
        return {
          provider: betterProvider,
          fallbacks: [decision.provider, ...decision.fallbacks],
          reason: `evolution_weight: ${betterProvider}(${betterWeight.toFixed(2)}) > ${decision.provider}(${currentWeight.toFixed(2)})`,
          strategy: 'adaptive'
        };
      }
    }

    return decision;
  }

  // ===========================================================================
  // LEARN - Session end
  // ===========================================================================

  /**
   * Record task result and learn from it
   * @param {Object} result - { taskType, provider, success, latency, quality }
   */
  async recordResult(result) {
    const { taskType, provider, success, latency, quality } = result;

    // Update adapter metrics
    const adapter = this.adapters.get(provider);
    if (adapter) {
      adapter.metrics.calls++;
      if (success) {
        adapter.metrics.successes++;
        this.session.successCount++;
      } else {
        adapter.metrics.failures++;
        this.session.failureCount++;
      }
      adapter.metrics.avgLatency = adapter.metrics.avgLatency
        ? adapter.metrics.avgLatency * 0.8 + latency * 0.2
        : latency;
    }

    // Emit event
    const eventName = success ? 'task:completed' : 'task:failed';
    this.bus.emit(eventName, result);
  }

  /**
   * End-of-session learning
   */
  async learn() {
    if (this.session.routingLog.length === 0) return;

    this.bus.emit('evolution:learning_start', {
      sessionId: this.session.id,
      taskCount: this.session.taskCount
    });

    // 1. Adjust weights based on session results
    await this._adjustWeights();

    // 2. Extract patterns
    await this._extractPatterns();

    // 3. Log evolution
    await this._logEvolution();

    // 4. Save evolution state
    await this._saveEvolutionState();

    // 5. Save session summary
    await this._saveSessionSummary();

    this.bus.emit('evolution:learning_complete', {
      sessionId: this.session.id,
      adjustments: this.session.routingLog.length
    });
  }

  /**
   * Adjust provider weights based on session outcomes
   */
  async _adjustWeights() {
    if (!this.evolutionState) {
      this.evolutionState = { weights: {}, patterns: [], sessions: 0 };
    }

    const lr = this.config?.evolution?.weight_adjustment?.learning_rate || 0.05;
    const minW = this.config?.evolution?.weight_adjustment?.min_weight || 0.05;
    const maxW = this.config?.evolution?.weight_adjustment?.max_weight || 0.95;

    // Group results by task type + provider
    for (const entry of this.session.routingLog) {
      const { taskType, provider } = entry;
      if (!taskType || !provider) continue;

      if (!this.evolutionState.weights[taskType]) {
        this.evolutionState.weights[taskType] = {};
      }

      const current = this.evolutionState.weights[taskType][provider] || 0.5;
      const adapter = this.adapters.get(provider);
      if (!adapter) continue;

      const successRate = adapter.metrics.calls > 0
        ? adapter.metrics.successes / adapter.metrics.calls
        : 0.5;
      const expected = current;
      const observed = successRate;

      // Bayesian update: adjusted = base * (1 + lr * (observed - expected))
      let adjusted = current * (1 + lr * (observed - expected));
      adjusted = Math.max(minW, Math.min(maxW, adjusted));

      this.evolutionState.weights[taskType][provider] = adjusted;
    }

    this.bus.emit('evolution:weight', {
      weights: this.evolutionState.weights
    });
  }

  /**
   * Extract routing patterns from session
   */
  async _extractPatterns() {
    // Simple pattern extraction: which provider worked best for which task type
    const taskProviderSuccess = {};

    for (const entry of this.session.routingLog) {
      const key = `${entry.taskType}:${entry.provider}`;
      if (!taskProviderSuccess[key]) {
        taskProviderSuccess[key] = { success: 0, total: 0 };
      }
      taskProviderSuccess[key].total++;
    }

    // Merge with adapter metrics
    for (const [adapterId, adapter] of this.adapters) {
      if (adapter.metrics.calls > 0) {
        const rate = adapter.metrics.successes / adapter.metrics.calls;
        if (rate > 0.8 && adapter.metrics.calls >= 3) {
          const pattern = {
            id: `pattern-${Date.now()}-${adapterId}`,
            type: 'provider_strength',
            provider: adapterId,
            successRate: rate,
            sampleSize: adapter.metrics.calls,
            confidence: Math.min(1, adapter.metrics.calls / 10),
            discoveredAt: Date.now(),
            sessionId: this.session.id
          };

          if (!this.evolutionState.patterns) this.evolutionState.patterns = [];
          this.evolutionState.patterns.push(pattern);

          this.bus.emit('evolution:pattern', pattern);
        }
      }
    }
  }

  /**
   * Log evolution changes for audit trail
   */
  async _logEvolution() {
    const date = new Date().toISOString().split('T')[0];
    const logDir = path.join(NEXUS_ROOT, 'self-evolution', 'evolution-log');
    const logPath = path.join(logDir, `${date}.md`);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const lines = [
      '',
      `### [${timestamp}] Session ${this.session.id}`,
      `- Tasks: ${this.session.taskCount} (${this.session.successCount} success, ${this.session.failureCount} failed)`,
      `- Duration: ${((Date.now() - this.session.startTime) / 1000).toFixed(0)}s`
    ];

    // Weight changes
    if (this.evolutionState?.weights) {
      const entries = Object.entries(this.evolutionState.weights);
      if (entries.length > 0) {
        lines.push('- Weight updates:');
        for (const [taskType, providers] of entries) {
          for (const [pid, weight] of Object.entries(providers)) {
            lines.push(`  - ${taskType}/${pid}: ${weight.toFixed(3)}`);
          }
        }
      }
    }

    lines.push('');

    const logContent = lines.join('\n');

    // Append to daily log
    if (fs.existsSync(logPath)) {
      fs.appendFileSync(logPath, logContent);
    } else {
      fs.writeFileSync(logPath, `# NEXUS Evolution Log - ${date}\n${logContent}`);
    }
  }

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  async _loadEvolutionState() {
    try {
      if (fs.existsSync(EVOLUTION_STATE_PATH)) {
        const content = fs.readFileSync(EVOLUTION_STATE_PATH, 'utf8');
        this.evolutionState = JSON.parse(content);
        this.evolutionState.sessions = (this.evolutionState.sessions || 0) + 1;
      } else {
        this.evolutionState = { weights: {}, patterns: [], sessions: 1 };
      }
    } catch (e) {
      this.evolutionState = { weights: {}, patterns: [], sessions: 1 };
    }
  }

  async _saveEvolutionState() {
    try {
      const dir = path.dirname(EVOLUTION_STATE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.evolutionState.lastUpdated = Date.now();
      this.evolutionState.lastSessionId = this.session.id;

      const lock = getFileLock();
      await lock.writeJSONWithLock(EVOLUTION_STATE_PATH, this.evolutionState);
    } catch (e) {
      // Fallback: direct write
      try {
        fs.writeFileSync(EVOLUTION_STATE_PATH, JSON.stringify(this.evolutionState, null, 2));
      } catch (e2) {
        console.error('[-] Failed to save evolution state:', e2.message);
      }
    }
  }

  async _saveSessionSummary() {
    const dir = path.join(NEXUS_ROOT, 'knowledge', 'session-summaries');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const summary = {
      sessionId: this.session.id,
      startTime: this.session.startTime,
      endTime: Date.now(),
      taskCount: this.session.taskCount,
      successCount: this.session.successCount,
      failureCount: this.session.failureCount,
      adapterMetrics: {},
      routingDecisions: this.session.routingLog.length,
      evolutionState: {
        sessions: this.evolutionState?.sessions || 0,
        patternCount: this.evolutionState?.patterns?.length || 0
      }
    };

    for (const [id, adapter] of this.adapters) {
      summary.adapterMetrics[id] = { ...adapter.metrics };
    }

    const filename = `${new Date().toISOString().split('T')[0]}-${this.session.id.slice(-8)}.json`;
    fs.writeFileSync(path.join(dir, filename), JSON.stringify(summary, null, 2));
  }

  // ===========================================================================
  // HEALTH CHECKS
  // ===========================================================================

  async _healthCheckAll() {
    for (const [id, adapter] of this.adapters) {
      // For local LLM providers, check via LocalLLMPort
      if (adapter.config.type === 'local_llm') {
        try {
          const localLLM = this.container.resolve('LocalLLMPort');
          const available = await localLLM.isAvailable();
          adapter.status = available ? 'available' : 'unavailable';
        } catch {
          adapter.status = 'unavailable';
        }
      } else {
        adapter.status = 'available'; // Optimistic default for CLI providers
      }
      this.bus.emit('provider:health', { provider: id, status: adapter.status });
    }
  }

  // ===========================================================================
  // STATUS / INFO
  // ===========================================================================

  /**
   * Get current NEXUS status
   */
  getStatus() {
    const providers = {};
    for (const [id, adapter] of this.adapters) {
      providers[id] = {
        status: adapter.status,
        role: adapter.config.role,
        context: adapter.config.context,
        costTier: adapter.config.cost_tier,
        metrics: adapter.metrics
      };
    }

    return {
      sessionId: this.session.id,
      initialized: this.initialized,
      uptime: Date.now() - this.session.startTime,
      providers,
      taskCount: this.session.taskCount,
      successRate: this.session.taskCount > 0
        ? ((this.session.successCount / this.session.taskCount) * 100).toFixed(1) + '%'
        : 'N/A',
      evolutionSessions: this.evolutionState?.sessions || 0,
      patternCount: this.evolutionState?.patterns?.length || 0,
      eventCount: this.bus.getStats().totalEvents,
      ports: this.container.getStatus()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.bus.emit('system:shutdown', { sessionId: this.session.id });
    await this.learn();
    this.bus.reset();
    this.initialized = false;
  }
}

// Singleton
let instance = null;

function getOrchestrator() {
  if (!instance) {
    instance = new Orchestrator();
  }
  return instance;
}

function resetOrchestrator() {
  if (instance) {
    instance.shutdown().catch(() => {});
    instance = null;
  }
}

// ===========================================================================
// CLI Interface
// ===========================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  async function main() {
    const orchestrator = new Orchestrator();

    switch (command) {
      case 'init': {
        const ok = await orchestrator.init();
        if (ok) {
          console.log('[+] NEXUS initialized');
          const status = orchestrator.getStatus();
          console.log(`    Session: ${status.sessionId}`);
          console.log(`    Providers: ${Object.keys(status.providers).length}`);
          Object.entries(status.providers).forEach(([id, p]) => {
            console.log(`      [${p.status === 'available' ? '+' : '-'}] ${id}: ${p.role} (ctx: ${p.context}, cost: ${p.costTier})`);
          });
          console.log(`    Evolution sessions: ${status.evolutionSessions}`);
          console.log(`    Patterns: ${status.patternCount}`);
        } else {
          console.error('[-] NEXUS initialization failed');
          process.exit(1);
        }
        break;
      }

      case 'status': {
        await orchestrator.init();
        const status = orchestrator.getStatus();
        console.log(JSON.stringify(status, null, 2));
        break;
      }

      case 'route': {
        const taskDesc = args.slice(1).join(' ');
        if (!taskDesc) {
          console.error('Usage: node orchestrator.js route "task description"');
          process.exit(1);
        }
        await orchestrator.init();
        const decision = await orchestrator.route({
          type: 'general',
          prompt: taskDesc
        });
        console.log('[*] Routing Decision:');
        console.log(`    Provider: ${decision.provider}`);
        console.log(`    Fallbacks: ${decision.fallbacks.join(' -> ') || 'none'}`);
        console.log(`    Reason: ${decision.reason}`);
        console.log(`    Strategy: ${decision.strategy}`);
        break;
      }

      case 'evolve': {
        await orchestrator.init();
        console.log('[*] Evolution State:');
        console.log(`    Sessions: ${orchestrator.evolutionState?.sessions || 0}`);
        console.log(`    Patterns: ${orchestrator.evolutionState?.patterns?.length || 0}`);
        if (orchestrator.evolutionState?.weights) {
          console.log('    Weights:');
          for (const [taskType, providers] of Object.entries(orchestrator.evolutionState.weights)) {
            console.log(`      ${taskType}:`);
            for (const [pid, w] of Object.entries(providers)) {
              console.log(`        ${pid}: ${w.toFixed(3)}`);
            }
          }
        }
        if (orchestrator.evolutionState?.lastUpdated) {
          console.log(`    Last updated: ${new Date(orchestrator.evolutionState.lastUpdated).toISOString()}`);
        }
        break;
      }

      default:
        console.log(`
NEXUS Orchestrator
==================
Usage: node orchestrator.js <command> [args]

Commands:
  init              Initialize NEXUS (parse config, health check)
  status            Show current status (JSON)
  route "task"      Route a task to optimal provider
  evolve            Show evolution state

Lifecycle:
  init() -> route(task) -> recordResult() -> learn() -> shutdown()
`);
    }
  }

  main().catch(err => {
    console.error('[-] Error:', err.message);
    process.exit(1);
  });
}

module.exports = {
  Orchestrator,
  getOrchestrator,
  resetOrchestrator
};
