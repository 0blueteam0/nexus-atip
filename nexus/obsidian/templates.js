/**
 * NEXUS Obsidian Templates - Markdown Note Generators
 *
 * Generates Dataview-compatible markdown notes with YAML frontmatter
 * for all NEXUS data types: sessions, tasks, checkpoints, patterns, costs.
 *
 * @module nexus/obsidian/templates
 */

'use strict';

/**
 * Generate YAML frontmatter from an object
 * @param {Object} data - Key-value pairs for frontmatter
 * @returns {string} YAML frontmatter block
 */
function frontmatter(data) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => typeof v === 'string' ? `"${v}"` : v).join(', ')}]`);
    } else if (typeof value === 'object') {
      lines.push(`${key}:`);
      for (const [k, v] of Object.entries(value)) {
        lines.push(`  ${k}: ${v}`);
      }
    } else if (typeof value === 'string' && value.includes(':')) {
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

/**
 * Format ISO date string
 */
function isoDate(ts) {
  return new Date(ts || Date.now()).toISOString().split('T')[0];
}

/**
 * Format ISO datetime string
 */
function isoDateTime(ts) {
  return new Date(ts || Date.now()).toISOString().replace('Z', '');
}

// ─── Template Functions ─────────────────────────────

const templates = {
  /**
   * Session note
   * @param {Object} data - { sessionId, providers, taskCount, successRate, startTime, endTime, cost }
   */
  session(data) {
    const fm = frontmatter({
      type: 'session',
      session_id: data.sessionId,
      date: isoDate(data.startTime),
      start_time: isoDateTime(data.startTime),
      end_time: data.endTime ? isoDateTime(data.endTime) : null,
      providers: data.providers || [],
      task_count: data.taskCount || 0,
      success_rate: data.successRate || 0,
      total_cost: data.cost || 0,
      tags: ['nexus/session']
    });

    const body = [
      `# Session ${data.sessionId}`,
      '',
      '## Summary',
      `- **Start**: ${isoDateTime(data.startTime)}`,
      data.endTime ? `- **End**: ${isoDateTime(data.endTime)}` : '',
      `- **Tasks**: ${data.taskCount || 0}`,
      `- **Success Rate**: ${((data.successRate || 0) * 100).toFixed(0)}%`,
      `- **Cost**: $${(data.cost || 0).toFixed(4)}`,
      '',
      '## Providers Used',
      ...(data.providers || []).map(p => `- ${p}`),
      '',
      '## Tasks',
      ...(data.tasks || []).map(t =>
        `- [[Task-${t.id}]] ${t.type} -> ${t.provider} (${t.success ? 'success' : 'failed'})`
      ),
      ''
    ].filter(l => l !== '');

    return fm + '\n\n' + body.join('\n');
  },

  /**
   * Task note
   * @param {Object} data - { taskId, taskType, prompt, provider, status, cost, quality, sessionId, startTime }
   */
  task(data) {
    const fm = frontmatter({
      type: 'task',
      task_id: data.taskId,
      task_type: data.taskType,
      provider: data.provider,
      status: data.status || 'completed',
      cost: data.cost || 0,
      quality_score: data.quality || 0,
      date: isoDate(data.startTime),
      session: data.sessionId,
      tags: ['nexus/task', data.taskType]
    });

    const body = [
      `# Task: ${data.taskType}`,
      '',
      `> ${(data.prompt || '').slice(0, 200)}`,
      '',
      '## Details',
      `- **Provider**: ${data.provider}`,
      `- **Status**: ${data.status || 'completed'}`,
      `- **Cost**: $${(data.cost || 0).toFixed(4)}`,
      `- **Quality**: ${((data.quality || 0) * 100).toFixed(0)}%`,
      '',
      data.sessionId ? `**Session**: [[Session-${data.sessionId}]]` : '',
      ''
    ].filter(l => l !== '');

    return fm + '\n\n' + body.join('\n');
  },

  /**
   * Checkpoint note
   * @param {Object} data - { checkpointId, runId, graphId, node, step, state, timestamp }
   */
  checkpoint(data) {
    const fm = frontmatter({
      type: 'checkpoint',
      checkpoint_id: data.checkpointId,
      run_id: data.runId,
      graph_id: data.graphId,
      node: data.node,
      step: data.step,
      date: isoDate(data.timestamp),
      tags: ['nexus/checkpoint']
    });

    const body = [
      `# Checkpoint: ${data.checkpointId}`,
      '',
      '## Details',
      `- **Run**: ${data.runId}`,
      `- **Graph**: ${data.graphId}`,
      `- **Node**: ${data.node}`,
      `- **Step**: ${data.step}`,
      `- **Time**: ${isoDateTime(data.timestamp)}`,
      '',
      '## State',
      '```json',
      JSON.stringify(data.state || {}, null, 2).slice(0, 1000),
      '```',
      ''
    ];

    return fm + '\n\n' + body.join('\n');
  },

  /**
   * Knowledge/Pattern note
   * @param {Object} data - { patternId, type, provider, practice, confidence, observations, discoveredAt }
   */
  pattern(data) {
    const fm = frontmatter({
      type: 'pattern',
      pattern_id: data.patternId || data.id,
      pattern_type: data.type,
      provider: data.provider,
      confidence: data.confidence || 0,
      observations: data.observations || 0,
      date: isoDate(data.discoveredAt),
      tags: ['nexus/pattern', data.type]
    });

    const body = [
      `# Pattern: ${data.type}`,
      '',
      `> ${data.practice || data.description || ''}`,
      '',
      '## Details',
      `- **Provider**: ${data.provider}`,
      `- **Confidence**: ${((data.confidence || 0) * 100).toFixed(0)}%`,
      `- **Observations**: ${data.observations || 0}`,
      `- **Discovered**: ${isoDate(data.discoveredAt)}`,
      ''
    ];

    return fm + '\n\n' + body.join('\n');
  },

  /**
   * Daily cost report
   * @param {Object} data - { date, totalCost, totalTokens, byProvider, taskCount }
   */
  costReport(data) {
    const fm = frontmatter({
      type: 'cost_report',
      date: data.date || isoDate(),
      total_cost: data.totalCost || 0,
      total_tokens: data.totalTokens || 0,
      task_count: data.taskCount || 0,
      tags: ['nexus/cost']
    });

    const providerRows = Object.entries(data.byProvider || {}).map(([p, d]) =>
      `| ${p} | $${(d.cost || 0).toFixed(4)} | ${d.tokens || 0} | ${d.count || 0} |`
    );

    const body = [
      `# Cost Report: ${data.date || isoDate()}`,
      '',
      `**Total**: $${(data.totalCost || 0).toFixed(4)} | ${data.totalTokens || 0} tokens | ${data.taskCount || 0} tasks`,
      '',
      '## By Provider',
      '| Provider | Cost | Tokens | Tasks |',
      '|----------|------|--------|-------|',
      ...providerRows,
      ''
    ];

    return fm + '\n\n' + body.join('\n');
  },

  /**
   * Dashboard MOC (Map of Content)
   * @param {Object} data - { stats }
   */
  dashboard(data = {}) {
    return [
      '---',
      'type: dashboard',
      'tags: [nexus/dashboard]',
      '---',
      '',
      '# NEXUS Dashboard',
      '',
      '## Recent Sessions',
      '```dataview',
      'TABLE start_time as "Start", task_count as "Tasks", success_rate as "Success", total_cost as "Cost"',
      'FROM "NEXUS/Sessions"',
      'WHERE type = "session"',
      'SORT start_time DESC',
      'LIMIT 10',
      '```',
      '',
      '## Provider Performance',
      '```dataview',
      'TABLE provider as "Provider", round(quality_score * 100) as "Quality %", cost as "Cost"',
      'FROM "NEXUS/Tasks"',
      'WHERE type = "task"',
      'GROUP BY provider',
      '```',
      '',
      '## Cost Trend (Last 7 Days)',
      '```dataview',
      'TABLE total_cost as "Cost", total_tokens as "Tokens", task_count as "Tasks"',
      'FROM "NEXUS/Costs"',
      'WHERE type = "cost_report"',
      'SORT date DESC',
      'LIMIT 7',
      '```',
      '',
      '## Active Patterns',
      '```dataview',
      'TABLE pattern_type as "Type", provider as "Provider", round(confidence * 100) as "Confidence %"',
      'FROM "NEXUS/Knowledge"',
      'WHERE type = "pattern" AND confidence > 0.5',
      'SORT confidence DESC',
      '```',
      '',
      '## Quick Stats',
      '```dataview',
      'LIST',
      'FROM "NEXUS"',
      'WHERE type',
      'GROUP BY type',
      '```',
      ''
    ].join('\n');
  },

  /**
   * Provider status note
   * @param {Object} data - { providerId, role, status, context, costTier, strengths, weaknesses }
   */
  provider(data) {
    const fm = frontmatter({
      type: 'provider',
      provider_id: data.providerId,
      role: data.role,
      status: data.status,
      context: data.context,
      cost_tier: data.costTier,
      tags: ['nexus/provider']
    });

    const body = [
      `# Provider: ${data.providerId}`,
      '',
      `- **Role**: ${data.role}`,
      `- **Status**: ${data.status}`,
      `- **Context**: ${data.context}`,
      `- **Cost Tier**: ${data.costTier}`,
      '',
      '## Strengths',
      ...(data.strengths || []).map(s => `- ${s}`),
      '',
      '## Weaknesses',
      ...(data.weaknesses || []).map(w => `- ${w}`),
      ''
    ];

    return fm + '\n\n' + body.join('\n');
  }
};

module.exports = { templates, frontmatter, isoDate, isoDateTime };
