/**
 * NEXUS Knowledge Index
 *
 * Search and query accumulated knowledge across
 * patterns, best practices, and session summaries.
 *
 * @module nexus/knowledge/knowledge-index
 */

'use strict';

const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = path.resolve(__dirname);
const PATTERN_PATH = path.join(KNOWLEDGE_DIR, 'pattern-library.json');
const BEST_PRACTICES_PATH = path.join(KNOWLEDGE_DIR, 'best-practices.json');
const SUMMARIES_DIR = path.join(KNOWLEDGE_DIR, 'session-summaries');

class KnowledgeIndex {
  constructor() {}

  /**
   * Search patterns matching a query
   */
  searchPatterns(query) {
    const patterns = this._loadJSON(PATTERN_PATH, { patterns: [] });
    const lower = query.toLowerCase();
    return patterns.patterns.filter(p =>
      (p.taskType || '').toLowerCase().includes(lower) ||
      (p.provider || '').toLowerCase().includes(lower) ||
      (p.key || '').toLowerCase().includes(lower)
    );
  }

  /**
   * Get best practices for a task type
   */
  getBestPractices(taskType) {
    const bp = this._loadJSON(BEST_PRACTICES_PATH, { practices: [] });
    if (!taskType) return bp.practices;
    return bp.practices.filter(p =>
      (p.taskType || '').toLowerCase() === taskType.toLowerCase()
    );
  }

  /**
   * Add a best practice
   */
  addBestPractice(practice) {
    const bp = this._loadJSON(BEST_PRACTICES_PATH, { practices: [] });
    bp.practices.push({
      ...practice,
      addedAt: Date.now()
    });
    fs.writeFileSync(BEST_PRACTICES_PATH, JSON.stringify(bp, null, 2));
  }

  /**
   * Get session summaries
   */
  getSessionSummaries(limit = 10) {
    if (!fs.existsSync(SUMMARIES_DIR)) return [];
    return fs.readdirSync(SUMMARIES_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit)
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(SUMMARIES_DIR, f), 'utf8'));
        } catch (e) {
          return { file: f, error: 'parse_failed' };
        }
      });
  }

  /**
   * Get overall knowledge statistics
   */
  getStats() {
    const patterns = this._loadJSON(PATTERN_PATH, { patterns: [], antiPatterns: [] });
    const bp = this._loadJSON(BEST_PRACTICES_PATH, { practices: [] });
    const summaryCount = fs.existsSync(SUMMARIES_DIR)
      ? fs.readdirSync(SUMMARIES_DIR).filter(f => f.endsWith('.json')).length
      : 0;

    return {
      patterns: patterns.patterns.length,
      antiPatterns: patterns.antiPatterns?.length || 0,
      bestPractices: bp.practices.length,
      sessionSummaries: summaryCount
    };
  }

  _loadJSON(filepath, defaultVal) {
    try {
      if (fs.existsSync(filepath)) {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
      }
    } catch (e) {}
    return defaultVal;
  }
}

module.exports = { KnowledgeIndex };
