/**
 * Agent State Machine
 *
 * Manages agent states based on observed transcript events.
 * Replaces ATOS execution-monitor + NEXUS orchestrator state tracking.
 *
 * States:
 *   idle -> thinking -> coding -> searching -> testing -> waiting -> idle
 *                                                           |
 *   error -> recovering -> idle
 */

const db = require('./db');

const VALID_STATES = [
  'idle', 'thinking', 'coding', 'searching',
  'testing', 'waiting', 'error', 'recovering'
];

const TOOL_TO_STATE = {
  // File operations -> coding
  'Edit': 'coding',
  'Write': 'coding',
  'NotebookEdit': 'coding',
  'desktop-commander__write_file': 'coding',
  'desktop-commander__edit_block': 'coding',
  'edit-file-lines__edit_file_lines': 'coding',

  // Read/search -> searching
  'Read': 'searching',
  'Glob': 'searching',
  'Grep': 'searching',
  'desktop-commander__read_file': 'searching',
  'desktop-commander__search_code': 'searching',
  'desktop-commander__search_files': 'searching',
  'desktop-commander__list_directory': 'searching',

  // Testing -> testing
  'Bash': 'testing', // default for bash, refined by command content

  // Agents -> thinking
  'Agent': 'thinking',

  // Web/research -> searching
  'WebFetch': 'searching',
  'WebSearch': 'searching'
};

// Patterns in bash commands that indicate specific states
const BASH_STATE_PATTERNS = [
  { pattern: /npm\s+test|jest|pytest|mocha|vitest/i, state: 'testing' },
  { pattern: /npm\s+run\s+build|tsc|webpack|vite\s+build/i, state: 'coding' },
  { pattern: /git\s+(log|status|diff|show)/i, state: 'searching' },
  { pattern: /git\s+(add|commit|push|merge)/i, state: 'coding' },
  { pattern: /ls|find|cat|head|tail|grep/i, state: 'searching' },
  { pattern: /curl|wget|fetch/i, state: 'searching' },
  { pattern: /docker|podman/i, state: 'testing' },
  { pattern: /node.*test|python.*test/i, state: 'testing' }
];

class AgentStateMachine {
  constructor() {
    this.agents = new Map(); // agentId -> { state, tool, file, lastChange }
    this.listeners = [];
  }

  /**
   * Process a transcript event and update agent state
   */
  processEvent(event) {
    const agentId = event.agentId || 'main';
    const current = this.agents.get(agentId) || {
      state: 'idle', tool: null, file: null, lastChange: Date.now()
    };

    let newState = current.state;
    let tool = current.tool;
    let file = current.file;

    switch (event.type) {
      case 'tool_use':
        tool = event.toolName;
        file = event.filePath || current.file;
        newState = this._resolveToolState(event.toolName, event.command);
        break;

      case 'tool_result':
        if (event.error) {
          newState = 'error';
        }
        // Stay in current state until next event
        break;

      case 'text_output':
        // Claude is generating text -> thinking
        if (current.state === 'idle' || current.state === 'waiting') {
          newState = 'thinking';
        }
        break;

      case 'user_input':
        newState = 'thinking';
        tool = null;
        break;

      case 'session_end':
        newState = 'idle';
        tool = null;
        file = null;
        break;

      case 'agent_spawn':
        // Track sub-agent
        const subId = event.subAgentId || `sub-${Date.now()}`;
        this.agents.set(subId, {
          state: 'thinking',
          tool: null,
          file: null,
          lastChange: Date.now(),
          parent: agentId,
          type: event.subAgentType || 'general'
        });
        db.upsertAgentState(subId, 'thinking', null, null);
        this._emit('agent_spawn', { agentId: subId, parent: agentId });
        break;

      case 'agent_complete':
        const subAgent = event.subAgentId;
        if (subAgent && this.agents.has(subAgent)) {
          this.agents.get(subAgent).state = 'idle';
          db.upsertAgentState(subAgent, 'idle', null, null);
          this._emit('state_change', { agentId: subAgent, state: 'idle' });
        }
        break;

      case 'error':
        newState = 'error';
        break;

      case 'recovering':
        newState = 'recovering';
        break;
    }

    // Apply transition
    if (newState !== current.state || tool !== current.tool) {
      this.agents.set(agentId, {
        ...current,
        state: newState,
        tool,
        file,
        lastChange: Date.now()
      });

      db.upsertAgentState(agentId, newState, tool, file);

      this._emit('state_change', {
        agentId,
        previousState: current.state,
        state: newState,
        tool,
        file,
        timestamp: Date.now()
      });
    }
  }

  _resolveToolState(toolName, command) {
    if (!toolName) return 'thinking';

    // Check MCP tool mappings (strip server prefix)
    const shortName = toolName.includes('__')
      ? toolName.split('__').slice(-1)[0]
      : toolName;

    // Direct mapping
    if (TOOL_TO_STATE[toolName]) {
      const state = TOOL_TO_STATE[toolName];
      // Refine Bash state based on command content
      if (toolName === 'Bash' && command) {
        for (const { pattern, state: bashState } of BASH_STATE_PATTERNS) {
          if (pattern.test(command)) return bashState;
        }
      }
      return state;
    }

    // MCP tool heuristics
    if (toolName.includes('read') || toolName.includes('search') || toolName.includes('list')) {
      return 'searching';
    }
    if (toolName.includes('write') || toolName.includes('edit') || toolName.includes('create')) {
      return 'coding';
    }
    if (toolName.includes('execute') || toolName.includes('run')) {
      return 'testing';
    }

    return 'thinking'; // default for unknown tools
  }

  /**
   * Get current state of all agents
   */
  getAll() {
    const result = {};
    for (const [id, state] of this.agents) {
      result[id] = { ...state };
    }
    return result;
  }

  /**
   * Get state of a specific agent
   */
  get(agentId) {
    return this.agents.get(agentId) || { state: 'idle', tool: null, file: null };
  }

  /**
   * Auto-idle agents that haven't changed state in timeout ms
   */
  checkTimeouts(timeoutMs = 120000) {
    const now = Date.now();
    for (const [id, agent] of this.agents) {
      if (agent.state !== 'idle' && (now - agent.lastChange) > timeoutMs) {
        agent.state = 'idle';
        agent.tool = null;
        db.upsertAgentState(id, 'idle', null, agent.file);
        this._emit('state_change', { agentId: id, state: 'idle', reason: 'timeout' });
      }
    }
  }

  onStateChange(listener) {
    this.listeners.push(listener);
  }

  _emit(type, data) {
    for (const listener of this.listeners) {
      try { listener(type, data); } catch (e) { /* ignore */ }
    }
  }
}

module.exports = { AgentStateMachine, VALID_STATES, TOOL_TO_STATE };
