# 🔴 긴급 작업 목록 (재부팅 불필요)

## 1. Shrimp Task Manager MCP 수동 연결
```json
"shrimp": {
  "command": "node",
  "args": ["K:/PortableApps/Claude-Code/mcp-servers/shrimp-mcp/dist/index.js"],
  "env": {"SHRIMP_DIR": "K:/PortableApps/Claude-Code/ShrimpData"}
}
```

## 2. 추가 MCP 서버 연결 가능
- Git MCP
- Memory MCP (kiro)
- Edit File Lines MCP

## 3. NEXUS ATIP 프로젝트 복구
- index.html 분석
- threat-knowledge-graph 서버 시작
- 대시보드 접속 테스트

## 4. 메모리 시스템 통합
- brain/ → 메인 학습 시스템
- ShrimpData/memory/ → 작업 메모리
- memory-archive/ → 백업

## 5. 시스템 자동화 점검
- systems/SAFE-MONITOR.js 실행 중
- hooks/auto-memory-system.js 작동 확인
- .claude-hooks.json 설정 검증

## 6. 중복 파일 추가 정리
- CLAUDE-MINIMAL.md (중복?)
- .google-search-*.json (2개)
- .credentials.json (용도?)
- statsig/ (필요?)

## 7. 환경 변수 점검
- .env, .env.anthropic 통합
- .bashrc, .bash_profile 정리
- .npmrc 설정 확인

## 8. 숨겨진 문제들
- mcp-tools/ 폴더 아직 있음
- projects/ 폴더 아직 있음  
- temp/, tmp/ 둘 다 있음
- memory-data/ 아직 있음

재부팅 없이도 할 일이 산더미!