/**
 * NEXUS Config Parser - Architect.md -> Runtime Config
 *
 * Parses the human-readable Architect.md markdown into a
 * structured runtime configuration object.
 *
 * Features:
 * - Markdown section parsing (## headers)
 * - Key-value extraction (- key: value)
 * - Table parsing (| col | col |)
 * - Array/list extraction ([item1, item2])
 * - JSON cache for fast reload (nexus.config.json)
 * - Fallback to cache on parse failure
 *
 * @module nexus/core/config-parser
 */

'use strict';

const fs = require('fs');
const path = require('path');

const NEXUS_ROOT = path.resolve(__dirname, '..');
const ARCHITECT_PATH = path.join(NEXUS_ROOT, 'Architect.md');
const CACHE_PATH = path.join(NEXUS_ROOT, 'nexus.config.json');

/**
 * Parse a markdown value into its JS type
 */
function parseValue(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return parseFloat(trimmed);

  // Array: [item1, item2, item3]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1);
    return inner.split(',').map(s => parseValue(s.trim()));
  }

  return trimmed;
}

/**
 * Parse a markdown table into array of objects
 */
function parseTable(lines) {
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = headerLine
    .split('|')
    .map(h => h.trim())
    .filter(h => h && !h.match(/^-+$/));

  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i]
      .split('|')
      .map(c => c.trim())
      .filter(c => c);

    if (cells.length === 0) continue;

    const row = {};
    headers.forEach((h, idx) => {
      const key = h.toLowerCase().replace(/\s+/g, '_');
      row[key] = parseValue(cells[idx] || '');
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a provider block (### provider-name followed by - key: value lines)
 */
function parseProviderBlock(lines) {
  const provider = {};
  for (const line of lines) {
    const match = line.match(/^-\s+(\w[\w_]*)\s*:\s*(.+)$/);
    if (match) {
      provider[match[1]] = parseValue(match[2]);
    }
  }
  return provider;
}

/**
 * Main parse function - converts Architect.md to config object
 */
function parseArchitectMd(content) {
  const config = {
    providers: {},
    routing: {
      task_provider_map: [],
      strategy: 'adaptive_weighted',
      fallback_chain: [],
      max_retries: 3,
      timeout_ms: 60000,
      complexity_routing: []
    },
    cost: {
      budget: {},
      tiering: {},
      tracking: {}
    },
    workflows: {
      registered: [],
      defaults: {}
    },
    evolution: {
      weight_adjustment: {},
      pattern_learning: {},
      discovery: {}
    },
    self_evolution: {
      per_session: {},
      periodic: {},
      monthly: {}
    },
    integration: {
      atos: {},
      multi_ai: {},
      hooks: {}
    },
    metadata: {}
  };

  const lines = content.split('\n');
  let currentSection = null;
  let currentSubSection = null;
  let currentProvider = null;
  let tableBuffer = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Level 2 header (## Section)
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      // Flush table if pending
      if (inTable && tableBuffer.length > 0) {
        flushTable(config, currentSection, currentSubSection, tableBuffer);
        tableBuffer = [];
        inTable = false;
      }
      currentSection = h2Match[1].trim().toLowerCase().replace(/\s+/g, '_');
      currentSubSection = null;
      currentProvider = null;
      continue;
    }

    // Level 3 header (### SubSection)
    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match) {
      if (inTable && tableBuffer.length > 0) {
        flushTable(config, currentSection, currentSubSection, tableBuffer);
        tableBuffer = [];
        inTable = false;
      }
      currentSubSection = h3Match[1].trim().toLowerCase().replace(/\s+/g, '_');

      // Provider detection
      if (currentSection === 'providers') {
        currentProvider = currentSubSection;
        config.providers[currentProvider] = {};
      }
      continue;
    }

    // Table row
    if (line.trim().startsWith('|')) {
      inTable = true;
      tableBuffer.push(line.trim());
      continue;
    } else if (inTable && tableBuffer.length > 0) {
      flushTable(config, currentSection, currentSubSection, tableBuffer);
      tableBuffer = [];
      inTable = false;
    }

    // Key-value line (- key: value)
    const kvMatch = line.match(/^-\s+(\w[\w_]*)\s*:\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const value = parseValue(kvMatch[2]);

      if (currentProvider && currentSection === 'providers') {
        config.providers[currentProvider][key] = value;
      } else if (currentSection === 'cost_controls') {
        assignToPath(config.cost, currentSubSection, key, value);
      } else if (currentSection === 'evolution_settings') {
        assignToPath(config.evolution, currentSubSection, key, value);
      } else if (currentSection === 'self-evolution_schedule') {
        assignToPath(config.self_evolution, currentSubSection, key, value);
      } else if (currentSection === 'routing_rules') {
        assignToPath(config.routing, currentSubSection, key, value);
      } else if (currentSection === 'integration_points') {
        assignToPath(config.integration, currentSubSection, key, value);
      } else if (currentSection === 'metadata') {
        config.metadata[key] = value;
      }
      continue;
    }

    // Nested key-value (  - sub_key: value)
    const nestedKvMatch = line.match(/^\s+-\s+(\w[\w_]*)\s*:\s*(.+)$/);
    if (nestedKvMatch) {
      const key = nestedKvMatch[1];
      const value = parseValue(nestedKvMatch[2]);

      if (currentProvider && currentSection === 'providers') {
        config.providers[currentProvider][key] = value;
      }
    }
  }

  // Final table flush
  if (inTable && tableBuffer.length > 0) {
    flushTable(config, currentSection, currentSubSection, tableBuffer);
  }

  return config;
}

/**
 * Flush a collected table into the config
 */
function flushTable(config, section, subSection, tableLines) {
  const rows = parseTable(tableLines);
  if (rows.length === 0) return;

  if (section === 'routing_rules') {
    if (subSection === 'task-provider_mapping') {
      config.routing.task_provider_map = rows;
    } else if (subSection === 'complexity_routing') {
      config.routing.complexity_routing = rows;
    }
  } else if (section === 'workflow_patterns') {
    if (subSection === 'registered_workflows') {
      config.workflows.registered = rows;
    }
  }
}

/**
 * Assign a value to a nested config path
 */
function assignToPath(obj, subSection, key, value) {
  if (subSection) {
    if (!obj[subSection]) obj[subSection] = {};
    obj[subSection][key] = value;
  } else {
    obj[key] = value;
  }
}

/**
 * Load config from Architect.md with cache fallback
 */
function loadConfig(forceReparse = false) {
  // Try cache first (unless forced)
  if (!forceReparse && fs.existsSync(CACHE_PATH)) {
    try {
      const cached = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
      const architectStat = fs.existsSync(ARCHITECT_PATH)
        ? fs.statSync(ARCHITECT_PATH).mtimeMs
        : 0;

      // Cache is valid if Architect.md hasn't changed
      if (cached._cachedAt && cached._architectMtime === architectStat) {
        delete cached._cachedAt;
        delete cached._architectMtime;
        return cached;
      }
    } catch (e) {
      // Cache corrupted, reparse
    }
  }

  // Parse Architect.md
  if (!fs.existsSync(ARCHITECT_PATH)) {
    console.error('[!] Architect.md not found at:', ARCHITECT_PATH);
    return null;
  }

  try {
    const content = fs.readFileSync(ARCHITECT_PATH, 'utf8');
    const config = parseArchitectMd(content);

    // Save cache
    const architectStat = fs.statSync(ARCHITECT_PATH).mtimeMs;
    const cacheable = {
      ...config,
      _cachedAt: Date.now(),
      _architectMtime: architectStat
    };
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cacheable, null, 2));

    return config;
  } catch (e) {
    console.error('[!] Failed to parse Architect.md:', e.message);

    // Fallback to cache
    if (fs.existsSync(CACHE_PATH)) {
      try {
        const cached = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
        delete cached._cachedAt;
        delete cached._architectMtime;
        console.log('[*] Using cached config as fallback');
        return cached;
      } catch (ce) {
        console.error('[!] Cache also corrupted');
      }
    }

    return null;
  }
}

/**
 * Get a specific provider config
 */
function getProvider(config, providerId) {
  return config?.providers?.[providerId] || null;
}

/**
 * Get all enabled providers
 */
function getEnabledProviders(config) {
  if (!config?.providers) return [];
  return Object.entries(config.providers)
    .filter(([_, p]) => p.enabled !== false)
    .map(([id, p]) => ({ id, ...p }));
}

/**
 * Get routing rule for a task type
 */
function getRoutingRule(config, taskType) {
  if (!config?.routing?.task_provider_map) return null;
  return config.routing.task_provider_map.find(
    r => r.task_type === taskType
  );
}

/**
 * Get routing by complexity score
 */
function getComplexityRoute(config, score) {
  if (!config?.routing?.complexity_routing) return null;
  for (const rule of config.routing.complexity_routing) {
    const [min, max] = String(rule.score).split('-').map(Number);
    if (score >= min && score <= max) return rule;
  }
  return null;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'parse':
    case 'load': {
      const config = loadConfig(command === 'parse');
      if (config) {
        console.log(JSON.stringify(config, null, 2));
      } else {
        console.error('[-] Failed to load config');
        process.exit(1);
      }
      break;
    }

    case 'providers': {
      const config = loadConfig();
      if (config) {
        const providers = getEnabledProviders(config);
        console.log('[*] Enabled Providers:');
        providers.forEach(p => {
          console.log(`  [+] ${p.id}: ${p.role || 'unknown'} (ctx: ${p.context || '?'})`);
        });
      }
      break;
    }

    case 'validate': {
      const config = loadConfig(true);
      if (!config) {
        console.error('[-] Config validation failed: cannot parse');
        process.exit(1);
      }
      const providers = Object.keys(config.providers || {});
      const workflows = (config.workflows?.registered || []).length;
      console.log('[+] Config valid');
      console.log(`    Providers: ${providers.length} (${providers.join(', ')})`);
      console.log(`    Workflows: ${workflows}`);
      console.log(`    Evolution: ${config.evolution?.weight_adjustment?.learning_rate || 'N/A'}`);
      break;
    }

    default:
      console.log(`
NEXUS Config Parser
===================
Usage: node config-parser.js <command>

Commands:
  parse       Force re-parse Architect.md (ignore cache)
  load        Load config (cache-first)
  providers   List enabled providers
  validate    Validate Architect.md structure
`);
  }
}

module.exports = {
  parseArchitectMd,
  loadConfig,
  getProvider,
  getEnabledProviders,
  getRoutingRule,
  getComplexityRoute,
  parseValue,
  parseTable,
  ARCHITECT_PATH,
  CACHE_PATH,
  NEXUS_ROOT
};
