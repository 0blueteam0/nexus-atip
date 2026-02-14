/**
 * mcp-optimizer.js
 * MCP 서버 최적화 및 상태 검사
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
  claudeJsonPath: 'K:/PortableApps/genai/.claude.json',
  nodePath: 'K:/PortableApps/tools/nodejs/node.exe'
};

function loadMcpConfig() {
  const content = fs.readFileSync(CONFIG.claudeJsonPath, 'utf8');
  return JSON.parse(content);
}

function checkServerHealth(serverName, serverConfig) {
  const result = { name: serverName, status: 'unknown', details: {} };
  
  try {
    // 서버 실행 파일 존재 확인
    const cmd = serverConfig.command;
    if (cmd && !cmd.includes('npx') && !cmd.includes('cmd')) {
      if (!fs.existsSync(cmd)) {
        result.status = 'error';
        result.details.error = `명령어 경로 없음: ${cmd}`;
        return result;
      }
    }
    result.status = 'ok';
    result.details.command = cmd;
  } catch (e) {
    result.status = 'error';
    result.details.error = e.message;
  }
  
  return result;
}

function analyzeServers() {
  const config = loadMcpConfig();
  const servers = config.mcpServers || {};
  const results = [];
  
  Object.entries(servers).forEach(([name, cfg]) => {
    results.push(checkServerHealth(name, cfg));
  });
  
  return results;
}

module.exports = { analyzeServers, checkServerHealth };
