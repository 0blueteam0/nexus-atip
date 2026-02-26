/**
 * NEXUS Compound Loop - AgentLoopPort Implementation
 *
 * 4-phase task cycle based on Compound Engineering:
 *   Phase 1: Plan (40%) - Analyze task, design approach, gather context
 *   Phase 2: Work (10%) - Execute the planned steps
 *   Phase 3: Review (30%) - Evaluate results, identify improvements
 *   Phase 4: Compound (20%) - Extract learnings, store as solutions
 *
 * The 4th phase (Compound) is the key differentiator.
 * Without it, this is just "AI-assisted traditional development."
 *
 * Implements AgentLoopPort interface:
 *   - planTask(task) -> Plan
 *   - executeStep(step, context) -> Result
 *   - reviewResult(result, plan) -> Review
 *   - compoundLearning(review, solutions) -> Solution
 *
 * @module nexus/compound/loop
 */

'use strict';

const { SolutionsLibrary } = require('./solutions-library');
const { FiftyFiftyTracker } = require('./fifty-fifty-tracker');
const { getEventBus } = require('../core/event-bus');

class CompoundLoop {
  constructor(options = {}) {
    this.solutions = options.solutions || new SolutionsLibrary();
    this.tracker = options.tracker || new FiftyFiftyTracker();
    this.bus = getEventBus();
    this.stats = {
      loops: 0,
      plans: 0,
      executions: 0,
      reviews: 0,
      compounds: 0,
      solutionsCreated: 0
    };
  }

  /**
   * Phase 1: Plan (40% of effort)
   * Analyze the task, find relevant solutions, design approach
   *
   * @param {Object} task - { type, prompt, complexity, context }
   * @returns {Promise<Object>} Plan
   */
  async planTask(task) {
    this.stats.plans++;
    this.bus.emit('compound:plan', { task: task.type, prompt: task.prompt?.slice(0, 100) });

    // Search for existing solutions
    const existingSolutions = this.solutions.find({
      taskType: task.type,
      keyword: task.prompt?.split(' ').slice(0, 3).join(' ')
    });

    // Build plan
    const plan = {
      id: `plan-${Date.now()}`,
      task,
      phase: 'plan',
      existingSolutions: existingSolutions.slice(0, 5).map(s => ({
        id: s.id,
        title: s.title,
        category: s.category,
        timesReferenced: s.timesReferenced
      })),
      steps: this._decomposeTask(task),
      strategy: existingSolutions.length > 0 ? 'reuse_and_adapt' : 'fresh_approach',
      estimatedPhases: {
        plan: 0.4,
        work: 0.1,
        review: 0.3,
        compound: 0.2
      },
      createdAt: new Date().toISOString()
    };

    // Reference existing solutions
    for (const sol of existingSolutions.slice(0, 3)) {
      this.solutions.reference(sol.id);
    }

    return plan;
  }

  /**
   * Phase 2: Work (10% of effort)
   * Execute a single step from the plan
   *
   * @param {Object} step - { id, description, action }
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Step result
   */
  async executeStep(step, context = {}) {
    this.stats.executions++;
    this.bus.emit('compound:work', { step: step.id, description: step.description?.slice(0, 80) });

    const result = {
      stepId: step.id,
      phase: 'work',
      status: 'completed',
      output: null,
      startTime: Date.now(),
      endTime: null,
      notes: []
    };

    try {
      // The actual execution is delegated to the provider via orchestrator
      // This step primarily tracks and structures the result
      result.output = {
        description: step.description,
        action: step.action || 'execute',
        context: {
          provider: context.provider || 'unknown',
          taskType: context.taskType || 'general'
        }
      };
      result.status = 'completed';
    } catch (e) {
      result.status = 'failed';
      result.error = e.message;
      result.notes.push(`Error: ${e.message}`);
    }

    result.endTime = Date.now();
    result.duration = result.endTime - result.startTime;

    return result;
  }

  /**
   * Phase 3: Review (30% of effort)
   * Evaluate results against the plan, identify improvements
   *
   * @param {Object} result - Execution result
   * @param {Object} plan - Original plan
   * @returns {Promise<Object>} Review
   */
  async reviewResult(result, plan) {
    this.stats.reviews++;
    this.bus.emit('compound:review', {
      planId: plan.id,
      status: result.status
    });

    const review = {
      planId: plan.id,
      phase: 'review',
      status: result.status,
      quality: this._assessQuality(result, plan),
      improvements: [],
      patterns: [],
      timestamp: new Date().toISOString()
    };

    // Identify improvements
    if (result.status === 'completed') {
      review.improvements = this._identifyImprovements(result, plan);
    } else {
      review.improvements.push({
        type: 'error_handling',
        description: `Step failed: ${result.error || 'unknown'}`,
        priority: 'high'
      });
    }

    // Detect patterns
    review.patterns = this._detectPatterns(result, plan);

    // Track in 50/50 tracker
    const category = this._classifyTaskCategory(plan.task);
    this.tracker.record(category, {
      description: plan.task.prompt?.slice(0, 100),
      duration: result.duration || 0
    });

    return review;
  }

  /**
   * Phase 4: Compound (20% of effort) - THE KEY DIFFERENTIATOR
   * Extract learnings from the review and store as reusable solutions
   *
   * @param {Object} review - Review results
   * @param {Object} solutions - Context (existing solutions library)
   * @returns {Promise<Object>} New or updated solution
   */
  async compoundLearning(review, solutions) {
    this.stats.compounds++;
    this.stats.loops++;
    this.bus.emit('compound:compound', {
      planId: review.planId,
      quality: review.quality?.score
    });

    // Only create solutions from successful, high-quality results
    if (review.status !== 'completed' || (review.quality?.score || 0) < 0.5) {
      return {
        phase: 'compound',
        action: 'skip',
        reason: review.status !== 'completed'
          ? 'Task did not complete successfully'
          : 'Quality score too low for solution extraction'
      };
    }

    // Extract solution from review
    const solution = {
      title: `Solution: ${review.planId}`,
      category: review.patterns?.[0]?.category || 'general',
      tags: this._extractTags(review),
      taskType: review.patterns?.[0]?.taskType || 'general',
      content: this._formatSolutionContent(review)
    };

    // Store in library
    const stored = this.solutions.add(solution);
    this.stats.solutionsCreated++;

    this.bus.emit('compound:solution', {
      solutionId: stored.id,
      title: stored.title,
      category: stored.category
    });

    return {
      phase: 'compound',
      action: 'created',
      solution: stored,
      balance: this.tracker.getBalance()
    };
  }

  /**
   * Run a complete 4-phase loop for a task
   * @param {Object} task - Task to process
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Complete loop result
   */
  async runLoop(task, context = {}) {
    // Phase 1: Plan
    const plan = await this.planTask(task);

    // Phase 2: Work (execute first step as representative)
    const step = plan.steps[0] || { id: 'step-1', description: task.prompt };
    const result = await this.executeStep(step, context);

    // Phase 3: Review
    const review = await this.reviewResult(result, plan);

    // Phase 4: Compound
    const compound = await this.compoundLearning(review);

    return {
      plan,
      result,
      review,
      compound,
      loopId: `loop-${Date.now()}`,
      balance: this.tracker.getBalance()
    };
  }

  /**
   * Decompose a task into steps
   */
  _decomposeTask(task) {
    const steps = [];
    const prompt = task.prompt || '';

    // Simple decomposition: split by complexity
    if (task.complexity === 'complex' || prompt.length > 500) {
      steps.push(
        { id: 'step-1', description: 'Analyze requirements and constraints', action: 'analyze' },
        { id: 'step-2', description: 'Design solution approach', action: 'design' },
        { id: 'step-3', description: 'Implement core logic', action: 'implement' },
        { id: 'step-4', description: 'Test and validate', action: 'validate' }
      );
    } else if (task.complexity === 'medium') {
      steps.push(
        { id: 'step-1', description: 'Analyze and implement', action: 'implement' },
        { id: 'step-2', description: 'Validate results', action: 'validate' }
      );
    } else {
      steps.push(
        { id: 'step-1', description: 'Execute task', action: 'execute' }
      );
    }

    return steps;
  }

  /**
   * Assess quality of a result
   */
  _assessQuality(result, plan) {
    let score = 0;

    if (result.status === 'completed') score += 0.5;
    if (!result.error) score += 0.2;
    if (result.duration < 60000) score += 0.1; // Under 1 minute
    if (plan.existingSolutions.length > 0) score += 0.1; // Had prior knowledge
    if (result.notes?.length === 0) score += 0.1; // No warnings

    return {
      score: Math.min(score, 1.0),
      factors: {
        completed: result.status === 'completed',
        noErrors: !result.error,
        fast: result.duration < 60000,
        priorKnowledge: plan.existingSolutions.length > 0
      }
    };
  }

  /**
   * Identify potential improvements
   */
  _identifyImprovements(result, plan) {
    const improvements = [];

    if (result.duration > 30000) {
      improvements.push({
        type: 'performance',
        description: 'Task took over 30 seconds - consider caching or optimization',
        priority: 'medium'
      });
    }

    if (plan.existingSolutions.length === 0) {
      improvements.push({
        type: 'knowledge_gap',
        description: 'No existing solutions found - this is a new pattern',
        priority: 'low'
      });
    }

    return improvements;
  }

  /**
   * Detect patterns from execution
   */
  _detectPatterns(result, plan) {
    const patterns = [];

    if (plan.task?.type) {
      patterns.push({
        taskType: plan.task.type,
        category: plan.task.type,
        outcome: result.status,
        duration: result.duration
      });
    }

    return patterns;
  }

  /**
   * Classify task as 'feature' or 'system'
   */
  _classifyTaskCategory(task) {
    const systemKeywords = ['refactor', 'optimize', 'improve', 'fix', 'update', 'clean', 'migrate', 'test'];
    const prompt = (task.prompt || '').toLowerCase();

    for (const kw of systemKeywords) {
      if (prompt.includes(kw)) return 'system';
    }
    return 'feature';
  }

  /**
   * Extract tags from review
   */
  _extractTags(review) {
    const tags = [];
    if (review.patterns?.[0]?.taskType) tags.push(review.patterns[0].taskType);
    if (review.patterns?.[0]?.category) tags.push(review.patterns[0].category);
    if (review.quality?.score >= 0.8) tags.push('high-quality');
    if (review.improvements?.length > 0) tags.push('has-improvements');
    return [...new Set(tags)];
  }

  /**
   * Format solution content for storage
   */
  _formatSolutionContent(review) {
    const sections = [];
    sections.push(`# Solution from ${review.planId}`);
    sections.push(`\nQuality: ${((review.quality?.score || 0) * 100).toFixed(0)}%`);

    if (review.improvements?.length > 0) {
      sections.push('\n## Improvements');
      review.improvements.forEach(imp => {
        sections.push(`- [${imp.priority}] ${imp.description}`);
      });
    }

    if (review.patterns?.length > 0) {
      sections.push('\n## Patterns');
      review.patterns.forEach(p => {
        sections.push(`- ${p.taskType}: ${p.outcome} (${p.duration}ms)`);
      });
    }

    return sections.join('\n');
  }

  /**
   * Get loop statistics
   */
  getStats() {
    return {
      ...this.stats,
      solutions: this.solutions.getStats(),
      balance: this.tracker.getBalance()
    };
  }

  static implementsPorts() {
    return ['AgentLoopPort'];
  }
}

module.exports = { CompoundLoop };
