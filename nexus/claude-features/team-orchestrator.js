/**
 * NEXUS Team Orchestrator - Claude Agent Teams Integration
 *
 * Wraps Claude Code v2.1.32+ Agent Teams / Swarm pattern.
 * Provides TeammateTool-style parallel agent coordination
 * through the NEXUS orchestration layer.
 *
 * Operations: start, message, status, list, cancel
 *
 * @module nexus/claude-features/team-orchestrator
 */

'use strict';

const { getEventBus } = require('../core/event-bus');

class TeamOrchestrator {
  constructor(options = {}) {
    this.bus = getEventBus();
    this._teams = new Map();
    this._maxTeamSize = options.maxTeamSize || 8;
    this._enabled = options.enabled !== false;
    this._timeoutMs = options.timeoutMs || 300000;
    this._a2aHub = null;

    // Wire up hook events from Claude Code v2.1.71
    this._setupHookListeners();
  }

  /**
   * Listen for Claude Code hook events via EventBus
   * Bridges native Agent Teams events to NEXUS team tracking
   */
  _setupHookListeners() {
    // SubagentStart -> auto-track as team member activity
    this.bus.on('hook:SubagentStart', (data) => {
      const activeTeam = this._getActiveTeam();
      if (activeTeam) {
        const idle = activeTeam.members.find(m => m.status === 'idle');
        if (idle) {
          idle.status = 'working';
          idle.startedAt = Date.now();
          idle.externalAgentId = data.agentId;
          this.bus.emit('team:member:dispatched', {
            teamId: activeTeam.id, memberId: idle.id, agentId: data.agentId
          });
        }
      }
    });

    // TaskCompleted -> auto-complete team member
    this.bus.on('hook:TaskCompleted', (data) => {
      const activeTeam = this._getActiveTeam();
      if (activeTeam) {
        const working = activeTeam.members.find(
          m => m.status === 'working' && m.externalAgentId === data.agentId
        );
        if (working) {
          this.memberComplete(activeTeam.id, working.id, {
            success: data.success !== false,
            taskId: data.taskId
          });
        }
      }
    });

    // TeammateIdle -> track idle state for work redistribution
    this.bus.on('hook:TeammateIdle', (data) => {
      this.bus.emit('team:member:idle', {
        agentName: data.agentName,
        teamName: data.teamName
      });
    });
  }

  /**
   * Get the first active team (most recent)
   * @private
   */
  _getActiveTeam() {
    for (const [, team] of this._teams) {
      if (team.status === 'active') return team;
    }
    return null;
  }

  /**
   * Connect to A2AHub for cross-provider team dispatch
   * @param {Object} hub - A2AHub instance
   */
  connectA2AHub(hub) {
    this._a2aHub = hub;
  }

  /**
   * Start a new agent team for a complex task
   * @param {Object} params
   * @param {string} params.name - Team name
   * @param {string} params.task - Main task
   * @param {Array<Object>} params.members - [{role, agentType, subtask}]
   * @returns {{teamId: string, started: boolean}}
   */
  startTeam({ name, task, members }) {
    if (!this._enabled) {
      return { started: false, reason: 'Agent Teams not enabled' };
    }

    if (members.length > this._maxTeamSize) {
      return { started: false, reason: `Team size ${members.length} exceeds max ${this._maxTeamSize}` };
    }

    const teamId = `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const team = {
      id: teamId,
      name: name || 'Unnamed Team',
      task,
      status: 'active',
      members: members.map((m, i) => ({
        id: `member-${i}`,
        role: m.role || 'worker',
        agentType: m.agentType || 'general-purpose',
        subtask: m.subtask,
        status: 'idle',
        result: null,
        startedAt: null,
        completedAt: null
      })),
      createdAt: Date.now(),
      completedAt: null,
      results: []
    };

    this._teams.set(teamId, team);

    this.bus.emit('team:started', {
      teamId, name: team.name, memberCount: members.length
    });

    return { started: true, teamId };
  }

  /**
   * Send a message/task to a specific team member
   * @param {string} teamId
   * @param {string} memberId
   * @param {Object} message - { action, data }
   */
  message(teamId, memberId, message) {
    const team = this._teams.get(teamId);
    if (!team) return { sent: false, reason: 'Team not found' };

    const member = team.members.find(m => m.id === memberId);
    if (!member) return { sent: false, reason: 'Member not found' };

    member.status = 'working';
    member.startedAt = Date.now();

    this.bus.emit('team:message', {
      teamId, memberId, role: member.role, action: message.action
    });

    return { sent: true };
  }

  /**
   * Record a member's completion
   */
  memberComplete(teamId, memberId, result) {
    const team = this._teams.get(teamId);
    if (!team) return false;

    const member = team.members.find(m => m.id === memberId);
    if (!member) return false;

    member.status = 'completed';
    member.result = result;
    member.completedAt = Date.now();
    team.results.push({ memberId, role: member.role, result });

    this.bus.emit('team:member:completed', { teamId, memberId, role: member.role });

    // Check if all members are done
    const allDone = team.members.every(m => m.status === 'completed' || m.status === 'failed');
    if (allDone) {
      team.status = 'completed';
      team.completedAt = Date.now();
      this.bus.emit('team:completed', {
        teamId, name: team.name,
        durationMs: team.completedAt - team.createdAt,
        successCount: team.members.filter(m => m.status === 'completed').length
      });
    }

    return true;
  }

  /**
   * Get team status
   */
  getTeamStatus(teamId) {
    const team = this._teams.get(teamId);
    if (!team) return null;

    return {
      id: team.id,
      name: team.name,
      status: team.status,
      members: team.members.map(m => ({
        id: m.id,
        role: m.role,
        status: m.status,
        agentType: m.agentType
      })),
      progress: {
        total: team.members.length,
        completed: team.members.filter(m => m.status === 'completed').length,
        working: team.members.filter(m => m.status === 'working').length,
        idle: team.members.filter(m => m.status === 'idle').length
      }
    };
  }

  /**
   * List all teams
   */
  listTeams() {
    return [...this._teams.values()].map(t => ({
      id: t.id,
      name: t.name,
      status: t.status,
      memberCount: t.members.length,
      createdAt: t.createdAt
    }));
  }

  /**
   * Cancel a team
   */
  cancelTeam(teamId) {
    const team = this._teams.get(teamId);
    if (!team) return false;

    team.status = 'cancelled';
    team.completedAt = Date.now();
    this.bus.emit('team:cancelled', { teamId });
    return true;
  }

  /**
   * Delegate a team task to A2AHub for cross-provider execution
   * Bridges TeamOrchestrator bookkeeping with A2AHub real dispatch
   * @param {string} teamId
   * @returns {Object} delegation result
   */
  delegateViaA2AHub(teamId) {
    const team = this._teams.get(teamId);
    if (!team) return { delegated: false, reason: 'Team not found' };
    if (!this._a2aHub) return { delegated: false, reason: 'A2AHub not connected' };

    try {
      const result = this._a2aHub.delegateToTeam({
        goal: team.task,
        members: team.members.map(m => m.agentType),
        timeout: this._timeoutMs
      });
      return { delegated: true, a2aTeamId: result.teamId };
    } catch (e) {
      return { delegated: false, reason: e.message };
    }
  }

  /**
   * Get overall status
   */
  getStatus() {
    const teams = this.listTeams();
    return {
      enabled: this._enabled,
      totalTeams: teams.length,
      activeTeams: teams.filter(t => t.status === 'active').length,
      maxTeamSize: this._maxTeamSize,
      timeoutMs: this._timeoutMs,
      a2aHubConnected: !!this._a2aHub,
      hookListeners: ['SubagentStart', 'TaskCompleted', 'TeammateIdle']
    };
  }
}

module.exports = { TeamOrchestrator };
