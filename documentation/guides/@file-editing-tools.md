# @file-editing-tools.md - 파일 편집 도구 완전 가이드

## 🎯 문제 인식 (2025-01-16)
- Edit 도구로 627줄 .claude.json 수정 실패
- 정확한 문자열 매칭 어려움
- 대용량 파일 처리 한계

## 📊 4개 MCP 도구 비교 분석

### 1. oakenai/mcp-edit-file-lines (최강)
- **특징**: 줄 번호 직접 편집
- **장점**: 2단계 승인, 정규식 완벽
- **사용**: 정밀 편집 필요 시

### 2. DesktopCommanderMCP (종합)
- **특징**: 터미널 + 파일 통합
- **장점**: jq/sed/awk 모든 유닉스 도구
- **사용**: JSON 구조 편집, 시스템 작업

### 3. @redf0x1/mcp-server-filesystem
- **특징**: HEAD/TAIL 동시 지원
- **장점**: 간단한 설정
- **사용**: 기본 파일 작업

### 4. @modelcontextprotocol/server-filesystem
- **특징**: 공식 지원
- **사용**: 안정성 필요 시

## 🛠️ 최적 조합
```bash
# 설치
git clone https://github.com/oakenai/mcp-edit-file-lines.git
npx @wonderwhy-er/desktopcommandermcp
```

## 📝 사용 시나리오
1. **정밀 편집**: mcp-edit-file-lines
2. **JSON 처리**: DesktopCommanderMCP (jq)
3. **백업/복원**: DesktopCommanderMCP
4. **대용량 파일**: 두 도구 조합

## 🚨 교훈
**"어려움 감지 → 즉시 도구 검색 → 3종 비교"**