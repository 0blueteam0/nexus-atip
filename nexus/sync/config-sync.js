#!/usr/bin/env node
'use strict';

/**
 * NEXUS Config Sync Engine
 *
 * Synchronizes MCP server configs from .claude.json to:
 * - .gemini/settings.json (Gemini CLI)
 * - .codex/config.toml (Codex CLI)
 *
 * Usage:
 *   node nexus/sync/config-sync.js           # Full sync
 *   node nexus/sync/config-sync.js --dry-run # Preview changes
 *   node nexus/sync/config-sync.js --gemini  # Gemini only
 *   node nexus/sync/config-sync.js --codex   # Codex only
 *
 * @module nexus/sync/config-sync
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CLAUDE_JSON = path.join(ROOT, '.claude.json');
const GEMINI_SETTINGS = path.join(ROOT, '.gemini', 'settings.json');
const CODEX_CONFIG = path.join(ROOT, '.codex', 'config.toml');
const CODEX_RUNTIME_HOME = path.join(ROOT, 'temp', 'codex-home');
const CODEX_RUNTIME_CONFIG = path.join(CODEX_RUNTIME_HOME, 'config.toml');
const CODEX_RUNTIME_STATE_DIR = path.join(CODEX_RUNTIME_HOME, '.codex');
const CODEX_RUNTIME_DOT_CONFIG = path.join(CODEX_RUNTIME_STATE_DIR, 'config.toml');
const CODEX_RUNTIME_SKILLS = path.join(CODEX_RUNTIME_HOME, 'skills');
const CODEX_COMPAT_SCRIPT = path.join(ROOT, 'nexus', 'scripts', 'codex-claude-compat.js');

// MCP servers safe to mirror (no Docker dependency, portable)
const GEMINI_PORTABLE_SERVERS = new Set([
  'desktop-commander',
  'github',
  'memory',
  'sqlite-mcp',
  'sequential-thinking',
  'shrimp-task',
  'edit-file-lines'
]);

// Servers that need Docker (skip by default)
const DOCKER_SERVERS = new Set([
  'firecrawl',
  'crawl4ai-lite',
  'searxng-crawl4ai-mcp'
]);

// Servers that repeatedly break Codex startup in the portable runtime.
// Keep them available in Claude, but defer them from the Codex mirror.
const CODEX_DEFERRED_SERVERS = new Map([
  ['mcp-installer', 'deferred-for-codex-startup-stability'],
  ['crawl4ai-lite', 'remote-package-startup-instability'],
  ['playwright', 'browser-bootstrap-instability'],
  ['hfspace', 'missing-hf-token'],
  ['task-master-ai', 'missing-anthropic-api-key'],
  ['notion', 'missing-notion-token']
]);

class ConfigSync {
  constructor(opts = {}) {
    this.dryRun = opts.dryRun || false;
    this.results = {
      gemini: null,
      codex: null,
      skipped: {
        gemini: [],
        codex: []
      }
    };
  }

  normalizePortablePath(value) {
    return typeof value === 'string' ? value.replace(/\\/g, '/') : value;
  }

  ensureNpxArgs(args = []) {
    return args[0] === '-y' ? args : ['-y', ...args];
  }

  /**
   * Read .claude.json and extract MCP server configs
   */
  readClaudeConfig() {
    try {
      const raw = fs.readFileSync(CLAUDE_JSON, 'utf8');
      const config = JSON.parse(raw);
      return config.mcpServers || {};
    } catch (e) {
      console.error(`[-] Cannot read .claude.json: ${e.message}`);
      return {};
    }
  }

  /**
   * Filter servers suitable for cross-CLI sync
   */
  filterGeminiServers(mcpServers) {
    const filtered = {};
    const skipped = [];

    for (const [name, config] of Object.entries(mcpServers)) {
      if (DOCKER_SERVERS.has(name)) {
        skipped.push({ name, reason: 'docker-dependent' });
        continue;
      }
      if (GEMINI_PORTABLE_SERVERS.has(name)) {
        filtered[name] = config;
      } else {
        skipped.push({ name, reason: 'not-in-portable-list' });
      }
    }

    this.results.skipped.gemini = skipped;
    return filtered;
  }

  filterCodexServers(mcpServers) {
    const filtered = {};
    const skipped = [];

    for (const [name, config] of Object.entries(mcpServers)) {
      if (CODEX_DEFERRED_SERVERS.has(name)) {
        skipped.push({ name, reason: CODEX_DEFERRED_SERVERS.get(name) });
        continue;
      }

      const type = config.type || 'stdio';

      if (type === 'stdio' && typeof config.command === 'string') {
        filtered[name] = config;
        continue;
      }

      if ((type === 'http' || type === 'sse') && typeof config.url === 'string') {
        filtered[name] = config;
        continue;
      }

      skipped.push({ name, reason: `unsupported-type:${type}` });
    }

    this.results.skipped.codex = skipped;
    return filtered;
  }

  /**
   * Convert Claude MCP config to Gemini settings.json format
   */
  toGeminiFormat(servers) {
    const geminiServers = {};

    for (const [name, config] of Object.entries(servers)) {
      const entry = {};
      const command = this.normalizePortablePath(config.command || '');
      const args = (config.args || []).map(arg => this.normalizePortablePath(arg));

      // Normalize command
      if (command === 'cmd' && args[0] === '/c') {
        // cmd /c npx ... -> npx ...
        if (args[1] === 'npx') {
          entry.command = 'npx';
          entry.args = this.ensureNpxArgs(args.slice(2));
        } else {
          entry.command = args[1];
          entry.args = args.slice(2);
        }
      } else if (command.toLowerCase().endsWith('node.exe')) {
        entry.command = 'node';
        entry.args = args;
      } else if (command.toLowerCase().endsWith('npx.cmd') || command === 'npx') {
        entry.command = 'npx';
        entry.args = this.ensureNpxArgs(args);
      } else {
        entry.command = command;
        entry.args = args;
      }

      if (config.timeout) entry.timeout = config.timeout;
      const env = this.toGeminiEnv(name, config.env || {});
      if (Object.keys(env).length > 0) {
        entry.env = env;
      }

      geminiServers[name] = entry;
    }

    return geminiServers;
  }

  toGeminiEnv(name, env) {
    const normalized = {};

    for (const [key, value] of Object.entries(env)) {
      normalized[key] = this.normalizePortablePath(value);
    }

    if (name === 'github' && normalized.GITHUB_TOKEN && !normalized.GITHUB_PERSONAL_ACCESS_TOKEN) {
      normalized.GITHUB_PERSONAL_ACCESS_TOKEN = normalized.GITHUB_TOKEN;
      delete normalized.GITHUB_TOKEN;
    }

    if (name === 'memory' && !normalized.MEMORY_FILE_PATH) {
      normalized.MEMORY_FILE_PATH = 'K:/PortableApps/genai/mcp-data/memory.json';
    }

    return normalized;
  }

  /**
   * Sync to .gemini/settings.json
   */
  syncGemini(servers) {
    const geminiDir = path.dirname(GEMINI_SETTINGS);
    if (!fs.existsSync(geminiDir)) fs.mkdirSync(geminiDir, { recursive: true });

    let existing = {};
    try {
      existing = JSON.parse(fs.readFileSync(GEMINI_SETTINGS, 'utf8'));
    } catch (e) { /* fresh start */ }

    const geminiServers = this.toGeminiFormat(servers);

    const updated = {
      ...existing,
      mcpServers: {
        ...(existing.mcpServers || {}),
        ...geminiServers
      },
      nexus: {
        ...(existing.nexus || {}),
        lastSync: new Date().toISOString()
      }
    };

    if (this.dryRun) {
      this.results.gemini = { path: GEMINI_SETTINGS, servers: Object.keys(geminiServers), dryRun: true };
      return;
    }

    fs.writeFileSync(GEMINI_SETTINGS, JSON.stringify(updated, null, 2));
    this.results.gemini = { path: GEMINI_SETTINGS, servers: Object.keys(geminiServers), status: 'synced' };
  }

  /**
   * Convert to Codex config.toml format
   */
  toCodexToml(servers) {
    const lines = [
      '# Codex CLI Configuration for NEXUS Multi-AI Orchestration',
      '# Auto-synced from .claude.json via: node nexus/sync/config-sync.js',
      `# Last sync: ${new Date().toISOString()}`,
      '',
      'project_doc_fallback_filenames = ["AGENTS.md", "CLAUDE.md", "CODEX.md"]',
      'project_doc_max_bytes = 65536',
      '',
      'notify = ["node", "K:/PortableApps/genai/nexus/hooks/codex-notify.js"]',
      '',
      '[history]',
      'persistence = "save-all"',
      ''
    ];

    for (const [name, config] of Object.entries(servers)) {
      const section = `mcp_servers.${name.replace(/-/g, '_')}`;
      const { command, args, url, bearerTokenEnvVar, cwd } = this.toCodexCommand(name, config);
      const env = this.toCodexEnv(name, config.env || {});

      lines.push(`[${section}]`);
      if (url) {
        lines.push(`url = "${url}"`);
      } else {
        lines.push(`command = "${command}"`);
      }
      if (args.length > 0) {
        lines.push(`args = [${args.map(arg => `"${arg}"`).join(', ')}]`);
      }
      if (bearerTokenEnvVar) {
        lines.push(`bearer_token_env_var = "${bearerTokenEnvVar}"`);
      }
      if (cwd) {
        lines.push(`cwd = "${cwd}"`);
      }
      lines.push('enabled = true');

      if (Object.keys(env).length > 0) {
        lines.push(`[${section}.env]`);
        for (const [k, v] of Object.entries(env)) {
          const val = this.normalizePortablePath(v);
          // Use $ENV_VAR for env references, quoted string otherwise
          if (val.startsWith('${') && val.endsWith('}')) {
            lines.push(`${k} = "$${val.slice(2, -1)}"`);
          } else {
            lines.push(`${k} = "${val}"`);
          }
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  toCodexCommand(name, config) {
    if (name === 'scrapegraph-local') {
      return {
        command: 'C:/Python313/python.exe',
        url: '',
        bearerTokenEnvVar: '',
        args: ['K:/PortableApps/genai/mcp-servers/scrapegraph-local-mcp/server.py'],
        cwd: ''
      };
    }

    if (name === 'serena') {
      return {
        command: 'K:/PortableApps/tools/uv/uvx.exe',
        url: '',
        bearerTokenEnvVar: '',
        args: [
          '--python',
          'C:/Python313/python.exe',
          '--from',
          'git+https://github.com/oraios/serena',
          'serena',
          'start-mcp-server'
        ],
        cwd: ''
      };
    }

    if ((config.type === 'http' || config.type === 'sse') && typeof config.url === 'string') {
      return {
        url: this.normalizePortablePath(config.url),
        bearerTokenEnvVar: config.bearerTokenEnvVar || '',
        command: '',
        args: [],
        cwd: ''
      };
    }

    const command = this.normalizePortablePath(config.command || '');
    const args = (config.args || []).map(arg => this.normalizePortablePath(arg));
    const cwd = this.normalizePortablePath(config.cwd || '');

    if (command === 'cmd' && args[0] === '/c') {
      if (args[1] === 'npx') {
        return {
          command: 'K:/PortableApps/tools/nodejs/npx.cmd',
          url: '',
          bearerTokenEnvVar: '',
          args: this.ensureNpxArgs(args.slice(2)),
          cwd
        };
      }

      return {
        command: args[1],
        url: '',
        bearerTokenEnvVar: '',
        args: args.slice(2),
        cwd
      };
    }

    if (command === 'node') {
      return {
        command: 'K:/PortableApps/tools/nodejs/node.exe',
        url: '',
        bearerTokenEnvVar: '',
        args,
        cwd
      };
    }

    if (command === 'npx') {
      return {
        command: 'K:/PortableApps/tools/nodejs/npx.cmd',
        url: '',
        bearerTokenEnvVar: '',
        args: this.ensureNpxArgs(args),
        cwd
      };
    }

    return {
      command,
      url: '',
      bearerTokenEnvVar: '',
      args,
      cwd
    };
  }

  toCodexEnv(name, env) {
    const normalized = {};

    for (const [key, value] of Object.entries(env)) {
      normalized[key] = this.normalizePortablePath(value);
    }

    if (name === 'github' && normalized.GITHUB_TOKEN && !normalized.GITHUB_PERSONAL_ACCESS_TOKEN) {
      normalized.GITHUB_PERSONAL_ACCESS_TOKEN = normalized.GITHUB_TOKEN;
      delete normalized.GITHUB_TOKEN;
    }

    if (name === 'memory' && !normalized.MEMORY_FILE_PATH) {
      normalized.MEMORY_FILE_PATH = 'K:/PortableApps/genai/mcp-data/memory.json';
    }

    if (name === 'ocr-mcp') {
      normalized.PYTHONPATH = [
        'K:/PortableApps/genai/python-packages/Python313/site-packages',
        'K:/PortableApps/genai/mcp-servers/ocr-mcp/src'
      ].join(';');
      normalized.PYTHONIOENCODING = 'utf-8:replace';
      normalized.PYTHONUTF8 = '1';
      normalized.OCR_DEFAULT_BACKEND = 'got-ocr';
      delete normalized.OCR_DEFAULT_ENGINE;
    }

    if (name === 'scrapegraph-local') {
      normalized.PYTHONIOENCODING = 'utf-8:replace';
      normalized.PYTHONUTF8 = '1';
    }

    if (name === 'serena') {
      normalized.PYTHONIOENCODING = 'utf-8:replace';
      normalized.PYTHONUTF8 = '1';
      normalized.UV_CACHE_DIR = 'K:/PortableApps/genai/temp/uv-cache';
      normalized.UV_TOOL_DIR = 'K:/PortableApps/genai/temp/uv-tools';
    }

    return normalized;
  }

  writeCodexTarget(targetPath, toml) {
    try {
      fs.writeFileSync(targetPath, toml);
      return { path: targetPath, status: 'synced' };
    } catch (e) {
      const reason = e.code || e.message;
      if ((reason === 'EPERM' || reason === 'EACCES') && targetPath === CODEX_CONFIG) {
        return { path: targetPath, status: 'protected', reason };
      }
      return { path: targetPath, status: 'error', reason };
    }
  }

  /**
   * Sync to .codex/config.toml
   */
  syncCodex(servers) {
    const codexDir = path.dirname(CODEX_CONFIG);
    if (!fs.existsSync(codexDir)) fs.mkdirSync(codexDir, { recursive: true });
    if (!fs.existsSync(CODEX_RUNTIME_HOME)) fs.mkdirSync(CODEX_RUNTIME_HOME, { recursive: true });
    if (!fs.existsSync(CODEX_RUNTIME_STATE_DIR)) fs.mkdirSync(CODEX_RUNTIME_STATE_DIR, { recursive: true });

    const toml = this.toCodexToml(servers);

    if (this.dryRun) {
      this.results.codex = { path: CODEX_CONFIG, servers: Object.keys(servers), dryRun: true };
      return;
    }

    const writes = [
      this.writeCodexTarget(CODEX_CONFIG, toml),
      this.writeCodexTarget(CODEX_RUNTIME_CONFIG, toml),
      this.writeCodexTarget(CODEX_RUNTIME_DOT_CONFIG, toml)
    ];

    const failed = writes.filter(write => write.status !== 'synced' && write.status !== 'protected');
    this.results.codex = {
      path: CODEX_CONFIG,
      servers: Object.keys(servers),
      status: failed.length === 0 ? 'synced' : failed.length === writes.length ? 'failed' : 'partial',
      writes
    };
  }

  /**
   * Create directory junction for shared skills roots
   */
  syncRootLink(target, link) {
    if (!fs.existsSync(target)) {
      return { link, target, status: 'missing-target' };
    }

    if (fs.existsSync(link)) {
      try {
        const existing = fs.readlinkSync(link);
        if (path.resolve(path.dirname(link), existing) === path.resolve(target)) {
          return { link, target, status: 'already-linked' };
        }
      } catch (e) {
        return { link, target, status: 'exists-not-symlink' };
      }
    }

    if (this.dryRun) {
      return { link, target, status: 'would-create' };
    }

    try {
      const linkDir = path.dirname(link);
      if (!fs.existsSync(linkDir)) fs.mkdirSync(linkDir, { recursive: true });
      fs.symlinkSync(target, link, 'junction');
      return { link, target, status: 'created' };
    } catch (e) {
      return { link, target, status: `error: ${e.message}` };
    }
  }

  syncCodexSkills(claudeSkills) {
    const links = [];

    if (!fs.existsSync(claudeSkills)) {
      return links;
    }

    if (!this.dryRun && !fs.existsSync(CODEX_RUNTIME_SKILLS)) {
      fs.mkdirSync(CODEX_RUNTIME_SKILLS, { recursive: true });
    }

    for (const entry of fs.readdirSync(claudeSkills, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const target = path.join(claudeSkills, entry.name);
      const skillMd = path.join(target, 'SKILL.md');
      if (!fs.existsSync(skillMd)) continue;

      const link = path.join(CODEX_RUNTIME_SKILLS, entry.name);
      links.push(this.syncRootLink(target, link));
    }

    return links;
  }

  syncCodexCompat() {
    if (!fs.existsSync(CODEX_COMPAT_SCRIPT)) return null;

    try {
      const { syncCompatSnapshot } = require(CODEX_COMPAT_SCRIPT);
      return syncCompatSnapshot({ silent: true });
    } catch (e) {
      return { error: e.message };
    }
  }

  syncSkillLinks() {
    const claudeSkills = path.join(ROOT, '.claude', 'skills');
    const geminiSkills = path.join(ROOT, '.gemini', 'skills');
    const agentsSkills = path.join(ROOT, '.agents', 'skills');

    this.syncCodexCompat();

    const links = [
      this.syncRootLink(claudeSkills, geminiSkills),
      this.syncRootLink(claudeSkills, agentsSkills),
      ...this.syncCodexSkills(claudeSkills)
    ];

    return links.filter(Boolean);
  }

  /**
   * Run full sync
   */
  sync(opts = {}) {
    const mcpServers = this.readClaudeConfig();
    if (Object.keys(mcpServers).length === 0) {
      return { synced: false, reason: 'no_mcp_servers' };
    }

    const geminiServers = this.filterGeminiServers(mcpServers);
    const codexServers = this.filterCodexServers(mcpServers);
    console.log(`[*] Found ${Object.keys(mcpServers).length} MCP servers`);
    console.log(`[*] Gemini portable: ${Object.keys(geminiServers).length}`);
    console.log(`[*] Codex compatible: ${Object.keys(codexServers).length}`);

    if (!opts.codexOnly) {
      this.syncGemini(geminiServers);
    }
    if (!opts.geminiOnly) {
      this.syncCodex(codexServers);
    }

    const links = this.syncSkillLinks();

    return {
      synced: true,
      dryRun: this.dryRun,
      gemini: this.results.gemini,
      codex: this.results.codex,
      skillLinks: links,
      skipped: this.results.skipped
    };
  }
}

module.exports = { ConfigSync };

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const geminiOnly = args.includes('--gemini');
  const codexOnly = args.includes('--codex');

  console.log('========================================');
  console.log('  NEXUS Config Sync');
  console.log('========================================');
  if (dryRun) console.log('  Mode: DRY RUN (no changes)');

  const sync = new ConfigSync({ dryRun });
  const result = sync.sync({ geminiOnly, codexOnly });

  if (!result.synced) {
    console.log(`[-] Sync failed: ${result.reason}`);
    process.exit(1);
  }

  if (result.gemini) {
    console.log(`\n  [+] Gemini: ${result.gemini.status || 'preview'}`);
    console.log(`      Path: ${result.gemini.path}`);
    console.log(`      Servers: ${result.gemini.servers.join(', ')}`);
  }

  if (result.codex) {
    console.log(`\n  [+] Codex: ${result.codex.status || 'preview'}`);
    console.log(`      Path: ${result.codex.path}`);
    console.log(`      Servers: ${result.codex.servers.join(', ')}`);
    if (Array.isArray(result.codex.writes)) {
      result.codex.writes.forEach(write => {
        const detail = write.reason ? ` (${write.reason})` : '';
        console.log(`      - ${write.status}: ${write.path}${detail}`);
      });
    }
  }

  if (result.skillLinks && result.skillLinks.length > 0) {
    console.log('\n  Skill Links:');
    result.skillLinks.forEach(l => {
      console.log(`    [${l.status}] ${path.basename(path.dirname(l.link))}/${path.basename(l.link)}`);
    });
  }

  if (result.skipped.gemini.length > 0) {
    console.log(`\n  Gemini skipped: ${result.skipped.gemini.length} servers`);
    result.skipped.gemini.forEach(s => console.log(`    [-] ${s.name}: ${s.reason}`));
  }

  if (result.skipped.codex.length > 0) {
    console.log(`\n  Codex skipped: ${result.skipped.codex.length} servers`);
    result.skipped.codex.forEach(s => console.log(`    [-] ${s.name}: ${s.reason}`));
  }

  console.log('\n========================================');
}
