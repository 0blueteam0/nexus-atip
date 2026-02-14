#!/usr/bin/env node
/**
 * Planning System - Unified CLI
 * 
 * 사용법:
 *   node planning-system init              # 시스템 초기화
 *   node planning-system status            # 현재 상태
 *   node planning-system checkpoint ...    # 체크포인트
 *   node planning-system restore           # 복원
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

const commands = {
  init: () => {
    console.log('[*] Planning System initialized');
    console.log('[+] Plans dir: plans/');
    console.log('[+] Log dir: planning-log/');
    console.log('[+] System dir: planning-system/');
  },
  
  status: () => {
    require('./restore.js');
  },
  
  checkpoint: () => {
    const args = process.argv.slice(3);
    process.argv = ['node', 'checkpoint.js', ...args];
    require('./checkpoint.js');
  },
  
  restore: () => {
    require('./restore.js');
  },
  
  help: () => {
    console.log(`
Planning System CLI

Commands:
  init        Initialize planning system
  status      Show current plan status
  checkpoint  Save checkpoint (--plan, --task, --phase, --status)
  restore     Restore last session state

Examples:
  node planning-system status
  node planning-system checkpoint --plan floofy-sauteeing-alpaca --task 0.4.1 --status completed
`);
  }
};

const cmd = process.argv[2] || 'help';
if (commands[cmd]) {
  commands[cmd]();
} else {
  console.log(`[-] Unknown command: ${cmd}`);
  commands.help();
}
