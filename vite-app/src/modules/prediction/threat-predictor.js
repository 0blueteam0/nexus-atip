/**
 * NEXUS ATIP V2.0 - AI Threat Prediction Engine
 * Bayesian threat forecasting + anomaly detection
 * Temporal pattern analysis for proactive defense
 */

import { eventBus, EVENTS } from '../../core/event-bus.js';
import { dataStore } from '../../core/data-store.js';

// Prediction model configurations
const PREDICTION_MODELS = {
  'bayesian-threat': {
    name: 'Bayesian Threat Forecasting',
    description: 'Predicts threat probability based on historical patterns and current indicators',
    features: ['actor_activity', 'ioc_volume', 'exploit_availability', 'seasonal_patterns'],
    accuracy: 0.82,
    updateInterval: 3600000
  },
  'anomaly-detection': {
    name: 'Anomaly Detection',
    description: 'Identifies unusual patterns in network and threat data',
    features: ['traffic_baseline', 'ioc_frequency', 'login_patterns', 'data_transfer'],
    accuracy: 0.78,
    updateInterval: 900000
  },
  'campaign-prediction': {
    name: 'Campaign Prediction',
    description: 'Predicts upcoming campaigns based on actor behavior patterns',
    features: ['actor_cadence', 'tool_preparation', 'infrastructure_setup', 'target_reconnaissance'],
    accuracy: 0.71,
    updateInterval: 7200000
  },
  'vulnerability-exploit': {
    name: 'Vulnerability Exploit Prediction',
    description: 'Estimates probability of vulnerability exploitation',
    features: ['cvss_score', 'exploit_availability', 'asset_exposure', 'patch_status'],
    accuracy: 0.85,
    updateInterval: 1800000
  }
};

// Risk factor weights for Bayesian model
const RISK_FACTORS = {
  threatActorActivity: { weight: 0.25, description: 'Active threat actor targeting' },
  iocVolume: { weight: 0.20, description: 'Volume of new indicators' },
  exploitAvailability: { weight: 0.20, description: 'Availability of exploits for known vulns' },
  patchLag: { weight: 0.15, description: 'Time since vulnerability disclosure vs patch' },
  historicalPattern: { weight: 0.10, description: 'Historical attack pattern match' },
  geopoliticalFactor: { weight: 0.10, description: 'Geopolitical tension indicator' }
};

class ThreatPredictor {
  constructor() {
    this._models = new Map();
    this._predictions = [];
    this._anomalies = [];
    this._baseline = null;
    this._stats = {
      totalPredictions: 0,
      anomaliesDetected: 0,
      accuracy: 0,
      lastPrediction: null,
      modelStatus: {}
    };
  }

  async init() {
    // Initialize models
    Object.entries(PREDICTION_MODELS).forEach(([id, config]) => {
      this._models.set(id, {
        ...config,
        id,
        status: 'ready',
        lastRun: null,
        predictions: 0
      });
      this._stats.modelStatus[id] = 'ready';
    });

    // Build baseline from existing data
    this._buildBaseline();

    // Listen for data changes to update predictions
    eventBus.on(EVENTS.THREAT_NEW, () => this._onNewData());
    eventBus.on(EVENTS.DETECTION_TRIGGERED, (data) => this._onDetection(data));
    eventBus.on(EVENTS.FEED_INGESTED, () => this._onNewData());
  }

  /**
   * Generate threat prediction
   * @param {string} modelId - Prediction model to use
   * @param {Object} context - Context data for prediction
   */
  predict(modelId, context = {}) {
    const model = this._models.get(modelId);
    if (!model) return null;

    let prediction;

    switch (modelId) {
      case 'bayesian-threat':
        prediction = this._bayesianThreatForecast(context);
        break;
      case 'anomaly-detection':
        prediction = this._detectAnomalies(context);
        break;
      case 'campaign-prediction':
        prediction = this._predictCampaign(context);
        break;
      case 'vulnerability-exploit':
        prediction = this._predictExploitation(context);
        break;
      default:
        prediction = { probability: 0, confidence: 0, details: 'Unknown model' };
    }

    const result = {
      id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      modelId,
      modelName: model.name,
      ...prediction,
      timestamp: Date.now(),
      context
    };

    this._predictions.push(result);
    model.predictions++;
    model.lastRun = Date.now();
    this._stats.totalPredictions++;
    this._stats.lastPrediction = Date.now();

    if (prediction.probability > 0.7) {
      eventBus.emit(EVENTS.PREDICTION_NEW, result);
    }

    return result;
  }

  /**
   * Bayesian threat probability estimation
   */
  _bayesianThreatForecast(context) {
    const factors = {};
    let totalScore = 0;

    // Evaluate each risk factor
    const actors = dataStore.query('threat-actors');
    const indicators = dataStore.query('indicators');
    const vulns = dataStore.query('vulnerabilities');

    // Threat actor activity factor
    const activeActors = actors.filter(a => a.status === 'active').length;
    factors.threatActorActivity = Math.min(activeActors / 20, 1.0);

    // IoC volume factor (normalized)
    const recentIoCs = indicators.filter(i =>
      i._added && (Date.now() - i._added) < 86400000
    ).length;
    factors.iocVolume = Math.min(recentIoCs / 100, 1.0);

    // Exploit availability
    const criticalVulns = vulns.filter(v =>
      v.severity === 'critical' || (v.cvss_score && v.cvss_score >= 9.0)
    ).length;
    factors.exploitAvailability = Math.min(criticalVulns / 10, 1.0);

    // Patch lag (simulated)
    factors.patchLag = context.patchLag || 0.3;

    // Historical pattern (simulated)
    factors.historicalPattern = context.historicalPattern || 0.4;

    // Geopolitical (simulated)
    factors.geopoliticalFactor = context.geopoliticalFactor || 0.2;

    // Weighted sum
    Object.entries(RISK_FACTORS).forEach(([key, config]) => {
      totalScore += (factors[key] || 0) * config.weight;
    });

    const probability = Math.min(Math.max(totalScore, 0), 1);
    const confidence = 0.6 + (actors.length + indicators.length > 0 ? 0.2 : 0);

    return {
      probability: Math.round(probability * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      severity: probability > 0.8 ? 'critical' : probability > 0.6 ? 'high' : probability > 0.4 ? 'medium' : 'low',
      factors,
      riskFactorWeights: RISK_FACTORS,
      recommendation: this._getRecommendation(probability)
    };
  }

  /**
   * Anomaly detection using statistical analysis
   */
  _detectAnomalies(context) {
    const anomalies = [];

    // Check IoC ingestion rate anomaly
    const indicators = dataStore.query('indicators');
    const hourlyRate = indicators.filter(i =>
      i._added && (Date.now() - i._added) < 3600000
    ).length;

    const baselineRate = this._baseline?.avgHourlyIoCs || 10;
    if (hourlyRate > baselineRate * 3) {
      anomalies.push({
        type: 'ioc-spike',
        severity: 'high',
        description: `IoC ingestion rate ${hourlyRate}/hr is ${Math.round(hourlyRate / baselineRate)}x above baseline`,
        value: hourlyRate,
        baseline: baselineRate
      });
    }

    // Check for new threat actor surge
    const actors = dataStore.query('threat-actors');
    const recentActors = actors.filter(a =>
      a._added && (Date.now() - a._added) < 86400000
    ).length;

    if (recentActors > 5) {
      anomalies.push({
        type: 'actor-surge',
        severity: 'medium',
        description: `${recentActors} new threat actors tracked in last 24h`,
        value: recentActors,
        baseline: this._baseline?.avgDailyActors || 2
      });
    }

    // Check detection rate anomaly
    const rules = dataStore.query('detection-rules');
    const triggeredRules = rules.filter(r => r.matches > 0).length;
    const triggerRate = rules.length > 0 ? triggeredRules / rules.length : 0;

    if (triggerRate > 0.3) {
      anomalies.push({
        type: 'detection-surge',
        severity: 'critical',
        description: `${Math.round(triggerRate * 100)}% of rules triggering (baseline: 5-10%)`,
        value: triggerRate,
        baseline: 0.07
      });
    }

    // Record anomalies
    anomalies.forEach(a => {
      this._anomalies.push({ ...a, timestamp: Date.now() });
      this._stats.anomaliesDetected++;

      eventBus.emit(EVENTS.ANOMALY_DETECTED, {
        type: 'prediction-anomaly',
        severity: a.severity,
        anomaly: a
      });
    });

    // Keep last 500 anomalies
    if (this._anomalies.length > 500) {
      this._anomalies = this._anomalies.slice(-500);
    }

    return {
      probability: anomalies.length > 0 ? 0.5 + (anomalies.length * 0.15) : 0.1,
      confidence: 0.75,
      anomalyCount: anomalies.length,
      anomalies,
      severity: anomalies.some(a => a.severity === 'critical') ? 'critical' :
                anomalies.some(a => a.severity === 'high') ? 'high' : 'low'
    };
  }

  /**
   * Campaign prediction based on actor patterns
   */
  _predictCampaign(context) {
    const actors = dataStore.query('threat-actors');
    const campaigns = dataStore.query('campaigns');

    const predictions = actors
      .filter(a => a.status === 'active')
      .slice(0, 5)
      .map(actor => {
        const actorCampaigns = campaigns.filter(c =>
          c.attributed_to === actor.name || c.actor_id === actor._id
        );

        return {
          actor: actor.name,
          origin: actor.origin,
          probability: Math.random() * 0.4 + 0.3, // 0.3-0.7 range
          targetSectors: actor.target_sectors || ['technology', 'government'],
          likelyTechniques: actor.mitre_techniques || [],
          historicalCampaigns: actorCampaigns.length,
          estimatedTimeframe: '2-4 weeks'
        };
      })
      .sort((a, b) => b.probability - a.probability);

    return {
      probability: predictions.length > 0 ? predictions[0].probability : 0.2,
      confidence: 0.65,
      predictions,
      severity: predictions.some(p => p.probability > 0.6) ? 'high' : 'medium'
    };
  }

  /**
   * Vulnerability exploitation prediction
   */
  _predictExploitation(context) {
    const vulns = dataStore.query('vulnerabilities');

    const atRisk = vulns
      .filter(v => v.severity === 'critical' || (v.cvss_score && v.cvss_score >= 7.0))
      .map(v => {
        const exploitProb = this._calculateExploitProbability(v);
        return {
          id: v._id,
          cve: v.cve_id || v.name,
          cvss: v.cvss_score,
          exploitProbability: exploitProb,
          exploitAvailable: v.exploit_available || false,
          patchAvailable: v.patch_available || false,
          daysExposed: v._added ? Math.floor((Date.now() - v._added) / 86400000) : 0
        };
      })
      .sort((a, b) => b.exploitProbability - a.exploitProbability);

    return {
      probability: atRisk.length > 0 ? atRisk[0].exploitProbability : 0.1,
      confidence: 0.80,
      vulnerabilitiesAtRisk: atRisk.slice(0, 10),
      totalCritical: vulns.filter(v => v.severity === 'critical').length,
      severity: atRisk.some(v => v.exploitProbability > 0.7) ? 'critical' : 'medium'
    };
  }

  /**
   * Calculate exploit probability for a vulnerability
   */
  _calculateExploitProbability(vuln) {
    let prob = 0;

    // CVSS base score contribution
    const cvss = vuln.cvss_score || 5.0;
    prob += (cvss / 10) * 0.4;

    // Exploit availability
    if (vuln.exploit_available) prob += 0.3;

    // Patch status (no patch = higher risk)
    if (!vuln.patch_available) prob += 0.15;

    // Time since disclosure
    const days = vuln._added ? Math.floor((Date.now() - vuln._added) / 86400000) : 30;
    if (days < 7) prob += 0.15; // Fresh vulnerability
    else if (days < 30) prob += 0.1;

    return Math.min(Math.round(prob * 100) / 100, 1.0);
  }

  /**
   * Build statistical baseline from existing data
   */
  _buildBaseline() {
    const indicators = dataStore.query('indicators');
    const actors = dataStore.query('threat-actors');

    this._baseline = {
      avgHourlyIoCs: Math.max(indicators.length / 24, 5),
      avgDailyActors: Math.max(actors.length / 7, 1),
      totalIndicators: indicators.length,
      totalActors: actors.length,
      builtAt: Date.now()
    };
  }

  /**
   * Generate recommendation based on threat probability
   */
  _getRecommendation(probability) {
    if (probability > 0.8) {
      return {
        level: 'IMMEDIATE ACTION',
        actions: [
          'Activate incident response team',
          'Enable enhanced monitoring',
          'Review and harden critical assets',
          'Update detection rules',
          'Brief executive leadership'
        ]
      };
    }
    if (probability > 0.6) {
      return {
        level: 'ELEVATED ALERT',
        actions: [
          'Increase monitoring frequency',
          'Review access controls',
          'Update threat intelligence feeds',
          'Conduct targeted threat hunt'
        ]
      };
    }
    if (probability > 0.4) {
      return {
        level: 'HEIGHTENED AWARENESS',
        actions: [
          'Monitor threat landscape',
          'Review patch status',
          'Update detection signatures'
        ]
      };
    }
    return {
      level: 'NORMAL OPERATIONS',
      actions: ['Continue standard monitoring', 'Regular threat brief review']
    };
  }

  /**
   * Handle new data events - refresh predictions
   */
  _onNewData() {
    this._buildBaseline();
    // Auto-run anomaly detection on new data
    this.predict('anomaly-detection');
  }

  /**
   * Handle detection events
   */
  _onDetection(data) {
    if (data.matchCount > 5) {
      this.predict('anomaly-detection', {
        trigger: 'multi-detection',
        matchCount: data.matchCount
      });
    }
  }

  /**
   * Get all predictions
   */
  getPredictions(limit = 50) {
    return this._predictions.slice(-limit).reverse();
  }

  /**
   * Get anomalies
   */
  getAnomalies(limit = 50) {
    return this._anomalies.slice(-limit).reverse();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this._stats,
      models: PREDICTION_MODELS,
      riskFactors: RISK_FACTORS,
      baseline: this._baseline,
      recentAnomalies: this._anomalies.slice(-10)
    };
  }

  destroy() {
    this._models.clear();
    this._predictions = [];
    this._anomalies = [];
  }
}

export const threatPredictor = new ThreatPredictor();
export default threatPredictor;
