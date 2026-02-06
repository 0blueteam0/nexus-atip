#!/usr/bin/env node
/**
 * CLAUDE.md 실시간 주입 스크립트
 * 매 프롬프트마다 실행되어 CLAUDE.md 내용을 컨텍스트에 포함
 */

const fs = require('fs');

// CLAUDE.md 핵심 내용을 간결하게 출력
function injectClaudeMd() {
  const claudeMdPath = 'K:/PortableApps/Claude-Code/CLAUDE.md';
  
  // 핵심 지침만 추출
  const coreGuidelines = `
[CLAUDE.md 자동 로드]
- 한국어 병기 활성화
- MCP 출력 간결화
- Desktop Commander 우선
- Bottom-up Proactive 모드
- Shrimp Task Manager 사용
- 모듈: @mcp-selective-usage.md
`;
  
  // stdout으로 출력 (Claude가 읽음)
  console.log(coreGuidelines);
}

// 메인 실행
if (require.main === module) {
  injectClaudeMd();
}

module.exports = { injectClaudeMd };