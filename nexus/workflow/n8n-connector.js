/**
 * NEXUS n8n Connector - REST API Client
 *
 * Communicates with n8n automation platform via REST API.
 * Manages workflow triggering, status checking, and listing.
 *
 * @module nexus/workflow/n8n-connector
 */

'use strict';

const http = require('http');

const DEFAULT_BASE_URL = 'http://localhost:5678';
const DEFAULT_TIMEOUT = 30000;

class N8nConnector {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.apiKey = options.apiKey || process.env.N8N_API_KEY || '';
    const url = new URL(this.baseUrl);
    this._host = url.hostname;
    this._port = parseInt(url.port) || 5678;
  }

  async isAvailable() {
    try {
      const res = await this._request('GET', '/api/v1/workflows?limit=1');
      return res.statusCode === 200;
    } catch {
      return false;
    }
  }

  /**
   * List all workflows
   * @returns {Promise<Array<{id, name, active, createdAt, updatedAt}>>}
   */
  async listWorkflows() {
    const res = await this._request('GET', '/api/v1/workflows');
    if (res.statusCode !== 200) return [];
    const data = JSON.parse(res.body);
    return (data.data || []).map(w => ({
      id: w.id,
      name: w.name,
      active: w.active,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      nodes: (w.nodes || []).length
    }));
  }

  /**
   * Trigger a workflow via webhook
   * @param {string} webhookPath - Webhook endpoint path
   * @param {Object} data - Payload to send
   * @returns {Promise<{success, data, executionId}>}
   */
  async triggerWebhook(webhookPath, data = {}) {
    const path = webhookPath.startsWith('/') ? webhookPath : `/webhook/${webhookPath}`;
    const res = await this._request('POST', path, data);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      let responseData;
      try { responseData = JSON.parse(res.body); } catch { responseData = res.body; }
      return { success: true, data: responseData };
    }
    return { success: false, error: `HTTP ${res.statusCode}`, body: res.body.slice(0, 200) };
  }

  /**
   * Get execution status
   * @param {string} executionId
   * @returns {Promise<{id, status, startedAt, stoppedAt, data}>}
   */
  async getExecution(executionId) {
    const res = await this._request('GET', `/api/v1/executions/${executionId}`);
    if (res.statusCode !== 200) return null;
    const data = JSON.parse(res.body);
    return {
      id: data.id,
      status: data.finished ? (data.stoppedAt ? 'completed' : 'error') : 'running',
      startedAt: data.startedAt,
      stoppedAt: data.stoppedAt,
      workflowId: data.workflowData?.id,
      mode: data.mode
    };
  }

  /**
   * List recent executions
   * @param {Object} options - { limit, status, workflowId }
   * @returns {Promise<Array>}
   */
  async listExecutions(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit);
    if (options.status) params.set('status', options.status);
    if (options.workflowId) params.set('workflowId', options.workflowId);

    const qs = params.toString();
    const path = `/api/v1/executions${qs ? '?' + qs : ''}`;
    const res = await this._request('GET', path);
    if (res.statusCode !== 200) return [];
    const data = JSON.parse(res.body);
    return data.data || [];
  }

  /**
   * Activate or deactivate a workflow
   * @param {string} workflowId
   * @param {boolean} active
   */
  async setWorkflowActive(workflowId, active) {
    const res = await this._request('PATCH', `/api/v1/workflows/${workflowId}`, { active });
    return res.statusCode === 200;
  }

  _request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const headers = { 'Content-Type': 'application/json' };
      if (this.apiKey) {
        headers['X-N8N-API-KEY'] = this.apiKey;
      }

      const options = {
        hostname: this._host,
        port: this._port,
        path,
        method,
        headers,
        timeout: this.timeout
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('n8n timeout')); });

      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }
}

module.exports = { N8nConnector };
