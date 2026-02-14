/**
 * version-checker.js
 * Claude Code 버전 확인 및 업데이트 가능 여부 체크
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  npmPath: 'K:/PortableApps/tools/nodejs/npm.cmd',
  packagePath: 'K:/PortableApps/genai/package.json',
  packageName: '@anthropic-ai/claude-code'
};

async function getCurrentVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(CONFIG.packagePath, 'utf8'));
    return pkg.dependencies[CONFIG.packageName] || 'unknown';
  } catch (e) {
    console.error('[!] package.json 읽기 실패:', e.message);
    return null;
  }
}

async function getLatestVersion() {
  try {
    const result = execSync(
      `"${CONFIG.npmPath}" view ${CONFIG.packageName} version`,
      { encoding: 'utf8', timeout: 30000 }
    ).trim();
    return result;
  } catch (e) {
    console.error('[!] npm 버전 조회 실패:', e.message);
    return null;
  }
}

module.exports = {
  getCurrentVersion,
  getLatestVersion
};
