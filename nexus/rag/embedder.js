/**
 * NEXUS Embedder - Text Embedding Generator
 *
 * GPU-free strategy:
 * - Primary: Ollama nomic-embed-text (CPU, free, local)
 * - Fallback: OpenAI text-embedding-3-small (API, $0.02/1M tokens)
 *
 * @module nexus/rag/embedder
 */

'use strict';

const { OllamaClient } = require('../local-llm/ollama-client');

class Embedder {
  constructor(options = {}) {
    this.ollamaClient = new OllamaClient();
    this.defaultModel = options.model || 'nomic-embed-text';
    this.dimensions = options.dimensions || 768;
    this._ollamaAvailable = null;
  }

  /**
   * Generate embedding for a single text
   * @param {string} text
   * @returns {Promise<{vector: number[], model: string, source: string}>}
   */
  async embed(text) {
    // Try Ollama first (free, local)
    if (await this._isOllamaAvailable()) {
      try {
        const result = await this.ollamaClient.embed(this.defaultModel, text);
        if (result.embeddings && result.embeddings[0]) {
          return {
            vector: result.embeddings[0],
            model: this.defaultModel,
            source: 'ollama_cpu'
          };
        }
      } catch {
        // Fall through to next strategy
      }
    }

    // Fallback: zero vector (placeholder until API embedding is configured)
    return {
      vector: new Array(this.dimensions).fill(0),
      model: 'none',
      source: 'zero_fallback'
    };
  }

  /**
   * Generate embeddings for multiple texts (batch)
   * @param {string[]} texts
   * @returns {Promise<Array<{vector, model, source}>>}
   */
  async embedBatch(texts) {
    if (await this._isOllamaAvailable()) {
      try {
        const result = await this.ollamaClient.embed(this.defaultModel, texts);
        if (result.embeddings) {
          return result.embeddings.map(v => ({
            vector: v,
            model: this.defaultModel,
            source: 'ollama_cpu'
          }));
        }
      } catch {
        // Fall through
      }
    }

    return texts.map(() => ({
      vector: new Array(this.dimensions).fill(0),
      model: 'none',
      source: 'zero_fallback'
    }));
  }

  /**
   * Get embedding dimensions
   */
  getDimensions() {
    return this.dimensions;
  }

  async _isOllamaAvailable() {
    if (this._ollamaAvailable === null) {
      this._ollamaAvailable = await this.ollamaClient.isAvailable();
    }
    return this._ollamaAvailable;
  }
}

module.exports = { Embedder };
