/**
 * NEXUS Remote Bridge - Remote Control Integration
 *
 * Bridges Claude Code v2.1.51+ remote-control capability
 * with NEXUS monitor, allowing the monitoring dashboard
 * to send commands to running Claude Code instances.
 *
 * @module nexus/claude-features/remote-bridge
 */

'use strict';

const { getEventBus } = require('../core/event-bus');

class RemoteBridge {
  constructor(options = {}) {
    this.bus = getEventBus();
    this._instances = new Map();
    this._commandQueue = [];
    this._maxQueue = options.maxQueue || 100;
  }

  /**
   * Register a Claude Code instance
   * @param {Object} instance - { id, pid, sessionId, startedAt }
   */
  registerInstance(instance) {
    this._instances.set(instance.id, {
      ...instance,
      status: 'connected',
      registeredAt: Date.now(),
      lastPing: Date.now()
    });

    this.bus.emit('remote:instance:registered', { instanceId: instance.id });
  }

  /**
   * Send a command to a registered instance
   * @param {string} instanceId
   * @param {Object} command - { type, payload }
   * @returns {{queued: boolean, commandId: string}}
   */
  sendCommand(instanceId, command) {
    const instance = this._instances.get(instanceId);
    if (!instance) return { queued: false, reason: 'Instance not found' };

    const commandEntry = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      instanceId,
      command,
      status: 'queued',
      createdAt: Date.now()
    };

    this._commandQueue.push(commandEntry);
    if (this._commandQueue.length > this._maxQueue) {
      this._commandQueue = this._commandQueue.slice(-this._maxQueue);
    }

    this.bus.emit('remote:command:queued', {
      commandId: commandEntry.id, instanceId, type: command.type
    });

    return { queued: true, commandId: commandEntry.id };
  }

  /**
   * Update instance heartbeat
   */
  ping(instanceId) {
    const instance = this._instances.get(instanceId);
    if (instance) {
      instance.lastPing = Date.now();
      instance.status = 'connected';
    }
  }

  /**
   * List connected instances
   */
  listInstances() {
    const now = Date.now();
    return [...this._instances.values()].map(inst => ({
      id: inst.id,
      sessionId: inst.sessionId,
      status: (now - inst.lastPing) > 30000 ? 'stale' : inst.status,
      lastPing: inst.lastPing
    }));
  }

  /**
   * Get pending commands for an instance
   */
  getPendingCommands(instanceId) {
    return this._commandQueue.filter(c =>
      c.instanceId === instanceId && c.status === 'queued'
    );
  }

  /**
   * Mark command as executed
   */
  completeCommand(commandId, result) {
    const cmd = this._commandQueue.find(c => c.id === commandId);
    if (cmd) {
      cmd.status = 'completed';
      cmd.result = result;
      cmd.completedAt = Date.now();
    }
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      instances: this._instances.size,
      connectedInstances: this.listInstances().filter(i => i.status === 'connected').length,
      pendingCommands: this._commandQueue.filter(c => c.status === 'queued').length,
      totalCommands: this._commandQueue.length
    };
  }
}

module.exports = { RemoteBridge };
