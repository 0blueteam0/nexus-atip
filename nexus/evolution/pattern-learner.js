/**
 * NEXUS Pattern Learner - Workflow Pattern Extraction
 *
 * Automatically discovers routing patterns from execution history.
 * Identifies which provider works best for which task types.
 *
 * @module nexus/evolution/pattern-learner
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PATTERN_STORE = path.resolve(__dirname, '../knowledge/pattern-library.json');
const MAX_PATTERNS = 1000;
const MIN_OBSERVATIONS = 5;
const CONFIDENCE_THRESHOLD = 0.7;

class PatternLearner {
  constructor() {
    this.patterns = this._loadPatterns();
  }

  _loadPatterns() {
    try {
      if (fs.existsSync(PATTERN_STORE)) {
        return JSON.parse(fs.readFileSync(PATTERN_STORE, 'utf8'));
      }
    } catch (e) {}
    return { patterns: [], antiPatterns: [], metadata: { totalObservations: 0 } };
  }

  _savePatterns() {
    const dir = path.dirname(PATTERN_STORE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PATTERN_STORE, JSON.stringify(this.patterns, null, 2));
  }

  /**
   * Observe a routing outcome
   * @param {Object} observation - { taskType, provider, success, latency, quality }
   */
  observe(observation) {
    const { taskType, provider, success, latency, quality } = observation;
    this.patterns.metadata.totalObservations++;

    // Find or create pattern entry
    const key = `${taskType}:${provider}`;
    let pattern = this.patterns.patterns.find(p => p.key === key);

    if (!pattern) {
      pattern = {
        key,
        taskType,
        provider,
        observations: 0,
        successes: 0,
        failures: 0,
        totalLatency: 0,
        avgQuality: 0,
        confidence: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now()
      };
      this.patterns.patterns.push(pattern);
    }

    pattern.observations++;
    pattern.lastSeen = Date.now();
    if (success) pattern.successes++;
    else pattern.failures++;
    pattern.totalLatency += latency || 0;

    if (quality !== undefined) {
      pattern.avgQuality = pattern.avgQuality * 0.8 + quality * 0.2;
    }

    // Calculate confidence
    pattern.confidence = this._calcConfidence(pattern);

    // Check for anti-patterns
    if (pattern.observations >= MIN_OBSERVATIONS &&
        (pattern.successes / pattern.observations) < 0.3) {
      this._recordAntiPattern(pattern);
    }

    // Prune if too many patterns
    if (this.patterns.patterns.length > MAX_PATTERNS) {
      this._prune();
    }

    this._savePatterns();
  }

  /**
   * Get best provider for a task type
   */
  getBestProvider(taskType) {
    const candidates = this.patterns.patterns
      .filter(p => p.taskType === taskType &&
                   p.observations >= MIN_OBSERVATIONS &&
                   p.confidence >= CONFIDENCE_THRESHOLD)
      .sort((a, b) => {
        const rateA = a.successes / a.observations;
        const rateB = b.successes / b.observations;
        return rateB - rateA;
      });

    return candidates[0] || null;
  }

  /**
   * Get anti-patterns (providers to avoid for specific tasks)
   */
  getAntiPatterns(taskType) {
    return this.patterns.antiPatterns
      .filter(p => p.taskType === taskType);
  }

  /**
   * Calculate confidence score
   */
  _calcConfidence(pattern) {
    // More observations = higher confidence (logarithmic)
    const observationFactor = Math.min(1, Math.log10(pattern.observations + 1) / 2);
    // Consistent results = higher confidence
    const rate = pattern.successes / pattern.observations;
    const consistency = 1 - 2 * Math.abs(rate - 0.5); // 0 at 50%, 1 at 0% or 100%
    return (observationFactor * 0.6 + consistency * 0.4);
  }

  _recordAntiPattern(pattern) {
    const exists = this.patterns.antiPatterns
      .find(p => p.taskType === pattern.taskType && p.provider === pattern.provider);
    if (exists) return;

    this.patterns.antiPatterns.push({
      taskType: pattern.taskType,
      provider: pattern.provider,
      failureRate: pattern.failures / pattern.observations,
      observations: pattern.observations,
      discoveredAt: Date.now()
    });
  }

  _prune() {
    // Remove lowest-confidence patterns
    this.patterns.patterns.sort((a, b) => b.confidence - a.confidence);
    this.patterns.patterns = this.patterns.patterns.slice(0, MAX_PATTERNS);
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    return {
      totalPatterns: this.patterns.patterns.length,
      antiPatterns: this.patterns.antiPatterns.length,
      totalObservations: this.patterns.metadata.totalObservations,
      topPatterns: this.patterns.patterns
        .filter(p => p.confidence >= CONFIDENCE_THRESHOLD)
        .slice(0, 10)
        .map(p => ({
          task: p.taskType,
          provider: p.provider,
          successRate: (p.successes / p.observations * 100).toFixed(1) + '%',
          confidence: p.confidence.toFixed(2)
        }))
    };
  }
}

module.exports = { PatternLearner };
