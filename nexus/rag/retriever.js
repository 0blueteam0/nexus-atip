/**
 * NEXUS Retriever - Similarity Search + Re-ranking
 *
 * Searches Qdrant for relevant documents and returns
 * ranked results for context injection.
 *
 * @module nexus/rag/retriever
 */

'use strict';

const { QdrantClient } = require('./qdrant-client');
const { Embedder } = require('./embedder');

const DEFAULT_COLLECTION = 'nexus_knowledge';

class Retriever {
  constructor(options = {}) {
    this.qdrant = new QdrantClient(options.qdrantOptions);
    this.embedder = new Embedder(options.embedderOptions);
    this.collectionName = options.collection || DEFAULT_COLLECTION;
    this.defaultLimit = options.limit || 5;
    this.defaultThreshold = options.scoreThreshold || 0.5;
  }

  /**
   * Search for relevant documents
   * @param {string} query
   * @param {Object} options - { limit, scoreThreshold, filter }
   * @returns {Promise<Array<{text, score, source, doc_id, chunk_index}>>}
   */
  async search(query, options = {}) {
    const embedding = await this.embedder.embed(query);

    if (embedding.source === 'zero_fallback') {
      return []; // Can't search without real embeddings
    }

    const results = await this.qdrant.search(this.collectionName, embedding.vector, {
      limit: options.limit || this.defaultLimit,
      scoreThreshold: options.scoreThreshold || this.defaultThreshold,
      filter: options.filter
    });

    return results.map(r => ({
      text: r.payload.text,
      score: r.score,
      source: r.payload.source,
      doc_id: r.payload.doc_id,
      chunk_index: r.payload.chunk_index
    }));
  }

  /**
   * Search and format as context string
   * @param {string} query
   * @param {Object} options
   * @returns {Promise<string>}
   */
  async searchAsContext(query, options = {}) {
    const results = await this.search(query, options);
    if (results.length === 0) return '';

    return results.map((r, i) =>
      `[Source ${i + 1}: ${r.source} (score: ${r.score.toFixed(2)})]\n${r.text}`
    ).join('\n\n---\n\n');
  }
}

module.exports = { Retriever };
