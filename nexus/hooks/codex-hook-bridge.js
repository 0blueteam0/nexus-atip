#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..', '..')
const HOOKS_FILE = path.join(ROOT, '.claude-hooks.json')
const LOG_FILE = path.join(ROOT, 'nexus', 'data', 'codex-hook-bridge.jsonl')

const PHASE_TRIGGER_MAP = {
  'session-start': new Set(['session-start']),
  'session-end': new Set(['session-end']),
  notify: new Set([
    'after-response',
    'after-tool-call',
    'agent-spawn',
    'agent-complete',
    'file-save',
    'pre-commit',
    'PostToolResult'
  ])
}

const DEGRADE_TRIGGER_HOOKS = {
  notify: {
    'after-tool-call': new Set(['dashboard-tool-track']),
    'agent-spawn': new Set(['dashboard-agent-start']),
    'agent-complete': new Set(['dashboard-agent-complete']),
    'file-save': new Set(['date-validation']),
    'pre-commit': new Set(['date-validation']),
    PostToolResult: new Set(['design-lint'])
  }
}

const PHASE_TIMEOUT_MS = {
  'session-start': 4000,
  'session-end': 4000,
  notify: 2000
}

function loadDotEnv() {
  const envFile = path.join(ROOT, '.env')
  const env = {}

  if (!fs.existsSync(envFile)) return env

  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const idx = trimmed.indexOf('=')
    if (idx === -1) continue

    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    env[key] = value
  }

  return env
}

function loadHooks() {
  if (!fs.existsSync(HOOKS_FILE)) return {}
  const raw = JSON.parse(fs.readFileSync(HOOKS_FILE, 'utf8'))
  return raw.hooks || {}
}

function appendLog(entry) {
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n')
}

function getBridgeMode(phase, hookId, trigger) {
  const exactTriggers = PHASE_TRIGGER_MAP[phase] || new Set()
  if (!exactTriggers.has(trigger)) return null

  if (phase === 'notify' && trigger !== 'after-response') {
    const supportedHooks = DEGRADE_TRIGGER_HOOKS.notify[trigger]
    if (!supportedHooks || !supportedHooks.has(hookId)) return null
    return 'degraded'
  }

  return 'exact'
}

function selectHooks(phase) {
  const hooks = loadHooks()

  return Object.entries(hooks)
    .filter(([, config]) => config.enabled !== false)
    .map(([id, config]) => {
      const triggers = Array.isArray(config.triggers) ? config.triggers : []
      const matchedTriggers = triggers
        .map(trigger => ({ trigger, mode: getBridgeMode(phase, id, trigger) }))
        .filter(item => item.mode)

      return {
        id,
        command: config.command || '',
        triggers,
        matchedTriggers: matchedTriggers.map(item => item.trigger),
        bridgeModes: [...new Set(matchedTriggers.map(item => item.mode))],
        priority: config.priority || 'medium'
      }
    })
    .filter(hook => hook.matchedTriggers.length > 0)
}

function buildHookEnv(phase, context = {}) {
  const toolsUsed = Array.isArray(context.toolsUsed) ? JSON.stringify(context.toolsUsed) : process.env.TOOLS_USED || '[]'
  const agentsSpawned = Array.isArray(context.agentsSpawned)
    ? JSON.stringify(context.agentsSpawned)
    : process.env.AGENTS_SPAWNED || '[]'
  const filesModified = Array.isArray(context.filesModified)
    ? JSON.stringify(context.filesModified)
    : process.env.FILES_MODIFIED || '[]'

  const baseEnv = {
    ...loadDotEnv(),
    ...process.env,
    CODEX_COMPAT_PHASE: phase,
    CODEX_PROVIDER: 'codex-cli',
    AGENT_ID: context.turnId || process.env.AGENT_ID || '',
    AGENT_STATUS: context.success === false ? 'failed' : 'completed',
    AGENT_TYPE: 'codex-cli',
    AGENT_PROMPT: process.env.AGENT_PROMPT || '',
    USER_PROMPT: process.env.USER_PROMPT || '',
    ACTIVE_PLAN: process.env.ACTIVE_PLAN || '',
    TOOLS_USED: toolsUsed,
    AGENTS_SPAWNED: agentsSpawned,
    FILES_MODIFIED: filesModified,
    RESPONSE_DURATION: String(context.responseDuration || process.env.RESPONSE_DURATION || 0),
    RESPONSE_SUCCESS: context.success === false ? 'false' : 'true'
  }

  if (typeof context.tokensUsed === 'number') {
    baseEnv.CODEX_TOKENS_USED = String(context.tokensUsed)
  }

  if (context.model) {
    baseEnv.CODEX_MODEL = context.model
  }

  return baseEnv
}

function normalizeHookCommand(command) {
  if (typeof command !== 'string') return command

  return command
    .replace(/2>\s*\/dev\/null/g, '2>nul')
    .replace(/\|\|\s*true\b/g, '|| exit /b 0')
}

function extractUrl(command) {
  return typeof command === 'string' ? command.match(/https?:\/\/[^\s"]+/)?.[0] || '' : ''
}

function safeJsonParse(value, fallback) {
  if (value == null || value === '') return fallback
  if (Array.isArray(value) || typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch (e) {
    return fallback
  }
}

function normalizeArray(value) {
  const parsed = Array.isArray(value) ? value : safeJsonParse(value, [])
  return Array.isArray(parsed) ? parsed : []
}

function normalizeToolEntry(entry, env, context = {}) {
  if (typeof entry === 'string') {
    return {
      tool: entry,
      success: context.success !== false,
      responseTime: Number(env.RESPONSE_DURATION || context.responseDuration || 0),
      context: {}
    }
  }

  if (!entry || typeof entry !== 'object') return null

  const tool = entry.tool || entry.name || entry.id || ''
  if (!tool) return null

  return {
    tool,
    success: entry.success !== false && context.success !== false,
    responseTime: Number(entry.responseTime || entry.duration || env.RESPONSE_DURATION || context.responseDuration || 0),
    context: typeof entry.context === 'object' && entry.context ? entry.context : {}
  }
}

function getToolEntries(env, context = {}) {
  const rawTools = Array.isArray(context.toolsUsed) ? context.toolsUsed : normalizeArray(env.TOOLS_USED)
  const tools = rawTools
    .map(entry => normalizeToolEntry(entry, env, context))
    .filter(Boolean)

  if (tools.length > 0) return tools
  if (!env.TOOL_NAME) return []

  return [
    {
      tool: env.TOOL_NAME,
      success: env.TOOL_SUCCESS !== 'false' && context.success !== false,
      responseTime: Number(env.TOOL_DURATION || env.RESPONSE_DURATION || context.responseDuration || 0),
      context: {}
    }
  ]
}

function normalizeFileEntry(entry) {
  if (typeof entry === 'string') return entry
  if (!entry || typeof entry !== 'object') return ''
  return entry.path || entry.file || entry.filePath || entry.name || ''
}

function getFilesModified(env, context = {}) {
  const rawFiles = Array.isArray(context.filesModified) ? context.filesModified : normalizeArray(env.FILES_MODIFIED)
  return [...new Set(rawFiles.map(normalizeFileEntry).filter(Boolean))]
}

function getDesignFiles(env, context = {}) {
  const designExtensions = new Set(['.css', '.scss', '.less', '.tsx', '.jsx', '.vue', '.svelte', '.html', '.md', '.txt'])
  return getFilesModified(env, context).filter(filePath => designExtensions.has(path.extname(filePath).toLowerCase()))
}

function quoteShellArg(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`
}

function extractNodeScript(command) {
  return typeof command === 'string' ? command.match(/\bnode\s+("?)([^"\s]+)\1/i)?.[2] || '' : ''
}

function postJson(urlString, payload, timeoutMs = 5000) {
  return new Promise(resolve => {
    const url = new URL(urlString)
    const body = JSON.stringify(payload)
    const transport = url.protocol === 'https:' ? https : http
    const req = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: timeoutMs
      },
      res => {
        let responseBody = ''
        res.on('data', chunk => {
          if (responseBody.length < 1500) responseBody += chunk.toString()
        })
        res.on('end', () => {
          resolve({
            status: res.statusCode >= 200 && res.statusCode < 300 ? 'ok' : 'exit',
            code: res.statusCode || 0,
            stdout: responseBody.trim(),
            stderr: ''
          })
        })
      }
    )

    req.on('timeout', () => {
      req.destroy(new Error('timeout'))
    })

    req.on('error', error => {
      resolve({
        status: 'error',
        error: error.message,
        stdout: '',
        stderr: error.message
      })
    })

    req.write(body)
    req.end()
  })
}

async function postJsonBatch(urlString, payloads, timeoutMs = 5000) {
  const results = []
  for (const payload of payloads) {
    results.push(await postJson(urlString, payload, timeoutMs))
  }

  const failed = results.find(result => result.status !== 'ok')
  return {
    status: failed ? failed.status : 'ok',
    code: failed ? failed.code || 0 : 200,
    stdout: results.map(result => result.stdout).filter(Boolean).join('\n').slice(0, 1500),
    stderr: results.map(result => result.stderr).filter(Boolean).join('\n').slice(0, 1000),
    count: results.length
  }
}

function buildPromptHookPayload(env, context = {}) {
  return {
    prompt: env.USER_PROMPT || `Codex turn ${context.turnId || Date.now()}`,
    sessionId: context.turnId || `codex-${Date.now()}`,
    timestamp: new Date().toISOString(),
    activePlan: env.ACTIVE_PLAN || null,
    toolsUsed: safeJsonParse(env.TOOLS_USED, []),
    agentsSpawned: safeJsonParse(env.AGENTS_SPAWNED, []),
    duration: Number(env.RESPONSE_DURATION || context.responseDuration || 0),
    success: context.success !== false,
    context: {
      provider: 'codex-cli',
      model: context.model || env.CODEX_MODEL || 'unknown',
      turnId: context.turnId || '',
      tokensUsed: Number(context.tokensUsed || env.CODEX_TOKENS_USED || 0),
      filesModified: Array.isArray(context.filesModified) ? context.filesModified : []
    }
  }
}

function buildToolHookPayloads(env, context = {}) {
  return getToolEntries(env, context).map(entry => ({
    tool: entry.tool,
    success: entry.success !== false,
    responseTime: entry.responseTime || 0,
    context: {
      provider: 'codex-cli',
      turnId: context.turnId || '',
      phase: env.CODEX_COMPAT_PHASE,
      ...entry.context
    }
  }))
}

function buildAgentHookPayload(action, env, context = {}) {
  const agentId = context.turnId || env.AGENT_ID || `codex-${Date.now()}`

  return {
    action,
    agentId,
    type: env.AGENT_TYPE || 'codex-cli',
    prompt: env.USER_PROMPT || env.AGENT_PROMPT || `Codex turn ${agentId}`,
    status: context.success === false ? 'failed' : 'completed',
    result: context.success === false ? 'failed' : 'completed',
    sessionId: agentId,
    timestamp: new Date().toISOString()
  }
}

async function runTargetedNodeScript(command, files, env, timeoutMs = 15000) {
  const scriptPath = extractNodeScript(command)
  if (!scriptPath || files.length === 0) {
    return { status: 'skip', code: 0, stdout: '', stderr: '', count: 0 }
  }

  const results = []
  for (const filePath of files) {
    results.push(await runShellCommand(`node ${quoteShellArg(scriptPath)} ${quoteShellArg(filePath)}`, env, timeoutMs))
  }

  const failed = results.find(result => result.status !== 'ok')
  return {
    status: failed ? failed.status : 'ok',
    code: failed ? failed.code || 0 : 0,
    stdout: results.map(result => result.stdout).filter(Boolean).join('\n').slice(0, 1500),
    stderr: results.map(result => result.stderr).filter(Boolean).join('\n').slice(0, 1000),
    count: results.length
  }
}

function getSkipReason(hook, env, context = {}) {
  if (hook.id === 'dashboard-tool-track' && buildToolHookPayloads(env, context).length === 0) {
    return 'no-tools-used'
  }

  if (hook.id === 'dashboard-agent-start' || hook.id === 'dashboard-agent-complete') {
    if (!context.turnId && !env.AGENT_ID && !env.USER_PROMPT) return 'missing-turn-context'
  }

  if (hook.id === 'date-validation' && getFilesModified(env, context).length === 0) {
    return 'no-modified-files'
  }

  if (hook.id === 'design-lint' && getDesignFiles(env, context).length === 0) {
    return 'no-design-files'
  }

  return ''
}

async function runSpecialHook(hook, env, context, timeoutMs) {
  if (hook.id === 'dashboard-prompt-record') {
    const url = extractUrl(hook.command)
    if (!url) {
      return { status: 'error', error: 'missing-url', stdout: '', stderr: 'missing-url' }
    }
    return postJson(url, buildPromptHookPayload(env, context), 5000)
  }

  if (hook.id === 'dashboard-tool-track') {
    const url = extractUrl(hook.command)
    if (!url) {
      return { status: 'error', error: 'missing-url', stdout: '', stderr: 'missing-url' }
    }
    return postJsonBatch(url, buildToolHookPayloads(env, context), 5000)
  }

  if (hook.id === 'dashboard-agent-start') {
    const url = extractUrl(hook.command)
    if (!url) {
      return { status: 'error', error: 'missing-url', stdout: '', stderr: 'missing-url' }
    }
    return postJson(url, buildAgentHookPayload('start', env, context), 5000)
  }

  if (hook.id === 'dashboard-agent-complete') {
    const url = extractUrl(hook.command)
    if (!url) {
      return { status: 'error', error: 'missing-url', stdout: '', stderr: 'missing-url' }
    }
    return postJson(url, buildAgentHookPayload('complete', env, context), 5000)
  }

  if (hook.id === 'date-validation') {
    return runTargetedNodeScript(hook.command, getFilesModified(env, context), env, timeoutMs)
  }

  if (hook.id === 'design-lint') {
    return runTargetedNodeScript(hook.command, getDesignFiles(env, context), env, timeoutMs)
  }

  return null
}

function runShellCommand(command, env, timeoutMs = 15000) {
  return new Promise(resolve => {
    const child = spawn(normalizeHookCommand(command), {
      cwd: ROOT,
      env,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    const finish = result => {
      if (settled) return
      settled = true
      resolve(result)
    }

    const timer = setTimeout(() => {
      child.kill()
      finish({ status: 'timeout', stdout: stdout.trim(), stderr: stderr.trim() })
    }, timeoutMs)

    child.stdout.on('data', chunk => {
      if (stdout.length < 1000) stdout += chunk.toString()
    })

    child.stderr.on('data', chunk => {
      if (stderr.length < 1000) stderr += chunk.toString()
    })

    child.on('error', error => {
      clearTimeout(timer)
      finish({ status: 'error', error: error.message, stdout: stdout.trim(), stderr: stderr.trim() })
    })

    child.on('exit', code => {
      clearTimeout(timer)
      finish({ status: code === 0 ? 'ok' : 'exit', code, stdout: stdout.trim(), stderr: stderr.trim() })
    })
  })
}

async function runCompatHooks(phase, context = {}) {
  const hooks = selectHooks(phase)
  const env = buildHookEnv(phase, context)
  const executed = []
  const skipped = []
  const timeoutMs = PHASE_TIMEOUT_MS[phase] || 4000

  if (!fs.existsSync(path.dirname(LOG_FILE))) {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true })
  }

  for (const hook of hooks) {
    if (!hook.command) {
      skipped.push({ id: hook.id, reason: 'missing-command' })
      continue
    }

    const skipReason = getSkipReason(hook, env, context)
    if (skipReason) {
      skipped.push({ id: hook.id, reason: skipReason, triggers: hook.matchedTriggers, bridgeModes: hook.bridgeModes })
      continue
    }

    const startedAt = Date.now()
    const result = await runSpecialHook(hook, env, context, timeoutMs) || await runShellCommand(hook.command, env, timeoutMs)
    const durationMs = Date.now() - startedAt
    executed.push({ ...hook, ...result, durationMs })
  }

  appendLog({
    timestamp: new Date().toISOString(),
    phase,
    executed,
    skipped
  })

  return { phase, executed, skipped }
}

module.exports = {
  runCompatHooks
}

if (require.main === module) {
  const phase = process.argv[2]
  runCompatHooks(phase || 'notify')
    .then(result => {
      console.log(`[+] Codex hook bridge: ${result.phase} (${result.executed.length} hooks)`)
    })
    .catch(error => {
      console.log(`[-] Codex hook bridge error: ${error.message}`)
      process.exit(1)
    })
}
