/**
 * NEXUS InfraPort Adapter - Infrastructure Management (L1)
 *
 * Manages Docker containers, Ollama, Qdrant, and other services.
 * Wraps existing start-scripts/*.bat and docker commands.
 *
 * @module nexus/infra/infra-adapter
 */

'use strict';

const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const GENAI_ROOT = path.resolve(__dirname, '../..');
const DOCKER_STATUS_PATH = path.join(GENAI_ROOT, 'data', 'docker-status.json');

const SERVICE_REGISTRY = {
  docker: {
    type: 'runtime',
    check: 'docker info',
    layer: 'L1'
  },
  ollama: {
    type: 'local-llm',
    check: 'curl -s http://localhost:11434/api/tags',
    start: path.join(GENAI_ROOT, 'start-scripts/ai-stack/start-ollama.bat'),
    layer: 'L2'
  },
  qdrant: {
    type: 'vector-db',
    check: 'curl -s http://localhost:6333/collections',
    start: path.join(GENAI_ROOT, 'start-scripts/ai-stack/start-qdrant.bat'),
    layer: 'L5'
  },
  n8n: {
    type: 'workflow',
    check: 'curl -s http://localhost:5678/api/v1/workflows',
    container: 'n8n-automation',
    layer: 'L4'
  },
  firecrawl: {
    type: 'crawling',
    check: 'curl -s http://localhost:3002/v1/health',
    container: 'firecrawl-api-1',
    layer: 'L7'
  },
  searxng: {
    type: 'search',
    check: 'curl -s http://localhost:8082',
    container: 'searxng',
    layer: 'L7'
  }
};

class InfraAdapter {
  constructor() {
    this._statusCache = new Map();
    this._cacheTimeout = 10000; // 10s cache
  }

  /**
   * Get status of a specific service
   */
  async getServiceStatus(serviceName) {
    const service = SERVICE_REGISTRY[serviceName];
    if (!service) {
      return { name: serviceName, status: 'unknown', reason: 'Service not in registry' };
    }

    // Check cache
    const cached = this._statusCache.get(serviceName);
    if (cached && Date.now() - cached.timestamp < this._cacheTimeout) {
      return cached.data;
    }

    const result = await this._checkService(serviceName, service);
    this._statusCache.set(serviceName, { data: result, timestamp: Date.now() });
    return result;
  }

  /**
   * Start a service
   */
  async startService(serviceName) {
    const service = SERVICE_REGISTRY[serviceName];
    if (!service) {
      return { success: false, reason: `Unknown service: ${serviceName}` };
    }

    try {
      if (service.container) {
        execSync(`docker start ${service.container}`, { timeout: 30000, stdio: 'pipe' });
        return { success: true, method: 'docker-start', service: serviceName };
      }

      if (service.start && fs.existsSync(service.start)) {
        exec(`"${service.start}"`, { timeout: 60000 });
        return { success: true, method: 'bat-script', service: serviceName };
      }

      return { success: false, reason: `No start method for ${serviceName}` };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  }

  /**
   * Stop a service
   */
  async stopService(serviceName) {
    const service = SERVICE_REGISTRY[serviceName];
    if (!service) {
      return { success: false, reason: `Unknown service: ${serviceName}` };
    }

    try {
      if (service.container) {
        execSync(`docker stop ${service.container}`, { timeout: 30000, stdio: 'pipe' });
        return { success: true, method: 'docker-stop', service: serviceName };
      }

      return { success: false, reason: `No stop method for ${serviceName}` };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  }

  /**
   * List all registered services with their status
   */
  async listServices() {
    const results = [];
    for (const [name, service] of Object.entries(SERVICE_REGISTRY)) {
      const status = await this.getServiceStatus(name);
      results.push({
        name,
        type: service.type,
        layer: service.layer,
        ...status
      });
    }
    return results;
  }

  /**
   * Check if a service is running
   */
  async _checkService(name, service) {
    try {
      if (service.check) {
        const output = execSync(service.check, {
          timeout: 5000,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        return {
          name,
          status: 'running',
          layer: service.layer,
          type: service.type,
          response: output.slice(0, 200)
        };
      }
      return { name, status: 'unknown', layer: service.layer, type: service.type };
    } catch (e) {
      return {
        name,
        status: 'stopped',
        layer: service.layer,
        type: service.type,
        error: e.message.slice(0, 100)
      };
    }
  }
}

module.exports = { InfraAdapter };
