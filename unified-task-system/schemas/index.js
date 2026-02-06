/**
 * Unified Task Hub - Schema Index
 * 모든 스키마 모듈 통합 export
 *
 * @module unified-task-system/schemas
 * @version 2.0.0
 */

const taskSchema = require('./task.schema');
const stateMachineSchema = require('./state-machine.schema');
const agentSchema = require('./agent.schema');
const queueSchema = require('./queue.schema');

module.exports = {
  // Task Schema
  TaskStatus: taskSchema.TaskStatus,
  TaskPriority: taskSchema.TaskPriority,
  AgentRole: taskSchema.AgentRole,
  TaskSchema: taskSchema.TaskSchema,
  createTask: taskSchema.createTask,
  validateTask: taskSchema.validateTask,

  // State Machine Schema
  RIPERPhase: stateMachineSchema.RIPERPhase,
  StateSchema: stateMachineSchema.StateSchema,
  TransitionRules: stateMachineSchema.TransitionRules,
  AgentPhaseMapping: stateMachineSchema.AgentPhaseMapping,
  createInitialState: stateMachineSchema.createInitialState,
  validateTransition: stateMachineSchema.validateTransition,
  checkGate: stateMachineSchema.checkGate,


  // Agent Schema
  AgentStatus: agentSchema.AgentStatus,
  AgentProfiles: agentSchema.AgentProfiles,
  AgentSchema: agentSchema.AgentSchema,
  createAgent: agentSchema.createAgent,
  createAgentPool: agentSchema.createAgentPool,
  getAvailableAgent: agentSchema.getAvailableAgent,

  // Queue Schema
  QueueNames: queueSchema.QueueNames,
  JobStatus: queueSchema.JobStatus,
  QueueConfig: queueSchema.QueueConfig,
  JobSchema: queueSchema.JobSchema,
  createJob: queueSchema.createJob
};
