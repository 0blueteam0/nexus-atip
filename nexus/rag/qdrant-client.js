/**
 * NEXUS Qdrant Client - Vector DB HTTP Client
 *
 * Lightweight REST client for Qdrant vector database.
 * Manages collections, points (vectors), and search.
 *
 * @module nexus/rag/qdrant-client
 */

'use strict';

const http = require('http');

const DEFAULT_BASE_URL = 'http://localhost:6333';
const DEFAULT_TIMEOUT = 30000;

class QdrantClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    const url = new URL(this.baseUrl);
    this._host = url.hostname;
    this._port = parseInt(url.port) || 6333;
  }

  async isAvailable() {
    try {
      const res = await this._request('GET', '/collections');
      return res.statusCode === 200;
    } catch {
      return false;
    }
  }

  async listCollections() {
    const res = await this._request('GET', '/collections');
    if (res.statusCode !== 200) return [];
    const data = JSON.parse(res.body);
    return (data.result?.collections || []).map(c => c.name);
  }

  async createCollection(name, vectorSize = 768, distance = 'Cosine') {
    const body = {
      vectors: { size: vectorSize, distance }
    };
    const res = await this._request('PUT', `/collections/${name}`, body);
    return res.statusCode === 200;
  }

  async deleteCollection(name) {
    const res = await this._request('DELETE', `/collections/${name}`);
    return res.statusCode === 200;
  }

  async getCollectionInfo(name) {
    const res = await this._request('GET', `/collections/${name}`);
    if (res.statusCode !== 200) return null;
    return JSON.parse(res.body).result;
  }

  async upsertPoints(collectionName, points) {
    const body = { points };
    const res = await this._request('PUT', `/collections/${collectionName}/points`, body);
    return res.statusCode === 200;
  }

  async search(collectionName, vector, options = {}) {
    const body = {
      vector,
      limit: options.limit || 5,
      with_payload: true,
      score_threshold: options.scoreThreshold || 0.5
    };
    if (options.filter) body.filter = options.filter;

    const res = await this._request('POST', `/collections/${collectionName}/points/search`, body);
    if (res.statusCode !== 200) return [];
    const data = JSON.parse(res.body);
    return (data.result || []).map(r => ({
      id: r.id,
      score: r.score,
      payload: r.payload
    }));
  }

  async countPoints(collectionName) {
    const res = await this._request('POST', `/collections/${collectionName}/points/count`, { exact: true });
    if (res.statusCode !== 200) return 0;
    return JSON.parse(res.body).result?.count || 0;
  }

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
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Qdrant timeout')); });

      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }
}

module.exports = { QdrantClient };
