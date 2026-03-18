/**
 * NEXUS SSE Bridge - EventBus to Server-Sent Events
 *
 * Converts NEXUS EventBus events into SSE streams
 * for real-time browser consumption.
 *
 * @module nexus/monitor/sse-bridge
 */

'use strict';

const { getEventBus } = require('../core/event-bus');

class SSEBridge {
  constructor() {
    this.bus = getEventBus();
    this._clients = new Set();
    this._eventBuffer = [];
    this._maxBuffer = 100;
    this._heartbeatInterval = null;

    // Subscribe to all events
    this.bus.on('*', (data) => {
      const event = data._event || 'unknown';
      this._broadcast(event, data);
    });
  }

  /**
   * Add an SSE client (HTTP response object)
   * @param {http.ServerResponse} res
   */
  addClient(res) {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send buffered events
    for (const entry of this._eventBuffer) {
      res.write(`event: ${entry.event}\ndata: ${JSON.stringify(entry.data)}\n\n`);
    }

    this._clients.add(res);

    // Remove on disconnect
    res.on('close', () => {
      this._clients.delete(res);
    });

    // Start heartbeat if first client
    if (this._clients.size === 1 && !this._heartbeatInterval) {
      this._heartbeatInterval = setInterval(() => {
        this._broadcast('heartbeat', { timestamp: Date.now(), clients: this._clients.size });
      }, 10000);
    }
  }

  /**
   * Broadcast event to all SSE clients
   */
  _broadcast(event, data) {
    // Buffer event
    this._eventBuffer.push({ event, data, timestamp: Date.now() });
    if (this._eventBuffer.length > this._maxBuffer) {
      this._eventBuffer = this._eventBuffer.slice(-this._maxBuffer);
    }

    // Send to all clients
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this._clients) {
      try {
        client.write(message);
      } catch {
        this._clients.delete(client);
      }
    }
  }

  /**
   * Send a custom event to all clients
   */
  send(event, data) {
    this._broadcast(event, data);
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      clients: this._clients.size,
      bufferedEvents: this._eventBuffer.length
    };
  }

  /**
   * Cleanup
   */
  close() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
    for (const client of this._clients) {
      try { client.end(); } catch {}
    }
    this._clients.clear();
  }
}

module.exports = { SSEBridge };
