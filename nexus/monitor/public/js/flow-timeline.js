/**
 * Flow Timeline View - Task Flow Visualization
 *
 * Shows tasks flowing through L1->L7 layers with timing,
 * branching, and fallback path visualization.
 *
 * @module nexus/monitor/views/flow-timeline
 */

'use strict';

(function () {
  const container = document.getElementById('flow-timeline');
  const entries = [];
  const MAX_ENTRIES = 200;

  function addEntry(type, data) {
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);

    let node = '--';
    let detail = '';
    let status = '';
    let duration = '';

    if (type === 'graph:node:start') {
      node = data.node || data.nodeId || '--';
      detail = 'Node started' + (data.graphId ? ' [' + data.graphId + ']' : '');
      status = '';
    } else if (type === 'graph:node:end') {
      node = data.node || data.nodeId || '--';
      duration = data.duration ? data.duration + 'ms' : '';
      detail = 'Node completed';
      status = 'success';
    } else if (type === 'task:received') {
      node = 'Orchestrator';
      detail = truncate(data.task || data.description || JSON.stringify(data), 80);
      status = '';
    } else if (type === 'task:routed') {
      node = data.provider || data.target || '--';
      detail = 'Routed' + (data.complexity ? ' (complexity: ' + data.complexity + ')' : '');
      status = '';
    } else if (type === 'task:completed') {
      node = data.provider || '--';
      duration = data.duration ? data.duration + 'ms' : '';
      detail = 'Task completed';
      status = 'success';
    } else if (type === 'task:failed') {
      node = data.provider || '--';
      detail = data.error || 'Task failed';
      status = 'error';
    } else if (type === 'graph:start') {
      node = data.graphId || '--';
      detail = 'Graph execution started';
      status = '';
    } else if (type === 'graph:end') {
      node = data.graphId || '--';
      duration = data.duration ? data.duration + 'ms' : '';
      detail = data.error ? 'Graph failed: ' + data.error : 'Graph completed';
      status = data.error ? 'error' : 'success';
    } else if (type === 'graph:stream') {
      node = data.node || '--';
      detail = 'Streaming: ' + truncate(JSON.stringify(data.chunk || data), 60);
      status = '';
    } else if (type.startsWith('deep-agent:')) {
      node = 'DeepAgent';
      detail = type.split(':').slice(1).join(':') + ' ' + truncate(JSON.stringify(data), 50);
      status = '';
    } else if (type.startsWith('subagent:')) {
      node = data.role || 'SubAgent';
      detail = type.split(':')[1] + (data.parentId ? ' [parent: ' + data.parentId.slice(0, 8) + ']' : '');
      status = type.includes('completed') ? 'success' : '';
    } else {
      return; // Skip non-flow events
    }

    const entry = { time, type, node, detail, status, duration };
    entries.push(entry);
    if (entries.length > MAX_ENTRIES) entries.shift();

    renderEntry(entry);
  }

  function renderEntry(entry) {
    const div = document.createElement('div');
    div.className = 'timeline-entry' + (entry.status ? ' ' + entry.status : '');

    div.innerHTML = `
      <span class="timeline-time">${entry.time}</span>
      <span class="timeline-node">${entry.node}</span>
      <span class="timeline-duration">${entry.duration}</span>
      <span class="timeline-detail" title="${escapeHtml(entry.detail)}">${escapeHtml(entry.detail)}</span>
    `;

    container.appendChild(div);

    // Auto-scroll
    container.scrollTop = container.scrollHeight;
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '...' : str;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Event handler chain
  const prevHandler = window.onNexusEvent;
  window.onNexusEvent = function (type, data) {
    if (prevHandler) prevHandler(type, data);
    addEntry(type, data);
  };
})();
