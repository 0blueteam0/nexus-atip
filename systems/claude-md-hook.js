#!/usr/bin/env node
/**
 * CLAUDE.md Hook System
 * 매 프롬프트마다 CLAUDE.md 내용을 자동으로 컨텍스트에 주입
 */

const fs = require('fs');
const path = require('path');

class ClaudeMdHook {
  constructor() {
    this.hooksPath = 'K:/PortableApps/Claude-Code/.claude-hooks.json';
    this.claudeMdPath = 'K:/PortableApps/Claude-Code/CLAUDE.md';
    this.contextCachePath = 'K:/PortableApps/Claude-Code/.claude-context-cache.json';
  }

  // Hook 설정 업데이트
  updateHooks() {
    try {
      const hooks = JSON.parse(fs.readFileSync(this.hooksPath, 'utf8'));
      
      // user-prompt-submit-hook 추가
      if (!hooks.hooks['user-prompt-submit']) {
        hooks.hooks['user-prompt-submit'] = {
          enabled: true,
          command: 'node K:/PortableApps/Claude-Code/systems/inject-claude-md.js',
          description: '매 프롬프트마다 CLAUDE.md 컨텍스트 자동 주입',
          priority: 1
        };
      }
      
      // claude-md-loader hook 추가
      hooks.hooks['claude-md-loader'] = {
        enabled: true,
        triggers: ['*'], // 모든 프롬프트에 적용
        action: 'prepend-context',
        content: '@claude-md-core',
        description: 'CLAUDE.md 핵심 내용 자동 로드'
      };
      
      fs.writeFileSync(this.hooksPath, JSON.stringify(hooks, null, 2));
      console.log('[+] Hook 설정 업데이트 완료');
      return true;
    } catch (error) {
      console.error('[!] Hook 업데이트 실패:', error.message);
      return false;
    }
  }

  // 컨텍스트 캐시 생성
  createContextCache() {
    const claudeMd = fs.readFileSync(this.claudeMdPath, 'utf8');
    
    // 핵심 섹션 추출
    const sections = {
      korean: this.extractSection(claudeMd, '[KR] 한국어 표시 프로토콜'),
      mcp: this.extractSection(claudeMd, '[!!] MCP 출력 간결화 규칙'),
      dc: this.extractSection(claudeMd, '[DC] Desktop Commander 우선 사용'),
      bottomup: this.extractSection(claudeMd, '[>>] BOTTOM-UP PROACTIVE PARADIGM'),
      shrimp: this.extractSection(claudeMd, '🎐 Task Management Preference'),
      modules: this.extractSection(claudeMd, '📚 모듈화 시스템')
    };
    
    const cache = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      sections: sections,
      checksum: this.calculateChecksum(claudeMd)
    };
    
    fs.writeFileSync(this.contextCachePath, JSON.stringify(cache, null, 2));
    console.log('[+] 컨텍스트 캐시 생성 완료');
    return cache;
  }

  extractSection(content, marker) {
    const lines = content.split('\n');
    const startIdx = lines.findIndex(line => line.includes(marker));
    if (startIdx === -1) return '';
    
    let endIdx = startIdx + 1;
    while (endIdx < lines.length && !lines[endIdx].startsWith('##')) {
      endIdx++;
    }
    
    return lines.slice(startIdx, endIdx).join('\n');
  }

  calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }
}

// 실행
if (require.main === module) {
  const hook = new ClaudeMdHook();
  
  console.log('[*] CLAUDE.md Hook System 설정');
  
  if (hook.updateHooks()) {
    hook.createContextCache();
    console.log('[+] Hook 시스템 활성화 완료');
  }
}

module.exports = ClaudeMdHook;