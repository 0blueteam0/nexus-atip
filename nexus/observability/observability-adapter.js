/**
 * NEXUS Observability Adapter - ObservabilityPort Implementation
 *
 * Unified interface for cost tracking, quality scoring,
 * and dashboard data generation.
 *
 * @module nexus/observability/observability-adapter
 */

'use strict';

const { CostTracker } = require('./cost-tracker');
const { QualityScorer } = require('./quality-scorer');

class ObservabilityAdapter {
  constructor() {
    this.costTracker = new CostTracker();
    this.qualityScorer = new QualityScorer();
  }

  /**
   * Track cost entry
   * @param {Object} entry - { provider, inputTokens, outputTokens, taskType }
   */
  async trackCost(entry) {
    await this.costTracker.trackCost(entry);
  }

  /**
   * Track quality entry
   * @param {Object} entry - { provider, taskType, success, latencyMs, quality }
   */
  async trackQuality(entry) {
    await this.qualityScorer.trackQuality(entry);
  }

  /**
   * Get combined dashboard data
   * @param {Object} timeRange - { from, to }
   * @returns {Promise<{costs, quality, providers}>}
   */
  async getDashboard(timeRange = {}) {
    const costs = this.costTracker.getCostSummary(timeRange);
    const quality = this.qualityScorer.getProviderQuality();
    const today = this.costTracker.getTodayCost();

    return {
      costs: {
        total: costs.total,
        totalTokens: costs.totalTokens,
        byProvider: costs.byProvider,
        count: costs.count
      },
      today: {
        total: today.total,
        totalTokens: today.totalTokens,
        count: today.count
      },
      quality,
      timestamp: Date.now()
    };
  }

  /**
   * Get cost summary
   * @param {Object} timeRange
   * @returns {Promise<{total, byProvider}>}
   */
  async getCostSummary(timeRange = {}) {
    return this.costTracker.getCostSummary(timeRange);
  }
}

module.exports = { ObservabilityAdapter };
