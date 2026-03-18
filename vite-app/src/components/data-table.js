/**
 * NEXUS ATIP V2.0 - Data Table Component
 * Reusable sortable/filterable data table
 * Used in all 11 view renderers
 */

import { badge, tlpBadge, severityBadge, statusBadge } from './badge.js';

/**
 * Column definition format:
 * { key: string, label: string, type?: 'text'|'badge-severity'|'badge-tlp'|'badge-status'|'number'|'date'|'custom', render?: Function }
 */

/**
 * Render a data table
 * @param {Object} opts
 * @param {string} opts.title - Table title
 * @param {Array<Object>} opts.columns - Column definitions [{key, label, type?, render?}]
 * @param {Array<Object>} opts.rows - Data rows
 * @param {string} [opts.emptyText] - Text when no rows
 * @param {number} [opts.limit=50] - Max rows to display
 * @param {string} [opts.id] - Optional table ID
 * @returns {string} HTML string
 */
let _tableIdCounter = 0;

export function dataTable({ title, columns, rows, emptyText = 'No data available', limit = 50, id = '', sortable = true }) {
  const displayRows = rows.slice(0, limit);
  const tableId = id || `dt-${++_tableIdCounter}`;
  const idAttr = ` id="${tableId}"`;
  const overflow = rows.length > limit ? `<div class="table-overflow">${rows.length - limit} more rows...</div>` : '';

  return `
    <div class="card"${idAttr}>
      ${title ? `<div class="card__header"><h3>${title}</h3><span class="card__count">${rows.length}</span></div>` : ''}
      <div class="table-wrap">
        <table class="data-table"${sortable ? ' data-sortable="1"' : ''}>
          <thead>
            <tr>${columns.map((col, i) =>
              sortable
                ? `<th class="sortable-th" data-col-idx="${i}" data-sort-type="${col.type || 'text'}" data-sort-key="${col.key}">${col.label}<span class="sort-arrow"></span></th>`
                : `<th>${col.label}</th>`
            ).join('')}</tr>
          </thead>
          <tbody>
            ${displayRows.length === 0
              ? `<tr><td colspan="${columns.length}" class="table-empty">${emptyText}</td></tr>`
              : displayRows.map(row => renderRow(row, columns)).join('')
            }
          </tbody>
        </table>
      </div>
      ${overflow}
    </div>
  `;
}

/**
 * Render a single table row
 */
function renderRow(row, columns) {
  return `<tr>${columns.map(col => `<td>${renderCell(row, col)}</td>`).join('')}</tr>`;
}

/**
 * Render a cell value based on column type
 */
function renderCell(row, col) {
  const value = getNestedValue(row, col.key);

  // Custom render function takes priority
  if (typeof col.render === 'function') {
    return col.render(value, row);
  }

  if (value === undefined || value === null) return '-';

  switch (col.type) {
    case 'badge-severity':
      return severityBadge(value);
    case 'badge-tlp':
      return tlpBadge(value);
    case 'badge-status':
      return statusBadge(value);
    case 'badge':
      return badge(value, col.badgeType || 'status');
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value;
    case 'percent':
      return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value;
    case 'date':
      return value ? new Date(value).toLocaleString() : '-';
    case 'list':
      return Array.isArray(value) ? value.join(', ') : value;
    case 'code':
      return `<code>${escapeHtml(String(value))}</code>`;
    default:
      return escapeHtml(String(value));
  }
}

/**
 * Get nested object value by dot-notation key
 */
function getNestedValue(obj, key) {
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : null, obj);
}

/**
 * Escape HTML
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Render a simple key-value info table (vertical layout)
 * @param {Object} opts
 * @param {string} opts.title - Table title
 * @param {Array<{label: string, value: string|number}>} opts.items
 * @returns {string} HTML string
 */
export function infoTable({ title, items }) {
  return `
    <div class="card">
      ${title ? `<div class="card__header"><h3>${title}</h3></div>` : ''}
      <div class="table-wrap">
        <table class="data-table info-table">
          <tbody>
            ${items.map(item => `
              <tr>
                <td class="info-table__label">${item.label}</td>
                <td>${item.value ?? '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Wire up click-to-sort on all sortable data tables
 * Call this in postRenderEffects()
 */
export function wireTableSorting() {
  document.querySelectorAll('table[data-sortable] .sortable-th').forEach(th => {
    if (th.dataset.sortWired) return;
    th.dataset.sortWired = '1';
    th.addEventListener('click', () => {
      const table = th.closest('table');
      const tbody = table?.querySelector('tbody');
      if (!tbody) return;
      const colIdx = parseInt(th.dataset.colIdx, 10);
      const sortType = th.dataset.sortType || 'text';

      // Toggle direction
      const curDir = th.dataset.sortDir || '';
      const newDir = curDir === 'asc' ? 'desc' : 'asc';

      // Clear all arrows in this table
      table.querySelectorAll('.sortable-th').forEach(h => {
        h.dataset.sortDir = '';
        h.classList.remove('sort-asc', 'sort-desc');
      });
      th.dataset.sortDir = newDir;
      th.classList.add(newDir === 'asc' ? 'sort-asc' : 'sort-desc');

      // Sort rows
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        const cellA = a.children[colIdx]?.textContent?.trim() || '';
        const cellB = b.children[colIdx]?.textContent?.trim() || '';
        let cmp = 0;
        if (sortType === 'number' || sortType === 'percent') {
          const nA = parseFloat(cellA.replace(/[,%]/g, '')) || 0;
          const nB = parseFloat(cellB.replace(/[,%]/g, '')) || 0;
          cmp = nA - nB;
        } else {
          cmp = cellA.localeCompare(cellB, undefined, { numeric: true, sensitivity: 'base' });
        }
        return newDir === 'asc' ? cmp : -cmp;
      });
      rows.forEach(r => tbody.appendChild(r));
    });
  });
}

export default { dataTable, infoTable, wireTableSorting };
