/**
 * NEXUS Weight Adjuster - Bayesian Weight Optimization
 *
 * Adjusts provider routing weights based on observed outcomes.
 * Formula: adjusted = base * (1 + lr * (observed - expected))
 * Clamped to [min_weight, max_weight] range.
 *
 * @module nexus/evolution/weight-adjuster
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { getEventBus } = require('../core/event-bus');

const DEFAULTS = {
  learning_rate: 0.05,
  decay_factor: 0.95,
  min_weight: 0.05,
  max_weight: 0.95
};

class WeightAdjuster {
  constructor(config = {}) {
    this.lr = config.learning_rate || DEFAULTS.learning_rate;
    this.decay = config.decay_factor || DEFAULTS.decay_factor;
    this.minW = config.min_weight || DEFAULTS.min_weight;
    this.maxW = config.max_weight || DEFAULTS.max_weight;
    this.bus = getEventBus();
  }

  /**
   * Adjust weight for a task-provider pair
   * @param {number} currentWeight - Current weight [0,1]
   * @param {number} observed - Observed success rate [0,1]
   * @param {number} expected - Expected success rate (= current weight)
   * @returns {number} Adjusted weight
   */
  adjust(currentWeight, observed, expected = null) {
    if (expected === null) expected = currentWeight;
    const adjusted = currentWeight * (1 + this.lr * (observed - expected));
    return this.clamp(adjusted);
  }

  /**
   * Batch adjust weights for a task type
   * @param {Object} weights - { providerId: weight }
   * @param {Object} outcomes - { providerId: { successes, total } }
   * @returns {Object} Adjusted weights (normalized)
   */
  batchAdjust(weights, outcomes) {
    const adjusted = {};

    for (const [pid, currentWeight] of Object.entries(weights)) {
      const outcome = outcomes[pid];
      if (outcome && outcome.total > 0) {
        const observed = outcome.successes / outcome.total;
        adjusted[pid] = this.adjust(currentWeight, observed);
      } else {
        // Apply decay to unused providers
        adjusted[pid] = this.clamp(currentWeight * this.decay);
      }
    }

    return this.normalize(adjusted);
  }

  /**
   * Clamp weight to allowed range
   */
  clamp(weight) {
    return Math.max(this.minW, Math.min(this.maxW, weight));
  }

  /**
   * Normalize weights to sum to 1
   */
  normalize(weights) {
    const total = Object.values(weights).reduce((s, w) => s + w, 0);
    if (total === 0) return weights;
    const normalized = {};
    for (const [k, v] of Object.entries(weights)) {
      normalized[k] = v / total;
    }
    return normalized;
  }

  /**
   * Apply time decay to all weights
   */
  applyDecay(weights) {
    const decayed = {};
    for (const [taskType, providers] of Object.entries(weights)) {
      decayed[taskType] = {};
      for (const [pid, w] of Object.entries(providers)) {
        decayed[taskType][pid] = this.clamp(w * this.decay + (1 - this.decay) * 0.5);
      }
    }
    return decayed;
  }
}

module.exports = { WeightAdjuster, DEFAULTS };
