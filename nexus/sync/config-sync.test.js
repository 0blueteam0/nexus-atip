const test = require('node:test')
const assert = require('node:assert/strict')

const { ConfigSync } = require('./config-sync.js')

test('should normalize Gemini MCP commands when syncing from Claude config', () => {
  const sync = new ConfigSync({ dryRun: true })

  const formatted = sync.toGeminiFormat({
    github: {
      command: 'cmd',
      args: ['/c', 'npx', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_TOKEN: '${GITHUB_TOKEN}'
      }
    },
    memory: {
      command: 'K:/PortableApps/tools/nodejs/node.exe',
      args: ['K:\\PortableApps\\genai\\node_modules\\@modelcontextprotocol\\server-memory\\dist\\index.js']
    },
    'sqlite-mcp': {
      command: 'K:/PortableApps/tools/nodejs/npx.cmd',
      args: ['mcp-server-sqlite-npx', 'K:/PortableApps/genai/data/sqlite/claude.db']
    }
  })

  assert.equal(formatted.github.command, 'npx')
  assert.deepEqual(formatted.github.args, ['-y', '@modelcontextprotocol/server-github'])
  assert.deepEqual(formatted.github.env, {
    GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}'
  })

  assert.equal(formatted.memory.command, 'node')
  assert.equal(formatted.memory.env.MEMORY_FILE_PATH, 'K:/PortableApps/genai/mcp-data/memory.json')
  assert.deepEqual(formatted.memory.args, [
    'K:/PortableApps/genai/node_modules/@modelcontextprotocol/server-memory/dist/index.js'
  ])

  assert.equal(formatted['sqlite-mcp'].command, 'npx')
  assert.deepEqual(formatted['sqlite-mcp'].args, [
    '-y',
    'mcp-server-sqlite-npx',
    'K:/PortableApps/genai/data/sqlite/claude.db'
  ])
})

test('should render Codex MCP commands as strings in TOML', () => {
  const sync = new ConfigSync({ dryRun: true })

  const toml = sync.toCodexToml({
    'desktop-commander': {
      type: 'stdio',
      command: 'cmd',
      args: ['/c', 'npx', '@wonderwhy-er/desktop-commander']
    }
  })

  assert.match(toml, /command = "K:\/PortableApps\/tools\/nodejs\/npx\.cmd"/)
  assert.doesNotMatch(toml, /command = \[/)
})
