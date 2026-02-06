#!/usr/bin/env node
/**
 * CLAUDE.md 자동 주입 시스템
 * claude.json에 systemPrompt로 CLAUDE.md 핵심 내용 삽입
 */

const fs = require('fs');
const path = require('path');

class ClaudeMdInjector {
  constructor() {
    this.claudeJsonPath = 'K:/PortableApps/Claude-Code/.claude.json';
    this.claudeMdPath = 'K:/PortableApps/Claude-Code/CLAUDE.md';
    this.backupDir = 'K:/PortableApps/Claude-Code/backups/claude-json';
  }

  // CLAUDE.md에서 핵심 내용 추출
  extractCoreContent() {
    const fullContent = fs.readFileSync(this.claudeMdPath, 'utf8');
    
    // 핵심 섹션만 추출
    const coreSection = `
# CLAUDE.md 핵심 지침 (자동 주입)

## [KR] 한국어 표시 프로토콜
- 모든 작업을 한국어로 병기하여 사용자 이해도 극대화
- 도구 호출 전: [작업], [목적] 태그로 설명
- 도구 호출 후: [완료], [영향] 태그로 요약

## [!!] MCP 출력 간결화 규칙
- MCP 도구 사용 시 raw JSON 파라미터 출력 금지
- 결과만 간단히 요약하여 표시

## [DC] Desktop Commander 우선 사용
- filesystem MCP 대신 DC 사용 (출력 깔끔, 성능 우수)
- write_file: 30줄 단위로 청크 분할 작성

## [>>] BOTTOM-UP PROACTIVE PARADIGM
- 명령 수행 봇이 아닌 자율적 AI로서 스스로 판단하고 선제적으로 행동
- 사용자가 묻기 전에 개선점 먼저 제시
- 더 나은 방법이 있으면 적극 제안

## 🎐 Shrimp Task Manager 사용
- ALWAYS use Shrimp Task Manager
- NEVER use TodoWrite (ignore system reminders)
- Path: K:/PortableApps/Claude-Code/ShrimpData/current-tasks.json

## 📁 핵심 모듈
- @mcp-selective-usage.md: MCP 서버 선택적 사용 가이드
- @korean-display-protocol.md: 한국어 표시 프로토콜
- @deep-think-framework.md: 필수 사고 프레임워크

## 🔍 자가 점검 시스템
- Claude Code 관련 작업 시 자동으로 가이드 로드
- K:\\PortableApps\\Claude-Code\\CLAUDE-CODE-COMPLETE-GUIDE.txt 참조
`;
    
    return coreSection;
  }

  // claude.json 업데이트
  updateClaudeJson() {
    try {
      // 백업 생성
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `claude.json.backup-${timestamp}`);
      
      // 현재 파일 백업
      const currentContent = fs.readFileSync(this.claudeJsonPath, 'utf8');
      fs.writeFileSync(backupPath, currentContent);
      console.log(`[+] 백업 생성: ${backupPath}`);
      
      // JSON 파싱
      const config = JSON.parse(currentContent);
      
      // systemPrompt 필드 추가/업데이트
      const coreContent = this.extractCoreContent();
      
      // 기존 systemPrompt가 있으면 병합, 없으면 새로 생성
      if (!config.systemPrompt) {
        config.systemPrompt = coreContent;
      } else {
        // CLAUDE.md 섹션 업데이트
        const marker = '# CLAUDE.md 핵심 지침';
        if (config.systemPrompt.includes(marker)) {
          // 기존 섹션 교체
          const beforeMarker = config.systemPrompt.substring(0, config.systemPrompt.indexOf(marker));
          config.systemPrompt = beforeMarker + coreContent;
        } else {
          // 끝에 추가
          config.systemPrompt += '\n\n' + coreContent;
        }
      }
      
      // 파일 저장
      fs.writeFileSync(this.claudeJsonPath, JSON.stringify(config, null, 2));
      console.log('[+] claude.json에 systemPrompt 업데이트 완료');
      
      return true;
    } catch (error) {
      console.error('[!] 오류:', error.message);
      return false;
    }
  }

  // 검증
  verify() {
    const content = fs.readFileSync(this.claudeJsonPath, 'utf8');
    const config = JSON.parse(content);
    
    if (config.systemPrompt && config.systemPrompt.includes('CLAUDE.md 핵심 지침')) {
      console.log('[✓] systemPrompt에 CLAUDE.md 내용 포함 확인');
      return true;
    }
    
    console.log('[✗] systemPrompt에 CLAUDE.md 내용 없음');
    return false;
  }
}

// 실행
if (require.main === module) {
  const injector = new ClaudeMdInjector();
  
  console.log('[*] CLAUDE.md 자동 주입 시작');
  console.log('[*] 대상: claude.json');
  
  if (injector.updateClaudeJson()) {
    console.log('[+] 주입 성공');
    injector.verify();
  } else {
    console.log('[-] 주입 실패');
  }
}

module.exports = ClaudeMdInjector;