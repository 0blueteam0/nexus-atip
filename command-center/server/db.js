/**
 * SQLite State Store (Phase 4 integrated into Phase 2)
 *
 * Replaces:
 *   - ATOS usage-stats.json (tool_usage table)
 *   - Unified Task System (tasks table)
 *   - Planning System state (sessions table)
 *   - NEXUS evolution data (patterns table)
 *
 * All existing systems remain intact - this is additive.
 */

const path = require('path');
let Database;

const DB_PATH = path.join(__dirname, '..', 'data', 'observer.db');

let db = null;

function getDb() {
  if (db) return db;

  try {
    Database = require('better-sqlite3');
  } catch (e) {
    console.error('[DB] better-sqlite3 not installed. Run: npm install');
    console.error('[DB] Falling back to in-memory store');
    return createInMemoryStore();
  }

  db = new Database(DB_PATH, { verbose: process.env.VERBOSE ? console.log : undefined });
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initSchema(db);
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      started_at DATETIME DEFAULT (datetime('now')),
      ended_at DATETIME,
      tokens_input INTEGER DEFAULT 0,
      tokens_output INTEGER DEFAULT 0,
      cost_usd REAL DEFAULT 0,
      active BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      source TEXT DEFAULT 'observer',
      plan_file TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      completed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS tool_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      tool_name TEXT NOT NULL,
      mcp_server TEXT,
      duration_ms INTEGER,
      success BOOLEAN DEFAULT 1,
      timestamp DATETIME DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS agent_states (
      agent_id TEXT PRIMARY KEY,
      display_name TEXT,
      state TEXT DEFAULT 'idle',
      current_tool TEXT,
      current_file TEXT,
      x INTEGER DEFAULT 0,
      y INTEGER DEFAULT 0,
      last_updated DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern_type TEXT NOT NULL,
      data TEXT,
      confidence REAL DEFAULT 0.5,
      created_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      source TEXT,
      data TEXT,
      timestamp DATETIME DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tool_usage_session ON tool_usage(session_id);
    CREATE INDEX IF NOT EXISTS idx_tool_usage_tool ON tool_usage(tool_name);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
  `);
}

/**
 * In-memory fallback when better-sqlite3 is unavailable
 */
function createInMemoryStore() {
  const store = {
    sessions: new Map(),
    tasks: new Map(),
    toolUsage: [],
    agentStates: new Map(),
    patterns: [],
    events: []
  };

  return {
    prepare: (sql) => createInMemoryStatement(store, sql),
    exec: () => {},
    close: () => {},
    _store: store,
    _inMemory: true
  };
}

function createInMemoryStatement(store, sql) {
  const lower = sql.toLowerCase().trim();
  return {
    run: (...params) => {
      if (lower.startsWith('insert into events')) {
        store.events.push({ params, timestamp: new Date().toISOString() });
        if (store.events.length > 10000) store.events.shift();
      }
      if (lower.startsWith('insert into tool_usage')) {
        store.toolUsage.push({ params, timestamp: new Date().toISOString() });
        if (store.toolUsage.length > 10000) store.toolUsage.shift();
      }
      return { changes: 1 };
    },
    get: () => null,
    all: () => []
  };
}

// -- Query helpers --

function recordEvent(type, source, data) {
  const db = getDb();
  db.prepare('INSERT INTO events (event_type, source, data) VALUES (?, ?, ?)')
    .run(type, source, typeof data === 'string' ? data : JSON.stringify(data));
}

function recordToolUsage(sessionId, toolName, mcpServer, durationMs, success) {
  const db = getDb();
  db.prepare(
    'INSERT INTO tool_usage (session_id, tool_name, mcp_server, duration_ms, success) VALUES (?, ?, ?, ?, ?)'
  ).run(sessionId, toolName, mcpServer || null, durationMs || null, success ? 1 : 0);
}

function upsertAgentState(agentId, state, currentTool, currentFile) {
  const db = getDb();
  db.prepare(`
    INSERT INTO agent_states (agent_id, state, current_tool, current_file, last_updated)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(agent_id) DO UPDATE SET
      state = excluded.state,
      current_tool = excluded.current_tool,
      current_file = excluded.current_file,
      last_updated = datetime('now')
  `).run(agentId, state, currentTool || null, currentFile || null);
}

function startSession(sessionId) {
  const db = getDb();
  db.prepare(`
    INSERT OR IGNORE INTO sessions (id) VALUES (?)
  `).run(sessionId);
}

function endSession(sessionId) {
  const db = getDb();
  db.prepare(`
    UPDATE sessions SET ended_at = datetime('now'), active = 0 WHERE id = ?
  `).run(sessionId);
}

function getActiveSession() {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE active = 1 ORDER BY started_at DESC LIMIT 1').get();
}

function getToolStats(limit = 20) {
  const db = getDb();
  return db.prepare(`
    SELECT tool_name, mcp_server, COUNT(*) as count,
           AVG(duration_ms) as avg_duration,
           SUM(CASE WHEN success THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
    FROM tool_usage
    GROUP BY tool_name
    ORDER BY count DESC
    LIMIT ?
  `).all(limit);
}

function getRecentEvents(limit = 50) {
  const db = getDb();
  return db.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT ?').all(limit);
}

function getAllAgentStates() {
  const db = getDb();
  return db.prepare('SELECT * FROM agent_states').all();
}

function close() {
  if (db && !db._inMemory) {
    db.close();
    db = null;
  }
}

// === F Architecture: Self-Learning Tables ===

function initFTables() {
  const d = getDb();
  d.exec(`
    CREATE TABLE IF NOT EXISTS routing_weights (
      tool_name TEXT NOT NULL,
      intent TEXT NOT NULL,
      weight REAL DEFAULT 0.5,
      alpha INTEGER DEFAULT 1,
      beta INTEGER DEFAULT 1,
      last_updated DATETIME DEFAULT (datetime('now')),
      PRIMARY KEY (tool_name, intent)
    );

    CREATE TABLE IF NOT EXISTS routing_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      task_description TEXT,
      intent TEXT,
      tier INTEGER,
      routed_to TEXT,
      alternatives TEXT,
      confidence REAL,
      outcome TEXT,
      timestamp DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_scores (
      agent_name TEXT NOT NULL,
      task_type TEXT NOT NULL,
      success_count INTEGER DEFAULT 0,
      failure_count INTEGER DEFAULT 0,
      score REAL DEFAULT 0.5,
      last_updated DATETIME DEFAULT (datetime('now')),
      PRIMARY KEY (agent_name, task_type)
    );

    CREATE TABLE IF NOT EXISTS chain_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern_name TEXT,
      chain TEXT NOT NULL,
      intent TEXT,
      success_rate REAL DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      last_used DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skill_performance (
      skill_name TEXT PRIMARY KEY,
      trigger_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      success_rate REAL DEFAULT 0,
      auto_generated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT (datetime('now')),
      last_triggered DATETIME
    );

    CREATE TABLE IF NOT EXISTS pattern_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern_hash TEXT UNIQUE,
      description TEXT,
      tool_chain TEXT,
      occurrence_count INTEGER DEFAULT 1,
      confidence REAL DEFAULT 0,
      status TEXT DEFAULT 'candidate',
      first_seen DATETIME DEFAULT (datetime('now')),
      last_seen DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS evolution_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT,
      description TEXT,
      before_state TEXT,
      after_state TEXT,
      improvement_delta REAL,
      timestamp DATETIME DEFAULT (datetime('now'))
    );
  `);
}

// --- Bayesian Routing ---
function updateRoutingWeight(toolName, intent, success) {
  const d = getDb();
  const a = success ? 1 : 0, b = success ? 0 : 1;
  d.prepare(`
    INSERT INTO routing_weights (tool_name,intent,alpha,beta,weight) VALUES (?,?,?,?,?)
    ON CONFLICT(tool_name,intent) DO UPDATE SET
      alpha=alpha+?, beta=beta+?,
      weight=CAST((alpha+?) AS REAL)/(alpha+?+beta+?),
      last_updated=datetime('now')
  `).run(toolName, intent, 1+a, 1+b, success?0.667:0.333, a, b, a, a, b);
}

function getBestToolsForIntent(intent, limit = 5) {
  const d = getDb();
  return d.prepare(
    'SELECT tool_name,weight,alpha,beta FROM routing_weights WHERE intent=? ORDER BY weight DESC LIMIT ?'
  ).all(intent, limit);
}

// --- Pattern Candidates ---
function recordPattern(hash, description, toolChain) {
  const d = getDb();
  d.prepare(`
    INSERT INTO pattern_candidates (pattern_hash,description,tool_chain) VALUES (?,?,?)
    ON CONFLICT(pattern_hash) DO UPDATE SET
      occurrence_count=occurrence_count+1,
      confidence=MIN(1.0,confidence+0.1),
      last_seen=datetime('now')
  `).run(hash, description, JSON.stringify(toolChain));
}

function getReadyPatterns(minOccurrences = 3) {
  const d = getDb();
  return d.prepare(
    'SELECT * FROM pattern_candidates WHERE status="candidate" AND occurrence_count>=? ORDER BY confidence DESC'
  ).all(minOccurrences);
}

// --- Evolution Log ---
function logEvolution(actionType, description, beforeState, afterState, delta) {
  const d = getDb();
  d.prepare(
    'INSERT INTO evolution_log (action_type,description,before_state,after_state,improvement_delta) VALUES (?,?,?,?,?)'
  ).run(actionType, description, JSON.stringify(beforeState), JSON.stringify(afterState), delta);
}

// --- Extended Stats ---
function getSwarmStats() {
  const d = getDb();
  const base = getToolStats();
  let routing = [], autoSkills = 0, pendingPatterns = 0;
  try {
    routing = d.prepare('SELECT intent,COUNT(*) as c FROM routing_history GROUP BY intent ORDER BY c DESC LIMIT 10').all();
    autoSkills = d.prepare('SELECT COUNT(*) as c FROM skill_performance WHERE auto_generated=1').get().c;
    pendingPatterns = d.prepare('SELECT COUNT(*) as c FROM pattern_candidates WHERE status="candidate"').get().c;
  } catch(e) { /* tables may not exist yet */ }
  return { tools: base, routing, autoSkills, pendingPatterns };
}

// Auto-init F tables on first load
try { initFTables(); } catch(e) { /* will init when getDb() is first called */ }

module.exports = {
  getDb,
  recordEvent,
  recordToolUsage,
  upsertAgentState,
  startSession,
  endSession,
  getActiveSession,
  getToolStats,
  getRecentEvents,
  getAllAgentStates,
  close,
  // F Architecture exports
  initFTables,
  updateRoutingWeight,
  getBestToolsForIntent,
  recordPattern,
  getReadyPatterns,
  logEvolution,
  getSwarmStats
};
