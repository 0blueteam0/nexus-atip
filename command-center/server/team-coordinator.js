/**
 * Team Coordinator (F Architecture Layer 4)
 *
 * Prevents agent conflicts and coordinates multi-agent work:
 *   - File locking: prevents simultaneous edits to same file
 *   - Task queue: manages pending work assignments
 *   - Resource tracking: knows which agent owns which resource
 *   - Conflict detection: alerts when agents target overlapping files
 *
 * Works with StateMachine for agent state and Broadcaster for notifications.
 *
 * Usage:
 *   const coordinator = new TeamCoordinator(stateMachine, broadcaster);
 *   coordinator.acquireLock('agent-1', '/path/file.js'); // true or false
 *   coordinator.releaseLock('agent-1', '/path/file.js');
 *   coordinator.getStatus(); // full coordination state
 */
'use strict';

const db = require('./db');

// Lock timeout: auto-release after this duration (ms)
const LOCK_TIMEOUT_MS = 300000; // 5 minutes
// Max locks per agent
const MAX_LOCKS_PER_AGENT = 10;

class TeamCoordinator {
  constructor(stateMachine, broadcaster) {
    this.stateMachine = stateMachine;
    this.broadcaster = broadcaster;

    // file path -> { agentId, acquiredAt, purpose }
    this.fileLocks = new Map();

    // agentId -> Set of locked file paths
    this.agentLocks = new Map();

    // Task assignment queue: { id, description, assignedTo, status, priority }
    this.taskQueue = [];
    this.taskIdCounter = 0;

    // Conflict history for learning
    this.conflictLog = [];
    this.maxConflictLog = 50;
  }

  /**
   * Acquire a file lock for an agent
   * @param {string} agentId - Agent requesting the lock
   * @param {string} filePath - Normalized file path
   * @param {string} purpose - What the agent intends to do
   * @returns {{ acquired: boolean, holder?: string, reason?: string }}
   */
  acquireLock(agentId, filePath, purpose) {
    const normalized = this._normalizePath(filePath);

    // Check existing lock
    const existing = this.fileLocks.get(normalized);
    if (existing) {
      // Check if lock timed out
      if (Date.now() - existing.acquiredAt > LOCK_TIMEOUT_MS) {
        this._releaseLockInternal(existing.agentId, normalized, 'timeout');
      } else if (existing.agentId !== agentId) {
        // Conflict detected
        this._recordConflict(agentId, existing.agentId, normalized, purpose);
        return {
          acquired: false,
          holder: existing.agentId,
          reason: `File locked by ${existing.agentId} since ${new Date(existing.acquiredAt).toISOString()}`
        };
      } else {
        // Same agent already holds the lock - refresh it
        existing.acquiredAt = Date.now();
        existing.purpose = purpose || existing.purpose;
        return { acquired: true };
      }
    }

    // Check max locks per agent
    const agentCurrentLocks = this.agentLocks.get(agentId) || new Set();
    if (agentCurrentLocks.size >= MAX_LOCKS_PER_AGENT) {
      return {
        acquired: false,
        reason: `Agent ${agentId} already holds ${MAX_LOCKS_PER_AGENT} locks (max)`
      };
    }

    // Acquire lock
    this.fileLocks.set(normalized, {
      agentId,
      acquiredAt: Date.now(),
      purpose: purpose || 'edit'
    });

    agentCurrentLocks.add(normalized);
    this.agentLocks.set(agentId, agentCurrentLocks);

    // Broadcast lock event
    if (this.broadcaster) {
      this.broadcaster.broadcast('file_locked', {
        agentId,
        filePath: normalized,
        purpose,
        timestamp: Date.now()
      });
    }

    return { acquired: true };
  }

  /**
   * Release a file lock
   * @param {string} agentId - Agent releasing the lock
   * @param {string} filePath - File to unlock
   * @returns {boolean} Whether the lock was released
   */
  releaseLock(agentId, filePath) {
    const normalized = this._normalizePath(filePath);
    return this._releaseLockInternal(agentId, normalized, 'manual');
  }

  /**
   * Release all locks held by an agent (e.g. when agent completes or crashes)
   * @param {string} agentId - Agent whose locks to release
   * @returns {number} Number of locks released
   */
  releaseAllLocks(agentId) {
    const locks = this.agentLocks.get(agentId);
    if (!locks) return 0;

    let count = 0;
    for (const filePath of locks) {
      this._releaseLockInternal(agentId, filePath, 'agent_complete');
      count++;
    }

    return count;
  }

  /**
   * Check if a file is locked and by whom
   * @param {string} filePath - File to check
   * @returns {{ locked: boolean, holder?: string, purpose?: string, since?: number }}
   */
  checkLock(filePath) {
    const normalized = this._normalizePath(filePath);
    const lock = this.fileLocks.get(normalized);

    if (!lock) return { locked: false };

    // Check timeout
    if (Date.now() - lock.acquiredAt > LOCK_TIMEOUT_MS) {
      this._releaseLockInternal(lock.agentId, normalized, 'timeout');
      return { locked: false };
    }

    return {
      locked: true,
      holder: lock.agentId,
      purpose: lock.purpose,
      since: lock.acquiredAt
    };
  }

  /**
   * Enqueue a task for agent assignment
   * @param {string} description - Task description
   * @param {number} priority - Priority (1=highest, 5=lowest)
   * @param {string} preferredAgent - Preferred agent (optional)
   * @returns {Object} Created task
   */
  enqueueTask(description, priority, preferredAgent) {
    const task = {
      id: `coord-${++this.taskIdCounter}`,
      description,
      priority: priority || 3,
      preferredAgent: preferredAgent || null,
      assignedTo: null,
      status: 'pending',
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null
    };

    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => a.priority - b.priority);

    return task;
  }

  /**
   * Assign next available task to an agent
   * @param {string} agentId - Agent requesting work
   * @returns {Object|null} Assigned task or null
   */
  assignNextTask(agentId) {
    // Find first pending task (prefer tasks with matching preferredAgent)
    let task = this.taskQueue.find(t =>
      t.status === 'pending' && t.preferredAgent === agentId
    );

    if (!task) {
      task = this.taskQueue.find(t =>
        t.status === 'pending' && !t.preferredAgent
      );
    }

    if (!task) return null;

    task.assignedTo = agentId;
    task.status = 'in_progress';
    task.startedAt = Date.now();

    return task;
  }

  /**
   * Mark a coordinated task as complete
   * @param {string} taskId - Task to complete
   * @param {boolean} success - Whether task succeeded
   */
  completeTask(taskId, success) {
    const task = this.taskQueue.find(t => t.id === taskId);
    if (!task) return false;

    task.status = success ? 'completed' : 'failed';
    task.completedAt = Date.now();

    return true;
  }

  /**
   * Get full coordination status
   */
  getStatus() {
    // Clean up timed out locks
    this._cleanupTimeouts();

    const locks = [];
    for (const [filePath, lock] of this.fileLocks) {
      locks.push({
        filePath,
        agentId: lock.agentId,
        purpose: lock.purpose,
        since: lock.acquiredAt,
        ageMs: Date.now() - lock.acquiredAt
      });
    }

    const agents = {};
    for (const [agentId, lockSet] of this.agentLocks) {
      agents[agentId] = {
        lockCount: lockSet.size,
        files: Array.from(lockSet)
      };
    }

    const pendingTasks = this.taskQueue.filter(t => t.status === 'pending').length;
    const activeTasks = this.taskQueue.filter(t => t.status === 'in_progress').length;

    return {
      locks,
      agents,
      tasks: {
        pending: pendingTasks,
        active: activeTasks,
        total: this.taskQueue.length
      },
      conflicts: {
        total: this.conflictLog.length,
        recent: this.conflictLog.slice(-5)
      }
    };
  }

  /**
   * Check for potential conflicts between agents
   * @param {string} agentId - Agent about to act
   * @param {string[]} targetFiles - Files the agent wants to touch
   * @returns {Array} Potential conflicts
   */
  detectConflicts(agentId, targetFiles) {
    const conflicts = [];

    for (const filePath of targetFiles) {
      const normalized = this._normalizePath(filePath);
      const lock = this.fileLocks.get(normalized);

      if (lock && lock.agentId !== agentId) {
        conflicts.push({
          filePath: normalized,
          holder: lock.agentId,
          purpose: lock.purpose,
          severity: 'high'
        });
      }

      // Also check for directory-level conflicts
      for (const [lockedPath, lockInfo] of this.fileLocks) {
        if (lockInfo.agentId === agentId) continue;
        if (this._isParentDir(normalized, lockedPath) || this._isParentDir(lockedPath, normalized)) {
          conflicts.push({
            filePath: normalized,
            relatedLock: lockedPath,
            holder: lockInfo.agentId,
            severity: 'medium'
          });
        }
      }
    }

    return conflicts;
  }

  // --- Private methods ---

  _releaseLockInternal(agentId, normalizedPath, reason) {
    const lock = this.fileLocks.get(normalizedPath);
    if (!lock) return false;
    if (lock.agentId !== agentId && reason !== 'timeout') return false;

    this.fileLocks.delete(normalizedPath);

    const agentLockSet = this.agentLocks.get(lock.agentId);
    if (agentLockSet) {
      agentLockSet.delete(normalizedPath);
      if (agentLockSet.size === 0) this.agentLocks.delete(lock.agentId);
    }

    if (this.broadcaster) {
      this.broadcaster.broadcast('file_unlocked', {
        agentId: lock.agentId,
        filePath: normalizedPath,
        reason,
        timestamp: Date.now()
      });
    }

    return true;
  }

  _recordConflict(requestingAgent, holdingAgent, filePath, purpose) {
    const conflict = {
      requestingAgent,
      holdingAgent,
      filePath,
      purpose,
      timestamp: Date.now()
    };

    this.conflictLog.push(conflict);
    if (this.conflictLog.length > this.maxConflictLog) this.conflictLog.shift();

    // Broadcast conflict
    if (this.broadcaster) {
      this.broadcaster.broadcast('conflict_detected', conflict);
    }

    // Log to DB for evolution analysis
    db.logEvolution('conflict', `${requestingAgent} vs ${holdingAgent} on ${filePath}`,
      { requesting: requestingAgent, holding: holdingAgent },
      { filePath, purpose }, -0.05);
  }

  _cleanupTimeouts() {
    const now = Date.now();
    for (const [filePath, lock] of this.fileLocks) {
      if (now - lock.acquiredAt > LOCK_TIMEOUT_MS) {
        this._releaseLockInternal(lock.agentId, filePath, 'timeout');
      }
    }
  }

  _normalizePath(filePath) {
    return filePath.replace(/\\/g, '/').replace(/\/+/g, '/');
  }

  _isParentDir(child, parent) {
    const childParts = child.split('/');
    const parentParts = parent.split('/');
    if (parentParts.length >= childParts.length) return false;
    return childParts.slice(0, parentParts.length).join('/') === parent;
  }
}

module.exports = { TeamCoordinator };
