/**
 * Event Collector
 *
 * Receives HTTP POST events from Claude Code hooks.
 * Replaces 30 individual hooks with a single HTTP endpoint.
 *
 * Endpoint: POST /event
 * Expected payload:
 *   { type: "tool_use"|"tool_result"|"session_start"|"session_end"|..., data: {...} }
 */

const { analyze } = require('./complexity-detector');

class EventCollector {
  constructor(stateMachine, broadcaster, db) {
    this.stateMachine = stateMachine;
    this.broadcaster = broadcaster;
    this.db = db;
    this.sessionId = null;
    this.verbose = process.env.VERBOSE === '1';
  }

  /**
   * Register Express routes
   */
  registerRoutes(app) {
    // Main event endpoint
    app.post('/event', (req, res) => {
      try {
        this._handleEvent(req.body);
        res.json({ ok: true });
      } catch (err) {
        console.error('[Collector] Event error:', err.message);
        res.status(400).json({ ok: false, error: err.message });
      }
    });

    // Session lifecycle
    app.post('/session/start', (req, res) => {
      this._handleSessionStart(req.body);
      res.json({ ok: true, sessionId: this.sessionId });
    });

    app.post('/session/end', (req, res) => {
      this._handleSessionEnd(req.body);
      res.json({ ok: true });
    });

    // Complexity analysis
    app.post('/analyze', (req, res) => {
      const { input } = req.body;
      const result = analyze(input || '');
      res.json(result);
    });

    // Tool usage tracking
    app.post('/tool', (req, res) => {
      try {
        this._handleToolEvent(req.body);
        res.json({ ok: true });
      } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
      }
    });

    // Query endpoints
    app.get('/state', (req, res) => {
      res.json({
        agents: this.stateMachine.getAll(),
        sessionId: this.sessionId,
        timestamp: Date.now()
      });
    });

    app.get('/stats/tools', (req, res) => {
      const limit = parseInt(req.query.limit) || 20;
      res.json(this.db.getToolStats(limit));
    });

    app.get('/stats/events', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      res.json(this.db.getRecentEvents(limit));
    });

    app.get('/stats/agents', (req, res) => {
      res.json(this.db.getAllAgentStates());
    });

    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        uptime: process.uptime(),
        sessionId: this.sessionId,
        agentCount: Object.keys(this.stateMachine.getAll()).length
      });
    });
  }

  _handleEvent(body) {
    if (!body || !body.type) {
      throw new Error('Missing event type');
    }

    const { type, data = {} } = body;

    // Record raw event
    this.db.recordEvent(type, 'hook', data);

    // Map hook event to state machine event
    const event = this._mapHookEvent(type, data);
    if (event) {
      this.stateMachine.processEvent(event);
    }

    // Broadcast to WebSocket clients
    this.broadcaster.broadcast('hook_event', { type, data, timestamp: Date.now() });

    if (this.verbose) {
      console.log(`[Collector] Event: ${type}`);
    }
  }

  _mapHookEvent(type, data) {
    switch (type) {
      case 'tool_use':
      case 'tool-call':
        return {
          type: 'tool_use',
          agentId: data.agentId || 'main',
          toolName: data.tool_name || data.toolName,
          command: data.command,
          filePath: data.file_path || data.filePath
        };

      case 'tool_result':
      case 'tool-result':
        return {
          type: 'tool_result',
          agentId: data.agentId || 'main',
          error: data.error || data.is_error || false
        };

      case 'session_start':
      case 'session-start':
        this._handleSessionStart(data);
        return { type: 'user_input', agentId: 'main' };

      case 'session_end':
      case 'session-end':
        this._handleSessionEnd(data);
        return { type: 'session_end', agentId: 'main' };

      case 'user_input':
      case 'user-input':
        return { type: 'user_input', agentId: 'main' };

      case 'agent_spawn':
        return {
          type: 'agent_spawn',
          agentId: data.parentId || 'main',
          subAgentId: data.agentId,
          subAgentType: data.agentType
        };

      case 'agent_complete':
        return {
          type: 'agent_complete',
          agentId: data.parentId || 'main',
          subAgentId: data.agentId
        };

      case 'error':
        return {
          type: 'error',
          agentId: data.agentId || 'main'
        };

      default:
        // Unknown event types are still recorded but don't affect state
        return null;
    }
  }

  _handleSessionStart(data = {}) {
    this.sessionId = data.sessionId || `session-${Date.now()}`;
    this.db.startSession(this.sessionId);
    this.broadcaster.broadcast('session_start', { sessionId: this.sessionId });
    console.log(`[Collector] Session started: ${this.sessionId}`);
  }

  _handleSessionEnd(data = {}) {
    if (this.sessionId) {
      this.db.endSession(this.sessionId);
      this.broadcaster.broadcast('session_end', { sessionId: this.sessionId });
      console.log(`[Collector] Session ended: ${this.sessionId}`);
      this.sessionId = null;
    }
  }

  _handleToolEvent(body) {
    if (!body || !body.tool_name) {
      throw new Error('Missing tool_name');
    }

    this.db.recordToolUsage(
      this.sessionId,
      body.tool_name,
      body.mcp_server || null,
      body.duration_ms || null,
      body.success !== false
    );

    this.broadcaster.broadcast('tool_usage', {
      tool: body.tool_name,
      server: body.mcp_server,
      duration: body.duration_ms,
      success: body.success !== false
    });
  }
}

module.exports = { EventCollector };
