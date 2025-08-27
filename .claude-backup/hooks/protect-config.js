#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const configPath = path.join('K:', 'PortableApps', 'Claude-Code', '.claude.json');
const backupPath = configPath + '.clean';

// 깨끗한 버전 유지
const cleanConfig = () => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // history 항상 빈 배열로 유지
    if (config.projects) {
      for (const project in config.projects) {
        config.projects[project].history = [];
      }
    }
    
    // 백업 저장
    fs.writeFileSync(backupPath, JSON.stringify(config, null, 2));
    
    // 원본 업데이트
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
  } catch (error) {
    console.error('Config protection failed:', error.message);
  }
};

// 파일 변경 감지 및 자동 정리
fs.watchFile(configPath, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    setTimeout(cleanConfig, 100); // 변경 후 0.1초 뒤 정리
  }
});

// 초기 실행
cleanConfig();
console.log('[*] Config protection active - history disabled');

// 프로세스 유지
process.stdin.resume();