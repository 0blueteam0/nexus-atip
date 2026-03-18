/**
 * NEXUS ATIP V2.0 - Badge Component
 * Reusable badge for severity, TLP, status indicators
 */

const SEVERITY_CLASSES = {
  critical: 'badge-critical',
  high: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low',
  info: 'badge-info'
};

const TLP_CLASSES = {
  RED: 'badge-critical',
  AMBER: 'badge-high',
  GREEN: 'badge-low',
  WHITE: 'badge-info',
  CLEAR: 'badge-info'
};

const STATUS_CLASSES = {
  active: 'badge-high',
  inactive: 'badge-medium',
  ready: 'badge-low',
  error: 'badge-critical',
  running: 'badge-info',
  completed: 'badge-low',
  pending: 'badge-medium'
};

/**
 * Render a badge element
 * @param {string} text - Badge text
 * @param {string} type - 'severity' | 'tlp' | 'status' | 'custom'
 * @param {string} [customClass] - Custom CSS class override
 * @returns {string} HTML string
 */
export function badge(text, type = 'status', customClass = '') {
  if (!text) return '';

  let cssClass = 'badge';
  const upperText = String(text).toUpperCase();
  const lowerText = String(text).toLowerCase();

  switch (type) {
    case 'severity':
      cssClass += ` ${SEVERITY_CLASSES[lowerText] || 'badge-info'}`;
      break;
    case 'tlp':
      cssClass += ` ${TLP_CLASSES[upperText] || 'badge-info'}`;
      break;
    case 'status':
      cssClass += ` ${STATUS_CLASSES[lowerText] || 'badge-info'}`;
      break;
    case 'custom':
      cssClass += ` ${customClass}`;
      break;
    default:
      cssClass += ' badge-info';
  }

  return `<span class="${cssClass}">${escapeHtml(text)}</span>`;
}

/**
 * Render a TLP badge
 */
export function tlpBadge(tlp) {
  return badge(tlp || 'GREEN', 'tlp');
}

/**
 * Render a severity badge
 */
export function severityBadge(severity) {
  return badge(severity || 'low', 'severity');
}

/**
 * Render a status badge
 */
export function statusBadge(status) {
  return badge(status || 'inactive', 'status');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

export default { badge, tlpBadge, severityBadge, statusBadge };
