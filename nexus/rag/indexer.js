/**
 * NEXUS Indexer - Document Chunking + Vector Indexing
 *
 * Splits documents into chunks, generates embeddings,
 * and upserts into Qdrant vector DB.
 *
 * @module nexus/rag/indexer
 */

'use strict';

const crypto = require('crypto');
const { QdrantClient } = require('./qdrant-client');
const { Embedder } = require('./embedder');

const DEFAULT_COLLECTION = 'nexus_knowledge';
const DEFAULT_CHUNK_SIZE = 512;    // tokens (~2048 chars)
const DEFAULT_CHUNK_OVERLAP = 64;  // tokens (~256 chars)

class Indexer {
  constructor(options = {}) {
    this.qdrant = new QdrantClient(options.qdrantOptions);
    this.embedder = new Embedder(options.embedderOptions);
    this.collectionName = options.collection || DEFAULT_COLLECTION;
    this.chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
    this.chunkOverlap = options.chunkOverlap || DEFAULT_CHUNK_OVERLAP;
  }

  /**
   * Index an array of documents
   * @param {Array<{id, content, metadata}>} documents
   * @returns {Promise<{indexed, chunks, collection}>}
   */
  async index(documents) {
    // Ensure collection exists
    await this._ensureCollection();

    let totalChunks = 0;
    const batchSize = 10;

    for (const doc of documents) {
      const chunks = this._chunkText(doc.content, doc.id, doc.metadata);
      totalChunks += chunks.length;

      // Process in batches
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const texts = batch.map(c => c.text);
        const embeddings = await this.embedder.embedBatch(texts);

        const points = batch.map((chunk, idx) => ({
          id: this._hashId(chunk.docId + '_' + chunk.chunkIndex),
          vector: embeddings[idx].vector,
          payload: {
            text: chunk.text,
            doc_id: chunk.docId,
            chunk_index: chunk.chunkIndex,
            source: chunk.metadata?.source || 'unknown',
            ...chunk.metadata
          }
        }));

        await this.qdrant.upsertPoints(this.collectionName, points);
      }
    }

    return {
      indexed: documents.length,
      chunks: totalChunks,
      collection: this.collectionName
    };
  }

  /**
   * Split text into overlapping chunks
   * @private
   */
  _chunkText(text, docId, metadata = {}) {
    if (!text) return [];

    // Simple character-based chunking (chars ~= tokens * 4)
    const charChunkSize = this.chunkSize * 4;
    const charOverlap = this.chunkOverlap * 4;
    const chunks = [];
    let start = 0;
    let index = 0;

    while (start < text.length) {
      let end = Math.min(start + charChunkSize, text.length);

      // Try to break at sentence/paragraph boundary
      if (end < text.length) {
        const breakPoint = text.lastIndexOf('\n', end);
        if (breakPoint > start + charChunkSize * 0.5) {
          end = breakPoint + 1;
        }
      }

      chunks.push({
        text: text.slice(start, end).trim(),
        docId,
        chunkIndex: index,
        metadata
      });

      start = end - charOverlap;
      if (start >= text.length) break;
      index++;
    }

    return chunks;
  }

  /**
   * Create deterministic integer ID from string
   * @private
   */
  _hashId(str) {
    const hash = crypto.createHash('md5').update(str).digest('hex');
    // Qdrant expects integer or UUID; use first 8 hex chars as integer
    return parseInt(hash.slice(0, 15), 16);
  }

  async _ensureCollection() {
    const collections = await this.qdrant.listCollections();
    if (!collections.includes(this.collectionName)) {
      await this.qdrant.createCollection(
        this.collectionName,
        this.embedder.getDimensions()
      );
    }
  }
}

module.exports = { Indexer };
