/**
 * LangGraph System - Main Entry
 * RIPER+ 워크플로우 State Machine
 *
 * @module langgraph-system
 * @version 1.0.0
 */

const { StateAnnotation, RIPERPhase, TaskStatus, AgentRole } = require('./state');
const {
  specifyNode,
  exploreNode,
  planNode,
  implementNode,
  verifyNode,
  releaseNode,
  errorNode,
  endNode
} = require('./nodes');
const {
  buildRIPERGraph,
  compileGraph,
  runWorkflow,
  resumeWorkflow,
  getState
} = require('./graph');

module.exports = {
  // State
  StateAnnotation,
  RIPERPhase,
  TaskStatus,
  AgentRole,

  // Nodes
  specifyNode,
  exploreNode,
  planNode,
  implementNode,
  verifyNode,
  releaseNode,
  errorNode,
  endNode,

  // Graph
  buildRIPERGraph,
  compileGraph,
  runWorkflow,
  resumeWorkflow,
  getState
};
