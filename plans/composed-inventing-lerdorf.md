# 전체 시스템 빌드 검증 플랜

## 목표
K:\PortableApps\Claude-Code 프로젝트의 모든 빌드 가능한 컴포넌트 검증

---

## Phase 1: TypeScript MCP 서버 빌드 검증

### 1.1 mcp-edit-file-lines
- **경로**: `mcp-servers/mcp-edit-file-lines/`
- **빌드**: `npm run build` (tsc)
- **테스트**: `npm test` (Jest)
- **성공 기준**: 빌드 완료 + 테스트 통과

### 1.2 desktop-commander-mcp
- **경로**: `desktop-commander-mcp/`
- **빌드**: `npm run build` (tsc + 파일 복사)
- **테스트**: `npm test`
- **성공 기준**: dist/ 생성 + 테스트 통과

### 1.3 git-mcp-server
- **경로**: `mcp-servers/git-mcp-server/`
- **빌드**: `npm run build` (tsc)
- **테스트**: `npm test` (Vitest)
- **Lint**: `npm run lint`
- **성공 기준**: 빌드 + 테스트 + Lint 모두 통과

---

## Phase 2: Frontend 빌드 검증

### 2.1 llm-council/frontend
- **경로**: `llm-council/frontend/`
- **빌드**: `npm run build` (Vite)
- **Lint**: `npm run lint`
- **성공 기준**: dist/ 생성

### 2.2 security-hub/dashboard
- **경로**: `security-hub/dashboard/`
- **빌드**: `npm run build` (Vite)
- **성공 기준**: dist/ 생성

---

## Phase 3: Node.js 스크립트 검증

### 3.1 ATOS 시스템 (17개 파일)
- **경로**: `atos/`
- **검증 방법**: `node --check atos/index.js` (문법 검사)
- **핵심 파일**:
  - index.js (메인)
  - recommendation-engine.js
  - context-analyzer.js
  - execution-monitor.js

### 3.2 Planning System (9개 파일)
- **경로**: `planning-system/`
- **검증 방법**: `node --check planning-system/index.js`
- **핵심 파일**:
  - restore.js
  - checkpoint.js
  - workflow.js

---

## Phase 4: 통합 검증

### 4.1 의존성 확인
```bash
npm ls --depth=0  # 루트 의존성
```

### 4.2 MCP 서버 연결 테스트
- Desktop Commander: `npx @modelcontextprotocol/inspector dist/index.js`
- Edit File Lines: `npx @modelcontextprotocol/inspector build/index.js`

---

## 실행 순서

| 순서 | 대상 | 명령어 | 예상 결과 |
|------|------|--------|----------|
| 1 | mcp-edit-file-lines | `cd mcp-servers/mcp-edit-file-lines && npm run build` | build/ 생성 |
| 2 | mcp-edit-file-lines | `npm test` | Jest 테스트 통과 |
| 3 | desktop-commander | `cd desktop-commander-mcp && npm run build` | dist/ 생성 |
| 4 | desktop-commander | `npm test` | 테스트 통과 |
| 5 | git-mcp-server | `cd mcp-servers/git-mcp-server && npm run build` | dist/ 생성 |
| 6 | git-mcp-server | `npm test` | Vitest 통과 |
| 7 | llm-council | `cd llm-council/frontend && npm run build` | dist/ 생성 |
| 8 | security-hub | `cd security-hub/dashboard && npm run build` | dist/ 생성 |
| 9 | ATOS | `node --check atos/index.js` | 문법 OK |
| 10 | Planning | `node --check planning-system/index.js` | 문법 OK |

---

## 검증 결과 템플릿

```
[ ] Phase 1.1 mcp-edit-file-lines 빌드
[ ] Phase 1.1 mcp-edit-file-lines 테스트
[ ] Phase 1.2 desktop-commander 빌드
[ ] Phase 1.2 desktop-commander 테스트
[ ] Phase 1.3 git-mcp-server 빌드
[ ] Phase 1.3 git-mcp-server 테스트
[ ] Phase 2.1 llm-council/frontend 빌드
[ ] Phase 2.2 security-hub/dashboard 빌드
[ ] Phase 3.1 ATOS 문법 검증
[ ] Phase 3.2 Planning 문법 검증
```

---

## 예상 문제 및 해결책

| 문제 | 해결책 |
|------|--------|
| node_modules 없음 | `npm install` 먼저 실행 |
| TypeScript 버전 충돌 | 로컬 devDependencies 사용 |
| Jest ESM 문제 | `--experimental-vm-modules` 플래그 |
| Vite 빌드 실패 | node_modules 재설치 |

---

## 성공 기준
- 모든 TypeScript 빌드 성공 (에러 0)
- 모든 테스트 통과 (100%)
- Lint 에러 0
- Node.js 스크립트 문법 검증 통과

---

**작성일**: 2026-02-04
**예상 소요**: 전체 빌드 및 검증
