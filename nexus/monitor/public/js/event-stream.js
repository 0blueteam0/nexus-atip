/**
 * Event Stream View - Real-time EventBus Log
 *
 * Displays all NEXUS EventBus events with filtering,
 * namespace coloring, and auto-scroll.
 *
 * @module nexus/monitor/views/event-stream
 */

'use strict';

(function () {
  const log = document.getElementById('event-log');
  const filterInput = document.getElementById('event-filter');
  const clearBtn = document.getElementById('event-clear');
  const autoScrollCheckbox = document.getElementById('event-autoscroll');

  const allEvents = [];
  const MAX_EVENTS = 500;

  // Namespace color mapping
  const NS_COLORS = {
    'system': 'ns-system',
    'task': 'ns-task',
    'graph': 'ns-graph',
    'provider': 'ns-provider',
    'evolution': 'ns-evolution',
    'team': 'ns-team',
    'hitl': 'ns-hitl',
    'deep-agent': 'ns-graph',
    'subagent': 'ns-graph',
    'monitor': 'ns-system',
    'heartbeat': 'ns-system'
  };

  function getNamespaceClass(eventName) {
    const ns = eventName.split(':')[0];
    return NS_COLORS[ns] || '';
  }

  function matchesFilter(eventName, filter) {
    if (!filter) return true;

    // Support wildcard: "task:*" matches "task:received", "task:completed"
    if (filter.includes('*')) {
      const regex = new RegExp('^' + filter.replace(/\*/g, '.*') + '$');
      return regex.test(eventName);
    }

    // Simple substring match
    return eventName.includes(filter);
  }

  function addEvent(type, data) {
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);

    // Format data summary
    let dataSummary = '';
    if (data && typeof data === 'object') {
      const keys = Object.keys(data).filter(k => !k.startsWith('_'));
      const parts = [];
      for (const k of keys.slice(0, 4)) {
        const v = data[k];
        if (typeof v === 'string') {
          parts.push(k + '=' + (v.length > 30 ? v.slice(0, 30) + '...' : v));
        } else if (typeof v === 'number') {
          parts.push(k + '=' + v);
        } else if (typeof v === 'boolean') {
          parts.push(k + '=' + v);
        }
      }
      dataSummary = parts.join(', ');
    }

    const entry = { time, type, dataSummary };
    allEvents.push(entry);
    if (allEvents.length > MAX_EVENTS) allEvents.shift();

    // Check filter
    const filter = filterInput.value.trim();
    if (!matchesFilter(type, filter)) return;

    renderEntry(entry);
  }

  function renderEntry(entry) {
    const div = document.createElement('div');
    div.className = 'event-entry';

    const nsClass = getNamespaceClass(entry.type);

    div.innerHTML = `
      <span class="event-time">${entry.time}</span>
      <span class="event-name ${nsClass}">${escapeHtml(entry.type)}</span>
      <span class="event-data" title="${escapeHtml(entry.dataSummary)}">${escapeHtml(entry.dataSummary)}</span>
    `;

    log.appendChild(div);

    // Auto-scroll
    if (autoScrollCheckbox.checked) {
      log.scrollTop = log.scrollHeight;
    }

    // Limit DOM nodes
    while (log.children.length > MAX_EVENTS) {
      log.removeChild(log.firstChild);
    }
  }

  function refilter() {
    log.innerHTML = '';
    const filter = filterInput.value.trim();
    allEvents.forEach(entry => {
      if (matchesFilter(entry.type, filter)) {
        renderEntry(entry);
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Filter input handler (debounced)
  let filterTimeout;
  filterInput.addEventListener('input', () => {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(refilter, 300);
  });

  // Clear button
  clearBtn.addEventListener('click', () => {
    allEvents.length = 0;
    log.innerHTML = '';
  });

  // Event handler chain
  const prevHandler = window.onNexusEvent;
  window.onNexusEvent = function (type, data) {
    if (prevHandler) prevHandler(type, data);
    addEvent(type, data);
  };
})();
