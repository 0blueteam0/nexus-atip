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
    `SELECT * FROM pattern_candidates WHERE status='candidate' AND occurrence_count>=? ORDER BY confidence DESC`
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
    pendingPatterns = d.prepare(`SELECT COUNT(*) as c FROM pattern_candidates WHERE status='candidate'`).get().c;
  } catch(e) { /* tables may not exist yet */ }
  return { tools: base, routing, autoSkills, pendingPatterns };
}

// === Phase 3: Control Plane + Scheduler Tables ===

function initPhase3Tables() {
  const d = getDb();
  d.exec(`
    CREATE TABLE IF NOT EXISTS control_commands (
      id TEXT PRIMARY KEY,
      command_type TEXT NOT NULL CHECK (command_type IN ('enqueue_task','schedule_job','request_state','restart_component','update_config','dispatch_claude_task')),
      idempotency_key TEXT UNIQUE,
      payload_hash TEXT,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','failed','cancelled')),
      priority INTEGER NOT NULL DEFAULT 50,
      requested_by TEXT,
      source TEXT DEFAULT 'api',
      target_component TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      not_before DATETIME DEFAULT (datetime('now')),
      started_at DATETIME,
      completed_at DATETIME,
      acked_at DATETIME,
      result TEXT,
      last_error TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_control_commands_status_not_before
      ON control_commands(status, not_before, priority, created_at);
    CREATE INDEX IF NOT EXISTS idx_control_commands_type_created
      ON control_commands(command_type, created_at);

    CREATE TABLE IF NOT EXISTS control_command_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      actor TEXT,
      detail TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      FOREIGN KEY (command_id) REFERENCES control_commands(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_control_command_events_command
      ON control_command_events(command_id, created_at);

    CREATE TABLE IF NOT EXISTS scheduler_schedules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 5),
      handler_name TEXT NOT NULL,
      interval_seconds INTEGER NOT NULL CHECK (interval_seconds > 0),
      enabled INTEGER NOT NULL DEFAULT 1,
      max_runtime_seconds INTEGER NOT NULL DEFAULT 300,
      retry_backoff_seconds INTEGER NOT NULL DEFAULT 60,
      failure_count INTEGER NOT NULL DEFAULT 0,
      payload TEXT,
      next_run_at DATETIME NOT NULL,
      last_run_at DATETIME,
      last_success_at DATETIME,
      last_failure_at DATETIME,
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_scheduler_schedules_due
      ON scheduler_schedules(enabled, next_run_at);

    CREATE TABLE IF NOT EXISTS scheduler_runs (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL,
      lease_owner TEXT,
      status TEXT NOT NULL CHECK (status IN ('running','success','failed','skipped')),
      trigger_source TEXT DEFAULT 'tick',
      scheduled_for DATETIME,
      started_at DATETIME DEFAULT (datetime('now')),
      ended_at DATETIME,
      duration_ms INTEGER,
      output TEXT,
      error_message TEXT,
      FOREIGN KEY (schedule_id) REFERENCES scheduler_schedules(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_scheduler_runs_schedule_started
      ON scheduler_runs(schedule_id, started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_scheduler_runs_status_started
      ON scheduler_runs(status, started_at DESC);

    CREATE TABLE IF NOT EXISTS scheduler_leases (
      lease_name TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      acquired_at DATETIME DEFAULT (datetime('now')),
      last_heartbeat_at DATETIME DEFAULT (datetime('now')),
      expires_at DATETIME NOT NULL,
      meta TEXT
    );
  `);
}

// === Phase 3: Evolution + Memory Sync Tables ===

function initEvolutionMemoryTables() {
  const d = getDb();
  d.exec(`
    CREATE TABLE IF NOT EXISTS evolution_recommendations (
      id TEXT PRIMARY KEY,
      recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('weight_adjustment','pattern_promotion','config_tweak')),
      risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high')),
      title TEXT NOT NULL,
      rationale TEXT,
      before_state TEXT,
      proposed_state TEXT NOT NULL,
      expected_impact REAL DEFAULT 0,
      confidence REAL DEFAULT 0.5,
      auto_applicable INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','rejected','applied','failed','rolled_back')),
      created_by TEXT DEFAULT 'evolution-agent',
      approved_by TEXT,
      approved_at DATETIME,
      applied_by TEXT,
      applied_at DATETIME,
      rejected_by TEXT,
      rejected_at DATETIME,
      rejection_reason TEXT,
      source_metrics TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_evo_reco_status_risk
      ON evolution_recommendations(status, risk_level, created_at DESC);

    CREATE TABLE IF NOT EXISTS evolution_snapshots (
      id TEXT PRIMARY KEY,
      recommendation_id TEXT NOT NULL,
      snapshot_type TEXT NOT NULL,
      state_blob TEXT NOT NULL,
      checksum TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      FOREIGN KEY (recommendation_id) REFERENCES evolution_recommendations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evolution_apply_history (
      id TEXT PRIMARY KEY,
      recommendation_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('apply','rollback')),
      success INTEGER NOT NULL DEFAULT 0,
      actor TEXT,
      details TEXT,
      error TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      FOREIGN KEY (recommendation_id) REFERENCES evolution_recommendations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memory_sync_checkpoint (
      sync_key TEXT PRIMARY KEY,
      cursor_mtime_ms INTEGER DEFAULT 0,
      last_scan_at DATETIME,
      last_success_at DATETIME,
      last_error TEXT,
      updated_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS memory_documents (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL UNIQUE,
      file_name TEXT NOT NULL,
      name TEXT,
      description TEXT,
      doc_type TEXT,
      frontmatter_json TEXT,
      content TEXT NOT NULL,
      content_sha256 TEXT NOT NULL,
      content_redacted INTEGER DEFAULT 0,
      mtime_ms INTEGER NOT NULL,
      size_bytes INTEGER,
      status TEXT DEFAULT 'active' CHECK (status IN ('active','deleted','invalid')),
      first_seen_at DATETIME DEFAULT (datetime('now')),
      last_seen_at DATETIME DEFAULT (datetime('now')),
      last_synced_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_memory_docs_type_status
      ON memory_documents(doc_type, status);

    CREATE TABLE IF NOT EXISTS memory_sync_runs (
      id TEXT PRIMARY KEY,
      trigger_source TEXT,
      files_scanned INTEGER DEFAULT 0,
      files_changed INTEGER DEFAULT 0,
      files_inserted INTEGER DEFAULT 0,
      files_updated INTEGER DEFAULT 0,
      files_skipped INTEGER DEFAULT 0,
      files_invalid INTEGER DEFAULT 0,
      started_at DATETIME DEFAULT (datetime('now')),
      ended_at DATETIME,
      duration_ms INTEGER,
      success INTEGER DEFAULT 0,
      error_message TEXT
    );
  `);
}

// === Phase 5: Claude Remote Bridge Tables ===

function initClaudeRemoteTables() {
  const d = getDb();
  d.exec(`
    CREATE TABLE IF NOT EXISTS claude_sessions (
      id TEXT PRIMARY KEY,
      name TEXT,
      pid INTEGER,
      status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','busy','dead','stale')),
      capabilities TEXT,
      cwd TEXT,
      started_at DATETIME DEFAULT (datetime('now')),
      last_heartbeat_at DATETIME DEFAULT (datetime('now')),
      ended_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS claude_tasks (
      id TEXT PRIMARY KEY,
      command_id TEXT,
      session_id TEXT,
      prompt TEXT NOT NULL,
      agent_type TEXT DEFAULT 'general',
      allowed_tools TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','cancelled','failed_stale')),
      pid INTEGER,
      exit_code INTEGER,
      stderr_tail TEXT,
      status_reason TEXT,
      result TEXT,
      output_size_bytes INTEGER DEFAULT 0,
      started_at DATETIME,
      completed_at DATETIME,
      heartbeat_at DATETIME,
      timeout_seconds INTEGER DEFAULT 600,
      created_at DATETIME DEFAULT (datetime('now')),
      FOREIGN KEY (command_id) REFERENCES control_commands(id),
      FOREIGN KEY (session_id) REFERENCES claude_sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_claude_tasks_status
      ON claude_tasks(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_claude_sessions_status
      ON claude_sessions(status);
  `);
}

// === Phase 6: Skill Factory + Autonomy Tables ===

function initPhase6Tables() {
  const d = getDb();
  d.exec(`
    CREATE TABLE IF NOT EXISTS generated_skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      pattern_hash TEXT,
      trigger_phrase TEXT,
      skill_content TEXT NOT NULL,
      tool_chain TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','staged','evaluating','active','retired','failed')),
      eval_pass_rate REAL,
      eval_runs INTEGER DEFAULT 0,
      deployed_at DATETIME,
      retired_at DATETIME,
      created_by TEXT DEFAULT 'skill-factory',
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skill_eval_runs (
      id TEXT PRIMARY KEY,
      skill_id TEXT NOT NULL,
      eval_type TEXT DEFAULT 'basic',
      test_count INTEGER DEFAULT 0,
      pass_count INTEGER DEFAULT 0,
      pass_rate REAL,
      duration_ms INTEGER,
      issues TEXT,
      started_at DATETIME DEFAULT (datetime('now')),
      ended_at DATETIME,
      FOREIGN KEY (skill_id) REFERENCES generated_skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS decomposition_plans (
      id TEXT PRIMARY KEY,
      parent_task_id TEXT,
      description TEXT NOT NULL,
      subtasks TEXT NOT NULL,
      dag_edges TEXT,
      status TEXT DEFAULT 'planned' CHECK (status IN ('planned','running','completed','failed','cancelled')),
      total_subtasks INTEGER DEFAULT 0,
      completed_subtasks INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT (datetime('now')),
      completed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS decomposition_runs (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      subtask_index INTEGER,
      subtask_description TEXT,
      claude_task_id TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','skipped')),
      result TEXT,
      duration_ms INTEGER,
      started_at DATETIME,
      ended_at DATETIME,
      FOREIGN KEY (plan_id) REFERENCES decomposition_plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS autonomy_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,
      module TEXT NOT NULL,
      description TEXT,
      risk_level TEXT DEFAULT 'low',
      approved INTEGER DEFAULT 0,
      blocked INTEGER DEFAULT 0,
      block_reason TEXT,
      actor TEXT,
      detail TEXT,
      created_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_generated_skills_status ON generated_skills(status);
    CREATE INDEX IF NOT EXISTS idx_decomposition_plans_status ON decomposition_plans(status);
    CREATE INDEX IF NOT EXISTS idx_autonomy_audit_action ON autonomy_audit(action_type, created_at DESC);
  `);
}

// === Phase 7: Obsidian Bridge Tables ===

function initObsidianTables() {
  const d = getDb();
  d.exec(`
    CREATE TABLE IF NOT EXISTS obsidian_notes (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL UNIQUE,
      title TEXT,
      content_hash TEXT,
      mtime_ms INTEGER,
      size_bytes INTEGER,
      links_json TEXT DEFAULT '[]',
      tags_json TEXT DEFAULT '[]',
      frontmatter_json TEXT,
      folder TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active','deleted','orphaned')),
      first_seen_at DATETIME DEFAULT (datetime('now')),
      last_synced_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS obsidian_sync_runs (
      id TEXT PRIMARY KEY,
      direction TEXT DEFAULT 'pull' CHECK (direction IN ('pull','push','both')),
      trigger_source TEXT,
      notes_scanned INTEGER DEFAULT 0,
      notes_new INTEGER DEFAULT 0,
      notes_updated INTEGER DEFAULT 0,
      notes_deleted INTEGER DEFAULT 0,
      notes_pushed INTEGER DEFAULT 0,
      duration_ms INTEGER,
      success INTEGER DEFAULT 0,
      error_message TEXT,
      started_at DATETIME DEFAULT (datetime('now')),
      ended_at DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_obsidian_notes_folder ON obsidian_notes(folder, status);
    CREATE INDEX IF NOT EXISTS idx_obsidian_notes_tags ON obsidian_notes(tags_json);
  `);
}

// Auto-init all tables on first load
try { initFTables(); } catch(e) { /* will init when getDb() is first called */ }
try { initPhase3Tables(); } catch(e) { /* will init when getDb() is first called */ }
try { initEvolutionMemoryTables(); } catch(e) { /* will init when getDb() is first called */ }
try { initClaudeRemoteTables(); } catch(e) { /* will init when getDb() is first called */ }
try { initPhase6Tables(); } catch(e) { /* will init when getDb() is first called */ }
try { initObsidianTables(); } catch(e) { /* will init when getDb() is first called */ }

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
  getSwarmStats,
  // Phase 3 exports
  initPhase3Tables,
  initEvolutionMemoryTables,
  initClaudeRemoteTables,
  initPhase6Tables
};
