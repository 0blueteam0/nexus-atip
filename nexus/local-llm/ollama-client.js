/**
 * NEXUS Ollama HTTP Client
 *
 * Lightweight REST client for Ollama API (CPU mode).
 * Handles generate, chat, embeddings, model listing.
 *
 * @module nexus/local-llm/ollama-client
 */

'use strict';

const http = require('http');

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_TIMEOUT = 120000; // 2min for CPU inference

class OllamaClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    const url = new URL(this.baseUrl);
    this._host = url.hostname;
    this._port = parseInt(url.port) || 11434;
  }

  /**
   * Check if Ollama is running
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const res = await this._request('GET', '/api/tags');
      return res.statusCode === 200;
    } catch {
      return false;
    }
  }

  /**
   * List installed models
   * @returns {Promise<Array<{name, size, modified_at, details}>>}
   */
  async listModels() {
    const res = await this._request('GET', '/api/tags');
    if (res.statusCode !== 200) {
      throw new Error(`Ollama listModels failed: ${res.statusCode}`);
    }
    const data = JSON.parse(res.body);
    return (data.models || []).map(m => ({
      name: m.name,
      size: m.size,
      modified_at: m.modified_at,
      family: m.details?.family || 'unknown',
      parameter_size: m.details?.parameter_size || 'unknown',
      quantization: m.details?.quantization_level || 'unknown'
    }));
  }

  /**
   * Get info for a specific model
   * @param {string} modelName
   * @returns {Promise<Object>}
   */
  async getModelInfo(modelName) {
    const res = await this._request('POST', '/api/show', { name: modelName });
    if (res.statusCode !== 200) return null;
    return JSON.parse(res.body);
  }

  /**
   * Generate completion (non-streaming)
   * @param {string} model
   * @param {string} prompt
   * @param {Object} options - { temperature, top_p, num_predict, system }
   * @returns {Promise<{response, model, total_duration, eval_count}>}
   */
  async generate(model, prompt, options = {}) {
    const body = {
      model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 0.9,
        num_predict: options.num_predict ?? 2048
      }
    };
    if (options.system) body.system = options.system;

    const res = await this._request('POST', '/api/generate', body);
    if (res.statusCode !== 200) {
      throw new Error(`Ollama generate failed: ${res.statusCode} - ${res.body.slice(0, 200)}`);
    }
    const data = JSON.parse(res.body);
    return {
      response: data.response,
      model: data.model,
      total_duration_ms: Math.round((data.total_duration || 0) / 1e6),
      eval_count: data.eval_count || 0,
      eval_duration_ms: Math.round((data.eval_duration || 0) / 1e6)
    };
  }

  /**
   * Generate embeddings
   * @param {string} model - e.g. 'nomic-embed-text'
   * @param {string|string[]} input
   * @returns {Promise<{embeddings: number[][]}>}
   */
  async embed(model, input) {
    const res = await this._request('POST', '/api/embed', {
      model,
      input: Array.isArray(input) ? input : [input]
    });
    if (res.statusCode !== 200) {
      throw new Error(`Ollama embed failed: ${res.statusCode}`);
    }
    return JSON.parse(res.body);
  }

  /**
   * Low-level HTTP request
   * @private
   */
  _request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this._host,
        port: this._port,
        path,
        method,
        headers: { 'Content-Type': 'application/json' },
        timeout: this.timeout
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body: data });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Ollama request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }
}

module.exports = { OllamaClient };
