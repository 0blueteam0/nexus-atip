/**
 * NEXUS Context Pipeline - ContextEnginePort Implementation
 *
 * 3-stage context compilation pipeline:
 *   Stage 1 (Gatherer): Collect from memory tiers, session, knowledge
 *   Stage 2 (Scoper): Apply instruction budgets per ETH Zurich principle
 *   Stage 3 (Formatter): Convert to provider-specific format
 *
 * Implements ContextEnginePort interface:
 *   - assemble(task, provider) -> formatted context
 *   - compact(context, budget) -> reduced context
 *   - detectAnomaly(context) -> anomalies list
 *
 * @module nexus/context/pipeline
 */

'use strict';

const { ContextGatherer } = require('./gatherer');
const { ContextScoper } = require('./scoper');
const { ContextFormatter } = require('./formatter');

class ContextPipeline {
  constructor(options = {}) {
    this.gatherer = options.gatherer || new ContextGatherer(options);
    this.scoper = options.scoper || new ContextScoper(options);
    this.formatter = options.formatter || new ContextFormatter(options);
    this.stats = {
      assemblies: 0,
      compactions: 0,
      anomalies: 0,
      avgReduction: 0
    };
  }

  /**
   * Assemble context for a task targeting a specific provider
   * Full 3-stage pipeline: gather -> scope -> format
   *
   * @param {Object} task - { type, prompt, complexity }
   * @param {string} provider - Target provider ID
   * @returns {Promise<Object>} Formatted context
   */
  async assemble(task, provider) {
    // Stage 1: Gather
    const raw = await this.gatherer.gather(task);

    // Stage 2: Scope
    const scoped = this.scoper.scope(raw, provider || 'claude-code');

    // Stage 3: Format
    const formatted = this.formatter.format(scoped);

    // Update stats
    this.stats.assemblies++;
    const reduction = scoped.metadata?.reductionPercent || 0;
    this.stats.avgReduction = Math.round(
      (this.stats.avgReduction * (this.stats.assemblies - 1) + reduction)
      / this.stats.assemblies
    );

    return formatted;
  }

  /**
   * Compact existing context to fit within a token budget
   *
   * @param {Object} context - Existing formatted context
   * @param {number} budget - Token budget target
   * @returns {Promise<Object>} Compacted context
   */
  async compact(context, budget) {
    this.stats.compactions++;

    if (!context || !context.content) {
      return context;
    }

    const currentTokens = context.tokenEstimate || Math.ceil(context.content.length / 4);

    if (currentTokens <= budget) {
      return context; // Already within budget
    }

    // Progressive reduction strategies
    const ratio = budget / currentTokens;
    let content = context.content;

    if (ratio < 0.3) {
      // Aggressive: keep only task + critical instructions
      const lines = content.split('\n');
      const taskLines = lines.filter(l =>
        l.startsWith('Task:') || l.startsWith('## Task') || l.startsWith('Type:')
      );
      const criticalLines = lines.filter(l =>
        l.includes('[AVOID]') || l.includes('CRITICAL')
      );
      content = [...taskLines, ...criticalLines].join('\n');
    } else if (ratio < 0.6) {
      // Moderate: trim guidelines section
      const sections = content.split('## ');
      const kept = sections.filter(s =>
        s.startsWith('Task') || s.length < 200
      );
      content = kept.map(s => (s.startsWith('Task') ? '## ' : '## ') + s).join('\n');
    } else {
      // Light: truncate to budget
      const targetChars = budget * 4;
      content = content.slice(0, targetChars);
    }

    return {
      ...context,
      content,
      tokenEstimate: Math.ceil(content.length / 4),
      compacted: true,
      originalTokens: currentTokens
    };
  }

  /**
   * Detect anomalies in context (duplicates, stale data, conflicts)
   *
   * @param {Object} context - Context to analyze
   * @returns {Promise<Array>} List of detected anomalies
   */
  async detectAnomaly(context) {
    const anomalies = [];

    if (!context) {
      anomalies.push({
        type: 'missing_context',
        severity: 'high',
        message: 'Context is null or undefined'
      });
      return anomalies;
    }

    // Check for duplicate instructions
    if (context.instructions) {
      const seen = new Set();
      for (const inst of context.instructions) {
        const key = inst.content?.toLowerCase().trim();
        if (key && seen.has(key)) {
          anomalies.push({
            type: 'duplicate_instruction',
            severity: 'medium',
            message: `Duplicate: ${inst.content.slice(0, 50)}...`
          });
        }
        seen.add(key);
      }

      // Check duplicate ratio
      const dupeRatio = (context.instructions.length - seen.size) / context.instructions.length;
      if (dupeRatio > 0.3) {
        anomalies.push({
          type: 'high_duplicate_ratio',
          severity: 'high',
          message: `${Math.round(dupeRatio * 100)}% duplicate instructions`
        });
      }
    }

    // Check for stale session data
    if (context.context?.session?.lastActivity) {
      const age = Date.now() - context.context.session.lastActivity;
      if (age > 604800000) { // 7 days
        anomalies.push({
          type: 'stale_session',
          severity: 'low',
          message: `Session data is ${Math.round(age / 86400000)} days old`
        });
      }
    }

    // Check for conflicting instructions
    if (context.instructions) {
      const avoids = context.instructions.filter(i => i.type === 'anti_pattern');
      const practices = context.instructions.filter(i => i.type === 'best_practice');

      for (const avoid of avoids) {
        for (const practice of practices) {
          if (this._isConflicting(avoid.content, practice.content)) {
            anomalies.push({
              type: 'conflicting_instructions',
              severity: 'high',
              message: `Conflict between: "${avoid.content.slice(0, 30)}" and "${practice.content.slice(0, 30)}"`
            });
          }
        }
      }
    }

    this.stats.anomalies += anomalies.length;
    return anomalies;
  }

  /**
   * Simple conflict detection between two instruction strings
   */
  _isConflicting(a, b) {
    const aLower = (a || '').toLowerCase();
    const bLower = (b || '').toLowerCase();

    // Check for direct contradictions
    const negations = [
      ['always', 'never'],
      ['use', 'avoid'],
      ['enable', 'disable'],
      ['include', 'exclude']
    ];

    for (const [pos, neg] of negations) {
      if ((aLower.includes(pos) && bLower.includes(neg)) ||
          (aLower.includes(neg) && bLower.includes(pos))) {
        // Check if they reference the same subject (naive: word overlap)
        const aWords = new Set(aLower.split(/\s+/));
        const bWords = new Set(bLower.split(/\s+/));
        let overlap = 0;
        for (const w of aWords) {
          if (bWords.has(w) && w.length > 3) overlap++;
        }
        if (overlap >= 2) return true;
      }
    }

    return false;
  }

  /**
   * Get pipeline statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Declare port implementation
   */
  static implementsPorts() {
    return ['ContextEnginePort'];
  }
}

module.exports = { ContextPipeline };
