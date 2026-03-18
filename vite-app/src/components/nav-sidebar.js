/**
 * NEXUS ATIP V2.0 - Navigation Sidebar Component
 * Collapsible sidebar with sectioned navigation
 */

/**
 * Navigation structure definition
 */
const NAV_SECTIONS = [
  {
    title: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '[#]' },
      { id: 'detection', label: 'Detection', icon: '[!]' },
      { id: 'soar', label: 'SOAR', icon: '[>]' }
    ]
  },
  {
    title: 'Intelligence',
    items: [
      { id: 'threats', label: 'Threat Actors', icon: '[*]' },
      { id: 'indicators', label: 'Indicators', icon: '[~]' },
      { id: 'malware', label: 'Malware', icon: '[x]' },
      { id: 'darkweb', label: 'Dark Web', icon: '[.]' },
      { id: 'prediction', label: 'Prediction', icon: '[?]' }
    ]
  },
  {
    title: 'Knowledge',
    items: [
      { id: 'graph', label: 'Threat Graph', icon: '[=]' },
      { id: 'mitre', label: 'MITRE ATT&CK', icon: '[+]' },
      { id: 'feeds', label: 'Feeds', icon: '[@]' }
    ]
  }
];

/**
 * Render sidebar HTML
 * @param {string} activeView - Currently active view ID
 * @returns {string} HTML string
 */
export function navSidebar(activeView = 'dashboard') {
  return `
    <nav class="sidebar" id="app-sidebar" role="navigation" aria-label="Main navigation">
      <div class="sidebar__brand">
        <div class="sidebar__logo">NEXUS</div>
        <div class="sidebar__subtitle">ATIP V2.0</div>
      </div>
      <button class="sidebar__toggle" id="sidebar-toggle" title="Toggle sidebar (S)">
        <span class="sidebar__toggle-icon">&laquo;</span>
      </button>
      <div class="sidebar__nav">
        ${NAV_SECTIONS.map(section => renderSection(section, activeView)).join('')}
      </div>
      <div class="sidebar__footer">
        <div class="sidebar__version">v2.0.0-modular</div>
      </div>
    </nav>
  `;
}

/**
 * Render a nav section
 */
function renderSection(section, activeView) {
  const key = `atip-nav-${section.title.toLowerCase()}`;
  let collapsed = false;
  try { collapsed = localStorage.getItem(key) === '1'; } catch {}
  return `
    <div class="nav-section${collapsed ? ' nav-section--collapsed' : ''}">
      <div class="nav-section__title" data-section-key="${key}">
        <span class="nav-section__chevron">${collapsed ? '\u25B6' : '\u25BC'}</span>
        ${section.title}
      </div>
      <div class="nav-section__items"${collapsed ? ' style="display:none"' : ''}>
        ${section.items.map(item => renderNavItem(item, activeView)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render a single nav item
 */
function renderNavItem(item, activeView) {
  const active = item.id === activeView ? ' nav-item--active' : '';
  return `
    <a class="nav-item${active}" data-view="${item.id}" href="#${item.id}">
      <span class="nav-item__icon">${item.icon}</span>
      <span class="nav-item__label">${item.label}</span>
    </a>
  `;
}

/**
 * Wire up sidebar click handlers
 * @param {Function} onNavigate - Callback(viewId) when nav item clicked
 */
export function wireNavigation(onNavigate) {
  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const view = el.dataset.view;
      if (view && typeof onNavigate === 'function') {
        onNavigate(view);
      }
    });
  });
}

/**
 * Update active state in sidebar
 * @param {string} viewId
 */
export function setActiveNav(viewId) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('nav-item--active', el.dataset.view === viewId);
  });
}

/**
 * Get NAV_SECTIONS for external use
 */
export function getNavSections() {
  return NAV_SECTIONS;
}

/**
 * Get view label by ID
 * @param {string} viewId
 * @returns {string}
 */
export function getViewLabel(viewId) {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find(i => i.id === viewId);
    if (item) return item.label;
  }
  return viewId;
}

/**
 * Toggle sidebar collapsed state
 */
export function toggleSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const layout = document.querySelector('.app-layout');
  if (!sidebar) return;
  const collapsed = sidebar.classList.toggle('sidebar--collapsed');
  if (layout) layout.classList.toggle('sidebar-collapsed', collapsed);
  const icon = sidebar.querySelector('.sidebar__toggle-icon');
  if (icon) icon.innerHTML = collapsed ? '&raquo;' : '&laquo;';
  try { localStorage.setItem('atip-sidebar-collapsed', collapsed ? '1' : ''); } catch {}
}

/**
 * Restore sidebar state from localStorage
 */
export function restoreSidebarState() {
  try {
    if (localStorage.getItem('atip-sidebar-collapsed') === '1') toggleSidebar();
  } catch {}
}

/**
 * Wire up section collapse/expand click handlers
 */
export function wireSectionCollapse() {
  document.querySelectorAll('.nav-section__title[data-section-key]').forEach(title => {
    if (title.dataset.collapseWired) return;
    title.dataset.collapseWired = '1';
    title.setAttribute('tabindex', '0');
    title.setAttribute('role', 'button');
    title.setAttribute('aria-expanded', 'true');
    const doToggle = () => {
      const key = title.dataset.sectionKey;
      const section = title.closest('.nav-section');
      const items = section?.querySelector('.nav-section__items');
      const chevron = title.querySelector('.nav-section__chevron');
      if (!items) return;
      const collapsed = section.classList.toggle('nav-section--collapsed');
      items.style.display = collapsed ? 'none' : '';
      if (chevron) chevron.textContent = collapsed ? '\u25B6' : '\u25BC';
      title.setAttribute('aria-expanded', String(!collapsed));
      try { localStorage.setItem(key, collapsed ? '1' : ''); } catch {}
    };
    title.addEventListener('click', doToggle);
    title.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doToggle(); }
    });
  });
}

export default { navSidebar, wireNavigation, setActiveNav, getNavSections, getViewLabel, toggleSidebar, restoreSidebarState, wireSectionCollapse };
