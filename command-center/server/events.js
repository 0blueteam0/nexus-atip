/**
 * Event Contract (F Architecture Phase 4)
 *
 * Standardized WebSocket event schema with versioning.
 * All Observer modules emit events through this contract.
 *
 * Event format: { type, version, data, timestamp }
 */
'use strict';

const EVENT_VERSION = 1;

// Canonical event type registry
const EVENT_TYPES = {
  // Control Plane
  CONTROL_COMMAND_CREATED: 'control.command.created',
  CONTROL_COMMAND_CLAIMED: 'control.command.claimed',
  CONTROL_COMMAND_COMPLETED: 'control.command.completed',
  CONTROL_COMMAND_FAILED: 'control.command.failed',
  CONTROL_COMMAND_CANCELLED: 'control.command.cancelled',

  // Scheduler
  SCHEDULER_HEARTBEAT: 'scheduler.heartbeat',
  SCHEDULER_RUN_STARTED: 'scheduler.run.started',
  SCHEDULER_RUN_SUCCESS: 'scheduler.run.success',
  SCHEDULER_RUN_FAILED: 'scheduler.run.failed',

  // Evolution
  EVOLUTION_PROPOSALS: 'evolution.proposals',
  EVOLUTION_APPLIED: 'evolution.applied',
  EVOLUTION_ROLLED_BACK: 'evolution.rolled_back',
  EVOLUTION_REPORT: 'evolution.report',

  // Memory Sync
  MEMORY_SYNC_COMPLETE: 'memory.sync.complete',
  MEMORY_SYNC_FAILED: 'memory.sync.failed',

  // Alerts
  ALERT_RAISED: 'alert.raised',
  ALERT_CLEARED: 'alert.cleared',

  // Agent State (existing, formalized)
  STATE_CHANGE: 'state_change',
  AGENT_SPAWN: 'agent_spawn',
  ROUTING_HINT: 'routing_hint',

  // Transcript (existing, formalized)
  TRANSCRIPT_EVENT: 'transcript_event',
  HOOK_EVENT: 'hook_event'
};

/**
 * Create a standardized event payload
 */
function createEvent(type, data) {
  return {
    type,
    version: EVENT_VERSION,
    data: data || {},
    timestamp: Date.now()
  };
}

/**
 * Validate event type exists in registry
 */
function isValidEventType(type) {
  return Object.values(EVENT_TYPES).includes(type);
}

module.exports = { EVENT_TYPES, EVENT_VERSION, createEvent, isValidEventType };
