/**
 * NEXUS ATIP V2.0 - Stat Card Component
 * Reusable statistics card for dashboard widgets
 * Used across: Dashboard, Detection, Malware, DarkWeb, Prediction, SOAR, Graph, Feeds
 */

/**
 * Render a single stat card
 * @param {Object} opts
 * @param {string} opts.label - Card label
 * @param {string|number} opts.value - Primary value
 * @param {string} [opts.sub] - Subtitle/description
 * @param {string} [opts.severity] - 'critical'|'high'|'medium'|'low' for accent color
 * @param {string} [opts.icon] - Optional icon character/text
 * @returns {string} HTML string
 */
export function statCard({ label, value, sub = '', severity = '', icon = '', sparkline = null, sparkColor = '', trend = null }) {
  const accentClass = severity ? `stat-card--${severity}` : '';
  const iconHtml = icon ? `<span class="stat-card__icon">${icon}</span>` : '';
  // If value is a pure integer, mark for count-up animation
  const numVal = typeof value === 'number' ? value : parseInt(String(value).replace(/,/g, ''), 10);
  const isCountable = !isNaN(numVal) && String(value).replace(/,/g, '') === String(numVal);
  const countAttr = isCountable ? ` data-count-target="${numVal}"` : '';
  const sparkAttr = sparkline ? ` data-sparkline='${JSON.stringify(sparkline)}'` : '';
  const sparkColorAttr = sparkColor ? ` data-spark-color="${sparkColor}"` : '';
  // Trend indicator: { direction: 'up'|'down'|'flat', value: '12%' }
  const trendHtml = trend ? `<span class="stat-card__trend stat-card__trend--${trend.direction}">${trend.direction === 'up' ? '\u25B2' : trend.direction === 'down' ? '\u25BC' : '\u25CF'} ${trend.value}</span>` : '';

  return `
    <div class="stat-card ${accentClass}"${sparkAttr}${sparkColorAttr}>
      <div class="stat-card__header">
        ${iconHtml}
        <span class="stat-card__label">${label}</span>
      </div>
      <div class="stat-card__value"${countAttr}>${isCountable ? '0' : value}${trendHtml}</div>
      ${sub ? `<div class="stat-card__sub">${sub}</div>` : ''}
    </div>
  `;
}

/**
 * Render a row of stat cards
 * @param {Array<Object>} cards - Array of statCard option objects
 * @param {number} [cols=4] - Number of columns
 * @returns {string} HTML string
 */
export function statCardRow(cards, cols = 4) {
  return `
    <div class="stat-row stat-row--${cols}">
      ${cards.map(c => statCard(c)).join('')}
    </div>
  `;
}

export default { statCard, statCardRow };
