/**
 * Command Center Observer Server
 *
 * External process that watches Claude Code activity without
 * consuming any context tokens. Replaces ~30 hooks with a
 * single lightweight Observer.
 *
 * Architecture:
 *   JSONL Transcripts ---> TranscriptWatcher ---+
 *                                               |
 *   HTTP Hook Events ---> EventCollector -------+--> StateMachine --> SQLite DB
 *                                               |
 *   WebSocket <--- Broadcaster <----------------+
 *
 * Usage:
 *   node index.js                  # default port 3847
 *   node index.js --port 4000      # custom port
 *   node index.js --verbose        # debug output
 */

const http = require('http');
const express = require('express');
const path = require('path');

const db = require('./db');
const { AgentStateMachine } = require('./state-machine');
const { Broadcaster } = require('./broadcaster');
const { TranscriptWatcher } = require('./transcript-watcher');
const { EventCollector } = require('./event-collector');
const { AutonomousRouter } = require('./autonomous-router');
const { SelfLearningEngine } = require('./self-learning-engine');
const { TeamCoordinator } = require('./team-coordinator');
const { ControlPlane } = require('./control-plane');
const { Scheduler } = require('./scheduler');
const { EvolutionAgent } = require('./evolution-agent');
const { MemorySync } = require('./memory-sync');
const { Auth } = require('./auth');
const { AlertsEngine } = require('./alerts-engine');
const { ClaudeRemoteBridge } = require('./claude-remote-bridge');
const { SkillFactory } = require('./skill-factory');
const { TaskDecomposer } = require('./task-decomposer');
const { AutonomyGuard } = require('./autonomy-guard');
const { ObsidianBridge } = require('./obsidian-bridge');
const { AntifragileEngine } = require('./antifragile');

// Parse CLI args
const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const PORT = portIdx !== -1 ? parseInt(args[portIdx + 1]) : 3847;
if (args.includes('--verbose')) process.env.VERBOSE = '1';

// Initialize components
const stateMachine = new AgentStateMachine();
const broadcaster = new Broadcaster();
const antifragile = new AntifragileEngine({ broadcaster });
const router = new AutonomousRouter({ antifragile });
const learner = new SelfLearningEngine({ antifragile });
const coordinator = new TeamCoordinator(stateMachine, broadcaster);
const auth = new Auth();
const alertsEngine = new AlertsEngine({ broadcaster });
const autonomyGuard = new AutonomyGuard({ broadcaster });
const obsidianBridge = new ObsidianBridge({ broadcaster });
const claudeBridge = new ClaudeRemoteBridge({ broadcaster });
const skillFactory = new SkillFactory({ broadcaster, claudeBridge, autonomyGuard });
const taskDecomposer = new TaskDecomposer({ claudeBridge, broadcaster, autonomyGuard, router });
const evolutionAgent = new EvolutionAgent({ learner, router, broadcaster });
const memorySync = new MemorySync({ broadcaster });
const controlPlane = new ControlPlane({ stateMachine, broadcaster, coordinator: null, scheduler: null, antifragile });
const scheduler = new Scheduler({ controlPlane, learner, router, coordinator: null, broadcaster, evolutionAgent, memorySync });
const watcher = new TranscriptWatcher(stateMachine, broadcaster, db, router, learner);
const collector = new EventCollector(stateMachine, broadcaster, db, router, antifragile);

// Wire up circular references after all components created
controlPlane.coordinator = coordinator;
controlPlane.scheduler = scheduler;
controlPlane.claudeBridge = claudeBridge;
scheduler.coordinator = coordinator;

// Express setup
const app = express();
app.use(express.json({ limit: '1mb' }));

// CORS + Auth (Phase 4)
app.use(auth.corsMiddleware());

// Register API routes
collector.registerRoutes(app);

// === F Architecture: Autonomous Routing API ===
app.post('/route', (req, res) => {
  const task = req.body.task || req.body.taskDescription; // backward compat
  if (!task) return res.status(400).json({ error: 'task required' });
  const result = router.analyzeIntent(task);
  res.json(result);
});

app.post('/route/outcome', (req, res) => {
  const { tool_name, intent, success, duration_ms } = req.body;
  router.recordOutcome(tool_name, intent, success, duration_ms);
  learner.learn(tool_name, intent, success, duration_ms);
  res.json({ ok: true });
});

app.get('/route/hint', (req, res) => {
  const { tool, intent } = req.query;
  const hint = router.getProactiveHint(tool, intent);
  res.json(hint || { type: 'no_hint' });
});

app.get('/route/weights', (req, res) => {
  const { intent } = req.query;
  if (!intent) return res.status(400).json({ error: 'intent required' });
  res.json(db.getBestToolsForIntent(intent));
});

app.get('/skills/candidates', (req, res) => {
  res.json(router.getSkillCandidates());
});

app.get('/stats/swarm', (req, res) => {
  res.json(db.getSwarmStats());
});

// === Self-Learning Engine API ===
app.get('/learning/stats', (req, res) => {
  res.json(learner.getStats());
});

app.get('/learning/trend', (req, res) => {
  const { tool } = req.query;
  if (!tool) return res.status(400).json({ error: 'tool query param required' });
  res.json(learner.getTrend(tool));
});

app.get('/learning/best', (req, res) => {
  const { intent, limit } = req.query;
  if (!intent) return res.status(400).json({ error: 'intent query param required' });
  res.json(learner.getBestTools(intent, parseInt(limit) || 5));
});

// === Team Coordinator API ===
app.post('/team/lock', (req, res) => {
  const { agent_id, file_path, purpose } = req.body;
  if (!agent_id || !file_path) return res.status(400).json({ error: 'agent_id and file_path required' });
  res.json(coordinator.acquireLock(agent_id, file_path, purpose));
});

app.post('/team/release', (req, res) => {
  const { agent_id, file_path } = req.body;
  if (!agent_id) return res.status(400).json({ error: 'agent_id required' });
  if (file_path) {
    res.json({ released: coordinator.releaseLock(agent_id, file_path) });
  } else {
    res.json({ released: coordinator.releaseAllLocks(agent_id) });
  }
});

app.get('/team/status', (req, res) => {
  res.json(coordinator.getStatus());
});

app.post('/team/conflicts', (req, res) => {
  const { agent_id, target_files } = req.body;
  if (!agent_id || !target_files) return res.status(400).json({ error: 'agent_id and target_files required' });
  res.json(coordinator.detectConflicts(agent_id, target_files));
});

app.post('/team/task', (req, res) => {
  const { description, priority, preferred_agent } = req.body;
  if (!description) return res.status(400).json({ error: 'description required' });
  res.json(coordinator.enqueueTask(description, priority, preferred_agent));
});

app.post('/team/task/next', (req, res) => {
  const { agent_id } = req.body;
  if (!agent_id) return res.status(400).json({ error: 'agent_id required' });
  const task = coordinator.assignNextTask(agent_id);
  res.json(task || { message: 'no pending tasks' });
});

// === Auth middleware (Phase 4: 2-tier read/write) ===
const readAuth = auth.readAuth();
const writeAuth = auth.writeAuth();

// === Control Plane API ===

app.post('/control/command', writeAuth, (req, res) => {
  const result = controlPlane.enqueueCommand(req.body);
  res.status(result.ok ? 200 : 400).json(result);
});

app.get('/control/queue', readAuth, (req, res) => {
  res.json(controlPlane.getQueue(req.query));
});

app.post('/control/command/:id/ack', writeAuth, (req, res) => {
  controlPlane.completeCommand(req.params.id, req.body.result, req.body.actor);
  res.json({ ok: true });
});

app.post('/control/command/:id/fail', writeAuth, (req, res) => {
  controlPlane.failCommand(req.params.id, req.body.error, req.body.retryable, req.body.actor);
  res.json({ ok: true });
});

app.post('/control/command/:id/cancel', writeAuth, (req, res) => {
  controlPlane.cancelCommand(req.params.id, req.body.reason, req.body.actor);
  res.json({ ok: true });
});

app.get('/control/stats', (req, res) => {
  res.json(controlPlane.getStats());
});

// === Scheduler API ===
app.get('/schedules', (req, res) => {
  res.json(scheduler.listSchedules());
});

app.post('/schedules', writeAuth, (req, res) => {
  res.json(scheduler.registerSchedule(req.body));
});

app.patch('/schedules/:id', writeAuth, (req, res) => {
  res.json(scheduler.updateSchedule(req.params.id, req.body));
});

app.get('/scheduler/runs', (req, res) => {
  res.json(scheduler.getRuns(req.query));
});

app.post('/scheduler/tick', writeAuth, (req, res) => {
  scheduler.tick();
  res.json({ ok: true, tickCount: scheduler.tickCount });
});

app.post('/scheduler/run/:id', writeAuth, (req, res) => {
  const d = db.getDb();
  const schedule = d.prepare('SELECT * FROM scheduler_schedules WHERE id = ?').get(req.params.id);
  if (!schedule) return res.status(404).json({ error: 'schedule not found' });
  res.json(scheduler.runSchedule(schedule));
});

app.get('/scheduler/status', (req, res) => {
  res.json(scheduler.getStatus());
});

// === Evolution Agent API ===
app.post('/evolution/propose', writeAuth, (req, res) => {
  res.json(evolutionAgent.proposeCycle(req.body));
});

app.get('/evolution/recommendations', (req, res) => {
  res.json(evolutionAgent.getRecommendations(req.query));
});

app.post('/evolution/recommendations/:id/approve', writeAuth, (req, res) => {
  res.json(evolutionAgent.approveRecommendation(req.params.id, req.body.approver, req.body.note));
});

app.post('/evolution/recommendations/:id/reject', writeAuth, (req, res) => {
  res.json(evolutionAgent.rejectRecommendation(req.params.id, req.body.approver, req.body.reason));
});

app.post('/evolution/recommendations/:id/apply', writeAuth, (req, res) => {
  res.json(evolutionAgent.applyRecommendation(req.params.id, req.body.actor || 'user'));
});

app.post('/evolution/recommendations/:id/rollback', writeAuth, (req, res) => {
  res.json(evolutionAgent.rollback(req.params.id, req.body.actor || 'user', req.body.reason));
});

app.get('/evolution/history', (req, res) => {
  res.json(evolutionAgent.getHistory(parseInt(req.query.limit) || 20));
});

// === Memory Sync API ===
app.post('/memory/sync', writeAuth, (req, res) => {
  res.json(memorySync.runIncremental(req.body));
});

app.get('/memory/status', (req, res) => {
  res.json(memorySync.getSyncStatus());
});

app.get('/memory/documents', (req, res) => {
  res.json(memorySync.getDocuments(req.query));
});

app.get('/memory/sync/runs', (req, res) => {
  res.json(memorySync.getRuns(parseInt(req.query.limit) || 20));
});

// === Alerts API ===
app.get('/alerts', readAuth, (req, res) => {
  res.json(alertsEngine.getActive());
});

app.get('/alerts/rules', readAuth, (req, res) => {
  res.json(alertsEngine.getRules());
});

app.post('/alerts/test/:ruleId', writeAuth, (req, res) => {
  res.json(alertsEngine.testRule(req.params.ruleId));
});

// === Claude Remote Bridge API ===
app.get('/claude/sessions', readAuth, (req, res) => {
  res.json(claudeBridge.getSessions());
});

app.post('/claude/dispatch', writeAuth, (req, res) => {
  const { prompt, agent_type, timeout_seconds, cwd } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  res.json(claudeBridge.dispatch({ prompt, agentType: agent_type, timeoutSec: timeout_seconds, cwd }));
});

app.get('/claude/tasks', readAuth, (req, res) => {
  res.json(claudeBridge.getTasks(req.query));
});

app.post('/claude/tasks/:id/cancel', writeAuth, (req, res) => {
  res.json(claudeBridge.cancel(req.params.id, req.body.reason));
});

app.get('/claude/stats', readAuth, (req, res) => {
  res.json(claudeBridge.getStats());
});

// === Skill Factory API ===
app.post('/skills/factory/cycle', writeAuth, (req, res) => {
  res.json(skillFactory.runCycle());
});

app.get('/skills/factory/list', readAuth, (req, res) => {
  res.json(skillFactory.list(req.query));
});

app.post('/skills/factory/:id/deploy', writeAuth, (req, res) => {
  res.json(skillFactory.deploy(req.params.id));
});

app.post('/skills/factory/:id/retire', writeAuth, (req, res) => {
  res.json(skillFactory.retire(req.params.id));
});

// === Task Decomposer API ===
app.post('/decompose/plan', writeAuth, (req, res) => {
  res.json(taskDecomposer.createPlan(req.body));
});

app.post('/decompose/plan/:id/execute', writeAuth, (req, res) => {
  res.json(taskDecomposer.executePlan(req.params.id));
});

app.get('/decompose/plans', readAuth, (req, res) => {
  res.json(taskDecomposer.getPlans(req.query));
});

app.get('/decompose/plan/:id/runs', readAuth, (req, res) => {
  res.json(taskDecomposer.getPlanRuns(req.params.id));
});

// === Autonomy Guard API ===
app.get('/autonomy/audit', readAuth, (req, res) => {
  res.json(autonomyGuard.getAudit(req.query));
});

app.get('/autonomy/limits', readAuth, (req, res) => {
  res.json(autonomyGuard.getLimits());
});

app.get('/autonomy/stats', readAuth, (req, res) => {
  res.json(autonomyGuard.getStats());
});

// === Obsidian Bridge API ===
app.post('/obsidian/sync', writeAuth, (req, res) => {
  res.json(obsidianBridge.pull(req.body));
});

app.post('/obsidian/push', writeAuth, (req, res) => {
  const { title, content, folder, tags, frontmatter, type } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content required' });
  if (type === 'evolution-report') {
    return res.json(obsidianBridge.pushEvolutionReport(req.body));
  }
  res.json(obsidianBridge.pushNote({ title, content, folder, tags, frontmatter }));
});

app.get('/obsidian/status', readAuth, (req, res) => {
  res.json(obsidianBridge.getStatus());
});

app.get('/obsidian/search', readAuth, (req, res) => {
  res.json(obsidianBridge.search(req.query));
});

// === Antifragile Engine API ===
app.get('/antifragile/status', (req, res) => {
  res.json(antifragile.getStatus());
});

app.get('/antifragile/trust/:tool', (req, res) => {
  res.json(antifragile.getTrustScore(req.params.tool));
});

app.post('/antifragile/assess', (req, res) => {
  const { toolName, command, targetFiles } = req.body;
  if (!toolName) return res.status(400).json({ error: 'toolName required' });
  const irrev = antifragile.scoreIrreversibility({ toolName, command, targetFiles });
  const authority = antifragile.checkAuthority(toolName, irrev.level);
  res.json({ ...irrev, authority });
});

app.get('/antifragile/failures', (req, res) => {
  const { intent } = req.query;
  res.json(antifragile.getFailureStats(intent || 'all'));
});

// === Code Mode API (NEXUS JIT Discovery) ===
app.post('/code-mode/search', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });
  // Lightweight proxy: analyze intent then return relevant tools from router + defaults
  const routeResult = router.analyzeIntent(query);
  res.json({
    query,
    intent: routeResult.intent,
    tools: routeResult.tools,
    tier: routeResult.tier,
    confidence: routeResult.confidence
  });
});

app.post('/code-mode/execute', writeAuth, (req, res) => {
  const { server, tool, args } = req.body;
  if (!server || !tool) return res.status(400).json({ error: 'server and tool required' });
  // Thin wrapper: record the intent for learning, delegate actual execution to caller
  const irrev = antifragile.scoreIrreversibility({ toolName: tool, command: JSON.stringify(args) });
  res.json({ server, tool, args, irreversibility: irrev, status: 'ready_for_execution' });
});

// === Prometheus-compatible Metrics ===
app.get('/metrics', (req, res) => {
  const d = db.getDb();
  const lines = [];
  const ts = Date.now();

  // Uptime
  lines.push(`# HELP observer_uptime_seconds Observer server uptime`);
  lines.push(`# TYPE observer_uptime_seconds gauge`);
  lines.push(`observer_uptime_seconds ${Math.round(process.uptime())}`);

  // Memory
  const mem = process.memoryUsage();
  lines.push(`# HELP observer_memory_rss_bytes Resident set size`);
  lines.push(`# TYPE observer_memory_rss_bytes gauge`);
  lines.push(`observer_memory_rss_bytes ${mem.rss}`);

  // Agent count
  const agents = Object.keys(stateMachine.getAll()).length;
  lines.push(`# HELP observer_active_agents Number of tracked agents`);
  lines.push(`# TYPE observer_active_agents gauge`);
  lines.push(`observer_active_agents ${agents}`);

  // Scheduler
  lines.push(`# HELP observer_scheduler_ticks Total scheduler ticks`);
  lines.push(`# TYPE observer_scheduler_ticks counter`);
  lines.push(`observer_scheduler_ticks ${scheduler.tickCount}`);
  lines.push(`# HELP observer_scheduler_has_lease Scheduler lease status`);
  lines.push(`# TYPE observer_scheduler_has_lease gauge`);
  lines.push(`observer_scheduler_has_lease ${scheduler.hasLease() ? 1 : 0}`);

  // Control plane queue
  try {
    const queueStats = d.prepare(`SELECT status, COUNT(*) as c FROM control_commands GROUP BY status`).all();
    lines.push(`# HELP observer_control_queue_size Control plane queue size by status`);
    lines.push(`# TYPE observer_control_queue_size gauge`);
    for (const s of queueStats) {
      lines.push(`observer_control_queue_size{status="${s.status}"} ${s.c}`);
    }
  } catch {}

  // Tool usage total
  try {
    const toolTotal = d.prepare(`SELECT COUNT(*) as c FROM tool_usage`).get();
    lines.push(`# HELP observer_tool_usage_total Total tool usage events`);
    lines.push(`# TYPE observer_tool_usage_total counter`);
    lines.push(`observer_tool_usage_total ${toolTotal.c}`);
  } catch {}

  // Learning weights
  try {
    const weightStats = d.prepare(`SELECT COUNT(*) as c, AVG(weight) as avg FROM routing_weights`).get();
    lines.push(`# HELP observer_routing_weights_count Total routing weight entries`);
    lines.push(`# TYPE observer_routing_weights_count gauge`);
    lines.push(`observer_routing_weights_count ${weightStats.c}`);
    lines.push(`# HELP observer_routing_weights_avg Average routing weight`);
    lines.push(`# TYPE observer_routing_weights_avg gauge`);
    lines.push(`observer_routing_weights_avg ${Math.round((weightStats.avg || 0) * 1000) / 1000}`);
  } catch {}

  // Evolution recommendations
  try {
    const evoStats = d.prepare(`SELECT status, COUNT(*) as c FROM evolution_recommendations GROUP BY status`).all();
    lines.push(`# HELP observer_evolution_recommendations Evolution recommendations by status`);
    lines.push(`# TYPE observer_evolution_recommendations gauge`);
    for (const s of evoStats) {
      lines.push(`observer_evolution_recommendations{status="${s.status}"} ${s.c}`);
    }
  } catch {}

  // Memory sync docs
  try {
    const memStats = d.prepare(`SELECT status, COUNT(*) as c FROM memory_documents GROUP BY status`).all();
    lines.push(`# HELP observer_memory_documents Synced memory documents by status`);
    lines.push(`# TYPE observer_memory_documents gauge`);
    for (const s of memStats) {
      lines.push(`observer_memory_documents{status="${s.status}"} ${s.c}`);
    }
  } catch {}

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(lines.join('\n') + '\n');
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'swarm-commander',
    version: '2.0.0-F',
    status: 'running',
    uptime: process.uptime(),
    wsPath: '/ws',
    endpoints: [
      'POST /event', 'POST /session/start', 'POST /session/end',
      'POST /analyze', 'POST /tool', 'POST /route', 'POST /route/outcome',
      'GET /route/hint', 'GET /route/weights', 'GET /skills/candidates',
      'GET /state', 'GET /stats/tools', 'GET /stats/events', 'GET /stats/agents', 'GET /stats/swarm',
      'GET /learning/stats', 'GET /learning/trend', 'GET /learning/best',
      'POST /team/lock', 'POST /team/release', 'GET /team/status',
      'POST /team/conflicts', 'POST /team/task', 'POST /team/task/next',
      'POST /control/command', 'GET /control/queue', 'POST /control/command/:id/ack',
      'POST /control/command/:id/fail', 'POST /control/command/:id/cancel', 'GET /control/stats',
      'GET /schedules', 'POST /schedules', 'PATCH /schedules/:id',
      'GET /scheduler/runs', 'POST /scheduler/tick', 'POST /scheduler/run/:id', 'GET /scheduler/status',
      'POST /evolution/propose', 'GET /evolution/recommendations',
      'POST /evolution/recommendations/:id/approve', 'POST /evolution/recommendations/:id/reject',
      'POST /evolution/recommendations/:id/apply', 'POST /evolution/recommendations/:id/rollback',
      'GET /evolution/history',
      'POST /memory/sync', 'GET /memory/status', 'GET /memory/documents', 'GET /memory/sync/runs',
      'GET /claude/sessions', 'POST /claude/dispatch', 'GET /claude/tasks',
      'POST /claude/tasks/:id/cancel', 'GET /claude/stats',
      'POST /skills/factory/cycle', 'GET /skills/factory/list',
      'POST /skills/factory/:id/deploy', 'POST /skills/factory/:id/retire',
      'POST /decompose/plan', 'POST /decompose/plan/:id/execute',
      'GET /decompose/plans', 'GET /decompose/plan/:id/runs',
      'GET /autonomy/audit', 'GET /autonomy/limits', 'GET /autonomy/stats',
      'POST /obsidian/sync', 'POST /obsidian/push', 'GET /obsidian/status', 'GET /obsidian/search',
      'GET /alerts', 'GET /alerts/rules', 'POST /alerts/test/:ruleId',
      'GET /antifragile/status', 'GET /antifragile/trust/:tool',
      'POST /antifragile/assess', 'GET /antifragile/failures',
      'POST /code-mode/search', 'POST /code-mode/execute',
      'GET /metrics', 'GET /health'
    ]
  });
});

// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket broadcaster
broadcaster.setAuth(auth);
broadcaster.attach(server);

// Handle state requests from UI clients
broadcaster.onStateRequest((ws) => {
  const state = {
    agents: stateMachine.getAll(),
    sessionId: collector.sessionId,
    timestamp: Date.now()
  };
  ws.send(JSON.stringify({ type: 'full_state', data: state }));
});

// Forward state machine changes to broadcaster
stateMachine.onStateChange((type, data) => {
  broadcaster.broadcast(type, data);
});

// Periodic timeout check (auto-idle stale agents)
const timeoutInterval = setInterval(() => {
  stateMachine.checkTimeouts(120000); // 2 minutes
}, 30000); // check every 30s

// Weight decay is now handled by Scheduler Tier2 (every 5 min)
// Removed standalone interval to prevent double decay
const decayInterval = null;

// Auto-release locks for completed agents
stateMachine.onStateChange((type, data) => {
  if (type === 'state_change' && data.state === 'idle' && data.reason === 'timeout') {
    coordinator.releaseAllLocks(data.agentId);
  }
});

// Start server
server.listen(PORT, () => {
  console.log('========================================');
  console.log('  Command Center Observer Server');
  console.log('========================================');
  console.log(`  Port: ${PORT}`);
  console.log(`  WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`  API: http://localhost:${PORT}/`);
  console.log(`  DB: ${path.resolve(__dirname, '..', 'data', 'observer.db')}`);
  console.log(`  Verbose: ${process.env.VERBOSE === '1' ? 'ON' : 'OFF'}`);
  console.log(`  Learning: epsilon=${0.15}, decay=${0.995}`);
  console.log(`  Coordinator: lock_timeout=5min, max_locks=10`);
  console.log(`  Auth: ${auth.enforced ? 'ENFORCED' : 'optional'} (${auth.writeToken ? 'token set' : 'no token'})`);
  console.log(`  Alerts: ${alertsEngine.rules.length} rules`);
  console.log(`  Claude Bridge: max_concurrent=${claudeBridge.getStats().maxConcurrent}`);
  console.log('========================================');

  // Start transcript watcher
  watcher.start();

  // Start scheduler + alerts + bridge reconciliation
  scheduler.start();
  alertsEngine.start(30000);
  claudeBridge.reconcile();

  // Auto-start session
  collector._handleSessionStart({ sessionId: `observer-${Date.now()}` });
});

// Graceful shutdown
function shutdown() {
  console.log('\n[*] Shutting down...');
  clearInterval(timeoutInterval);
  if (decayInterval) clearInterval(decayInterval);
  alertsEngine.stop();
  scheduler.stop();
  watcher.stop();
  broadcaster.close();
  db.close();
  server.close(() => {
    console.log('[+] Server stopped');
    process.exit(0);
  });
  // Force exit after 5 seconds
  setTimeout(() => process.exit(0), 5000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', (err) => {
  console.error('[!] Uncaught exception:', err.message);
});
process.on('unhandledRejection', (err) => {
  console.error('[!] Unhandled rejection:', err);
});
