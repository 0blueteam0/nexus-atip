/**
 * NEXUS Improvement Checklist
 *
 * Runs at end of every session to check what can be improved.
 *
 * @module nexus/self-evolution/improvement-checklist
 */

'use strict';

const { EvolutionLoop } = require('./evolution-loop');
const { AutoResearcher } = require('./auto-researcher');

class ImprovementChecklist {
  constructor() {
    this.loop = new EvolutionLoop();
    this.researcher = new AutoResearcher();
  }

  /**
   * Run the full checklist
   */
  async run(sessionData = {}) {
    const results = {
      timestamp: Date.now(),
      checks: []
    };

    // 1. Collect session statistics
    results.checks.push({
      name: 'session_stats',
      status: 'done',
      detail: `Tasks: ${sessionData.taskCount || 0}`
    });

    // 2. Run evolution cycle
    try {
      const cycle = await this.loop.run(sessionData);
      results.checks.push({
        name: 'evolution_cycle',
        status: 'done',
        detail: `${cycle.proposals.length} proposals, ${cycle.applied.length} applied`
      });
    } catch (e) {
      results.checks.push({
        name: 'evolution_cycle',
        status: 'error',
        detail: e.message
      });
    }

    // 3. Check if auto-research is due
    const researchDue = this.researcher.isResearchDue();
    results.checks.push({
      name: 'auto_research',
      status: researchDue ? 'due' : 'not_due',
      detail: researchDue ? 'Research cycle triggered' : 'Not yet due'
    });

    // 4. Check pending proposals
    const pending = this.loop.getPendingProposals();
    results.checks.push({
      name: 'pending_proposals',
      status: pending.length > 0 ? 'has_proposals' : 'none',
      detail: `${pending.length} pending proposals`
    });

    return results;
  }
}

module.exports = { ImprovementChecklist };
