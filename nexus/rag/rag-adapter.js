/**
 * NEXUS RAG Adapter - RAGPort Implementation
 *
 * Integrates indexer + retriever into the port system.
 * Provides unified interface for document indexing and search.
 *
 * @module nexus/rag/rag-adapter
 */

'use strict';

const { QdrantClient } = require('./qdrant-client');
const { Indexer } = require('./indexer');
const { Retriever } = require('./retriever');

class RAGAdapter {
  constructor(options = {}) {
    this.qdrant = new QdrantClient(options.qdrantOptions);
    this.indexer = new Indexer(options);
    this.retriever = new Retriever(options);
    this._available = null;
  }

  /**
   * Index documents into the vector store
   * @param {Array<{id, content, metadata}>} documents
   * @param {Object} options - { collection, chunkSize }
   * @returns {Promise<{indexed, chunks, collection, reason}>}
   */
  async index(documents, options = {}) {
    if (!await this._checkAvailable()) {
      return { indexed: 0, chunks: 0, reason: 'Qdrant not available' };
    }

    try {
      const result = await this.indexer.index(documents);
      return { ...result, reason: 'success' };
    } catch (e) {
      return { indexed: 0, chunks: 0, reason: `Index error: ${e.message}` };
    }
  }

  /**
   * Search for relevant documents
   * @param {string} query
   * @param {Object} options - { limit, scoreThreshold, filter }
   * @returns {Promise<Array<{text, score, source}>>}
   */
  async search(query, options = {}) {
    if (!await this._checkAvailable()) return [];

    try {
      return await this.retriever.search(query, options);
    } catch {
      return [];
    }
  }

  /**
   * Get RAG pipeline statistics
   * @returns {Promise<{collections, documents, available, reason}>}
   */
  async getStats() {
    if (!await this._checkAvailable()) {
      return { collections: 0, documents: 0, available: false, reason: 'Qdrant not available' };
    }

    try {
      const collections = await this.qdrant.listCollections();
      let totalDocs = 0;
      for (const col of collections) {
        totalDocs += await this.qdrant.countPoints(col);
      }

      return {
        collections: collections.length,
        documents: totalDocs,
        collectionNames: collections,
        available: true,
        reason: 'ok'
      };
    } catch (e) {
      return { collections: 0, documents: 0, available: false, reason: e.message };
    }
  }

  /**
   * Delete a collection
   * @param {string} collectionName
   * @returns {Promise<{success, reason}>}
   */
  async deleteCollection(collectionName) {
    if (!await this._checkAvailable()) {
      return { success: false, reason: 'Qdrant not available' };
    }

    try {
      const ok = await this.qdrant.deleteCollection(collectionName);
      return { success: ok, reason: ok ? 'deleted' : 'delete failed' };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  }

  async _checkAvailable() {
    if (this._available === null) {
      this._available = await this.qdrant.isAvailable();
    }
    return this._available;
  }
}

module.exports = { RAGAdapter };
