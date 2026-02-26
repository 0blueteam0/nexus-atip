/**
 * NEXUS Context Gatherer - Stage 1: Collect
 *
 * Gathers context from 3-tier memory (hot/warm/cold),
 * active session state, and knowledge base.
 *
 * @module nexus/context/gatherer
 */

'use strict';

const fs = require('fs');
const path = require('path');

const NEXUS_ROOT = path.resolve(__dirname, '..');
const GENAI_ROOT = path.resolve(NEXUS_ROOT, '..');

class ContextGatherer {
  constructor(options = {}) {
    this.tiers = options.tiers || {
      hot: { maxAge: 3600000, maxItems: 20 },
      warm: { maxAge: 86400000, maxItems: 50 },
      cold: { maxAge: null, maxItems: 200 }
    };
  }

  /**
   * Gather all relevant context for a task
   * @param {Object} task - { type, prompt, complexity, provider }
   * @returns {Object} Raw gathered context
   */
  async gather(task) {
    const context = {
      task: {
        type: task.type || 'general',
        prompt: task.prompt || '',
        complexity: task.complexity || 'unknown'
      },
      session: this._gatherSession(),
      knowledge: this._gatherKnowledge(task),
      patterns: this._gatherPatterns(task),
      evolution: this._gatherEvolution(),
      timestamp: Date.now()
    };

    return context;
  }

  /**
   * Gather active session state
   */
  _gatherSession() {
    const sessionFile = path.join(GENAI_ROOT, 'atos', 'current-session.json');
    try {
      if (fs.existsSync(sessionFile)) {
        const data = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
        return {
          id: data.sessionId || null,
          startTime: data.startTime || null,
          taskCount: data.taskCount || 0,
          lastActivity: data.lastActivity || null
        };
      }
    } catch (e) {
      // Session file not available
    }
    return { id: null, startTime: null, taskCount: 0, lastActivity: null };
  }

  /**
   * Gather relevant knowledge (best practices, anti-patterns)
   */
  _gatherKnowledge(task) {
    const result = { bestPractices: [], antiPatterns: [] };

    // Best practices
    const bpFile = path.join(NEXUS_ROOT, 'knowledge', 'best-practices.json');
    try {
      if (fs.existsSync(bpFile)) {
        const practices = JSON.parse(fs.readFileSync(bpFile, 'utf-8'));
        // Filter by task type relevance
        result.bestPractices = (practices.practices || [])
          .filter(p => !task.type || p.taskType === task.type || p.taskType === 'general')
          .slice(0, this.tiers.hot.maxItems);
      }
    } catch (e) { /* skip */ }

    // Anti-patterns
    const apFile = path.join(NEXUS_ROOT, 'knowledge', 'anti-patterns.json');
    try {
      if (fs.existsSync(apFile)) {
        const antiPatterns = JSON.parse(fs.readFileSync(apFile, 'utf-8'));
        result.antiPatterns = (antiPatterns.antiPatterns || [])
          .slice(0, 10);
      }
    } catch (e) { /* skip */ }

    return result;
  }

  /**
   * Gather learned patterns from pattern library
   */
  _gatherPatterns(task) {
    const patternFile = path.join(NEXUS_ROOT, 'knowledge', 'pattern-library.json');
    try {
      if (fs.existsSync(patternFile)) {
        const lib = JSON.parse(fs.readFileSync(patternFile, 'utf-8'));
        return (lib.patterns || [])
          .filter(p => p.frequency >= 2)
          .slice(0, 10);
      }
    } catch (e) { /* skip */ }
    return [];
  }

  /**
   * Gather evolution state (weights, sessions)
   */
  _gatherEvolution() {
    const evoFile = path.join(NEXUS_ROOT, 'evolution-state.json');
    try {
      if (fs.existsSync(evoFile)) {
        const state = JSON.parse(fs.readFileSync(evoFile, 'utf-8'));
        return {
          sessions: state.sessions || 0,
          weights: state.weights || {},
          lastUpdated: state.lastUpdated || null
        };
      }
    } catch (e) { /* skip */ }
    return { sessions: 0, weights: {}, lastUpdated: null };
  }
}

module.exports = { ContextGatherer };
