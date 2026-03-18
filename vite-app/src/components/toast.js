/**
 * NEXUS ATIP V2.0 - Toast Notification Component
 * Non-blocking notification system for events and alerts
 */

import { eventBus, EVENTS } from '../core/event-bus.js';

const TOAST_DURATION = 4000;
const MAX_TOASTS = 5;

let _container = null;
let _toasts = [];

/**
 * Initialize toast container
 */
export function initToast() {
  if (_container) return;
  _container = document.getElementById('toast-container');
  if (!_container) {
    _container = document.createElement('div');
    _container.id = 'toast-container';
    _container.className = 'toast-container';
    document.body.appendChild(_container);
  }

  // Auto-wire event bus notifications
  eventBus.on(EVENTS.THREAT_NEW, (d) => showToast(`New threat: ${d.collection || 'item'}`, 'info'));
  eventBus.on(EVENTS.DETECTION_TRIGGERED, (d) => showToast(`Detection: ${d.matchCount || 0} matches`, 'warning'));
  eventBus.on(EVENTS.ANOMALY_DETECTED, (d) => showToast(`Anomaly: ${d.type || 'unknown'}`, 'critical'));
  eventBus.on(EVENTS.PLAYBOOK_TRIGGERED, (d) => showToast(`Playbook: ${d.playbookName || 'triggered'}`, 'success'));
}

/**
 * Show a toast notification
 * @param {string} message - Toast message
 * @param {string} [level='info'] - 'info'|'success'|'warning'|'critical'
 * @param {number} [duration] - Duration in ms
 */
export function showToast(message, level = 'info', duration = TOAST_DURATION) {
  if (!_container) initToast();

  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const el = document.createElement('div');
  el.className = `toast toast--${level}`;
  el.id = id;
  el.innerHTML = `
    <span class="toast__icon">${levelIcon(level)}</span>
    <span class="toast__msg">${message}</span>
    <button class="toast__close" onclick="this.parentElement.remove()">&times;</button>
  `;

  _container.appendChild(el);
  _toasts.push(id);

  // Enforce max
  while (_toasts.length > MAX_TOASTS) {
    const oldId = _toasts.shift();
    const oldEl = document.getElementById(oldId);
    if (oldEl) oldEl.remove();
  }

  // Auto-dismiss
  setTimeout(() => {
    const toastEl = document.getElementById(id);
    if (toastEl) {
      toastEl.classList.add('toast--fade');
      setTimeout(() => toastEl.remove(), 300);
    }
    _toasts = _toasts.filter(t => t !== id);
  }, duration);

  return id;
}

function levelIcon(level) {
  switch (level) {
    case 'critical': return '[!]';
    case 'warning': return '[~]';
    case 'success': return '[+]';
    default: return '[*]';
  }
}

export default { initToast, showToast };
