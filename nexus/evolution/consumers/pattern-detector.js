/**
 * NEXUS Pattern Detector
 *
 * Analyzes event history and task results to detect recurring patterns.
 * Consumes evolution:* events from the EventBus and identifies:
 *   - Repeated task routing patterns
 *   - Provider preference drift
 *   - Error frequency spikes
 *   - Workflow usage patterns
 *
 * @module nexus/evolution/consumers/pattern-detector
 */

'use strict';

const { getEventBus } = require('../../core/event-bus');

class PatternDetector {
  constructor(options = {}) {
    this.minOccurrences = options.minOccurrences || 3;
    this.windowSize = options.windowSize || 50;
    this.patterns = [];
    this._attached = false;
  }

  /**
   * Attach to the EventBus and start listening
   */
  attach() {
    if (this._attached) return;
    const bus = getEventBus();

    bus.on('task:completed', (data) => this._onTaskCompleted(data));
    bus.on('task:failed', (data) => this._onTaskFailed(data));
    bus.on('evolution:weight', (data) => this._onWeightChange(data));

    this._attached = true;
  }

  /**
   * Detect patterns from a history of events
   * @param {Array} history - Event history entries
   * @returns {Array<Pattern>} Detected patterns
   */
  detect(history = []) {
    const patterns = [];

    // 1. Provider routing frequency
    const routingPatterns = this._detectRoutingPatterns(history);
    patterns.push(...routingPatterns);

    // 2. Error clustering
    const errorPatterns = this._detectErrorPatterns(history);
    patterns.push(...errorPatterns);

    // 3. Task type trends
    const taskPatterns = this._detectTaskTypePatterns(history);
    patterns.push(...taskPatterns);

    this.patterns = patterns;
    return patterns;
  }

  /**
   * Detect which providers handle which task types most often
   */
  _detectRoutingPatterns(history) {
    const patterns = [];
    const routingMap = {};

    const taskEvents = history.filter(e =>
      e.event === 'task:routed' || e.event === 'task:completed'
    );

    for (const entry of taskEvents) {
      const provider = entry.data?.provider;
      const taskType = entry.data?.taskType || entry.data?.task_type || 'unknown';
      if (!provider) continue;

      const key = `${provider}:${taskType}`;
      routingMap[key] = (routingMap[key] || 0) + 1;
    }

    for (const [key, count] of Object.entries(routingMap)) {
      if (count >= this.minOccurrences) {
        const [provider, taskType] = key.split(':');
        patterns.push({
          type: 'routing_preference',
          provider,
          taskType,
          occurrences: count,
          confidence: Math.min(count / 10, 1.0),
          suggestion: `${provider} is frequently chosen for ${taskType} tasks`
        });
      }
    }

    return patterns;
  }

  /**
   * Detect error frequency spikes
   */
  _detectErrorPatterns(history) {
    const patterns = [];
    const errorsByProvider = {};

    const failEvents = history.filter(e => e.event === 'task:failed');

    for (const entry of failEvents) {
      const provider = entry.data?.provider || 'unknown';
      if (!errorsByProvider[provider]) {
        errorsByProvider[provider] = { count: 0, errors: [] };
      }
      errorsByProvider[provider].count++;
      errorsByProvider[provider].errors.push(entry.data?.error || 'unknown');
    }

    for (const [provider, info] of Object.entries(errorsByProvider)) {
      if (info.count >= this.minOccurrences) {
        patterns.push({
          type: 'error_cluster',
          provider,
          occurrences: info.count,
          confidence: Math.min(info.count / 5, 1.0),
          suggestion: `${provider} has ${info.count} failures - consider weight reduction`,
          errors: [...new Set(info.errors)].slice(0, 5)
        });
      }
    }

    return patterns;
  }

  /**
   * Detect task type distribution trends
   */
  _detectTaskTypePatterns(history) {
    const patterns = [];
    const typeCounts = {};

    const taskEvents = history.filter(e =>
      e.event === 'task:received' || e.event === 'task:completed'
    );

    for (const entry of taskEvents) {
      const taskType = entry.data?.taskType || entry.data?.task_type || 'unknown';
      typeCounts[taskType] = (typeCounts[taskType] || 0) + 1;
    }

    const total = Object.values(typeCounts).reduce((a, b) => a + b, 0);
    if (total === 0) return patterns;

    for (const [taskType, count] of Object.entries(typeCounts)) {
      const ratio = count / total;
      if (ratio > 0.3 && count >= this.minOccurrences) {
        patterns.push({
          type: 'task_concentration',
          taskType,
          occurrences: count,
          ratio: Math.round(ratio * 100),
          confidence: Math.min(ratio * 2, 1.0),
          suggestion: `${taskType} represents ${Math.round(ratio * 100)}% of tasks - consider specialization`
        });
      }
    }

    return patterns;
  }

  _onTaskCompleted(data) {
    // Accumulate for real-time detection
  }

  _onTaskFailed(data) {
    // Accumulate for real-time detection
  }

  _onWeightChange(data) {
    // Track weight drift
  }

  /**
   * Get detected patterns
   * @returns {Array}
   */
  getPatterns() {
    return [...this.patterns];
  }
}

module.exports = { PatternDetector };
