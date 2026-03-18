/**
 * NEXUS ATIP V2.0 - View Registry
 * Replaces switch-case routing with declarative view registration
 */

const _views = new Map();

/**
 * Register a view renderer
 * @param {string} id - View ID (matches nav-item data-view)
 * @param {Function} renderer - Function that returns HTML string
 */
export function registerView(id, renderer) {
  _views.set(id, renderer);
}

/**
 * Render a registered view
 * @param {string} id - View ID
 * @returns {string} HTML string
 */
export function renderView(id) {
  const renderer = _views.get(id);
  if (!renderer) {
    return `<div class="view-error">View "${id}" not found</div>`;
  }
  return renderer();
}

/**
 * Check if a view is registered
 * @param {string} id
 * @returns {boolean}
 */
export function hasView(id) {
  return _views.has(id);
}

/**
 * Get all registered view IDs
 * @returns {string[]}
 */
export function getViewIds() {
  return Array.from(_views.keys());
}

/**
 * Render view into a target element
 * @param {string} viewId
 * @param {string|HTMLElement} target - CSS selector or element
 */
export function mountView(viewId, target) {
  const container = typeof target === 'string'
    ? document.querySelector(target)
    : target;

  if (!container) return;
  container.innerHTML = renderView(viewId);
}

/**
 * Generate skeleton placeholder HTML for view transitions (Iteration 19)
 * @returns {string} Skeleton HTML
 */
export function skeletonPlaceholder() {
  return `
    <div class="skeleton-view" aria-busy="true" aria-label="Loading view">
      <div class="skeleton-view__stats">
        ${Array(4).fill('<div class="skeleton-view__stat-card"><div class="skeleton skeleton--value"></div><div class="skeleton skeleton--text"></div></div>').join('')}
      </div>
      <div class="skeleton-view__content">
        <div class="skeleton-view__panel">
          <div class="skeleton skeleton--text" style="width:30%"></div>
          <div class="skeleton skeleton--card"></div>
        </div>
        <div class="skeleton-view__panel">
          <div class="skeleton skeleton--text" style="width:40%"></div>
          <div class="skeleton skeleton--card"></div>
        </div>
      </div>
    </div>
  `;
}

export default { registerView, renderView, hasView, getViewIds, mountView, skeletonPlaceholder };
