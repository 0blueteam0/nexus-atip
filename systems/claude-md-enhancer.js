#!/usr/bin/env node
/**
 * CLAUDE.md 강화 시스템
 * Claude Code가 CLAUDE.md를 더 잘 인식하도록 최적화
 */

const fs = require('fs');
const path = require('path');

class ClaudeMdEnhancer {
  constructor() {
    this.claudeMdPath = 'K:/PortableApps/genai/CLAUDE.md';
    this.settingsPath = 'K:/PortableApps/genai/.claude/settings.json';
    this.hooksPath = 'K:/PortableApps/genai/.claude-hooks.json';
  }

  // 1. CLAUDE.md에 모듈 임포트 추가
  enhanceClaudeMd() {
    const content = fs.readFileSync(this.claudeMdPath, 'utf8');
    
    // 이미 import가 있는지 확인
    if (!content.includes('@documentation/core-modules')) {
      const imports = `
# CLAUDE.md 자동 로드 모듈
@documentation/core-modules/@korean-display-protocol.md
@documentation/core-modules/@mcp-selective-usage.md
@documentation/core-modules/@deep-think-framework.md
@documentation/core-modules/@model-consistency.md
@documentation/core-modules/@context-driven-development.md

`;
      
      // 파일 맨 위에 추가
      const newContent = imports + content;
      fs.writeFileSync(this.claudeMdPath, newContent);
      console.log('[+] CLAUDE.md에 모듈 import 추가 완료');
    }
  }

  // 2. settings.json에 systemPromptFile 추가
  updateSettings() {
    let settings = {};
    
    if (fs.existsSync(this.settingsPath)) {
      settings = JSON.parse(fs.readFileSync(this.settingsPath, 'utf8'));
    }
    
    // systemPromptFile 설정
    settings.systemPromptFile = 'K:/PortableApps/genai/CLAUDE.md';
    
    // customInstructions 추가
    if (!settings.customInstructions) {
      settings.customInstructions = {
        enabled: true,
        files: [
          'CLAUDE.md',
          'documentation/core-modules/@korean-display-protocol.md',
          'documentation/core-modules/@mcp-selective-usage.md'
        ]
      };
    }
    
    // 디렉토리 생성
    const settingsDir = path.dirname(this.settingsPath);
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }
    
    fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
    console.log('[+] settings.json 업데이트 완료');
  }

  // 3. Hook 시스템 강화
  enhanceHooks() {
    const hooks = JSON.parse(fs.readFileSync(this.hooksPath, 'utf8'));
    
    // SessionStart hook 강화
    if (hooks.hooks['session-start']) {
      const cmd = hooks.hooks['session-start'].command;
      if (!cmd.includes('load-claude-md')) {
        hooks.hooks['session-start'].command = 
          `node K:/PortableApps/genai/systems/load-claude-md.js && ${cmd}`;
      }
    }
    
    // UserPromptSubmit hook 추가
    hooks.hooks['user-prompt-submit'] = {
      enabled: true,
      command: 'node K:/PortableApps/genai/systems/inject-context.js',
      description: 'CLAUDE.md 컨텍스트 자동 주입'
    };
    
    fs.writeFileSync(this.hooksPath, JSON.stringify(hooks, null, 2));
    console.log('[+] Hook 시스템 강화 완료');
  }

  // 4. 컨텍스트 로더 생성
  createContextLoader() {
    const loaderScript = `#!/usr/bin/env node
// CLAUDE.md 자동 로드 스크립트
const fs = require('fs');

const claudeMd = fs.readFileSync('K:/PortableApps/genai/CLAUDE.md', 'utf8');
const lines = claudeMd.split('\\n').slice(0, 50); // 핵심 50줄만

console.log('[CLAUDE.md 로드됨]');
console.log('- 한국어 표시 활성화');
console.log('- MCP 출력 간결화');
console.log('- Desktop Commander 우선');
console.log('- Bottom-up Proactive 모드');
console.log('- Shrimp Task Manager 사용');
`;

    fs.writeFileSync(
      'K:/PortableApps/genai/systems/load-claude-md.js',
      loaderScript
    );
    console.log('[+] 컨텍스트 로더 생성 완료');
  }

  // 5. 컨텍스트 주입 스크립트
  createInjector() {
    const injectorScript = `#!/usr/bin/env node
// 프롬프트마다 CLAUDE.md 컨텍스트 주입
const fs = require('fs');

// 핵심 지침만 간결하게
const core = \`
[CLAUDE.md Active]
✓ 한국어 병기
✓ MCP 간결화  
✓ DC 우선 사용
✓ Bottom-up 모드
✓ Shrimp 사용
\`;

process.stdout.write(core);
`;

    fs.writeFileSync(
      'K:/PortableApps/genai/systems/inject-context.js', 
      injectorScript
    );
    console.log('[+] 컨텍스트 주입기 생성 완료');
  }

  // 전체 실행
  enhance() {
    console.log('[*] CLAUDE.md 인식 강화 시작');
    
    this.enhanceClaudeMd();
    this.updateSettings();
    this.enhanceHooks();
    this.createContextLoader();
    this.createInjector();
    
    console.log('[+] 모든 강화 완료!');
    console.log('[!] Claude Code 재시작 필요');
  }
}

// 실행
if (require.main === module) {
  const enhancer = new ClaudeMdEnhancer();
  enhancer.enhance();
}

module.exports = ClaudeMdEnhancer;