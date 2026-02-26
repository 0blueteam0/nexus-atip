/**
 * NEXUS Feature Tracker
 *
 * JSON-based feature tracking (feature_list.json).
 * Machine-readable pass/fail status for each feature.
 * JSON chosen over markdown to reduce accidental overwrite risk.
 *
 * @module nexus/harness/feature-tracker
 */

'use strict';

const fs = require('fs');
const path = require('path');

const FEATURES_PATH = path.join(__dirname, 'feature_list.json');

class FeatureTracker {
  constructor(options = {}) {
    this.featuresPath = options.featuresPath || FEATURES_PATH;
    this.state = this._load();
  }

  /**
   * Register a feature
   * @param {Object} feature - { id, name, description, category, tests }
   * @returns {Object} Registered feature
   */
  register(feature) {
    const id = feature.id || `feat-${Date.now()}`;
    const existing = this.state.features.find(f => f.id === id);
    if (existing) return existing;

    const entry = {
      id,
      name: feature.name || id,
      description: feature.description || '',
      category: feature.category || 'general',
      status: 'pending', // pending | pass | fail | partial
      tests: (feature.tests || []).map(t => ({
        name: t.name || t,
        status: 'pending', // pending | pass | fail
        lastRun: null,
        error: null
      })),
      registeredAt: new Date().toISOString(),
      lastTestedAt: null
    };

    this.state.features.push(entry);
    this._save();
    return entry;
  }

  /**
   * Update feature test status
   * @param {string} featureId
   * @param {string} testName
   * @param {string} status - 'pass' | 'fail'
   * @param {string} [error] - Error message if failed
   */
  updateTest(featureId, testName, status, error) {
    const feature = this.state.features.find(f => f.id === featureId);
    if (!feature) return null;

    const test = feature.tests.find(t => t.name === testName);
    if (test) {
      test.status = status;
      test.lastRun = new Date().toISOString();
      test.error = status === 'fail' ? (error || 'Unknown error') : null;
    }

    // Update feature status based on tests
    feature.lastTestedAt = new Date().toISOString();
    this._updateFeatureStatus(feature);
    this._save();

    return feature;
  }

  /**
   * Set overall feature status
   * @param {string} featureId
   * @param {string} status - 'pass' | 'fail' | 'partial'
   */
  setStatus(featureId, status) {
    const feature = this.state.features.find(f => f.id === featureId);
    if (!feature) return null;

    feature.status = status;
    feature.lastTestedAt = new Date().toISOString();
    this._save();
    return feature;
  }

  /**
   * Get features by status
   * @param {string} [status] - Filter by status, or all if omitted
   * @returns {Array}
   */
  getFeatures(status) {
    if (!status) return this.state.features;
    return this.state.features.filter(f => f.status === status);
  }

  /**
   * Get summary stats
   */
  getStats() {
    const features = this.state.features;
    return {
      total: features.length,
      pass: features.filter(f => f.status === 'pass').length,
      fail: features.filter(f => f.status === 'fail').length,
      partial: features.filter(f => f.status === 'partial').length,
      pending: features.filter(f => f.status === 'pending').length,
      categories: [...new Set(features.map(f => f.category))]
    };
  }

  /**
   * Update feature status based on its tests
   */
  _updateFeatureStatus(feature) {
    if (feature.tests.length === 0) return;

    const statuses = feature.tests.map(t => t.status);
    if (statuses.every(s => s === 'pass')) {
      feature.status = 'pass';
    } else if (statuses.every(s => s === 'fail')) {
      feature.status = 'fail';
    } else if (statuses.some(s => s === 'pass')) {
      feature.status = 'partial';
    }
  }

  _load() {
    try {
      if (fs.existsSync(this.featuresPath)) {
        return JSON.parse(fs.readFileSync(this.featuresPath, 'utf-8'));
      }
    } catch (e) { /* skip */ }
    return { version: '1.0.0', features: [] };
  }

  _save() {
    const dir = path.dirname(this.featuresPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.featuresPath, JSON.stringify(this.state, null, 2), 'utf-8');
  }
}

module.exports = { FeatureTracker };
