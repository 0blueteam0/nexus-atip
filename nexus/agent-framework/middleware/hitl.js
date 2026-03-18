/**
 * NEXUS HITL Middleware - Human-in-the-Loop
 *
 * Pauses graph execution at designated nodes to await
 * user approval before continuing. Integrates with EventBus
 * for approval/rejection signaling.
 *
 * @module nexus/agent-framework/middleware/hitl
 */

'use strict';

const { getEventBus } = require('../../core/event-bus');

class HITLMiddleware {
  constructor(options = {}) {
    this.bus = getEventBus();
    this._pendingApprovals = new Map();
    this._approvalTimeout = options.timeoutMs || 300000; // 5 min default
    this._breakpoints = new Set(options.breakpoints || []);
    this._autoApprove = options.autoApprove || false;

    // Listen for approval responses
    this.bus.on('hitl:approve', (data) => this._handleResponse(data, true));
    this.bus.on('hitl:reject', (data) => this._handleResponse(data, false));
  }

  /**
   * Add a breakpoint at a specific node
   * @param {string} nodeId
   */
  addBreakpoint(nodeId) {
    this._breakpoints.add(nodeId);
  }

  /**
   * Remove a breakpoint
   * @param {string} nodeId
   */
  removeBreakpoint(nodeId) {
    this._breakpoints.delete(nodeId);
  }

  /**
   * Check if a node requires approval (graph middleware hook)
   * Called by GraphEngine before executing each node.
   *
   * @param {string} nodeId - Node about to execute
   * @param {Object} state - Current graph state
   * @returns {Promise<{approved: boolean, feedback?: string}>}
   */
  async checkApproval(nodeId, state) {
    if (this._autoApprove) return { approved: true };
    if (!this._breakpoints.has(nodeId) && !this._breakpoints.has('*')) {
      return { approved: true };
    }

    const requestId = `hitl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Emit approval request
    this.bus.emit('hitl:request', {
      requestId,
      nodeId,
      state: this._sanitizeState(state),
      message: `Approval required for node: ${nodeId}`,
      timeout: this._approvalTimeout
    });

    // Wait for response
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this._pendingApprovals.delete(requestId);
        this.bus.emit('hitl:timeout', { requestId, nodeId });
        resolve({ approved: false, feedback: 'Approval timeout' });
      }, this._approvalTimeout);

      this._pendingApprovals.set(requestId, { resolve, timer, nodeId });
    });
  }

  /**
   * Handle approval/rejection response
   */
  _handleResponse(data, approved) {
    const pending = this._pendingApprovals.get(data.requestId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this._pendingApprovals.delete(data.requestId);

    this.bus.emit(approved ? 'hitl:approved' : 'hitl:rejected', {
      requestId: data.requestId,
      nodeId: pending.nodeId,
      feedback: data.feedback
    });

    pending.resolve({ approved, feedback: data.feedback });
  }

  /**
   * Programmatic approval (for testing or automation)
   * @param {string} requestId
   * @param {string} [feedback]
   */
  approve(requestId, feedback) {
    this._handleResponse({ requestId, feedback }, true);
  }

  /**
   * Programmatic rejection
   * @param {string} requestId
   * @param {string} [feedback]
   */
  reject(requestId, feedback) {
    this._handleResponse({ requestId, feedback }, false);
  }

  /**
   * Sanitize state for display (remove large/sensitive data)
   */
  _sanitizeState(state) {
    const clean = {};
    for (const [k, v] of Object.entries(state)) {
      if (typeof v === 'string' && v.length > 500) {
        clean[k] = v.slice(0, 500) + '... [truncated]';
      } else if (typeof v === 'object' && v !== null) {
        clean[k] = `[Object: ${Object.keys(v).join(', ')}]`;
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }

  /**
   * Get pending approvals
   */
  getPending() {
    return [...this._pendingApprovals.entries()].map(([id, p]) => ({
      requestId: id,
      nodeId: p.nodeId
    }));
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      breakpoints: [...this._breakpoints],
      pendingCount: this._pendingApprovals.size,
      autoApprove: this._autoApprove,
      timeoutMs: this._approvalTimeout
    };
  }
}

module.exports = { HITLMiddleware };
