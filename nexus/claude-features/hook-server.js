/**
 * NEXUS Hook Server - HTTP Hooks for EventBus
 *
 * Claude Code v2.1.63+ HTTP Hooks integration.
 * Exposes NEXUS EventBus events as HTTP POST endpoints
 * and receives external hook notifications.
 *
 * @module nexus/claude-features/hook-server
 */

'use strict';

const http = require('http');
const { getEventBus } = require('../core/event-bus');

class HookServer {
  constructor(options = {}) {
    this.bus = getEventBus();
    this._port = options.port || 7851;
    this._server = null;
    this._webhooks = new Map(); // event -> [url]
    this._receivedHooks = [];
    this._maxHistory = options.maxHistory || 200;
  }

  /**
   * Register a webhook URL for an event pattern
   * @param {string} eventPattern - Event name or wildcard (e.g., 'task:*')
   * @param {string} url - HTTP POST target URL
   */
  registerWebhook(eventPattern, url) {
    if (!this._webhooks.has(eventPattern)) {
      this._webhooks.set(eventPattern, []);
    }
    this._webhooks.get(eventPattern).push(url);

    // Subscribe to EventBus
    this.bus.on(eventPattern, (data) => {
      this._forward(eventPattern, data);
    });
  }

  /**
   * Forward event to registered webhook URLs
   */
  async _forward(event, data) {
    const urls = this._webhooks.get(event) || [];
    for (const url of urls) {
      try {
        const payload = JSON.stringify({
          event,
          data,
          timestamp: Date.now(),
          source: 'nexus'
        });

        // Simple HTTP POST (no external deps)
        const urlObj = new URL(url);
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        };

        await new Promise((resolve) => {
          const req = http.request(options, resolve);
          req.on('error', () => resolve());
          req.write(payload);
          req.end();
        });
      } catch {
        // Non-fatal: webhook delivery failure
      }
    }
  }

  /**
   * Start HTTP server to receive incoming hooks
   * @returns {Promise<{started: boolean, port: number}>}
   */
  start() {
    return new Promise((resolve) => {
      this._server = http.createServer((req, res) => {
        if (req.method === 'POST' && req.url === '/hook') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              this._receivedHooks.push({ ...payload, receivedAt: Date.now() });
              if (this._receivedHooks.length > this._maxHistory) {
                this._receivedHooks = this._receivedHooks.slice(-this._maxHistory);
              }

              // Re-emit on EventBus
              if (payload.event) {
                this.bus.emit(`hook:${payload.event}`, payload.data || {});
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ received: true }));
            } catch {
              res.writeHead(400);
              res.end('Invalid JSON');
            }
          });
        } else if (req.method === 'GET' && req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', webhooks: this._webhooks.size }));
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      });

      this._server.listen(this._port, () => {
        resolve({ started: true, port: this._port });
      });

      this._server.on('error', () => {
        resolve({ started: false, port: this._port, reason: 'Port in use' });
      });
    });
  }

  /**
   * Stop the server
   */
  stop() {
    if (this._server) {
      this._server.close();
      this._server = null;
    }
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      running: !!this._server,
      port: this._port,
      webhookCount: this._webhooks.size,
      receivedHooks: this._receivedHooks.length
    };
  }
}

module.exports = { HookServer };
