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

// Parse CLI args
const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const PORT = portIdx !== -1 ? parseInt(args[portIdx + 1]) : 3847;
if (args.includes('--verbose')) process.env.VERBOSE = '1';

// Initialize components
const stateMachine = new AgentStateMachine();
const broadcaster = new Broadcaster();
const router = new AutonomousRouter();
const watcher = new TranscriptWatcher(stateMachine, broadcaster, db, router);
const collector = new EventCollector(stateMachine, broadcaster, db);

// Express setup
const app = express();
app.use(express.json({ limit: '1mb' }));

// CORS for Electron/browser UI
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Register API routes
collector.registerRoutes(app);

// === F Architecture: Autonomous Routing API ===
app.post('/route', (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: 'task required' });
  const result = router.analyzeIntent(task);
  res.json(result);
});

app.post('/route/outcome', (req, res) => {
  const { tool_name, intent, success, duration_ms } = req.body;
  router.recordOutcome(tool_name, intent, success, duration_ms);
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'swarm-commander',
    version: '1.0.0-F',
    status: 'running',
    uptime: process.uptime(),
    wsPath: '/ws',
    endpoints: [
      'POST /event',
      'POST /session/start',
      'POST /session/end',
      'POST /analyze',
      'POST /tool',
      'POST /route',
      'POST /route/outcome',
      'GET /route/hint?tool=X&intent=Y',
      'GET /route/weights?intent=Y',
      'GET /skills/candidates',
      'GET /state',
      'GET /stats/tools',
      'GET /stats/events',
      'GET /stats/agents',
      'GET /stats/swarm',
      'GET /health'
    ]
  });
});

// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket broadcaster
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
  console.log('========================================');

  // Start transcript watcher
  watcher.start();

  // Auto-start session
  collector._handleSessionStart({ sessionId: `observer-${Date.now()}` });
});

// Graceful shutdown
function shutdown() {
  console.log('\n[*] Shutting down...');
  clearInterval(timeoutInterval);
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
