# Claude Code 업데이트 요약 (2.0.30 → 2.0.53)

## 업데이트 정보
- **날짜**: 2025-11-26
- **이전 버전**: 2.0.30
- **현재 버전**: 2.0.53
- **버전 차이**: 23개 버전

## 실행 방법
```bash
npm install @anthropic-ai/claude-code@2.0.53 --save --legacy-peer-deps
```

## 의존성 충돌 해결
- **문제**: LangChain 패키지 버전 충돌 (@langchain/core 1.0.2 vs 0.3.79)
- **해결**: --legacy-peer-deps 플래그 사용

## MCP 서버 상태
✓ 21개 MCP 서버 모두 정상 연결:
- mcp-installer, filesystem, memory, shrimp-task
- github, firecrawl, git-mcp, sqlite-mcp
- websearch, youtube-data, edit-file-lines
- kiro-memory, context7, one-search
- playwright, desktop-commander, supabase
- n8n, sequential-thinking, runpod-jupyter
- memory-keeper

## 보안 경고
- **취약점**: 7개 (4 moderate, 3 high)
- **권장**: `npm audit fix` 실행 검토

## 엔진 경고
- **Node.js**: v20.18.1 (일부 패키지는 v22+ 요구)
- **영향**: @mendable/firecrawl-js, yargs 계열
- **상태**: 작동 정상 (경고만)

## 백업 파일
- .claude.json.backup
- claude.bat.backup
- .npmrc.backup

## 롤백 방법
```bash
cd K:/PortableApps/genai
copy backups\update-2.0.30-to-2.0.53\*.backup .
npm install @anthropic-ai/claude-code@2.0.30 --save --legacy-peer-deps
```

## Zero C-Drive 유지
✓ 모든 설정 파일 K드라이브 유지
✓ npm-cache: K:/PortableApps/genai/npm-cache
✓ 포터블 환경 100% 보장
