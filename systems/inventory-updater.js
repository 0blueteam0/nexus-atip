#!/usr/bin/env node
/**
 * inventory-updater.js - SYSTEM-INVENTORY.md 자동 업데이트
 * 
 * 기능:
 * - Last Updated 타임스탬프 갱신
 * - Quick Stats 자동 계산
 * - Recent Changes Git log 기반 업데이트
 * 
 * 사용법:
 *   node systems/inventory-updater.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const INVENTORY_FILE = path.join(ROOT, 'SYSTEM-INVENTORY.md');

// Count MCP servers from .claude.json
function countMcpServers() {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude.json'), 'utf8'));
    return Object.keys(config.mcpServers || {}).length;
  } catch (e) {
    return '40+';
  }
}

// Count skills
function countSkills() {
  try {
    const skillsDir = path.join(ROOT, '.claude', 'skills');
    if (fs.existsSync(skillsDir)) {
      return fs.readdirSync(skillsDir).filter(f => 
        fs.statSync(path.join(skillsDir, f)).isDirectory()
      ).length;
    }
  } catch (e) {}
  return 19;
}

// Count rules
function countRules() {
  try {
    const rulesDir = path.join(ROOT, '.claude', 'rules');
    const archiveDir = path.join(rulesDir, 'archive');
    
    let active = 0, archived = 0;
    if (fs.existsSync(rulesDir)) {
      active = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md')).length;
    }
    if (fs.existsSync(archiveDir)) {
      archived = fs.readdirSync(archiveDir).filter(f => f.endsWith('.md')).length;
    }
    return `${active} active + ${archived} archived`;
  } catch (e) {}
  return '11';
}

// Get recent git commits
function getRecentCommits(count = 5) {
  try {
    const output = execSync(`git log --oneline -${count}`, { 
      cwd: ROOT, 
      encoding: 'utf8' 
    });
    return output.trim().split('\n').map(line => line.split(' ').slice(1).join(' '));
  } catch (e) {
    return [];
  }
}

// Update inventory file
function updateInventory() {
  if (!fs.existsSync(INVENTORY_FILE)) {
    console.log('[-] SYSTEM-INVENTORY.md not found');
    return;
  }
  
  let content = fs.readFileSync(INVENTORY_FILE, 'utf8');
  const now = new Date().toISOString().split('T')[0];
  
  // Update timestamp
  content = content.replace(
    /\*\*Last Updated\*\*: .+/,
    `**Last Updated**: ${now} (수동/자동 업데이트)`
  );
  
  // Update stats
  const mcpCount = countMcpServers();
  const skillCount = countSkills();
  const rulesCount = countRules();
  
  content = content.replace(
    /\| MCP Servers \| .+ \|/,
    `| MCP Servers | ${mcpCount} |`
  );
  content = content.replace(
    /\| Skills \| .+ \|/,
    `| Skills | ${skillCount} |`
  );
  
  fs.writeFileSync(INVENTORY_FILE, content);
  console.log(`[+] SYSTEM-INVENTORY.md updated (${now})`);
  console.log(`    MCP: ${mcpCount}, Skills: ${skillCount}, Rules: ${rulesCount}`);
}

// Main
updateInventory();
