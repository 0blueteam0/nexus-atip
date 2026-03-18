#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const CLAUDE_COMMANDS = path.join(ROOT, '.claude', 'commands')
const CLAUDE_AGENTS = path.join(ROOT, '.claude', 'agents')
const CLAUDE_HOOKS = path.join(ROOT, '.claude-hooks.json')
const OUTPUT_FILE = path.join(ROOT, 'nexus', 'data', 'codex-claude-compat.json')
const CODEX_RUNTIME_SKILLS = path.join(ROOT, 'temp', 'codex-home', 'skills')

const TRIGGER_BRIDGE_RULES = {
  'session-start': { phase: 'session-start', mode: 'exact' },
  'session-end': { phase: 'session-end', mode: 'exact' },
  'after-response': { phase: 'notify', mode: 'exact' },
  'after-tool-call': {
    phase: 'notify',
    mode: 'degraded',
    hooks: new Set(['dashboard-tool-track'])
  },
  'agent-spawn': {
    phase: 'notify',
    mode: 'degraded',
    hooks: new Set(['dashboard-agent-start'])
  },
  'agent-complete': {
    phase: 'notify',
    mode: 'degraded',
    hooks: new Set(['dashboard-agent-complete'])
  },
  'file-save': {
    phase: 'notify',
    mode: 'degraded',
    hooks: new Set(['date-validation'])
  },
  'pre-commit': {
    phase: 'notify',
    mode: 'degraded',
    hooks: new Set(['date-validation'])
  },
  PostToolResult: {
    phase: 'notify',
    mode: 'degraded',
    hooks: new Set(['design-lint'])
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function toPosixPath(filePath) {
  return filePath.replace(/\\/g, '/')
}

function uniqueBy(items, keyFn) {
  const seen = new Set()
  return items.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function previewIds(items, limit = 6) {
  return items
    .slice(0, limit)
    .map(item => item.id)
    .join(', ') || 'none'
}

function walkMarkdownFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return []

  const files = []
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}

  const frontmatter = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!kv) continue
    const [, key, rawValue] = kv
    frontmatter[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }

  return frontmatter
}

function readMarkdownSummary(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const frontmatter = parseFrontmatter(content)
  const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
  const heading = body.match(/^#\s+(.+)$/m)?.[1] || path.basename(filePath, '.md')

  return { frontmatter, heading }
}

function collectCommands() {
  return walkMarkdownFiles(CLAUDE_COMMANDS)
    .filter(filePath => path.basename(filePath) !== '_registry.md')
    .map(filePath => {
      const relPath = path.relative(CLAUDE_COMMANDS, filePath).replace(/\\/g, '/')
      const parsed = readMarkdownSummary(filePath)
      return {
        id: `/${path.basename(filePath, '.md')}`,
        scope: path.dirname(relPath).replace(/\\/g, '/'),
        file: relPath,
        title: parsed.heading,
        description: parsed.frontmatter.description || '',
        argumentHint: parsed.frontmatter['argument-hint'] || '',
        allowedTools: parsed.frontmatter['allowed-tools'] || ''
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

function collectAgents() {
  return walkMarkdownFiles(CLAUDE_AGENTS)
    .map(filePath => {
      const relPath = path.relative(CLAUDE_AGENTS, filePath).replace(/\\/g, '/')
      const parsed = readMarkdownSummary(filePath)
      return {
        id: parsed.frontmatter.name || path.basename(filePath, '.md'),
        file: relPath,
        description: parsed.frontmatter.description || '',
        tools: parsed.frontmatter.tools || '',
        model: parsed.frontmatter.model || ''
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

function getHookBridgeTargets(id, triggers) {
  const targets = []
  const unsupportedTriggers = []

  for (const trigger of triggers) {
    const rule = TRIGGER_BRIDGE_RULES[trigger]
    if (!rule) {
      unsupportedTriggers.push(trigger)
      continue
    }

    if (rule.hooks && !rule.hooks.has(id)) {
      unsupportedTriggers.push(trigger)
      continue
    }

    targets.push({
      trigger,
      phase: rule.phase,
      mode: rule.mode
    })
  }

  return {
    bridgeTargets: uniqueBy(targets, item => `${item.trigger}:${item.phase}:${item.mode}`),
    unsupportedTriggers: [...new Set(unsupportedTriggers)]
  }
}

function collectHooks() {
  if (!fs.existsSync(CLAUDE_HOOKS)) return []

  const raw = JSON.parse(fs.readFileSync(CLAUDE_HOOKS, 'utf8'))
  const hooks = raw.hooks || {}

  return Object.entries(hooks)
    .map(([id, config]) => {
      const triggers = Array.isArray(config.triggers) ? config.triggers : []
      const { bridgeTargets, unsupportedTriggers } = getHookBridgeTargets(id, triggers)
      return {
        id,
        enabled: config.enabled !== false,
        command: config.command || '',
        description: config.description || '',
        priority: config.priority || 'medium',
        triggers,
        bridgeTargets,
        bridgedPhases: [...new Set(bridgeTargets.map(target => target.phase))],
        bridgeModes: [...new Set(bridgeTargets.map(target => target.mode))],
        unsupportedTriggers
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

function buildCommandRouterSkill(snapshot) {
  return `---
name: claude-command-router
description: Route requests for Claude slash commands or workflows defined under \`.claude/commands\`. Use when a user names a Claude command, asks for an existing slash workflow, or needs Codex to mirror Claude command behavior.
---

# Claude Command Router

Use this skill when the user asks for a Claude slash command or an existing workflow under \`.claude/commands\`.

## Workflow
1. Read \`${toPosixPath(OUTPUT_FILE)}\`.
2. Match the request against \`commands[].id\`, \`title\`, or \`description\`.
3. Open only the selected source file under \`${toPosixPath(CLAUDE_COMMANDS)}\`.
4. Execute the command logic manually inside Codex and report any parity gap.

## Current Snapshot
- Registered commands: ${snapshot.counts.commands}
- Example ids: ${previewIds(snapshot.commands)}
- Snapshot source: \`${toPosixPath(OUTPUT_FILE)}\`
`
}

function buildAgentRouterSkill(snapshot) {
  return `---
name: claude-agent-router
description: Route requests for Claude agents, subagents, or specialist roles defined under \`.claude/agents\`. Use when a task references a Claude agent persona and Codex needs to reproduce that workflow manually.
---

# Claude Agent Router

Use this skill when the user refers to Claude agents, subagents, or specialist roles already defined under \`.claude/agents\`.

## Workflow
1. Read \`${toPosixPath(OUTPUT_FILE)}\`.
2. Match the task against \`agents[].id\`, \`description\`, or \`tools\`.
3. Open only the relevant source file under \`${toPosixPath(CLAUDE_AGENTS)}\`.
4. Reproduce the agent workflow manually inside Codex without assuming Claude-native lifecycle support.

## Current Snapshot
- Registered agents: ${snapshot.counts.agents}
- Example ids: ${previewIds(snapshot.agents)}
- Snapshot source: \`${toPosixPath(OUTPUT_FILE)}\`
`
}

function buildHookRouterSkill(snapshot) {
  const degradedHooks = snapshot.hooks
    .filter(hook => hook.bridgeModes.includes('degraded'))
    .map(hook => hook.id)
  const unsupportedHooks = snapshot.hooks
    .filter(hook => hook.enabled && hook.bridgeTargets.length === 0)
    .map(hook => hook.id)

  return `---
name: claude-hook-router
description: Explain and route Claude hook behavior for Codex compatibility. Use when a task depends on Claude hooks, lifecycle events, or bridge support between Claude-native hooks and Codex runtime behavior.
---

# Claude Hook Router

Use this skill when the task depends on Claude hook behavior and you need to know whether Codex can bridge it.

## Supported Bridge Model
- Exact phases: \`session-start\`, \`session-end\`, \`after-response -> notify\`
- Degraded phases: tool telemetry, agent telemetry, design lint, date validation
- Unsupported Claude-native triggers stay unsupported unless the snapshot says otherwise

## Current Snapshot
- Total hooks: ${snapshot.counts.hooks}
- Bridged hooks: ${snapshot.counts.bridgedHooks}
- Degraded hooks: ${snapshot.counts.degradedHooks}
- Unsupported enabled hooks: ${snapshot.counts.unsupportedEnabledHooks}
- Degraded ids: ${degradedHooks.join(', ') || 'none'}
- Unsupported ids: ${unsupportedHooks.join(', ') || 'none'}
- Snapshot source: \`${toPosixPath(OUTPUT_FILE)}\`
`
}

function writeRuntimeSkill(skillName, content) {
  const skillDir = path.join(CODEX_RUNTIME_SKILLS, skillName)
  ensureDir(skillDir)
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content)
}

function writeRuntimeSkills(snapshot) {
  ensureDir(CODEX_RUNTIME_SKILLS)
  writeRuntimeSkill('claude-command-router', buildCommandRouterSkill(snapshot))
  writeRuntimeSkill('claude-agent-router', buildAgentRouterSkill(snapshot))
  writeRuntimeSkill('claude-hook-router', buildHookRouterSkill(snapshot))
  return 3
}

function buildCompatSnapshot() {
  const commands = collectCommands()
  const agents = collectAgents()
  const hooks = collectHooks()

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      commands: commands.length,
      agents: agents.length,
      hooks: hooks.length,
      bridgedHooks: hooks.filter(hook => hook.enabled && hook.bridgeTargets.length > 0).length,
      degradedHooks: hooks.filter(hook => hook.enabled && hook.bridgeModes.includes('degraded')).length,
      unsupportedEnabledHooks: hooks.filter(hook => hook.enabled && hook.bridgeTargets.length === 0).length,
      runtimeSkills: 3
    },
    commands,
    agents,
    hooks
  }
}

function writeCompatSnapshot(snapshot, options = {}) {
  ensureDir(path.dirname(OUTPUT_FILE))
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(snapshot, null, 2) + '\n')
  writeRuntimeSkills(snapshot)

  if (!options.silent) {
    console.log(
      `[+] Claude compat snapshot updated: ${snapshot.counts.commands} commands, ${snapshot.counts.agents} agents, ${snapshot.counts.hooks} hooks, ${snapshot.counts.runtimeSkills} runtime skills`
    )
  }
}

function syncCompatSnapshot(options = {}) {
  const snapshot = buildCompatSnapshot()
  writeCompatSnapshot(snapshot, options)
  return snapshot
}

module.exports = {
  buildCompatSnapshot,
  collectHooks,
  getHookBridgeTargets,
  syncCompatSnapshot
}

if (require.main === module) {
  syncCompatSnapshot()
}
