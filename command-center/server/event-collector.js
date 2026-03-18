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

// Feature flags for active hook behavior
const HOOK_CONTEXT_HINTS = process.env.HOOK_CONTEXT_HINTS === '1';
const HOOK_BLOCK_DESTRUCTIVE = process.env.HOOK_BLOCK_DESTRUCTIVE !== '0'; // ON by default
const HINT_CONFIDENCE_THRESHOLD = 0.85;

// Destructive command patterns to block
const DESTRUCTIVE_PATTERNS = [
  /rm\s+(-rf?|--force)\s+[\/~]/i,
  /git\s+(reset\s+--hard|push\s+--force|clean\s+-f)/i,
  /del\s+\/[sq]/i,
  /format\s+[a-z]:/i,
  /DROP\s+(TABLE|DATABASE)/i,
  /TRUNCATE\s+TABLE/i
];

class EventCollector {
  constructor(stateMachine, broadcaster, db, router, antifragile) {
    this.stateMachine = stateMachine;
    this.broadcaster = broadcaster;
    this.db = db;
    this._router = router || null;
    this._antifragile = antifragile || null;
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

    // Claude Code HTTP hook endpoint (smart active response)
    app.post('/hook', (req, res) => {
      try {
        const data = req.body;
        if (!data || !data.hook_event_name) {
          res.json({ ok: true });
          return;
        }

        const event = data.hook_event_name;
        const sessionId = data.session_id;

        // === ACTIVE BEHAVIOR: PreToolUse ===
        if (event === 'PreToolUse') {
          const response = this._handlePreToolUseActive(data);
          res.json(response);
        } else {
          res.json({ ok: true });
        }

        // Map to Observer internal events
        const mapped = this._mapClaudeHook(event, data);
        if (mapped) {
          this.stateMachine.processEvent(mapped);
        }

        // Record raw event for learning
        this.db.recordEvent(`hook:${event}`, 'claude-hook', {
          session_id: sessionId,
          tool_name: data.tool_name,
          model: data.model,
          _pid: data._pid
        });

        // Broadcast to WS clients
        this.broadcaster.broadcast('hook_event', {
          type: event,
          session_id: sessionId,
          tool_name: data.tool_name,
          timestamp: data._timestamp || Date.now()
        });

        if (this.verbose) {
          console.log(`[Hook] ${event} session=${(sessionId || '').slice(0, 8)} tool=${data.tool_name || '-'}`);
        }
      } catch (err) {
        res.json({ ok: true }); // never block on error
        if (this.verbose) console.error('[Hook] Error:', err.message);
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

  /**
   * Smart active response for PreToolUse hooks.
   * Feature-flagged: security gate + context hints.
   */
  _handlePreToolUseActive(data) {
    const toolName = data.tool_name;
    const toolInput = data.tool_input || {};
    const response = {};

    // 1. Security Gate: block destructive commands (ON by default)
    if (HOOK_BLOCK_DESTRUCTIVE && toolName === 'Bash' && toolInput.command) {
      for (const pattern of DESTRUCTIVE_PATTERNS) {
        if (pattern.test(toolInput.command)) {
          this.db.recordEvent('hook:blocked_destructive', 'security-gate', {
            tool: toolName,
            command: toolInput.command.slice(0, 200),
            pattern: pattern.source
          });
          return {
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason: `[Observer Security Gate] Destructive command blocked: ${toolInput.command.slice(0, 80)}`
            }
          };
        }
      }
    }

    // 2. Antifragile no-op check: if recent failure rate is high, recommend inaction
    if (this._antifragile && process.env.ENABLE_ANTIFRAGILE_GATE === '1') {
      const intent = this._inferToolIntent(toolName);
      const noOp = this._antifragile.evaluateNoOp({
        intent: intent || 'unknown',
        currentState: this.stateMachine.getAll().main?.state || 'active',
        recentFailures: null
      });
      if (!noOp.shouldAct) {
        this.db.recordEvent('antifragile:no_op', 'iatrogenics-check', {
          tool: toolName, reason: noOp.reason, confidence: noOp.confidence
        });
        return {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            additionalContext: `[Antifragile] Iatrogenics warning: ${noOp.reason} (confidence: ${noOp.confidence})`
          }
        };
      }
    }

    // 3. Context Hints: provide routing hints for high-confidence intents
    if (HOOK_CONTEXT_HINTS && this._router) {
      try {
        const intent = this._inferToolIntent(toolName);
        if (intent) {
          const tools = this.db.getBestToolsForIntent ? this.db.getBestToolsForIntent(intent, 3) : [];
          const bestTool = tools[0];

          if (bestTool && bestTool.weight >= HINT_CONFIDENCE_THRESHOLD && bestTool.tool_name !== toolName) {
            response.hookSpecificOutput = {
              hookEventName: 'PreToolUse',
              additionalContext: `[Observer Hint] For ${intent}: ${bestTool.tool_name} has ${Math.round(bestTool.weight * 100)}% success rate vs current tool.`
            };
          }
        }
      } catch { /* hints are best-effort */ }
    }

    return Object.keys(response).length > 0 ? response : { ok: true };
  }

  /**
   * Infer intent from tool name for context hints
   */
  _inferToolIntent(toolName) {
    const map = {
      'Read': 'file_operation', 'Write': 'file_operation', 'Edit': 'file_operation',
      'Glob': 'code_search', 'Grep': 'code_search',
      'Bash': 'testing', 'Agent': 'architecture',
      'WebSearch': 'web_search', 'WebFetch': 'web_scrape',
    };
    if (toolName && toolName.startsWith('mcp__')) {
      if (toolName.includes('desktop-commander')) return 'file_operation';
      if (toolName.includes('serena')) return 'code_search';
      if (toolName.includes('firecrawl') || toolName.includes('one-search')) return 'web_search';
      if (toolName.includes('github') || toolName.includes('git-mcp')) return 'git_operation';
      if (toolName.includes('sequential-thinking')) return 'architecture';
    }
    return map[toolName] || null;
  }

  _mapClaudeHook(event, data) {
    const sessionId = data.session_id;
    switch (event) {
      case 'SessionStart':
        this._handleSessionStart({ sessionId });
        return { type: 'user_input', agentId: 'main' };

      case 'SessionEnd':
        this._handleSessionEnd({ sessionId });
        return { type: 'session_end', agentId: 'main' };

      case 'PreToolUse':
        return {
          type: 'tool_use',
          agentId: data.agent_id || 'main',
          toolName: data.tool_name,
          command: data.tool_input?.command,
          filePath: data.tool_input?.file_path || data.tool_input?.path
        };

      case 'PostToolUse':
        // Record tool usage for learning
        if (data.tool_name) {
          this.db.recordToolUsage(
            sessionId, data.tool_name, null,
            data.tool_response?.duration_ms || null,
            !data.tool_response?.is_error
          );
        }
        return {
          type: 'tool_result',
          agentId: data.agent_id || 'main',
          error: data.tool_response?.is_error || false
        };

      case 'PostToolUseFailure':
        // Record failure in antifragile engine for enriched learning
        if (this._antifragile) {
          this._antifragile.recordFailure({
            toolName: data.tool_name,
            intent: this._inferToolIntent(data.tool_name) || 'unknown',
            error: data.tool_response?.error || data.error || 'tool use failure',
            context: { session_id: data.session_id, agent_id: data.agent_id }
          });
        }
        return {
          type: 'tool_result',
          agentId: data.agent_id || 'main',
          error: true
        };

      case 'UserPromptSubmit':
        // Feed prompt to router for intent analysis
        if (data.prompt) {
          this.db.recordEvent('user_prompt', 'claude-hook', {
            prompt_length: data.prompt.length,
            session_id: data.session_id
          });
        }
        return { type: 'user_input', agentId: 'main' };

      case 'SubagentStart':
        return {
          type: 'agent_spawn',
          agentId: 'main',
          subAgentId: data.agent_id,
          subAgentType: data.agent_type
        };

      case 'SubagentStop':
        return {
          type: 'agent_complete',
          agentId: 'main',
          subAgentId: data.agent_id
        };

      case 'Stop':
        return { type: 'session_end', agentId: 'main' };

      default:
        return null;
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
