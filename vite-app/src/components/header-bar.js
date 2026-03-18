/**
 * NEXUS ATIP V2.0 - Header Bar Component
 * Top header with title, TLP badge, and live clock
 */

import { tlpBadge } from './badge.js';

let _clockInterval = null;

/**
 * Render header bar HTML
 * @param {Object} opts
 * @param {string} opts.title - Current view title
 * @param {string} [opts.tlp='GREEN'] - TLP level
 * @returns {string} HTML string
 */
export function headerBar({ title = 'Dashboard', tlp = 'GREEN' } = {}) {
  return `
    <header class="header-bar" role="banner">
      <div class="header-bar__left">
        <h2 class="header-bar__title" id="view-title">${title}</h2>
      </div>
      <div class="header-bar__center">
        <div class="header-search" id="header-search">
          <span class="header-search__icon">/</span>
          <input class="header-search__input" id="header-search-input"
                 type="text" placeholder="Search views... (press /)" autocomplete="off" />
          <div class="header-search__results" id="header-search-results"></div>
        </div>
      </div>
      <div class="header-bar__right">
        <span class="header-bar__refresh" id="auto-refresh-timer" title="Auto-refresh"></span>
        <div class="header-bar__notif" id="notif-bell" title="Notifications">
          <span class="notif-bell__icon">[!]</span>
          <span class="notif-bell__badge" id="notif-badge">0</span>
          <div class="notif-bell__dropdown" id="notif-dropdown">
            <div class="notif-bell__header">Notifications</div>
            <div class="notif-bell__list" id="notif-list">
              <div class="notif-bell__empty">No new notifications</div>
            </div>
          </div>
        </div>
        ${tlpBadge(tlp)}
        <span class="header-bar__clock" id="header-clock">${formatTime()}</span>
      </div>
    </header>
    <div class="breadcrumb-bar" id="breadcrumb-bar">
      <span class="breadcrumb__item" data-view="dashboard">Dashboard</span>
      <span class="breadcrumb__sep">/</span>
      <span class="breadcrumb__current">${title}</span>
    </div>
  `;
}

/**
 * Start the live clock update
 */
export function startClock() {
  stopClock();
  _clockInterval = setInterval(() => {
    const el = document.getElementById('header-clock');
    if (el) el.textContent = formatTime();
  }, 1000);
}

/**
 * Stop the live clock
 */
export function stopClock() {
  if (_clockInterval) {
    clearInterval(_clockInterval);
    _clockInterval = null;
  }
}

/**
 * Update header title
 * @param {string} title
 */
export function updateTitle(title) {
  const el = document.getElementById('view-title');
  if (el) el.textContent = title;
}

function formatTime() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export default { headerBar, startClock, stopClock, updateTitle };
