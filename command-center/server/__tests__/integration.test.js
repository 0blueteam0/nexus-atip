/**
 * Observer Integration Tests (Phase 4)
 * Uses node:test (built-in, zero deps)
 *
 * Run: node --test command-center/server/__tests__/integration.test.js
 */
'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const BASE = 'http://localhost:3847';

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

describe('Observer Health', () => {
  it('should return ok status', async () => {
    const { status, data } = await api('/health');
    assert.equal(status, 200);
    assert.equal(data.status, 'ok');
    assert.ok(data.uptime > 0);
  });

  it('should return version 2.0.0-F', async () => {
    const { data } = await api('/');
    assert.equal(data.version, '2.0.0-F');
    assert.ok(data.endpoints.length >= 50);
  });
});

describe('Control Plane', () => {
  let commandId;

  it('should enqueue a command', async () => {
    const { data } = await api('/control/command', {
      method: 'POST',
      body: JSON.stringify({
        command_type: 'request_state',
        payload: { scope: 'test' },
        idempotency_key: `test-${Date.now()}`
      })
    });
    assert.equal(data.ok, true);
    assert.ok(data.id);
    commandId = data.id;
  });

  it('should support idempotent replay', async () => {
    const key = `idem-${Date.now()}`;
    const payload = { scope: 'idem-test' };

    const r1 = await api('/control/command', {
      method: 'POST',
      body: JSON.stringify({ command_type: 'request_state', payload, idempotency_key: key })
    });
    const r2 = await api('/control/command', {
      method: 'POST',
      body: JSON.stringify({ command_type: 'request_state', payload, idempotency_key: key })
    });

    assert.equal(r1.data.ok, true);
    assert.equal(r2.data.ok, true);
    assert.equal(r2.data.idempotent_replay, true);
    assert.equal(r1.data.id, r2.data.id);
  });

  it('should reject invalid command type', async () => {
    const { data } = await api('/control/command', {
      method: 'POST',
      body: JSON.stringify({ command_type: 'invalid_type', payload: {} })
    });
    assert.equal(data.ok, false);
  });

  it('should return queue', async () => {
    const { status, data } = await api('/control/queue');
    assert.equal(status, 200);
    assert.ok(Array.isArray(data));
  });

  it('should return stats', async () => {
    const { status, data } = await api('/control/stats');
    assert.equal(status, 200);
    assert.ok(data.byStatus);
  });
});

describe('Scheduler', () => {
  it('should list schedules', async () => {
    const { data } = await api('/schedules');
    assert.ok(Array.isArray(data));
    assert.ok(data.length >= 5); // 5 default tiers
  });

  it('should return scheduler status with lease', async () => {
    const { data } = await api('/scheduler/status');
    assert.ok(data.instanceId);
    assert.equal(data.running, true);
  });

  it('should return run history', async () => {
    const { data } = await api('/scheduler/runs');
    assert.ok(Array.isArray(data));
  });

  it('should handle manual tick', async () => {
    const { data } = await api('/scheduler/tick', { method: 'POST' });
    assert.equal(data.ok, true);
    assert.ok(data.tickCount >= 0); // may be 0 right after restart
  });
});

describe('Evolution Agent', () => {
  it('should propose cycle', async () => {
    const { data } = await api('/evolution/propose', { method: 'POST', body: '{}' });
    assert.ok(data.count !== undefined);
    assert.ok(Array.isArray(data.recommendations));
  });

  it('should list recommendations', async () => {
    const { data } = await api('/evolution/recommendations');
    assert.ok(Array.isArray(data));
  });

  it('should return history', async () => {
    const { data } = await api('/evolution/history');
    assert.ok(Array.isArray(data));
  });
});

describe('Memory Sync', () => {
  it('should run sync', async () => {
    const { data } = await api('/memory/sync', { method: 'POST', body: '{}' });
    assert.equal(data.ok, true);
    assert.ok(data.stats);
    assert.ok(data.stats.scanned >= 0);
  });

  it('should return sync status', async () => {
    const { data } = await api('/memory/status');
    assert.ok(data.checkpoint || data.docCounts !== undefined);
  });

  it('should list documents', async () => {
    const { data } = await api('/memory/documents');
    assert.ok(Array.isArray(data));
  });
});

describe('Alerts', () => {
  it('should return active alerts', async () => {
    const { data } = await api('/alerts');
    assert.ok(Array.isArray(data));
  });

  it('should return alert rules', async () => {
    const { data } = await api('/alerts/rules');
    assert.ok(Array.isArray(data));
    assert.ok(data.length >= 5);
  });

  it('should test a rule', async () => {
    const { data } = await api('/alerts/test/queue_backlog', { method: 'POST' });
    assert.equal(data.ok, true);
    assert.ok(data.triggered !== undefined);
  });
});

describe('Routing', () => {
  it('should analyze intent', async () => {
    const { data } = await api('/route', {
      method: 'POST',
      body: JSON.stringify({ task: 'search for files' })
    });
    assert.ok(data.intent);
    assert.ok(data.tier);
  });

  it('should accept taskDescription for backward compat', async () => {
    const { data } = await api('/route', {
      method: 'POST',
      body: JSON.stringify({ taskDescription: 'read a file' })
    });
    assert.ok(data.intent);
  });
});

describe('Claude Bridge', () => {
  it('should return stats', async () => {
    const { data } = await api('/claude/stats');
    assert.ok(data.maxConcurrent);
    assert.ok(data.claudeBin);
  });

  it('should return sessions', async () => {
    const { data } = await api('/claude/sessions');
    assert.ok(Array.isArray(data));
  });

  it('should return tasks', async () => {
    const { data } = await api('/claude/tasks');
    assert.ok(Array.isArray(data));
  });
});

describe('Skill Factory', () => {
  it('should run cycle', async () => {
    const { data } = await api('/skills/factory/cycle', { method: 'POST', body: '{}' });
    assert.ok(data.generated !== undefined);
  });

  it('should list skills', async () => {
    const { data } = await api('/skills/factory/list');
    assert.ok(Array.isArray(data));
  });
});

describe('Task Decomposer', () => {
  let planId;

  it('should create a plan', async () => {
    const { data } = await api('/decompose/plan', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Test plan',
        subtasks: [
          { description: 'sub1', agentType: 'general' },
          { description: 'sub2', dependsOn: [0] }
        ]
      })
    });
    assert.equal(data.ok, true);
    assert.ok(data.planId);
    assert.equal(data.subtaskCount, 2);
    planId = data.planId;
  });

  it('should reject circular deps', async () => {
    const { data } = await api('/decompose/plan', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Bad plan',
        subtasks: [
          { description: 's1', dependsOn: [1] },
          { description: 's2', dependsOn: [0] }
        ]
      })
    });
    assert.equal(data.ok, false);
  });

  it('should list plans', async () => {
    const { data } = await api('/decompose/plans');
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
  });
});

describe('Autonomy Guard', () => {
  it('should return stats', async () => {
    const { data } = await api('/autonomy/stats');
    assert.ok(data.limits);
  });

  it('should return limits', async () => {
    const { data } = await api('/autonomy/limits');
    assert.ok(data.max_concurrent_claude_tasks);
    assert.ok(data.max_auto_deploys_per_day);
  });

  it('should return audit trail', async () => {
    const { data } = await api('/autonomy/audit');
    assert.ok(Array.isArray(data));
  });
});

describe('Obsidian Bridge', () => {
  it('should return status', async () => {
    const { data } = await api('/obsidian/status');
    assert.ok(data.vaultRoot);
    assert.equal(data.vaultExists, true);
  });

  it('should pull/sync vault', async () => {
    const { data } = await api('/obsidian/sync', { method: 'POST', body: '{}' });
    assert.equal(data.ok, true);
    assert.ok(data.stats.scanned >= 0);
  });

  it('should push a note', async () => {
    const { data } = await api('/obsidian/push', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Note', content: '# Test\nHello from integration test', tags: ['test'] })
    });
    assert.equal(data.ok, true);
    assert.ok(data.path);
  });

  it('should search notes', async () => {
    const { data } = await api('/obsidian/search');
    assert.ok(Array.isArray(data));
  });
});

describe('Antifragile Engine', () => {
  it('should return antifragile status', async () => {
    const { status, data } = await api('/antifragile/status');
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.principles));
    assert.ok(data.principles.includes('no-op'));
    assert.ok(data.principles.includes('barbell'));
    assert.equal(data.barbellExplorationRate, 0.10);
  });

  it('should return trust score for a tool', async () => {
    const { status, data } = await api('/antifragile/trust/desktop-commander');
    assert.equal(status, 200);
    assert.ok(data.score !== undefined);
    assert.ok(data.confidence);
  });

  it('should assess irreversibility', async () => {
    const { data } = await api('/antifragile/assess', {
      method: 'POST',
      body: JSON.stringify({ toolName: 'Read', command: 'cat file.txt' })
    });
    assert.equal(data.level, 'trivial');
    assert.equal(data.approval, 'none');
    assert.ok(data.authority);
    assert.equal(data.authority.allowed, true);
  });

  it('should score destructive commands as critical', async () => {
    const { data } = await api('/antifragile/assess', {
      method: 'POST',
      body: JSON.stringify({ toolName: 'Bash', command: 'rm -rf /tmp/data' })
    });
    assert.equal(data.level, 'critical');
    assert.ok(data.score >= 0.7);
  });

  it('should return failure stats', async () => {
    const { data } = await api('/antifragile/failures?intent=file_operation');
    assert.ok(data.total !== undefined);
    assert.ok(Array.isArray(data.tools));
    assert.ok(Array.isArray(data.lessons));
  });
});

describe('Code Mode', () => {
  it('should search for tools by query', async () => {
    const { status, data } = await api('/code-mode/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'search for files in directory' })
    });
    assert.equal(status, 200);
    assert.ok(data.intent);
    assert.ok(Array.isArray(data.tools));
    assert.ok(data.tools.length > 0);
  });

  it('should require query parameter', async () => {
    const { status } = await api('/code-mode/search', {
      method: 'POST',
      body: JSON.stringify({})
    });
    assert.equal(status, 400);
  });

  it('should return irreversibility for execute', async () => {
    const { data } = await api('/code-mode/execute', {
      method: 'POST',
      body: JSON.stringify({ server: 'desktop-commander', tool: 'read_file', args: { path: '/tmp/test' } })
    });
    assert.ok(data.irreversibility);
    assert.equal(data.status, 'ready_for_execution');
  });
});

describe('Routing with Barbell', () => {
  it('should include barbell strategy in route response', async () => {
    const { data } = await api('/route', {
      method: 'POST',
      body: JSON.stringify({ task: 'read and edit a configuration file' })
    });
    assert.ok(data.intent);
    // barbell field should exist (may be null if < 2 tools)
    assert.ok('barbell' in data);
  });

  it('should flag unknown intents for code-mode discovery', async () => {
    const { data } = await api('/route', {
      method: 'POST',
      body: JSON.stringify({ task: 'xyzzy frobnicate the quantum flux capacitor' })
    });
    assert.equal(data.intent, 'unknown');
    assert.equal(data.confidence, 0);
  });
});

describe('Scoped Dispatch', () => {
  it('should create plan with tool scopes when enabled', async () => {
    const { data } = await api('/decompose/plan', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Scoped test plan',
        subtasks: [
          { description: 'search for security vulnerabilities', agentType: 'review-agent' },
          { description: 'edit the configuration file', agentType: 'code-agent', dependsOn: [0] }
        ]
      })
    });
    assert.equal(data.ok, true);
    assert.ok(data.planId);
    assert.equal(data.subtaskCount, 2);
  });
});

describe('Metrics', () => {
  it('should return Prometheus format', async () => {
    const res = await fetch(`${BASE}/metrics`);
    const text = await res.text();
    assert.ok(text.includes('observer_uptime_seconds'));
    assert.ok(text.includes('observer_scheduler_ticks'));
    assert.ok(text.includes('observer_memory_documents'));
  });
});
