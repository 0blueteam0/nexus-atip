/**
 * WebSocket Broadcaster
 *
 * Manages WebSocket connections and broadcasts state updates
 * to all connected Command Center UI clients.
 */

const WebSocket = require('ws');

class Broadcaster {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.clientScopes = new WeakMap(); // ws -> scope ('read'|'write'|'anonymous')
    this.messageQueue = []; // buffer when no clients connected
    this.maxQueueSize = 100;
    this.verbose = process.env.VERBOSE === '1';
    this.auth = null; // set via setAuth()
  }

  setAuth(auth) {
    this.auth = auth;
  }

  /**
   * Attach to an HTTP server
   */
  attach(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      // Validate token if auth is configured
      let scope = 'anonymous';
      if (this.auth) {
        scope = this.auth.validateWsToken(req);
        if (scope === null) {
          ws.close(4001, 'invalid token');
          return;
        }
      }
      this.clients.add(ws);
      this.clientScopes.set(ws, scope);
      const clientIp = req.socket.remoteAddress;
      console.log(`[WS] Client connected (${this.clients.size} total) from ${clientIp} scope=${scope}`);

      // Send queued messages to new client
      for (const msg of this.messageQueue) {
        this._send(ws, msg);
      }
      this.messageQueue = [];

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WS] Client disconnected (${this.clients.size} remaining)`);
      });

      ws.on('error', (err) => {
        console.error('[WS] Client error:', err.message);
        this.clients.delete(ws);
      });

      // Handle incoming messages from UI (commands, requests)
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this._handleClientMessage(ws, msg);
        } catch {
          // ignore malformed messages
        }
      });

      // Send welcome message
      this._send(ws, {
        type: 'welcome',
        data: {
          server: 'command-center-observer',
          version: '0.1.0',
          timestamp: Date.now()
        }
      });
    });

    this.wss.on('error', (err) => {
      console.error('[WS] Server error:', err.message);
    });

    console.log('[WS] Broadcaster attached to server');
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(type, data) {
    const message = { type, data, timestamp: Date.now() };

    if (this.clients.size === 0) {
      // Queue for when a client connects
      this.messageQueue.push(message);
      if (this.messageQueue.length > this.maxQueueSize) {
        this.messageQueue.shift();
      }
      return;
    }

    const dead = [];
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        this._send(client, message);
      } else {
        dead.push(client);
      }
    }

    // Clean up dead connections
    for (const client of dead) {
      this.clients.delete(client);
    }
  }

  /**
   * Send to a specific client
   */
  _send(ws, message) {
    try {
      ws.send(JSON.stringify(message));
    } catch (err) {
      if (this.verbose) console.error('[WS] Send error:', err.message);
    }
  }

  /**
   * Handle messages from UI clients
   */
  _handleClientMessage(ws, msg) {
    switch (msg.type) {
      case 'ping':
        this._send(ws, { type: 'pong', timestamp: Date.now() });
        break;

      case 'request_state':
        // Client requests full state - will be handled by index.js listener
        if (this._onStateRequest) {
          this._onStateRequest(ws);
        }
        break;

      default:
        if (this.verbose) {
          console.log(`[WS] Unknown client message type: ${msg.type}`);
        }
    }
  }

  /**
   * Register a state request handler
   */
  onStateRequest(handler) {
    this._onStateRequest = handler;
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      connected: this.clients.size,
      queuedMessages: this.messageQueue.length
    };
  }

  /**
   * Close all connections
   */
  close() {
    if (this.wss) {
      for (const client of this.clients) {
        client.close();
      }
      this.wss.close();
      this.clients.clear();
      console.log('[WS] Broadcaster closed');
    }
  }
}

module.exports = { Broadcaster };
