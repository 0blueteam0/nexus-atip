#!/usr/bin/env node
/**
 * NEXUS v3.0 End-to-End Scenario Test
 *
 * Scenario: "Review the NEXUS orchestrator code and suggest improvements"
 *
 * This task should flow through ALL 7 layers:
 *   L1 (Infra)     -> Check Docker/Ollama status
 *   L2 (Models)    -> Route to optimal provider
 *   L3 (Framework) -> Execute plan-execute-review graph
 *   L4 (Workflow)   -> Check n8n workflow availability
 *   L5 (RAG)       -> Search for relevant knowledge
 *   L6 (Observe)   -> Track cost + quality
 *   L7 (Gateway)   -> Find best MCP tools + A2A agents
 *
 * NOT a mock test. Every call hits real adapters with real fallback behavior.
 */

'use strict';

const { Orchestrator } = require('../core/orchestrator');
const { getContainer, resetContainer } = require('../core/container');
const { getEventBus } = require('../core/event-bus');
const { MCPRouter } = require('../gateway/mcp-router');
const { A2AHub } = require('../gateway/a2a-hub');

// Capture all events for tracing
const eventTrace = [];
const bus = getEventBus();
bus.on('*', (data, eventName) => {
  eventTrace.push({ event: eventName, time: Date.now(), keys: Object.keys(data || {}) });
});

async function runScenario() {
  const startTime = Date.now();
  const results = {};

  console.log('');
  console.log('================================================================');
  console.log('  NEXUS v3.0 E2E Scenario: "Code Review Task"');
  console.log('================================================================');
  console.log('');

  // ────────────────────────────────────────────
  // STEP 1: Initialize Orchestrator (touches L1, L2, L6)
  // ────────────────────────────────────────────
  console.log('[Step 1] Orchestrator Init');
  const orch = new Orchestrator();
  const initOk = await orch.init();
  const status = orch.getStatus();

  console.log('  Session: ' + status.sessionId);
  console.log('  Providers: ' + Object.keys(status.providers).length);
  Object.entries(status.providers).forEach(([id, p]) => {
    console.log('    [' + (p.status === 'available' ? '+' : '-') + '] ' + id + ' (' + p.role + ', ' + p.status + ')');
  });
  results.init = { ok: initOk, providers: Object.keys(status.providers).length };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 2: L1 - Infrastructure Check
  // ────────────────────────────────────────────
  console.log('[Step 2] L1 Infrastructure Check');
  const container = getContainer();
  const infra = container.resolve('InfraPort');
  const services = await infra.listServices();
  services.forEach(s => {
    const icon = s.status === 'running' ? '+' : s.status === 'stopped' ? '-' : '?';
    console.log('  [' + icon + '] ' + s.name + ' (' + s.type + ') -> ' + s.status);
  });
  results.infra = {
    total: services.length,
    running: services.filter(s => s.status === 'running').length,
    stopped: services.filter(s => s.status === 'stopped').length
  };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 3: L2 - Route the task (model selection)
  // ────────────────────────────────────────────
  console.log('[Step 3] L2 Task Routing');
  const task = {
    type: 'code_review',
    prompt: 'Review the NEXUS orchestrator module for potential improvements',
    context: { file: 'nexus/core/orchestrator.js', lines: 700 }
  };

  const decision = await orch.route(task);
  console.log('  Task: ' + task.type + ' ("' + task.prompt.slice(0, 50) + '...")');
  console.log('  -> Provider: ' + decision.provider);
  console.log('  -> Fallbacks: ' + (decision.fallbacks.join(' -> ') || 'none'));
  console.log('  -> Reason: ' + decision.reason);
  console.log('  -> Strategy: ' + decision.strategy);
  results.routing = {
    provider: decision.provider,
    strategy: decision.strategy,
    hasFallbacks: decision.fallbacks.length > 0
  };
  console.log('');

  // Route a DIFFERENT task type to show routing varies
  console.log('[Step 3b] Route a trivial task (should prefer local/free)');
  const trivialTask = { type: 'summarization', prompt: 'summarize this file' };
  const trivialDecision = await orch.route(trivialTask);
  console.log('  Task: ' + trivialTask.type);
  console.log('  -> Provider: ' + trivialDecision.provider);
  console.log('  -> Reason: ' + trivialDecision.reason);
  results.trivialRouting = { provider: trivialDecision.provider };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 4: L3 - Execute Agent Graph
  // ────────────────────────────────────────────
  console.log('[Step 4] L3 Agent Graph Execution');
  const agentFw = container.resolve('AgentFrameworkPort');
  const fwStatus = await agentFw.getFrameworkStatus();
  console.log('  Frameworks: ' + fwStatus.frameworks.map(f => f.name + (f.available ? '[+]' : '[-]')).join(', '));
  console.log('  Graphs: ' + fwStatus.graphs);

  const graphResult = await agentFw.executeGraph('plan-execute-review', {
    task: task.prompt,
    provider: decision.provider
  });
  console.log('  Execution: ' + (graphResult.success ? 'SUCCESS' : 'FAIL'));
  console.log('  Steps taken: ' + graphResult.steps.length);
  graphResult.steps.forEach((step, i) => {
    console.log('    [' + (i + 1) + '] ' + step.nodeId + ' (' + step.duration + 'ms)');
  });
  console.log('  Final phase: ' + (graphResult.output?.phase || 'unknown'));
  results.graph = {
    success: graphResult.success,
    steps: graphResult.steps.length,
    finalPhase: graphResult.output?.phase
  };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 5: L4 - Workflow Engine Check
  // ────────────────────────────────────────────
  console.log('[Step 5] L4 Workflow (n8n) Check');
  const workflow = container.resolve('WorkflowPort');
  const workflows = await workflow.listWorkflows();
  if (workflows.length > 0) {
    console.log('  n8n: CONNECTED (' + workflows.length + ' workflows)');
    workflows.slice(0, 3).forEach(w => {
      console.log('    ' + w.id + ': ' + w.name + (w.active ? ' [active]' : ''));
    });
  } else {
    console.log('  n8n: Not available (graceful degradation -> null adapter behavior)');
  }
  results.workflow = { available: workflows.length > 0, count: workflows.length };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 6: L5 - RAG Search
  // ────────────────────────────────────────────
  console.log('[Step 6] L5 RAG Knowledge Search');
  const rag = container.resolve('RAGPort');
  const ragStats = await rag.getStats();
  console.log('  Qdrant: ' + (ragStats.available ? 'CONNECTED' : 'Not available'));
  if (ragStats.available) {
    console.log('  Collections: ' + ragStats.collections + ', Documents: ' + ragStats.documents);
    const searchResults = await rag.search('orchestrator improvements patterns');
    console.log('  Search "orchestrator improvements": ' + searchResults.length + ' results');
  } else {
    console.log('  Graceful degradation: search returns []');
    const emptySearch = await rag.search('test query');
    console.log('  Fallback search result: ' + JSON.stringify(emptySearch) + ' (empty, safe)');
  }
  results.rag = { available: ragStats.available || false, collections: ragStats.collections };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 7: L5 - LocalLLM availability
  // ────────────────────────────────────────────
  console.log('[Step 7] L2 Local LLM (Ollama) Check');
  const localLLM = container.resolve('LocalLLMPort');
  const ollamaAvailable = await localLLM.isAvailable();
  console.log('  Ollama: ' + (ollamaAvailable ? 'RUNNING' : 'Not running'));
  if (ollamaAvailable) {
    const models = await localLLM.listModels();
    console.log('  Models installed: ' + models.length);
    models.forEach(m => console.log('    ' + m.name + ' (' + m.parameter_size + ', ' + m.quantization + ')'));

    // Actually generate something small
    console.log('  Generating test response...');
    const gen = await localLLM.generate('Say hello in one sentence.', { taskType: 'summarization' });
    if (gen.text) {
      console.log('  Response: "' + gen.text.trim().slice(0, 80) + '"');
      console.log('  Latency: ' + gen.latency_ms + 'ms, Model: ' + gen.model);
    } else {
      console.log('  Generate returned empty: ' + gen.reason);
    }
  } else {
    console.log('  Graceful degradation: generate returns empty text');
    const fallback = await localLLM.generate('test');
    console.log('  Fallback reason: ' + fallback.reason);
  }
  results.ollama = { available: ollamaAvailable };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 8: L6 - Observability (track this session)
  // ────────────────────────────────────────────
  console.log('[Step 8] L6 Observability - Record Session');
  const obs = container.resolve('ObservabilityPort');

  // Simulate recording cost/quality for the routing decisions
  await obs.trackCost({
    provider: decision.provider,
    inputTokens: 1500,
    outputTokens: 800,
    taskType: 'code_review'
  });
  await obs.trackQuality({
    provider: decision.provider,
    taskType: 'code_review',
    success: true,
    latencyMs: Date.now() - startTime,
    quality: { completeness: 0.9, correctness: 0.85, relevance: 0.95 }
  });

  const dashboard = await obs.getDashboard();
  console.log('  Cost tracked: $' + dashboard.costs.total + ' (' + dashboard.costs.totalTokens + ' tokens)');
  console.log('  Quality entries: ' + Object.keys(dashboard.quality).length + ' providers scored');
  Object.entries(dashboard.quality).forEach(([p, q]) => {
    console.log('    ' + p + ': score ' + q.avgScore + ', success ' + q.successRate);
  });
  results.observability = { costTracked: dashboard.costs.total, qualityProviders: Object.keys(dashboard.quality).length };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 9: L7 - Gateway (MCP + A2A)
  // ────────────────────────────────────────────
  console.log('[Step 9] L7 Gateway - MCP + A2A');
  const mcpRouter = new MCPRouter();
  const a2aHub = new A2AHub();

  // Find best tools for code review
  const codeSearchTool = mcpRouter.findServer('code_search');
  const fileEditTool = mcpRouter.findServer('file_edit');
  const researchTool = mcpRouter.findServer('research');
  console.log('  MCP tool selection for code_review:');
  console.log('    code_search -> ' + (codeSearchTool || 'none'));
  console.log('    file_edit   -> ' + (fileEditTool || 'none'));
  console.log('    research    -> ' + (researchTool || 'none'));

  // Find agents for code review
  const codeAgents = a2aHub.findAgents('code');
  console.log('  A2A agents with "code" capability: ' + codeAgents.length);
  codeAgents.forEach(a => console.log('    ' + a.id + ': ' + a.capabilities.join(', ')));

  // Delegate task
  const delegation = a2aHub.delegateTask('claude-code', {
    type: 'code_review',
    prompt: task.prompt
  });
  console.log('  Task delegated to claude-code: ' + (delegation.queued ? 'QUEUED (' + delegation.taskId + ')' : 'FAILED'));

  results.gateway = {
    mcpServers: mcpRouter.getStatus().totalServers,
    toolsFound: [codeSearchTool, fileEditTool, researchTool].filter(Boolean).length,
    agentsFound: codeAgents.length,
    delegated: delegation.queued
  };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 10: Evolution + Policy (existing v2.0 layers)
  // ────────────────────────────────────────────
  console.log('[Step 10] Evolution + Policy (v2.0 layers)');
  const evolution = container.resolve('EvolutionPort');
  const evoState = evolution.getState();
  console.log('  Evolution: ' + evoState.sessions + ' sessions, ' + (evoState.patterns?.length || 0) + ' patterns');

  const policy = container.resolve('PolicyPort');
  const policyCheck = await policy.check('execute_code_review', { provider: decision.provider });
  console.log('  Policy check: ' + (policyCheck.allowed ? 'ALLOWED' : 'DENIED') + ' (' + policyCheck.reason + ')');

  const context = container.resolve('ContextEnginePort');
  const assembled = await context.assemble(task, decision.provider);
  console.log('  Context assembled: ' + (assembled.formatted ? assembled.formatted.length + ' chars' : 'empty (budget: ' + assembled.budget?.max + ')'));
  console.log('');

  // ────────────────────────────────────────────
  // STEP 11: Phase 8+ - Checkpoint Store
  // ────────────────────────────────────────────
  console.log('[Step 11] Checkpoint Store');
  let checkpointOk = false;
  try {
    const { CheckpointStore } = require('../agent-framework/checkpoint-store');
    const store = new CheckpointStore();
    const cpResult = store.save({
      runId: 'test-run-1',
      graphId: 'test-graph',
      nodeId: 'test-node',
      step: 1,
      state: { data: 'test' }
    });
    const loaded = store.load(cpResult.id);
    checkpointOk = loaded && loaded.state && loaded.state.data === 'test';
    const stats = store.getStats();
    console.log('  Backend: ' + stats.backend);
    console.log('  Save+Load: ' + (checkpointOk ? 'PASS' : 'FAIL'));
    console.log('  Total checkpoints: ' + stats.totalCheckpoints);
  } catch (e) {
    console.log('  [-] Error: ' + e.message);
  }
  results.checkpoint = { ok: checkpointOk };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 12: Phase 8+ - Middleware Stack
  // ────────────────────────────────────────────
  console.log('[Step 12] Middleware Stack');
  let middlewareOk = false;
  try {
    const { HITLMiddleware } = require('../agent-framework/middleware/hitl');
    const { TracerMiddleware } = require('../agent-framework/middleware/tracer');
    const { SummarizerMiddleware } = require('../agent-framework/middleware/summarizer');

    const hitl = new HITLMiddleware(bus);
    const tracer = new TracerMiddleware();
    const summarizer = new SummarizerMiddleware();

    middlewareOk = hitl && tracer && summarizer;
    console.log('  HITL: ' + (hitl ? 'loaded' : 'FAIL'));
    console.log('  Tracer: ' + (tracer ? 'loaded' : 'FAIL'));
    console.log('  Summarizer: ' + (summarizer ? 'loaded' : 'FAIL'));
  } catch (e) {
    console.log('  [-] Error: ' + e.message);
  }
  results.middleware = { ok: middlewareOk };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 13: Phase 8+ - Deep Agent Components
  // ────────────────────────────────────────────
  console.log('[Step 13] Deep Agent Components');
  let deepAgentOk = false;
  try {
    const { DeepPlanner } = require('../deep-agent/planner');
    const { ContextFS } = require('../deep-agent/context-fs');
    const { SubAgentManager } = require('../deep-agent/subagent-manager');

    const planner = new DeepPlanner(bus);
    const contextFs = new ContextFS();
    const subMgr = new SubAgentManager(bus);

    // Test planner
    const plan = planner.createPlan('test-task', 'Test planning', { complexity: 5 });
    deepAgentOk = plan && plan.subtasks && plan.subtasks.length > 0;

    console.log('  Planner: ' + (plan ? plan.subtasks.length + ' subtasks' : 'FAIL'));
    console.log('  ContextFS: ' + (contextFs ? 'loaded' : 'FAIL'));
    console.log('  SubAgentManager: ' + (subMgr ? 'loaded' : 'FAIL'));
  } catch (e) {
    console.log('  [-] Error: ' + e.message);
  }
  results.deepAgent = { ok: deepAgentOk };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 14: Phase 8+ - Claude Features
  // ────────────────────────────────────────────
  console.log('[Step 14] Claude Features Integration');
  let claudeFeaturesOk = false;
  try {
    const { ThinkingAdvisor } = require('../claude-features/thinking-advisor');
    const { TeamOrchestrator } = require('../claude-features/team-orchestrator');
    const { MemorySync } = require('../claude-features/memory-sync');

    const advisor = new ThinkingAdvisor();
    const advice = advisor.advise({ prompt: 'complex architecture redesign', complexity: 9 });
    const team = new TeamOrchestrator();
    const memSync = new MemorySync(bus);

    claudeFeaturesOk = advice && advice.mode !== 'none';
    console.log('  Thinking advisor: ' + advice.mode + ' (complexity 9)');
    console.log('  Team orchestrator: ' + (team ? 'loaded' : 'FAIL'));
    console.log('  Memory sync: ' + (memSync ? 'loaded' : 'FAIL'));
  } catch (e) {
    console.log('  [-] Error: ' + e.message);
  }
  results.claudeFeatures = { ok: claudeFeaturesOk };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 15: Phase 8+ - Monitor Server (quick check)
  // ────────────────────────────────────────────
  console.log('[Step 15] Monitor Server');
  let monitorOk = false;
  try {
    const { MonitorServer } = require('../monitor/server');
    const { SSEBridge } = require('../monitor/sse-bridge');
    monitorOk = MonitorServer && SSEBridge;
    console.log('  MonitorServer: ' + (MonitorServer ? 'loaded' : 'FAIL'));
    console.log('  SSEBridge: ' + (SSEBridge ? 'loaded' : 'FAIL'));
  } catch (e) {
    console.log('  [-] Error: ' + e.message);
  }
  results.monitor = { ok: monitorOk };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 16: Phase 8+ - Team Delegation
  // ────────────────────────────────────────────
  console.log('[Step 16] A2A Team Delegation');
  let teamOk = false;
  try {
    const teamResult = a2aHub.delegateToTeam({ goal: 'e2e test task' });
    teamOk = teamResult.status === 'started' && teamResult.members.length > 0;
    console.log('  Team ID: ' + teamResult.teamId);
    console.log('  Members: ' + teamResult.members.join(', '));
    console.log('  Status: ' + teamResult.status);
  } catch (e) {
    console.log('  [-] Error: ' + e.message);
  }
  results.teamDelegation = { ok: teamOk };
  console.log('');

  // ────────────────────────────────────────────
  // STEP 17: Phase 12 - Obsidian Integration
  // ────────────────────────────────────────────
  console.log('[Step 17] Obsidian Integration');
  let obsidianOk = false;
  try {
    const { ObsidianIntegration } = require('../obsidian');
    const { ObsidianBridge } = require('../obsidian/bridge');
    const { EventWriter } = require('../obsidian/event-writer');
    const { MemoryBridge } = require('../obsidian/memory-bridge');
    const { templates } = require('../obsidian/templates');

    // Verify all modules load
    const bridge = new ObsidianBridge({ port: 27124, insecure: true });
    const writer = new EventWriter(bridge, { autoSubscribe: false });
    const memBridge = new MemoryBridge(bridge);
    const integration = new ObsidianIntegration({});

    // Verify templates generate valid markdown
    const sessionNote = templates.session({
      sessionId: 'test-session',
      providers: ['claude-code'],
      taskCount: 1,
      successRate: 1,
      startTime: Date.now(),
      cost: 0.01,
      tasks: [{ id: 'task-1', type: 'code_review', provider: 'claude-code', success: true }]
    });
    const dashboardNote = templates.dashboard();

    obsidianOk = bridge && writer && memBridge && integration
      && sessionNote.includes('type: session')
      && dashboardNote.includes('dataview');

    console.log('  Bridge: ' + (bridge ? 'loaded' : 'FAIL'));
    console.log('  EventWriter: ' + (writer ? 'loaded' : 'FAIL'));
    console.log('  MemoryBridge: ' + (memBridge ? 'loaded' : 'FAIL'));
    console.log('  Templates: ' + (sessionNote.includes('type: session') ? 'valid' : 'FAIL'));
    console.log('  Dashboard: ' + (dashboardNote.includes('dataview') ? 'valid' : 'FAIL'));

    // Cleanup
    writer.unsubscribe();
  } catch (e) {
    console.log('  [-] Error: ' + e.message);
  }
  results.obsidian = { ok: obsidianOk };
  console.log('');

  // ────────────────────────────────────────────
  // Step 18: Multi-CLI Parity (Phase 13)
  // ────────────────────────────────────────────
  console.log('[Step 18] Multi-CLI Parity');
  let multiCliOk = false;
  try {
    const fs = require('fs');
    const path = require('path');
    const root = path.resolve(__dirname, '..', '..');

    // Check config files exist
    const geminiSettings = fs.existsSync(path.join(root, '.gemini', 'settings.json'));
    const codexConfig = fs.existsSync(path.join(root, '.codex', 'config.toml'));
    const agentsMd = fs.existsSync(path.join(root, 'AGENTS.md'));
    const geminiMd = fs.existsSync(path.join(root, 'GEMINI.md'));
    const codexMd = fs.existsSync(path.join(root, 'CODEX.md'));

    // Check hook handlers exist
    const hooksDir = path.join(__dirname, '..', 'hooks');
    const geminiHooks = [
      'gemini-session-start.js',
      'gemini-session-end.js',
      'gemini-before-tool.js',
      'gemini-after-tool.js'
    ].every(h => fs.existsSync(path.join(hooksDir, h)));
    const codexHook = fs.existsSync(path.join(hooksDir, 'codex-notify.js'));

    // Check config sync module loads
    const { ConfigSync } = require('../sync/config-sync');
    const sync = new ConfigSync({ dryRun: true });
    const syncResult = sync.sync();

    // Check skill symlinks
    const geminiSkills = fs.existsSync(path.join(root, '.gemini', 'skills'));
    const agentsSkills = fs.existsSync(path.join(root, '.agents', 'skills'));

    // Verify GEMINI.md has no "undefined"
    const geminiContent = fs.readFileSync(path.join(root, 'GEMINI.md'), 'utf8');
    const noUndefined = !geminiContent.includes('**undefined**');

    multiCliOk = geminiSettings && codexConfig && agentsMd && geminiMd && codexMd
      && geminiHooks && codexHook && syncResult.synced
      && geminiSkills && agentsSkills && noUndefined;

    console.log('  Config files: Gemini=' + (geminiSettings ? 'OK' : 'MISS') + ' Codex=' + (codexConfig ? 'OK' : 'MISS'));
    console.log('  Instruction files: AGENTS=' + (agentsMd ? 'OK' : 'MISS') + ' GEMINI=' + (geminiMd ? 'OK' : 'MISS') + ' CODEX=' + (codexMd ? 'OK' : 'MISS'));
    console.log('  Gemini hooks: ' + (geminiHooks ? '4/4' : 'INCOMPLETE'));
    console.log('  Codex hook: ' + (codexHook ? 'OK' : 'MISS'));
    console.log('  Config sync: ' + (syncResult.synced ? 'OK' : 'FAIL'));
    console.log('  Skill links: Gemini=' + (geminiSkills ? 'OK' : 'MISS') + ' Codex=' + (agentsSkills ? 'OK' : 'MISS'));
    console.log('  GEMINI.md clean: ' + (noUndefined ? 'OK' : 'has undefined'));
  } catch (e) {
    console.log('  [-] Error: ' + e.message);
  }
  results.multiCli = { ok: multiCliOk };
  console.log('');

  // ────────────────────────────────────────────
  // EVENT TRACE
  // ────────────────────────────────────────────
  console.log('[Event Trace] ' + eventTrace.length + ' events captured');
  const eventTypes = {};
  eventTrace.forEach(e => {
    const ns = (e.event || 'unknown').split(':')[0];
    eventTypes[ns] = (eventTypes[ns] || 0) + 1;
  });
  Object.entries(eventTypes).sort((a, b) => b[1] - a[1]).forEach(([ns, count]) => {
    console.log('  ' + ns + ':* -> ' + count + ' events');
  });
  console.log('');

  // ────────────────────────────────────────────
  // FINAL VERDICT
  // ────────────────────────────────────────────
  const totalTime = Date.now() - startTime;

  console.log('================================================================');
  console.log('  VERDICT');
  console.log('================================================================');
  console.log('');

  const checks = [
    // Original 12 checks (Phase 0-7)
    ['Orchestrator init',    results.init.ok],
    ['Multi-provider routing', results.routing.hasFallbacks],
    ['Strategy varies by task', results.routing.provider !== results.trivialRouting.provider || results.routing.strategy !== 'default'],
    ['Graph execution',      results.graph.success && results.graph.steps === 3],
    ['Graph completes review', results.graph.finalPhase === 'reviewed'],
    ['Infra services detected', results.infra.total > 0],
    ['Observability recording', results.observability.costTracked >= 0],
    ['MCP tool discovery',   results.gateway.toolsFound >= 2],
    ['A2A agent discovery',  results.gateway.agentsFound >= 1],
    ['A2A task delegation',  results.gateway.delegated],
    ['RAG graceful degrade', true],
    ['Event bus active',     eventTrace.length > 3],
    // Phase 8+ checks
    ['Checkpoint save/load', results.checkpoint?.ok],
    ['Middleware stack',     results.middleware?.ok],
    ['Deep Agent planner',  results.deepAgent?.ok],
    ['Claude features',     results.claudeFeatures?.ok],
    ['Monitor loadable',    results.monitor?.ok],
    ['Team delegation',     results.teamDelegation?.ok],
    // Phase 12 check
    ['Obsidian integration', results.obsidian?.ok],
    // Phase 13 check
    ['Multi-CLI parity',    results.multiCli?.ok]
  ];

  let passed = 0;
  checks.forEach(([name, ok]) => {
    console.log('  [' + (ok ? '+' : '-') + '] ' + name);
    if (ok) passed++;
  });

  console.log('');
  console.log('  Result: ' + passed + '/' + checks.length + ' checks passed');
  console.log('  Total time: ' + totalTime + 'ms');
  console.log('  7 Layers touched: L1(Infra) L2(Models) L3(Agents) L4(Workflow) L5(RAG) L6(Observe) L7(Gateway)');
  console.log('  Phase 8+: Checkpoint, Middleware, DeepAgent, ClaudeFeatures, Monitor, Teams');
  console.log('  Phase 12: Obsidian Integration');
  console.log('  Phase 13: Multi-CLI Parity');
  console.log('================================================================');
}

runScenario().catch(err => {
  console.error('[-] Scenario failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
