/**
 * NEXUS Workflow Adapter - WorkflowPort Implementation
 *
 * Bridges n8n automation to the NEXUS port system.
 * Supports workflow triggering, listing, and status.
 *
 * @module nexus/workflow/workflow-adapter
 */

'use strict';

const { N8nConnector } = require('./n8n-connector');

class WorkflowAdapter {
  constructor(options = {}) {
    this.n8n = new N8nConnector(options);
    this._available = null;
  }

  /**
   * Trigger a workflow
   * @param {string} workflowId - Workflow ID or webhook path
   * @param {Object} data - Input data
   * @returns {Promise<{success, data, reason}>}
   */
  async triggerWorkflow(workflowId, data = {}) {
    if (!await this._checkAvailable()) {
      return { success: false, reason: 'n8n not available' };
    }

    try {
      const result = await this.n8n.triggerWebhook(workflowId, data);
      return {
        success: result.success,
        data: result.data,
        reason: result.success ? 'triggered' : result.error
      };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  }

  /**
   * List available workflows
   * @returns {Promise<Array<{id, name, active, nodes}>>}
   */
  async listWorkflows() {
    if (!await this._checkAvailable()) return [];

    try {
      return await this.n8n.listWorkflows();
    } catch {
      return [];
    }
  }

  /**
   * Get workflow execution status
   * @param {string} executionId
   * @returns {Promise<{status, reason}>}
   */
  async getWorkflowStatus(executionId) {
    if (!await this._checkAvailable()) {
      return { status: 'unknown', reason: 'n8n not available' };
    }

    try {
      const exec = await this.n8n.getExecution(executionId);
      if (!exec) return { status: 'unknown', reason: 'Execution not found' };
      return { status: exec.status, ...exec };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  }

  async _checkAvailable() {
    if (this._available === null) {
      this._available = await this.n8n.isAvailable();
    }
    return this._available;
  }
}

module.exports = { WorkflowAdapter };
