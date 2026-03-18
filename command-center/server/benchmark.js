/**
 * Benchmark & Operational Metrics Module (F Architecture)
 *
 * Captures system health snapshots, compares across savepoints,
 * and provides quantitative evidence of architecture improvements.
 *
 * Inspired by: Anthropic Eval pattern, ETH Zurich CLAUDE.md research,
 * and AI Sparkup "benchmark mode" article.
 *
 * Metrics categories:
 *   1. Performance: test pass rate, test duration, endpoint latency
 *   2. Architecture: endpoint count, module count, DB table count
 *   3. Learning: routing weight coverage, intent coverage, trust scores
 *   4. Safety: antifragile failures, blocked commands, near misses
 *   5. Context: agent prompt sizes, token estimates, tool call counts
 */
'use strict';

const db = require('./db');
const path = require('path');
const fs = require('fs');

class BenchmarkEngine {
  constructor({ broadcaster }) {
    this.broadcaster = broadcaster;
    this.snapshotsDir = path.join(__dirname, '..', 'data', 'benchmarks');
    // Ensure directory exists
    try { fs.mkdirSync(this.snapshotsDir, { recursive: true }); } catch {}
  }

  /**
   * Capture a full system snapshot (savepoint metrics)
   * Call this before and after major changes to measure improvement.
   */
  captureSnapshot(label) {
    const d = db.getDb();
    const snapshot = {
      label: label || `snapshot-${Date.now()}`,
      timestamp: new Date().toISOString(),
      git: this._getGitInfo(),
      performance: this._getPerformanceMetrics(d),
      architecture: this._getArchitectureMetrics(d),
      learning: this._getLearningMetrics(d),
      safety: this._getSafetyMetrics(d),
      context: this._getContextMetrics(d)
    };

    // Save to file
    const filename = `${snapshot.label.replace(/[^a-zA-Z0-9-_]/g, '_')}.json`;
    const filepath = path.join(this.snapshotsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));

    // Save to DB
    try {
      d.prepare(`
        INSERT INTO events (event_type, source, data)
        VALUES ('benchmark:snapshot', 'benchmark-engine', ?)
      `).run(JSON.stringify(snapshot));
    } catch {}

    return snapshot;
  }

  /**
   * Compare two snapshots and produce a diff report
   */
  compare(labelA, labelB) {
    const a = this._loadSnapshot(labelA);
    const b = this._loadSnapshot(labelB);
    if (!a || !b) return { ok: false, error: `Snapshot not found: ${!a ? labelA : labelB}` };

    const diff = {
      from: { label: a.label, timestamp: a.timestamp, git: a.git },
      to: { label: b.label, timestamp: b.timestamp, git: b.git },
      deltas: {}
    };

    // Compare each metric category
    for (const category of ['performance', 'architecture', 'learning', 'safety', 'context']) {
      diff.deltas[category] = {};
      const aMetrics = a[category] || {};
      const bMetrics = b[category] || {};
      const allKeys = new Set([...Object.keys(aMetrics), ...Object.keys(bMetrics)]);

      for (const key of allKeys) {
        const va = aMetrics[key];
        const vb = bMetrics[key];
        if (typeof va === 'number' && typeof vb === 'number') {
          const delta = vb - va;
          const pct = va !== 0 ? Math.round((delta / va) * 10000) / 100 : null;
          diff.deltas[category][key] = {
            before: va, after: vb, delta,
            pctChange: pct,
            improved: this._isImprovement(category, key, delta)
          };
        } else {
          diff.deltas[category][key] = { before: va, after: vb };
        }
      }
    }

    // Overall score
    let improvements = 0, regressions = 0, unchanged = 0;
    for (const cat of Object.values(diff.deltas)) {
      for (const metric of Object.values(cat)) {
        if (metric.improved === true) improvements++;
        else if (metric.improved === false) regressions++;
        else unchanged++;
      }
    }
    diff.summary = { improvements, regressions, unchanged, score: improvements - regressions };

    return { ok: true, diff };
  }

  /**
   * Get current live metrics (no snapshot, just current state)
   */
  getLiveMetrics() {
    const d = db.getDb();
    return {
      timestamp: new Date().toISOString(),
      performance: this._getPerformanceMetrics(d),
      architecture: this._getArchitectureMetrics(d),
      learning: this._getLearningMetrics(d),
      safety: this._getSafetyMetrics(d),
      context: this._getContextMetrics(d)
    };
  }

  /**
   * List available snapshots
   */
  listSnapshots() {
    try {
      const files = fs.readdirSync(this.snapshotsDir)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const data = JSON.parse(fs.readFileSync(path.join(this.snapshotsDir, f), 'utf-8'));
          return { label: data.label, timestamp: data.timestamp, git: data.git, file: f };
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return files;
    } catch { return []; }
  }

  // === Metric collectors ===

  _getPerformanceMetrics(d) {
    const metrics = {};

    // Test results (from last integration test run, if recorded)
    try {
      const testEvent = d.prepare(`
        SELECT data FROM events WHERE event_type = 'benchmark:test_results'
        ORDER BY timestamp DESC LIMIT 1
      `).get();
      if (testEvent) {
        const t = JSON.parse(testEvent.data);
        metrics.testPassCount = t.pass || 0;
        metrics.testFailCount = t.fail || 0;
        metrics.testDurationMs = t.durationMs || 0;
      }
    } catch {}

    // Server uptime
    metrics.uptimeSeconds = Math.round(process.uptime());

    // Memory usage
    const mem = process.memoryUsage();
    metrics.memoryRssMb = Math.round(mem.rss / 1024 / 1024 * 10) / 10;
    metrics.memoryHeapMb = Math.round(mem.heapUsed / 1024 / 1024 * 10) / 10;

    // Average endpoint latency (from tool_usage if available)
    try {
      const avg = d.prepare(`
        SELECT AVG(duration_ms) as avg_ms, COUNT(*) as total
        FROM tool_usage WHERE timestamp > datetime('now', '-1 hour')
      `).get();
      metrics.avgToolLatencyMs = avg?.avg_ms ? Math.round(avg.avg_ms) : 0;
      metrics.toolCallsLastHour = avg?.total || 0;
    } catch {}

    return metrics;
  }

  _getArchitectureMetrics(d) {
    const metrics = {};

    // Endpoint count (from root endpoint)
    try {
      const tables = d.prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table'").get();
      metrics.dbTableCount = tables?.c || 0;
    } catch {}

    // Count registered schedules
    try {
      const schedules = d.prepare("SELECT COUNT(*) as c FROM scheduler_schedules").get();
      metrics.schedulerScheduleCount = schedules?.c || 0;
    } catch {}

    // Count control commands
    try {
      const cmds = d.prepare("SELECT COUNT(*) as c FROM control_commands").get();
      metrics.controlCommandsTotal = cmds?.c || 0;
    } catch {}

    // Count evolution recommendations
    try {
      const evo = d.prepare("SELECT COUNT(*) as c FROM evolution_recommendations").get();
      metrics.evolutionRecommendationsTotal = evo?.c || 0;
    } catch {}

    // Count decomposition plans
    try {
      const plans = d.prepare("SELECT COUNT(*) as c FROM decomposition_plans").get();
      metrics.decompositionPlansTotal = plans?.c || 0;
    } catch {}

    return metrics;
  }

  _getLearningMetrics(d) {
    const metrics = {};

    try {
      const weights = d.prepare(`
        SELECT COUNT(*) as total, COUNT(DISTINCT intent) as intents,
               COUNT(DISTINCT tool_name) as tools, AVG(weight) as avg_w,
               MAX(weight) as max_w, MIN(weight) as min_w
        FROM routing_weights
      `).get();
      metrics.routingWeightCount = weights?.total || 0;
      metrics.uniqueIntents = weights?.intents || 0;
      metrics.uniqueTools = weights?.tools || 0;
      metrics.avgWeight = weights?.avg_w ? Math.round(weights.avg_w * 1000) / 1000 : 0;
      metrics.maxWeight = weights?.max_w ? Math.round(weights.max_w * 1000) / 1000 : 0;
      metrics.minWeight = weights?.min_w ? Math.round(weights.min_w * 1000) / 1000 : 0;
    } catch {}

    // Evolution log
    try {
      const evoLog = d.prepare("SELECT COUNT(*) as c FROM evolution_log").get();
      metrics.evolutionLogEntries = evoLog?.c || 0;
    } catch {}

    // Pattern detection
    try {
      const patterns = d.prepare("SELECT COUNT(*) as c FROM skill_candidates").get();
      metrics.detectedPatterns = patterns?.c || 0;
    } catch {}

    return metrics;
  }

  _getSafetyMetrics(d) {
    const metrics = {};

    // Antifragile failures
    try {
      const failures = d.prepare(`
        SELECT COUNT(*) as c FROM events WHERE event_type = 'antifragile:failure'
      `).get();
      metrics.antifragileFailures = failures?.c || 0;
    } catch {}

    // Near misses
    try {
      const nearMiss = d.prepare(`
        SELECT COUNT(*) as c FROM events
        WHERE event_type = 'antifragile:failure' AND data LIKE '%"nearMiss":true%'
      `).get();
      metrics.nearMisses = nearMiss?.c || 0;
    } catch {}

    // Blocked destructive commands
    try {
      const blocked = d.prepare(`
        SELECT COUNT(*) as c FROM events WHERE event_type = 'hook:blocked_destructive'
      `).get();
      metrics.blockedDestructive = blocked?.c || 0;
    } catch {}

    // No-op decisions
    try {
      const noOps = d.prepare(`
        SELECT COUNT(*) as c FROM events WHERE event_type = 'antifragile:no_op'
      `).get();
      metrics.noOpDecisions = noOps?.c || 0;
    } catch {}

    // Autonomy guard blocks
    try {
      const auditBlocks = d.prepare(`
        SELECT COUNT(*) as c FROM autonomy_audit WHERE decision = 'blocked'
      `).get();
      metrics.autonomyBlocked = auditBlocks?.c || 0;
    } catch {}

    return metrics;
  }

  _getContextMetrics(d) {
    const metrics = {};

    // Tool usage stats
    try {
      const usage = d.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes
        FROM tool_usage
      `).get();
      metrics.totalToolCalls = usage?.total || 0;
      metrics.toolSuccessRate = usage?.total > 0
        ? Math.round((usage.successes / usage.total) * 10000) / 100
        : 0;
    } catch {}

    // Event count
    try {
      const events = d.prepare("SELECT COUNT(*) as c FROM events").get();
      metrics.totalEvents = events?.c || 0;
    } catch {}

    // Session count
    try {
      const sessions = d.prepare("SELECT COUNT(*) as c FROM sessions").get();
      metrics.totalSessions = sessions?.c || 0;
    } catch {}

    // Claude tasks
    try {
      const tasks = d.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
               SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM claude_tasks
      `).get();
      metrics.claudeTasksTotal = tasks?.total || 0;
      metrics.claudeTasksCompleted = tasks?.completed || 0;
      metrics.claudeTasksFailed = tasks?.failed || 0;
    } catch {}

    return metrics;
  }

  // === Helpers ===

  _getGitInfo() {
    try {
      const { execSync } = require('child_process');
      const opts = { cwd: path.join(__dirname, '..', '..'), encoding: 'utf-8', timeout: 5000 };
      const hash = execSync('git rev-parse --short HEAD', opts).trim();
      const msg = execSync('git log -1 --format=%s', opts).trim();
      const branch = execSync('git branch --show-current', opts).trim();
      return { hash, message: msg, branch };
    } catch {
      return { hash: 'unknown', message: '', branch: '' };
    }
  }

  _loadSnapshot(label) {
    try {
      const filename = `${label.replace(/[^a-zA-Z0-9-_]/g, '_')}.json`;
      const filepath = path.join(this.snapshotsDir, filename);
      if (fs.existsSync(filepath)) {
        return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      }
      // Try exact match in directory
      const files = fs.readdirSync(this.snapshotsDir).filter(f => f.includes(label));
      if (files.length > 0) {
        return JSON.parse(fs.readFileSync(path.join(this.snapshotsDir, files[0]), 'utf-8'));
      }
    } catch {}
    return null;
  }

  /**
   * Determine if a delta is an improvement (metric-specific logic)
   */
  _isImprovement(category, key, delta) {
    // Higher is better
    const higherBetter = [
      'testPassCount', 'uptimeSeconds', 'toolCallsLastHour',
      'routingWeightCount', 'uniqueIntents', 'uniqueTools', 'avgWeight',
      'evolutionLogEntries', 'detectedPatterns',
      'totalToolCalls', 'toolSuccessRate', 'totalSessions',
      'claudeTasksCompleted', 'dbTableCount', 'schedulerScheduleCount'
    ];
    // Lower is better
    const lowerBetter = [
      'testFailCount', 'testDurationMs', 'memoryRssMb', 'memoryHeapMb',
      'avgToolLatencyMs', 'antifragileFailures', 'nearMisses',
      'blockedDestructive', 'autonomyBlocked', 'claudeTasksFailed'
    ];

    if (delta === 0) return null; // unchanged
    if (higherBetter.includes(key)) return delta > 0;
    if (lowerBetter.includes(key)) return delta < 0;
    return null; // neutral
  }

  /**
   * Record test results for benchmark tracking
   */
  recordTestResults({ pass, fail, durationMs, suites }) {
    const d = db.getDb();
    try {
      d.prepare(`
        INSERT INTO events (event_type, source, data)
        VALUES ('benchmark:test_results', 'benchmark-engine', ?)
      `).run(JSON.stringify({ pass, fail, durationMs, suites, timestamp: Date.now() }));
    } catch {}
    return { ok: true };
  }
}

module.exports = { BenchmarkEngine };
