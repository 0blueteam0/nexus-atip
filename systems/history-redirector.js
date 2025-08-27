#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 히스토리를 별도 파일로 리다이렉트
const configPath = 'K:\\PortableApps\\Claude-Code\\.claude.json';
const historyPath = 'K:\\PortableApps\\Claude-Code\\.claude\\history-temp.json';

// Proxy handler for history field
const handler = {
  get(target, prop) {
    if (prop === 'history') {
      return []; // 항상 빈 배열 반환
    }
    return target[prop];
  },
  set(target, prop, value) {
    if (prop === 'history') {
      // 히스토리는 별도 파일에 저장
      fs.writeFileSync(historyPath, JSON.stringify(value, null, 2));
      return true; // 설정은 성공으로 처리하지만 실제로는 저장 안함
    }
    target[prop] = value;
    return true;
  }
};

console.log('[*] History redirector active - storing to temp file instead');