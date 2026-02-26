-- NEXUS Triple-Store SQLite Schema
-- 7 domain tables for persistent state management
-- Compatible with sql.js (pure JS WASM) for K-drive portability

CREATE TABLE IF NOT EXISTS solutions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT DEFAULT '[]',  -- JSON array
  task_type TEXT DEFAULT 'general',
  provider TEXT,
  times_referenced INTEGER DEFAULT 0,
  promoted INTEGER DEFAULT 0,
  content TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS context_registry (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  task_type TEXT,
  format TEXT DEFAULT 'text',
  token_estimate INTEGER DEFAULT 0,
  reduction_percent INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_state (
  session_id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  tasks_completed INTEGER DEFAULT 0,
  commits INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  handoff TEXT  -- JSON
);

CREATE TABLE IF NOT EXISTS tool_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_name TEXT NOT NULL,
  provider TEXT,
  action TEXT,
  success INTEGER DEFAULT 1,
  duration_ms INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  cost REAL DEFAULT 0.0,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feature_tracking (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'pending',
  tests TEXT DEFAULT '[]',  -- JSON array
  registered_at TEXT NOT NULL,
  last_tested_at TEXT
);

CREATE TABLE IF NOT EXISTS review_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id TEXT,
  quality_score REAL DEFAULT 0.0,
  improvements TEXT DEFAULT '[]',  -- JSON array
  patterns TEXT DEFAULT '[]',  -- JSON array
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evolution_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  source TEXT,
  data TEXT DEFAULT '{}',  -- JSON
  timestamp TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_solutions_category ON solutions(category);
CREATE INDEX IF NOT EXISTS idx_solutions_task_type ON solutions(task_type);
CREATE INDEX IF NOT EXISTS idx_tool_analytics_provider ON tool_analytics(provider);
CREATE INDEX IF NOT EXISTS idx_tool_analytics_timestamp ON tool_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_evolution_log_type ON evolution_log(event_type);
