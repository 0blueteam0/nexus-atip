/**
 * NEXUS Quality Scorer - Result Quality Assessment
 *
 * Auto-evaluates task results on multiple dimensions:
 * completeness, correctness, performance.
 *
 * @module nexus/observability/quality-scorer
 */

'use strict';

const path = require('path');
const fs = require('fs');

const QUALITY_LOG_PATH = path.resolve(__dirname, '../knowledge/quality-log.json');

class QualityScorer {
  constructor() {
    this._entries = [];
    this._loadHistory();
  }

  /**
   * Record a quality assessment
   * @param {Object} entry - { provider, taskType, success, latencyMs, quality }
   *   quality: { completeness: 0-1, correctness: 0-1, relevance: 0-1 }
   */
  async trackQuality(entry) {
    const q = entry.quality || {};
    const record = {
      provider: entry.provider,
      taskType: entry.taskType || 'unknown',
      success: entry.success !== false,
      latencyMs: entry.latencyMs || 0,
      completeness: q.completeness ?? (entry.success ? 0.8 : 0.2),
      correctness: q.correctness ?? (entry.success ? 0.8 : 0.2),
      relevance: q.relevance ?? 0.7,
      overallScore: 0,
      timestamp: entry.timestamp || Date.now()
    };

    // Weighted overall score
    record.overallScore = (
      record.completeness * 0.35 +
      record.correctness * 0.45 +
      record.relevance * 0.20
    );

    this._entries.push(record);
    this._persist();
    return record;
  }

  /**
   * Get quality summary by provider
   * @returns {Object} { provider: { avgScore, count, successRate } }
   */
  getProviderQuality() {
    const byProvider = {};

    for (const e of this._entries) {
      if (!byProvider[e.provider]) {
        byProvider[e.provider] = { totalScore: 0, count: 0, successes: 0 };
      }
      byProvider[e.provider].totalScore += e.overallScore;
      byProvider[e.provider].count++;
      if (e.success) byProvider[e.provider].successes++;
    }

    const result = {};
    for (const [provider, data] of Object.entries(byProvider)) {
      result[provider] = {
        avgScore: data.count > 0 ? (data.totalScore / data.count).toFixed(3) : 0,
        count: data.count,
        successRate: data.count > 0 ? ((data.successes / data.count) * 100).toFixed(1) + '%' : 'N/A'
      };
    }
    return result;
  }

  _loadHistory() {
    try {
      if (fs.existsSync(QUALITY_LOG_PATH)) {
        this._entries = JSON.parse(fs.readFileSync(QUALITY_LOG_PATH, 'utf8'));
      }
    } catch {
      this._entries = [];
    }
  }

  _persist() {
    try {
      const dir = path.dirname(QUALITY_LOG_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const toSave = this._entries.slice(-10000);
      fs.writeFileSync(QUALITY_LOG_PATH, JSON.stringify(toSave, null, 2));
    } catch {
      // Non-fatal
    }
  }
}

module.exports = { QualityScorer };
