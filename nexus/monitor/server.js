/**
 * NEXUS Monitor Server - Real-time Dashboard
 *
 * Lightweight HTTP + SSE server for the monitoring dashboard.
 * Serves static files and provides API/SSE endpoints.
 *
 * Port: 7850 (configurable)
 *
 * @module nexus/monitor/server
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { SSEBridge } = require('./sse-bridge');
const { getEventBus } = require('../core/event-bus');

const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

class MonitorServer {
  constructor(options = {}) {
    this.port = options.port || 7850;
    this.bus = getEventBus();
    this.sseBridge = new SSEBridge();
    this._server = null;
  }

  /**
   * Start the monitoring server
   * @returns {Promise<{started: boolean, port: number, url: string}>}
   */
  start() {
    return new Promise((resolve) => {
      this._server = http.createServer((req, res) => {
        this._handleRequest(req, res);
      });

      this._server.listen(this.port, () => {
        this.bus.emit('monitor:started', { port: this.port });
        resolve({ started: true, port: this.port, url: `http://localhost:${this.port}` });
      });

      this._server.on('error', (err) => {
        resolve({ started: false, port: this.port, error: err.message });
      });
    });
  }

  /**
   * Handle HTTP requests
   */
  _handleRequest(req, res) {
    const url = req.url.split('?')[0];

    // SSE endpoint
    if (url === '/events') {
      return this.sseBridge.addClient(res);
    }

    // API endpoints
    if (url.startsWith('/api/')) {
      return this._handleAPI(url, req, res);
    }

    // Static files
    let filePath = path.join(PUBLIC_DIR, url === '/' ? 'index.html' : url);
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  }

  /**
   * Handle API requests
   */
  _handleAPI(url, req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    switch (url) {
      case '/api/status': {
        const stats = this.bus.getStats();
        res.writeHead(200);
        res.end(JSON.stringify({
          eventBus: stats,
          sse: this.sseBridge.getStats(),
          uptime: process.uptime()
        }));
        break;
      }

      case '/api/history': {
        const history = this.bus.getHistory({ limit: 100 });
        res.writeHead(200);
        res.end(JSON.stringify(history));
        break;
      }

      case '/api/layers': {
        // 7-Layer status for architecture map
        res.writeHead(200);
        res.end(JSON.stringify(this._getLayerStatus()));
        break;
      }

      default:
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Unknown API endpoint' }));
    }
  }

  /**
   * Get 7-layer status for architecture map
   */
  _getLayerStatus() {
    return [
      { id: 'L1', name: 'Infrastructure', status: 'active', ports: ['InfraPort'] },
      { id: 'L2', name: 'AI Models', status: 'active', ports: ['ModelRouterPort', 'LocalLLMPort'] },
      { id: 'L3', name: 'Agent Frameworks', status: 'active', ports: ['AgentFrameworkPort', 'AgentLoopPort'] },
      { id: 'L4', name: 'Orchestration', status: 'active', ports: ['WorkflowPort'] },
      { id: 'L5', name: 'Data/RAG', status: 'active', ports: ['RAGPort', 'MemoryPort'] },
      { id: 'L6', name: 'Observability', status: 'active', ports: ['ObservabilityPort', 'EvolutionPort'] },
      { id: 'L7', name: 'Protocols', status: 'active', ports: ['ToolExecutionPort', 'ContextEnginePort', 'PolicyPort'] }
    ];
  }

  /**
   * Stop the server
   */
  stop() {
    this.sseBridge.close();
    if (this._server) {
      this._server.close();
      this._server = null;
    }
    this.bus.emit('monitor:stopped', {});
  }
}

// CLI: start monitor standalone
if (require.main === module) {
  const server = new MonitorServer();
  server.start().then(result => {
    if (result.started) {
      console.log(`[+] NEXUS Monitor started: ${result.url}`);
      console.log('    Press Ctrl+C to stop');
    } else {
      console.error(`[-] Failed to start: ${result.error}`);
      process.exit(1);
    }
  });
}

module.exports = { MonitorServer };
