/**
 * NEXUS 50/50 Tracker
 *
 * Tracks the balance between feature development and system improvement.
 * Based on Compound Engineering principle: 50% features, 50% system.
 *
 * @module nexus/compound/fifty-fifty-tracker
 */

'use strict';

const fs = require('fs');
const path = require('path');

const TRACKER_PATH = path.join(__dirname, 'fifty-fifty-state.json');

class FiftyFiftyTracker {
  constructor() {
    this.state = this._load();
  }

  /**
   * Record a task completion
   * @param {string} category - 'feature' or 'system'
   * @param {Object} task - { id, description, duration }
   */
  record(category, task = {}) {
    if (category !== 'feature' && category !== 'system') {
      throw new Error(`Invalid category: ${category}. Use 'feature' or 'system'.`);
    }

    this.state[category].count++;
    this.state[category].totalDuration += (task.duration || 0);
    this.state[category].history.push({
      timestamp: new Date().toISOString(),
      description: task.description || '',
      duration: task.duration || 0
    });

    // Keep history manageable
    if (this.state[category].history.length > 100) {
      this.state[category].history = this.state[category].history.slice(-100);
    }

    this._save();
  }

  /**
   * Get current balance
   * @returns {Object} { featurePercent, systemPercent, balanced, recommendation }
   */
  getBalance() {
    const total = this.state.feature.count + this.state.system.count;
    if (total === 0) {
      return {
        featurePercent: 50,
        systemPercent: 50,
        balanced: true,
        recommendation: 'No tasks recorded yet'
      };
    }

    const featurePct = Math.round((this.state.feature.count / total) * 100);
    const systemPct = 100 - featurePct;
    const balanced = Math.abs(featurePct - 50) <= 15; // 35-65% is acceptable

    let recommendation = 'Balanced';
    if (featurePct > 65) {
      recommendation = 'Prioritize system improvements (current: too feature-heavy)';
    } else if (featurePct < 35) {
      recommendation = 'Prioritize feature development (current: too system-heavy)';
    }

    return {
      featurePercent: featurePct,
      systemPercent: systemPct,
      balanced,
      recommendation,
      total
    };
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      feature: {
        count: this.state.feature.count,
        totalDuration: this.state.feature.totalDuration
      },
      system: {
        count: this.state.system.count,
        totalDuration: this.state.system.totalDuration
      },
      balance: this.getBalance()
    };
  }

  /**
   * Reset tracker
   */
  reset() {
    this.state = this._defaultState();
    this._save();
  }

  _defaultState() {
    return {
      feature: { count: 0, totalDuration: 0, history: [] },
      system: { count: 0, totalDuration: 0, history: [] },
      startedAt: new Date().toISOString()
    };
  }

  _load() {
    try {
      if (fs.existsSync(TRACKER_PATH)) {
        return JSON.parse(fs.readFileSync(TRACKER_PATH, 'utf-8'));
      }
    } catch (e) { /* skip */ }
    return this._defaultState();
  }

  _save() {
    fs.writeFileSync(TRACKER_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
  }
}

module.exports = { FiftyFiftyTracker };
