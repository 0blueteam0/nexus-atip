#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..', '..')
const CONFIG_CANDIDATES = [
  path.join(ROOT, 'temp', 'codex-home', '.codex', 'config.toml'),
  path.join(ROOT, 'temp', 'codex-home', 'config.toml'),
  path.join(ROOT, '.codex', 'config.toml')
]
const REPORT_FILE = path.join(ROOT, 'nexus', 'data', 'codex-mcp-health-latest.json')

function getConfigFile() {
  return CONFIG_CANDIDATES.find(file => fs.existsSync(file)) || CONFIG_CANDIDATES[CONFIG_CANDIDATES.length - 1]
}

function parseQuotedArray(raw) {
  return [...raw.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(match => match[1])
}

function parseConfig() {
  const lines = fs.readFileSync(getConfigFile(), 'utf8').split(/\r?\n/)
  const servers = {}
  let current = null
  let inEnv = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const envSection = line.match(/^\[mcp_servers\.([^.]+)\.env\]$/)
    if (envSection) {
      current = envSection[1]
      inEnv = true
      servers[current] ||= { name: current, args: [], env: {} }
      continue
    }

    const section = line.match(/^\[mcp_servers\.([^\]]+)\]$/)
    if (section) {
      current = section[1]
      inEnv = false
      servers[current] ||= { name: current, args: [], env: {} }
      continue
    }

    if (!current) continue

    const kv = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.+)$/)
    if (!kv) continue

    const [, key, value] = kv
    if (inEnv) {
      servers[current].env[key] = value.replace(/^"|"$/g, '')
      continue
    }

    if (key === 'args') {
      servers[current].args = parseQuotedArray(value)
      continue
    }

    if (key === 'enabled') {
      servers[current].enabled = value === 'true'
      continue
    }

    if (key === 'cwd') {
      servers[current].cwd = value.replace(/^"|"$/g, '')
      continue
    }

    servers[current][key] = value.replace(/^"|"$/g, '')
  }

  return Object.values(servers).filter(server => server.enabled !== false)
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
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
  }

  return env
}

function resolveEnvValue(value, envSource) {
  if (typeof value !== 'string') return value
  if (!value.startsWith('$')) return value
  return envSource[value.slice(1)] || ''
}

function looksLikePath(value) {
  return typeof value === 'string' && (/^[A-Za-z]:[\\/]/.test(value) || value.startsWith('./') || value.startsWith('../'))
}

function checkCommandPath(command) {
  if (!command) return { ok: false, reason: 'missing-command' }
  if (looksLikePath(command)) {
    return fs.existsSync(command) ? { ok: true } : { ok: false, reason: `missing-command:${command}` }
  }
  return { ok: true }
}

function collectPathChecks(server) {
  const checks = []

  if (looksLikePath(server.cwd)) {
    checks.push({ kind: 'cwd', path: server.cwd })
  }

  if (looksLikePath(server.command)) {
    checks.push({ kind: 'command', path: server.command })
  }

  if (server.command?.toLowerCase().endsWith('node.exe') || server.command?.toLowerCase().endsWith('python.exe')) {
    const firstArg = server.args[0]
    if (looksLikePath(firstArg)) {
      checks.push({ kind: 'entry', path: firstArg })
    }
  }

  const dirFlag = server.args.findIndex(arg => arg === '--directory')
  if (dirFlag !== -1 && looksLikePath(server.args[dirFlag + 1])) {
    checks.push({ kind: 'directory', path: server.args[dirFlag + 1] })
  }

  return checks
}

function killTree(pid) {
  return new Promise(resolve => {
    if (!pid) {
      resolve()
      return
    }

    const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore'
    })
    killer.on('exit', () => resolve())
    killer.on('error', () => resolve())
  })
}

function shouldUseShell(command) {
  return typeof command === 'string' && /\.(cmd|bat)$/i.test(command)
}

function spawnProbe(server, env) {
  return new Promise(resolve => {
    const child = spawn(server.command, server.args, {
      cwd: server.cwd || ROOT,
      env,
      shell: shouldUseShell(server.command),
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    const finish = async result => {
      if (settled) return
      settled = true
      if (child.pid) await killTree(child.pid)
      resolve(result)
    }

    const timer = setTimeout(() => {
      finish({
        status: 'launch-ok',
        detail: 'process stayed alive during probe window',
        stdout: stdout.trim(),
        stderr: stderr.trim()
      })
    }, 1500)

    child.stdout.on('data', chunk => {
      if (stdout.length < 1500) stdout += chunk.toString()
    })

    child.stderr.on('data', chunk => {
      if (stderr.length < 1500) stderr += chunk.toString()
    })

    child.on('error', error => {
      clearTimeout(timer)
      finish({
        status: 'spawn-error',
        detail: error.message,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      })
    })

    child.on('exit', code => {
      clearTimeout(timer)
      finish({
        status: code === 0 ? 'early-exit' : 'failed',
        detail: `process exited with code ${code}`,
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      })
    })
  })
}

async function checkServer(server, envSource) {
  const env = { ...envSource }
  for (const [key, value] of Object.entries(server.env || {})) {
    env[key] = resolveEnvValue(value, envSource)
  }

  const commandCheck = checkCommandPath(server.command)
  const pathChecks = collectPathChecks(server).map(check => ({
    ...check,
    exists: fs.existsSync(check.path)
  }))

  if (!commandCheck.ok) {
    return {
      name: server.name,
      status: 'failed-preflight',
      detail: commandCheck.reason,
      paths: pathChecks
    }
  }

  const missingPath = pathChecks.find(check => !check.exists)
  if (missingPath) {
    return {
      name: server.name,
      status: 'failed-preflight',
      detail: `missing-${missingPath.kind}:${missingPath.path}`,
      paths: pathChecks
    }
  }

  const probe = await spawnProbe(server, env)
  return {
    name: server.name,
    status: probe.status,
    detail: probe.detail,
    stderr: probe.stderr || '',
    stdout: probe.stdout || '',
    paths: pathChecks
  }
}

async function main() {
  const envSource = {
    ...loadDotEnv(),
    ...process.env
  }
  const servers = parseConfig()
  const results = []

  for (const server of servers) {
    results.push(await checkServer(server, envSource))
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    healthy: results.filter(result => result.status === 'launch-ok').length,
    warnings: results.filter(result => result.status === 'early-exit').length,
    failed: results.filter(result => result.status === 'failed' || result.status === 'spawn-error' || result.status === 'failed-preflight').length
  }

  const report = { summary, results }
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2) + '\n')

  console.log('## [*] Codex MCP Health Report')
  console.log('')
  console.log(`- Total Servers: ${summary.total}`)
  console.log(`- [+] Healthy: ${summary.healthy}`)
  console.log(`- [!] Warnings: ${summary.warnings}`)
  console.log(`- [-] Failed: ${summary.failed}`)
  console.log('')

  for (const result of results) {
    const icon = result.status === 'launch-ok' ? '[+]' : result.status === 'early-exit' ? '[!]' : '[-]'
    console.log(`${icon} ${result.name}: ${result.status} (${result.detail})`)
  }
}

module.exports = {
  main,
  parseConfig
}

if (require.main === module) {
  main().catch(error => {
    console.log(`[-] Codex MCP health error: ${error.message}`)
    process.exit(1)
  })
}
