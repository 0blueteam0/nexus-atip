/**
 * NEXUS Self-Evolution Loop - 7-Step Cycle
 *
 * Analyze -> Diagnose -> Research -> Propose -> Test -> Apply -> Log
 *
 * This is the core differentiator: NEXUS doesn't just route tasks,
 * it continuously improves itself across sessions.
 *
 * @module nexus/self-evolution/evolution-loop
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { getEventBus } = require('../core/event-bus');
const { loadConfig } = require('../core/config-parser');
const { WeightAdjuster } = require('../evolution/weight-adjuster');
const { PatternLearner } = require('../evolution/pattern-learner');

const NEXUS_ROOT = path.resolve(__dirname, '..');
const EVOLUTION_LOG_DIR = path.join(__dirname, 'evolution-log');
const STATE_PATH = path.join(NEXUS_ROOT, 'evolution', 'evolution-state.json');

class EvolutionLoop {
  constructor() {
    this.bus = getEventBus();
    this.adjuster = new WeightAdjuster();
    this.learner = new PatternLearner();
    this.proposals = [];
  }

  /**
   * Run the full 7-step evolution cycle
   */
  async run(sessionData = {}) {
    const cycle = {
      startTime: Date.now(),
      steps: [],
      proposals: [],
      applied: []
    };

    // Step 1: Analyze
    const analysis = this._analyze(sessionData);
    cycle.steps.push({ step: 'analyze', result: analysis });

    // Step 2: Diagnose
    const diagnosis = this._diagnose(analysis);
    cycle.steps.push({ step: 'diagnose', result: diagnosis });

    // Step 3: Research (external - deferred to auto-researcher)
    cycle.steps.push({ step: 'research', result: 'deferred_to_auto_researcher' });

    // Step 4: Propose
    const proposals = this._propose(diagnosis);
    cycle.proposals = proposals;
    cycle.steps.push({ step: 'propose', result: { count: proposals.length } });

    // Step 5: Test (validate proposals)
    const validated = this._validate(proposals);
    cycle.steps.push({ step: 'test', result: { valid: validated.length, total: proposals.length } });

    // Step 6: Apply (auto-apply high-confidence proposals)
    const applied = await this._apply(validated);
    cycle.applied = applied;
    cycle.steps.push({ step: 'apply', result: { applied: applied.length } });

    // Step 7: Log
    await this._log(cycle);
    cycle.steps.push({ step: 'log', result: 'recorded' });

    cycle.endTime = Date.now();
    cycle.duration = cycle.endTime - cycle.startTime;

    this.bus.emit('evolution:cycle_complete', cycle);
    return cycle;
  }

  /**
   * Step 1: Analyze current system state
   */
  _analyze(sessionData) {
    const state = this._loadState();
    return {
      sessions: state.sessions || 0,
      totalRoutings: state.metrics?.totalRoutings || 0,
      weights: state.weights || {},
      patternCount: this.learner.getSummary().totalPatterns,
      antiPatternCount: this.learner.getSummary().antiPatterns,
      sessionMetrics: sessionData.metrics || {}
    };
  }

  /**
   * Step 2: Diagnose bottlenecks and inefficiencies
   */
  _diagnose(analysis) {
    const issues = [];

    // Check for underperforming providers
    for (const [taskType, providers] of Object.entries(analysis.weights)) {
      for (const [pid, weight] of Object.entries(providers)) {
        if (weight < 0.1) {
          issues.push({
            type: 'underperforming_provider',
            severity: 'medium',
            detail: `${pid} has very low weight (${weight.toFixed(3)}) for ${taskType}`,
            suggestion: 'Consider investigating or re-evaluating this provider'
          });
        }
      }
    }

    // Check for anti-patterns
    const summary = this.learner.getSummary();
    if (summary.antiPatterns > 3) {
      issues.push({
        type: 'many_anti_patterns',
        severity: 'high',
        detail: `${summary.antiPatterns} anti-patterns detected`,
        suggestion: 'Review and update routing rules in Architect.md'
      });
    }

    // Check for data scarcity
    if (analysis.sessions < 5) {
      issues.push({
        type: 'insufficient_data',
        severity: 'low',
        detail: `Only ${analysis.sessions} sessions recorded`,
        suggestion: 'Need more sessions for reliable weight adjustment'
      });
    }

    return { issues, timestamp: Date.now() };
  }

  /**
   * Step 4: Generate improvement proposals
   */
  _propose(diagnosis) {
    const proposals = [];

    for (const issue of diagnosis.issues) {
      switch (issue.type) {
        case 'underperforming_provider':
          proposals.push({
            type: 'weight_reset',
            confidence: 0.6,
            detail: issue.detail,
            action: 'Reset provider weight to 0.3 for re-evaluation'
          });
          break;
        case 'many_anti_patterns':
          proposals.push({
            type: 'routing_update',
            confidence: 0.8,
            detail: issue.detail,
            action: 'Update Architect.md routing rules to avoid anti-patterns'
          });
          break;
      }
    }

    return proposals;
  }

  /**
   * Step 5: Validate proposals
   */
  _validate(proposals) {
    return proposals.filter(p => p.confidence >= 0.5);
  }

  /**
   * Step 6: Apply validated proposals
   */
  async _apply(proposals) {
    const applied = [];
    const autoApplyThreshold = 0.95;

    for (const proposal of proposals) {
      if (proposal.confidence >= autoApplyThreshold) {
        // Auto-apply high-confidence changes
        applied.push({ ...proposal, autoApplied: true });
      } else {
        // Queue for user review
        this.proposals.push(proposal);
      }
    }

    return applied;
  }

  /**
   * Step 7: Log evolution cycle
   */
  async _log(cycle) {
    if (!fs.existsSync(EVOLUTION_LOG_DIR)) {
      fs.mkdirSync(EVOLUTION_LOG_DIR, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    const logPath = path.join(EVOLUTION_LOG_DIR, `${date}.md`);
    const time = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const lines = [
      '',
      `### [${time}] Evolution Cycle`,
      `- Duration: ${cycle.duration}ms`,
      `- Issues diagnosed: ${cycle.steps[1]?.result?.issues?.length || 0}`,
      `- Proposals generated: ${cycle.proposals.length}`,
      `- Auto-applied: ${cycle.applied.length}`,
      ''
    ];

    if (cycle.proposals.length > 0) {
      lines.push('Proposals:');
      cycle.proposals.forEach(p => {
        lines.push(`  - [${p.confidence.toFixed(2)}] ${p.type}: ${p.detail}`);
      });
      lines.push('');
    }

    const content = lines.join('\n');
    if (fs.existsSync(logPath)) {
      fs.appendFileSync(logPath, content);
    } else {
      fs.writeFileSync(logPath, `# NEXUS Evolution Log - ${date}\n${content}`);
    }
  }

  /**
   * Get pending proposals for user review
   */
  getPendingProposals() {
    return this.proposals;
  }

  _loadState() {
    try {
      if (fs.existsSync(STATE_PATH)) {
        return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
      }
    } catch (e) {}
    return {};
  }
}

module.exports = { EvolutionLoop };
