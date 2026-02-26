/**
 * NEXUS Context Scoper - Stage 2: Scope
 *
 * Applies instruction budgets based on ETH Zurich Minimal Instruction Principle.
 * - Max 10 instructions per bridge file
 * - Net-zero management (add 1 = remove 1)
 * - Progressive discovery ("refer when needed" not "read this")
 *
 * @module nexus/context/scoper
 */

'use strict';

const fs = require('fs');
const path = require('path');

const RULES_PATH = path.join(__dirname, 'scoping-rules.json');

class ContextScoper {
  constructor(options = {}) {
    this.rules = this._loadRules();
    this.overrides = options.overrides || {};
  }

  /**
   * Scope raw context down to budget
   * @param {Object} rawContext - Output from ContextGatherer
   * @param {string} provider - Target provider ID (e.g., 'claude-code')
   * @returns {Object} Scoped context within budget
   */
  scope(rawContext, provider) {
    const budget = this._getBudget(provider);
    const scoped = {
      task: rawContext.task,
      provider,
      budget: {
        maxTokens: budget.maxTokens,
        maxInstructions: budget.maxInstructions
      },
      instructions: [],
      context: {},
      metadata: {
        originalSize: 0,
        scopedSize: 0,
        reductionPercent: 0,
        timestamp: Date.now()
      }
    };

    // Collect all instruction candidates
    const candidates = this._collectCandidates(rawContext, budget);

    // Rank by priority
    const ranked = this._rankByPriority(candidates, budget.priority);

    // Apply budget limit
    scoped.instructions = ranked.slice(0, budget.maxInstructions);

    // Apply token budget to remaining context
    scoped.context = this._applyTokenBudget(rawContext, budget);

    // Calculate reduction
    const origStr = JSON.stringify(rawContext);
    const scopedStr = JSON.stringify(scoped);
    scoped.metadata.originalSize = origStr.length;
    scoped.metadata.scopedSize = scopedStr.length;
    scoped.metadata.reductionPercent =
      Math.round((1 - scopedStr.length / origStr.length) * 100);

    return scoped;
  }

  /**
   * Get budget for a specific provider
   */
  _getBudget(provider) {
    const providerBudget = this.rules.budgets?.[provider];
    if (providerBudget) return providerBudget;

    // Default budget
    return {
      maxTokens: 8000,
      maxInstructions: 10,
      priority: ['task_description', 'patterns', 'constraints'],
      exclude: []
    };
  }

  /**
   * Collect instruction candidates from raw context
   */
  _collectCandidates(rawContext, budget) {
    const candidates = [];
    const exclude = new Set(budget.exclude || []);

    // Best practices as instructions
    if (!exclude.has('patterns') && rawContext.knowledge?.bestPractices) {
      for (const bp of rawContext.knowledge.bestPractices) {
        candidates.push({
          type: 'best_practice',
          priority: bp.confidence || 0.5,
          content: `[${bp.taskType}] ${bp.practice}`,
          source: 'knowledge'
        });
      }
    }

    // Anti-patterns as warnings
    if (!exclude.has('patterns') && rawContext.knowledge?.antiPatterns) {
      for (const ap of rawContext.knowledge.antiPatterns) {
        candidates.push({
          type: 'anti_pattern',
          priority: (ap.severity || 'medium') === 'high' ? 0.9 : 0.6,
          content: `[AVOID] ${ap.pattern}: ${ap.reason}`,
          source: 'knowledge'
        });
      }
    }

    // Evolution weights as routing hints
    if (!exclude.has('verbose_history') && rawContext.evolution?.weights) {
      const w = rawContext.evolution.weights;
      if (Object.keys(w).length > 0) {
        candidates.push({
          type: 'routing_hint',
          priority: 0.7,
          content: `Routing weights: ${JSON.stringify(w)}`,
          source: 'evolution'
        });
      }
    }

    // Learned patterns
    if (!exclude.has('patterns') && rawContext.patterns?.length > 0) {
      for (const p of rawContext.patterns) {
        candidates.push({
          type: 'pattern',
          priority: Math.min(p.frequency / 10, 0.9),
          content: `Pattern (${p.frequency}x): ${p.description || p.id}`,
          source: 'patterns'
        });
      }
    }

    return candidates;
  }

  /**
   * Rank candidates by priority alignment
   */
  _rankByPriority(candidates, priorities) {
    const priorityMap = {};
    (priorities || []).forEach((p, i) => {
      priorityMap[p] = 1 - (i / priorities.length);
    });

    return candidates.sort((a, b) => {
      const aBoost = priorityMap[a.type] || 0;
      const bBoost = priorityMap[b.type] || 0;
      return (b.priority + bBoost) - (a.priority + aBoost);
    });
  }

  /**
   * Apply token budget to context data
   */
  _applyTokenBudget(rawContext, budget) {
    const maxTokens = budget.maxTokens;
    const exclude = new Set(budget.exclude || []);
    const context = {};

    // Estimate ~4 chars per token
    let tokensBudget = maxTokens;

    // Always include task (minimal)
    const taskStr = JSON.stringify(rawContext.task);
    const taskTokens = Math.ceil(taskStr.length / 4);
    context.task = rawContext.task;
    tokensBudget -= taskTokens;

    // Include session summary (small)
    if (!exclude.has('session_state') && rawContext.session && tokensBudget > 100) {
      context.session = {
        taskCount: rawContext.session.taskCount,
        id: rawContext.session.id
      };
      tokensBudget -= 50;
    }

    // Include evolution summary if budget allows
    if (!exclude.has('verbose_history') && rawContext.evolution && tokensBudget > 200) {
      context.evolution = {
        sessions: rawContext.evolution.sessions
      };
      tokensBudget -= 30;
    }

    return context;
  }

  /**
   * Load scoping rules from JSON
   */
  _loadRules() {
    try {
      if (fs.existsSync(RULES_PATH)) {
        return JSON.parse(fs.readFileSync(RULES_PATH, 'utf-8'));
      }
    } catch (e) {
      // Fallback to defaults
    }
    return {
      maxInstructionsPerBridge: 10,
      netZeroPolicy: true,
      budgets: {},
      tiers: {},
      anomalyThresholds: {}
    };
  }
}

module.exports = { ContextScoper };
