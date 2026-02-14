/**
 * cleanup-advisor.js
 * 폴더 정리 추천 시스템
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = 'K:/PortableApps/genai';

const CLEANUP_RULES = {
  safeDelete: [
    { pattern: /\.tmp$/, description: '임시 파일' },
    { pattern: /\.temp$/, description: '임시 파일' },
    { pattern: /\.corrupted\.\d+$/, description: '손상된 설정 파일' },
    { pattern: /__pycache__/, description: 'Python 캐시' },
    { pattern: /\.pyc$/, description: 'Python 바이트코드' }
  ],
  archiveCandidate: [
    { pattern: /^paper_/, description: '연구 프로젝트' },
    { pattern: /transformer-security/, description: '폐기된 프로젝트' },
    { pattern: /backup.*\d{4}/, description: '오래된 백업' }
  ],
  keepAlways: [
    '.claude.json', '.claude-hooks.json', 'CLAUDE.md',
    'package.json', 'claude.bat', '.env', '.gitignore'
  ]
};

function analyzeDirectory(dirPath = BASE_PATH) {
  const results = {
    safeToDelete: [],
    archiveCandidates: [],
    totalSize: 0,
    reclaimableSize: 0
  };
  
  scanDirectory(dirPath, results);
  return results;
}

function scanDirectory(dirPath, results, depth = 0) {
  if (depth > 5) return;
  
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    
    if (CLEANUP_RULES.keepAlways.includes(item.name)) continue;
    if (item.name === 'node_modules' || item.name === '.git') continue;
    
    const stats = fs.statSync(fullPath);
    results.totalSize += stats.size;
    
    // 삭제 안전 체크
    for (const rule of CLEANUP_RULES.safeDelete) {
      if (rule.pattern.test(item.name)) {
        results.safeToDelete.push({ path: fullPath, size: stats.size, reason: rule.description });
        results.reclaimableSize += stats.size;
        break;
      }
    }
    
    if (item.isDirectory()) {
      scanDirectory(fullPath, results, depth + 1);
    }
  }
}

module.exports = { analyzeDirectory, CLEANUP_RULES };
