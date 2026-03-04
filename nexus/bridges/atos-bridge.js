/**
 * NEXUS ATOS Bridge
 *
 * Connects NEXUS routing to existing ATOS recommendation engine,
 * feedback loop, and complexity detector.
 *
 * @module nexus/bridges/atos-bridge
 */

'use strict';

const path = require('path');
const { getEventBus } = require('../core/event-bus');

let recommendationEngine = null;
let feedbackLoop = null;
let complexityDetector = null;

function loadAtosModule(name) {
  try {
    return require(path.resolve(__dirname, '../../atos', name));
  } catch (e) {
    return null;
  }
}

class AtosBridge {
  constructor() {
    this.bus = getEventBus();
    this.loaded = false;
  }

  init() {
    recommendationEngine = loadAtosModule('recommendation-engine');
    feedbackLoop = loadAtosModule('feedback-loop');
    complexityDetector = loadAtosModule('complexity-detector');
    this.loaded = !!(recommendationEngine || feedbackLoop || complexityDetector);
    return this.loaded;
  }

  /**
   * Get ATOS recommendation enhanced with NEXUS routing
   */
  async getRecommendation(context) {
    if (!recommendationEngine?.recommend) return null;
    try {
      return await recommendationEngine.recommend(context);
    } catch (e) {
      return null;
    }
  }

  /**
   * Analyze complexity via ATOS detector
   */
  analyzeComplexity(input) {
    if (!complexityDetector?.analyze) {
      return { score: 5, level: 'medium', action: 'suggest' };
    }
    return complexityDetector.analyze(input);
  }

  /**
   * Send feedback to ATOS learning system
   */
  async sendFeedback(result) {
    if (!feedbackLoop?.learnFromSuccess && !feedbackLoop?.learnFromFailure) return;
    try {
      if (result.success && feedbackLoop.learnFromSuccess) {
        await feedbackLoop.learnFromSuccess(result);
      } else if (!result.success && feedbackLoop.learnFromFailure) {
        await feedbackLoop.learnFromFailure(result);
      }
    } catch (e) {
      // Silent fail - ATOS feedback is best-effort
    }
  }

  getStatus() {
    return {
      loaded: this.loaded,
      modules: {
        recommendationEngine: !!recommendationEngine,
        feedbackLoop: !!feedbackLoop,
        complexityDetector: !!complexityDetector
      }
    };
  }
}

module.exports = { AtosBridge };
