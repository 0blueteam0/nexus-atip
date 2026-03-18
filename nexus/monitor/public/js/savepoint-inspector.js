/**
 * Savepoint Inspector View - Checkpoint Viewer
 *
 * Displays checkpoint list from the CheckpointStore,
 * allows time-travel and branch visualization.
 *
 * @module nexus/monitor/views/savepoint-inspector
 */

'use strict';

(function () {
  const container = document.getElementById('savepoint-list');
  const savepoints = [];
  const MAX_SAVEPOINTS = 100;

  function addSavepoint(data) {
    const sp = {
      id: data.checkpointId || data.id || 'sp-' + Date.now(),
      runId: data.runId || '--',
      graphId: data.graphId || '--',
      node: data.node || data.nodeId || '--',
      timestamp: data.timestamp || Date.now(),
      stateKeys: data.stateKeys || [],
      parentId: data.parentId || null,
      branch: data.branch || 'main'
    };

    savepoints.unshift(sp); // newest first
    if (savepoints.length > MAX_SAVEPOINTS) savepoints.pop();

    renderAll();
  }

  function renderAll() {
    container.innerHTML = '';

    if (savepoints.length === 0) {
      container.innerHTML = '<div style="color:var(--text-secondary);padding:16px;">No savepoints yet. Checkpoints appear here when graph nodes execute with checkpointing enabled.</div>';
      return;
    }

    // Group by runId
    const grouped = {};
    savepoints.forEach(sp => {
      if (!grouped[sp.runId]) grouped[sp.runId] = [];
      grouped[sp.runId].push(sp);
    });

    Object.entries(grouped).forEach(([runId, sps]) => {
      // Run header
      const header = document.createElement('div');
      header.style.cssText = 'color:var(--accent-blue);font-weight:bold;padding:8px 0 4px;border-bottom:1px solid var(--border);margin-bottom:4px;';
      header.textContent = 'Run: ' + runId.slice(0, 12) + '... (' + sps.length + ' checkpoints)';
      container.appendChild(header);

      sps.forEach(sp => {
        const card = document.createElement('div');
        card.className = 'savepoint-card';

        const time = new Date(sp.timestamp).toLocaleTimeString();
        const stateInfo = sp.stateKeys.length > 0
          ? sp.stateKeys.slice(0, 5).join(', ')
          : 'no state data';

        card.innerHTML = `
          <div class="savepoint-id">${escapeHtml(sp.id.slice(0, 16))}</div>
          <div class="savepoint-meta">
            <span>Node: ${escapeHtml(sp.node)}</span> |
            <span>Graph: ${escapeHtml(sp.graphId)}</span> |
            <span>Branch: ${escapeHtml(sp.branch)}</span> |
            <span>Time: ${time}</span>
          </div>
          <div class="savepoint-meta" style="margin-top:2px;">
            State: ${escapeHtml(stateInfo)}
          </div>
        `;

        // Visual branch indicator
        if (sp.parentId) {
          const branchLine = document.createElement('div');
          branchLine.style.cssText = 'color:var(--accent-purple);font-size:10px;padding-left:8px;';
          branchLine.textContent = 'branched from ' + sp.parentId.slice(0, 12);
          card.appendChild(branchLine);
        }

        container.appendChild(card);
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Fetch existing checkpoints from API
  function fetchCheckpoints() {
    fetch('/api/history')
      .then(r => r.json())
      .then(history => {
        // Filter checkpoint-related events from history
        (history || []).forEach(evt => {
          if (evt._event && evt._event.includes('checkpoint')) {
            addSavepoint(evt);
          }
        });
      })
      .catch(() => {});
  }

  // Event handler chain
  const prevHandler = window.onNexusEvent;
  window.onNexusEvent = function (type, data) {
    if (prevHandler) prevHandler(type, data);

    // Capture checkpoint events
    if (type === 'graph:node:end' && data.checkpointId) {
      addSavepoint(data);
    }

    // Direct checkpoint events
    if (type === 'checkpoint:saved' || type === 'checkpoint:branched') {
      addSavepoint(data);
    }
  };

  // Initial render
  renderAll();
  fetchCheckpoints();
})();
