/**
 * NEXUS Ollama Adapter - LocalLLMPort Implementation
 *
 * Bridges Ollama CPU inference to the NEXUS port system.
 * Uses ollama-client for HTTP communication.
 * Selects models based on task type from model-registry.json.
 *
 * @module nexus/adapters/ollama-adapter
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { OllamaClient } = require('../local-llm/ollama-client');

const MODEL_REGISTRY_PATH = path.join(__dirname, '../local-llm/model-registry.json');

class OllamaAdapter {
  constructor(options = {}) {
    this.client = new OllamaClient(options);
    this._modelRegistry = null;
    this._available = null;
    this._availableCheckedAt = 0;
    this._cacheTimeout = 30000; // 30s availability cache
  }

  /**
   * Generate text completion via Ollama
   * @param {string} prompt
   * @param {Object} options - { model, taskType, temperature, system, num_predict }
   * @returns {Promise<{text, model, latency_ms, eval_count, reason}>}
   */
  async generate(prompt, options = {}) {
    const available = await this.isAvailable();
    if (!available) {
      return {
        text: '',
        model: 'none',
        reason: 'Ollama not available (CPU mode)',
        latency_ms: 0
      };
    }

    const model = options.model || this._selectModel(options.taskType || 'default');
    const startTime = Date.now();

    try {
      const result = await this.client.generate(model, prompt, {
        temperature: options.temperature,
        system: options.system,
        num_predict: options.num_predict
      });

      return {
        text: result.response,
        model: result.model,
        latency_ms: Date.now() - startTime,
        eval_count: result.eval_count,
        reason: 'ollama_cpu'
      };
    } catch (e) {
      return {
        text: '',
        model,
        reason: `Ollama error: ${e.message}`,
        latency_ms: Date.now() - startTime
      };
    }
  }

  /**
   * List locally installed models
   * @returns {Promise<Array<{name, size, family, parameter_size, quantization}>>}
   */
  async listModels() {
    try {
      return await this.client.listModels();
    } catch {
      return [];
    }
  }

  /**
   * Check if Ollama is running and accessible
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    const now = Date.now();
    if (this._available !== null && now - this._availableCheckedAt < this._cacheTimeout) {
      return this._available;
    }
    this._available = await this.client.isAvailable();
    this._availableCheckedAt = now;
    return this._available;
  }

  /**
   * Get info for a specific model
   * @param {string} modelName
   * @returns {Promise<Object|null>}
   */
  async getModelInfo(modelName) {
    try {
      return await this.client.getModelInfo(modelName);
    } catch {
      return null;
    }
  }

  /**
   * Select model based on task type
   * @private
   */
  _selectModel(taskType) {
    const registry = this._getModelRegistry();
    if (!registry) return 'llama3.2:3b';
    return registry.task_model_map[taskType] || registry.task_model_map.default || 'llama3.2:3b';
  }

  /**
   * Load model registry (cached)
   * @private
   */
  _getModelRegistry() {
    if (this._modelRegistry) return this._modelRegistry;
    try {
      this._modelRegistry = JSON.parse(fs.readFileSync(MODEL_REGISTRY_PATH, 'utf8'));
      return this._modelRegistry;
    } catch {
      return null;
    }
  }
}

module.exports = { OllamaAdapter };
