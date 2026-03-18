/**
 * NEXUS Deep Agent Planner - Task Auto-Decomposition
 *
 * LangChain Deep Agents "write_todos" pattern:
 * - Auto-decomposes complex tasks into subtasks
 * - Tracks progress across subtasks
 * - Dynamically modifies plan based on results
 *
 * Integrates with NEXUS GraphEngine and Shrimp Task Manager.
 *
 * @module nexus/deep-agent/planner
 */

'use strict';

const { getEventBus } = require('../core/event-bus');

class DeepPlanner {
  constructor(options = {}) {
    this.bus = getEventBus();
    this._plans = new Map();
    this._maxSubtasks = options.maxSubtasks || 20;
  }

  /**
   * Create a plan by decomposing a task
   * @param {Object} task - { id, prompt, context, complexity }
   * @returns {Object} Plan with subtasks
   */
  createPlan(task) {
    const planId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const subtasks = this._decompose(task);

    const plan = {
      id: planId,
      taskId: task.id || 'untracked',
      prompt: task.prompt,
      subtasks,
      status: 'active',
      progress: { completed: 0, total: subtasks.length, failed: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this._plans.set(planId, plan);
    this.bus.emit('deep-agent:plan:created', { planId, subtaskCount: subtasks.length });

    return plan;
  }

  /**
   * Decompose a task into subtasks based on complexity signals
   */
  _decompose(task) {
    const prompt = task.prompt || '';
    const complexity = task.complexity || 5;
    const subtasks = [];

    // Analysis subtask (always first)
    subtasks.push({
      id: `st-1`,
      type: 'analyze',
      description: `Analyze requirements: ${prompt.slice(0, 100)}`,
      status: 'pending',
      dependencies: [],
      result: null
    });

    // Decomposition heuristics based on task signals
    if (complexity >= 8 || prompt.length > 200) {
      subtasks.push({
        id: `st-2`,
        type: 'research',
        description: 'Gather context and existing patterns',
        status: 'pending',
        dependencies: ['st-1'],
        result: null
      });

      subtasks.push({
        id: `st-3`,
        type: 'plan',
        description: 'Design implementation approach',
        status: 'pending',
        dependencies: ['st-2'],
        result: null
      });

      subtasks.push({
        id: `st-4`,
        type: 'implement',
        description: 'Execute implementation',
        status: 'pending',
        dependencies: ['st-3'],
        result: null
      });

      subtasks.push({
        id: `st-5`,
        type: 'verify',
        description: 'Verify implementation correctness',
        status: 'pending',
        dependencies: ['st-4'],
        result: null
      });
    } else {
      subtasks.push({
        id: `st-2`,
        type: 'implement',
        description: `Implement: ${prompt.slice(0, 80)}`,
        status: 'pending',
        dependencies: ['st-1'],
        result: null
      });

      subtasks.push({
        id: `st-3`,
        type: 'verify',
        description: 'Verify result',
        status: 'pending',
        dependencies: ['st-2'],
        result: null
      });
    }

    return subtasks;
  }

  /**
   * Mark a subtask as completed
   * @param {string} planId
   * @param {string} subtaskId
   * @param {Object} result
   * @returns {Object} Updated plan
   */
  completeSubtask(planId, subtaskId, result) {
    const plan = this._plans.get(planId);
    if (!plan) return null;

    const subtask = plan.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return null;

    subtask.status = 'completed';
    subtask.result = result;
    subtask.completedAt = Date.now();
    plan.progress.completed++;
    plan.updatedAt = Date.now();

    this.bus.emit('deep-agent:subtask:completed', { planId, subtaskId });

    // Check if plan is fully completed
    if (plan.progress.completed >= plan.progress.total) {
      plan.status = 'completed';
      this.bus.emit('deep-agent:plan:completed', { planId });
    }

    return plan;
  }

  /**
   * Fail a subtask
   */
  failSubtask(planId, subtaskId, error) {
    const plan = this._plans.get(planId);
    if (!plan) return null;

    const subtask = plan.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return null;

    subtask.status = 'failed';
    subtask.error = error;
    plan.progress.failed++;
    plan.updatedAt = Date.now();

    this.bus.emit('deep-agent:subtask:failed', { planId, subtaskId, error });
    return plan;
  }

  /**
   * Dynamically add a subtask to an existing plan
   */
  addSubtask(planId, subtask) {
    const plan = this._plans.get(planId);
    if (!plan) return null;
    if (plan.subtasks.length >= this._maxSubtasks) return null;

    const newSubtask = {
      id: `st-${plan.subtasks.length + 1}`,
      ...subtask,
      status: 'pending',
      result: null
    };

    plan.subtasks.push(newSubtask);
    plan.progress.total++;
    plan.updatedAt = Date.now();

    this.bus.emit('deep-agent:subtask:added', { planId, subtaskId: newSubtask.id });
    return plan;
  }

  /**
   * Get next executable subtask (dependencies resolved)
   */
  getNextSubtask(planId) {
    const plan = this._plans.get(planId);
    if (!plan) return null;

    const completedIds = new Set(
      plan.subtasks.filter(s => s.status === 'completed').map(s => s.id)
    );

    return plan.subtasks.find(s =>
      s.status === 'pending' &&
      s.dependencies.every(d => completedIds.has(d))
    ) || null;
  }

  /**
   * Get plan by ID
   */
  getPlan(planId) {
    return this._plans.get(planId) || null;
  }

  /**
   * List all plans
   */
  listPlans() {
    return [...this._plans.values()].map(p => ({
      id: p.id,
      status: p.status,
      progress: p.progress,
      createdAt: p.createdAt
    }));
  }
}

module.exports = { DeepPlanner };
