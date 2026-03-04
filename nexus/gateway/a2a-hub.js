/**
 * NEXUS A2A Hub - Agent-to-Agent Protocol Hub
 *
 * Manages agent cards, task delegation between agents,
 * and A2A protocol communication.
 *
 * @module nexus/gateway/a2a-hub
 */

'use strict';

const path = require('path');
const fs = require('fs');

const AGENT_CARDS_DIR = path.join(__dirname, 'agent-cards');

class A2AHub {
  constructor() {
    this._agents = new Map();
    this._taskQueue = [];
    this._loadAgentCards();
  }

  /**
   * Register an agent with its capabilities
   * @param {Object} agentCard - { id, name, capabilities, endpoint }
   */
  registerAgent(agentCard) {
    this._agents.set(agentCard.id, {
      ...agentCard,
      registeredAt: Date.now(),
      status: 'available'
    });
  }

  /**
   * Get all registered agents
   * @returns {Array<{id, name, capabilities, status}>}
   */
  listAgents() {
    return [...this._agents.values()].map(a => ({
      id: a.id,
      name: a.name,
      capabilities: a.capabilities || [],
      status: a.status,
      endpoint: a.endpoint
    }));
  }

  /**
   * Find agents that can handle a specific task
   * @param {string} capability
   * @returns {Array<{id, name}>}
   */
  findAgents(capability) {
    return this.listAgents().filter(a =>
      a.capabilities.some(c =>
        c.toLowerCase().includes(capability.toLowerCase())
      )
    );
  }

  /**
   * Delegate a task to an agent
   * @param {string} agentId
   * @param {Object} task - { type, prompt, context }
   * @returns {{queued, taskId}}
   */
  delegateTask(agentId, task) {
    const agent = this._agents.get(agentId);
    if (!agent) {
      return { queued: false, reason: `Agent not found: ${agentId}` };
    }

    const taskEntry = {
      id: `a2a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      agentId,
      task,
      status: 'queued',
      createdAt: Date.now()
    };

    this._taskQueue.push(taskEntry);
    return { queued: true, taskId: taskEntry.id };
  }

  /**
   * Get hub status
   * @returns {Object}
   */
  getStatus() {
    return {
      agents: this._agents.size,
      queuedTasks: this._taskQueue.filter(t => t.status === 'queued').length,
      agentList: this.listAgents().map(a => `${a.id} (${a.capabilities.length} caps)`)
    };
  }

  _loadAgentCards() {
    // Register built-in NEXUS agents
    const builtinAgents = [
      {
        id: 'claude-code',
        name: 'Claude Code',
        capabilities: ['code_generation', 'architecture', 'mcp_tools', 'file_editing', 'git_ops'],
        endpoint: 'cli://claude-code'
      },
      {
        id: 'gemini-cli',
        name: 'Gemini CLI',
        capabilities: ['web_search', 'large_file_analysis', 'translation', 'multimodal'],
        endpoint: 'cli://gemini-cli'
      },
      {
        id: 'codex-cli',
        name: 'Codex CLI',
        capabilities: ['autonomous_coding', 'sandboxed_execution', 'testing'],
        endpoint: 'cli://codex-cli'
      },
      {
        id: 'ollama-cpu',
        name: 'Ollama CPU',
        capabilities: ['local_inference', 'embedding', 'summarization', 'privacy'],
        endpoint: 'http://localhost:11434'
      }
    ];

    for (const agent of builtinAgents) {
      this.registerAgent(agent);
    }

    // Load custom agent cards from files
    try {
      if (fs.existsSync(AGENT_CARDS_DIR)) {
        const files = fs.readdirSync(AGENT_CARDS_DIR).filter(f => f.endsWith('.json'));
        for (const file of files) {
          try {
            const card = JSON.parse(fs.readFileSync(path.join(AGENT_CARDS_DIR, file), 'utf8'));
            this.registerAgent(card);
          } catch {
            // Skip malformed cards
          }
        }
      }
    } catch {
      // Agent cards dir not available
    }
  }
}

module.exports = { A2AHub };
