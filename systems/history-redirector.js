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
      try {
        fs.writeFileSync(historyPath, JSON.stringify(value, null, 2));
      } catch (err) {
        console.error('[!] History write failed:', err.message);
      }
      return true; // 설정은 성공으로 처리하지만 실제로는 저장 안함
    }
    target[prop] = value;
    return true;
  }
};

/**
 * 히스토리 리다이렉터 초기화
 * @param {Object} configObj - 감싸려는 설정 객체
 * @returns {Proxy} - 프록시로 감싼 설정 객체
 */
function createHistoryRedirector(configObj = {}) {
  return new Proxy(configObj, handler);
}

/**
 * 저장된 히스토리 읽기
 * @returns {Array} - 저장된 히스토리 배열
 */
function getStoredHistory() {
  try {
    if (fs.existsSync(historyPath)) {
      return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
  } catch (err) {
    console.error('[!] History read failed:', err.message);
  }
  return [];
}

/**
 * 히스토리 초기화
 */
function clearHistory() {
  try {
    fs.writeFileSync(historyPath, '[]');
    console.log('[+] History cleared');
  } catch (err) {
    console.error('[!] History clear failed:', err.message);
  }
}

// 모듈 내보내기
module.exports = {
  createHistoryRedirector,
  getStoredHistory,
  clearHistory,
  handler,
  historyPath
};

console.log('[*] History redirector module loaded');