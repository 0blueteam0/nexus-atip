/**
 * NEXUS Evolution Engine
 *
 * EvolutionPort implementation that combines:
 *   - PatternDetector: recurring pattern detection
 *   - PerformanceOptimizer: bottleneck identification
 *   - EventBus integration: real-time event consumption
 *
 * Satisfies EvolutionPort contract:
 *   detectPatterns(history) -> Promise<Array<Pattern>>
 *   proposeImprovement(pattern) -> Promise<Improvement>
 *   applyImprovement(improvement) -> Promise<Result>
 *   getState() -> Object
 *
 * @module nexus/evolution/evolution-engine
 */

'use strict';

const { getEventBus } = require('../core/event-bus');
const { PatternDetector } = require('./consumers/pattern-detector');
const { PerformanceOptimizer } = require('./consumers/performance-optimizer');

class EvolutionEngine {
  constructor(options = {}) {
    this.patternDetector = options.patternDetector || new PatternDetector();
    this.performanceOptimizer = options.performanceOptimizer || new PerformanceOptimizer();
    this.appliedImprovements = [];
    this.initialized = false;
  }

  /**
   * Initialize and attach consumers to EventBus
   */
  init() {
    this.patternDetector.attach();
    this.performanceOptimizer.attach();
    this.initialized = true;
  }

  /**
   * Detect patterns from event history
   * @param {Array} history - Event history entries (or auto-fetch from EventBus)
   * @returns {Promise<Array<Pattern>>}
   */
  async detectPatterns(history) {
    if (!history || history.length === 0) {
      const bus = getEventBus();
      history = bus.getHistory({ limit: 200 });
    }

    const structuralPatterns = this.patternDetector.detect(history);
    const perfImprovements = this.performanceOptimizer.analyze(history);

    // Merge both sources
    const allPatterns = [
      ...structuralPatterns,
      ...perfImprovements.map(imp => ({
        type: imp.type,
        provider: imp.provider,
        confidence: imp.priority === 'high' ? 0.9 : imp.priority === 'medium' ? 0.6 : 0.3,
        suggestion: imp.suggestion,
        _source: 'performance'
      }))
    ];

    return allPatterns;
  }

  /**
   * Propose an improvement based on a detected pattern
   * @param {Object} pattern - Detected pattern
   * @returns {Promise<Improvement>}
   */
  async proposeImprovement(pattern) {
    const improvement = {
      id: `imp-${Date.now()}`,
      basedOn: pattern.type,
      provider: pattern.provider || null,
      action: this._deriveAction(pattern),
      description: pattern.suggestion || 'No specific suggestion',
      confidence: pattern.confidence || 0.5,
      createdAt: new Date().toISOString(),
      status: 'proposed'
    };

    return improvement;
  }

  /**
   * Apply a proposed improvement
   * @param {Object} improvement - Improvement to apply
   * @returns {Promise<Result>}
   */
  async applyImprovement(improvement) {
    const bus = getEventBus();

    // Emit evolution event
    bus.emit('evolution:pattern', {
      improvement: improvement.id,
      action: improvement.action,
      provider: improvement.provider
    });

    improvement.status = 'applied';
    improvement.appliedAt = new Date().toISOString();
    this.appliedImprovements.push(improvement);

    return {
      success: true,
      improvementId: improvement.id,
      action: improvement.action,
      message: `Improvement applied: ${improvement.description}`
    };
  }

  /**
   * Get evolution state
   * @returns {Object}
   */
  getState() {
    return {
      initialized: this.initialized,
      patterns: this.patternDetector.getPatterns(),
      metrics: this.performanceOptimizer.getMetrics(),
      appliedImprovements: this.appliedImprovements.length,
      recentImprovements: this.appliedImprovements.slice(-5)
    };
  }

  /**
   * Derive action type from pattern
   */
  _deriveAction(pattern) {
    switch (pattern.type) {
      case 'routing_preference':
        return 'optimize_routing';
      case 'error_cluster':
      case 'high_error_rate':
        return 'reduce_weight';
      case 'task_concentration':
        return 'specialize_provider';
      case 'slow_provider':
        return 'reduce_latency_weight';
      case 'token_inefficiency':
        return 'optimize_context';
      default:
        return 'investigate';
    }
  }
}

module.exports = { EvolutionEngine };
