# MCP 비교 분석 모듈

## ⚡ 자동 비교 프로세스 (CRITICAL)
**새로운 도구가 필요할 때 반드시 실행:**

1. **즉시 검색** → 관련 MCP/도구 3개 이상 찾기
2. **비교 테이블 작성** → 기능, 장단점, 호환성
3. **최적 선택** → Windows Native 환경 우선
4. **문서화** → 이 파일에 자동 추가
5. **학습 저장** → brain/patterns.json에 패턴 기록

## 📊 비교 사례들 (2025-08-15)

### Task Manager MCP 비교

| MCP 서버 | 패키지명 | 주요 특징 | 장점 | 단점 | 추천도 |
|----------|----------|-----------|------|------|--------|
| **Shrimp Task Manager** | mcp-shrimp-task-manager | Chain-of-Thought, 웹 UI:3000 | 시각적 관리, 의존성 추적 | 웹 포트 필요 | ⭐⭐⭐⭐⭐ |
| **Chain of Thought Ver** | @liorfranko/mcp-chain-of-thought | ENABLE_THOUGHT_CHAIN 제어 | 상세 사고 과정 | 복잡한 설정 | ⭐⭐⭐⭐ |
| **Gist Task Manager** | gist-task-manager-mcp | GitHub Gist 클라우드 저장 | 원격 동기화 | GitHub 의존 | ⭐⭐⭐ |
| **Task Manager by kazuph** | @kazuph/taskmanager | 사용자 승인 워크플로우 | 안전한 실행 | 수동 승인 필요 | ⭐⭐⭐ |

**선택**: Shrimp Task Manager - 시각적 UI + Chain-of-Thought + 로컬 실행

### Memory/Context MCP 비교

| MCP 서버 | 패키지명 | 주요 특징 | 장점 | 단점 | 추천도 |
|----------|----------|-----------|------|------|--------|
| **Kiro Memory** | @cbunting99/kiro-memory | 멀티 프로젝트, 자동 중요도 | 400+ 테스트, 프로덕션 레디 | 무거움 | ⭐⭐⭐⭐⭐ |
| **MCP Memory Service** | @doobidoo/mcp-memory-service | ChromaDB + 센텐스 트랜스포머 | 시맨틱 검색 | 설정 복잡 | ⭐⭐⭐⭐ |
| **Basic Memory** | @basicmachines/memory | 로컬 지식 그래프 | 간단한 설치 | 기능 제한 | ⭐⭐⭐ |
| **Local Context Memory** | @cunicopia-dev/local-memory-mcp | SQLite + FAISS | 빠른 검색 | 임베딩 필요 | ⭐⭐⭐⭐ |

**선택**: Kiro Memory - 가장 완성도 높음, 멀티 프로젝트 지원

### Web Crawler MCP 비교

| MCP 서버 | 패키지명 | 속도 | 성공률 | 특징 | 추천도 |
|----------|----------|------|--------|------|--------|
| **Firecrawl** | @mendableai/firecrawl-mcp-server | 7초 | 높음 | Claude 최적화 | ⭐⭐⭐⭐⭐ |
| **Bright Data** | bright-data-mcp | 83초 | 100% | CAPTCHA 우회 | ⭐⭐⭐⭐ |
| **Crawl4AI** | crawl4ai-mcp | 느림 | 보통 | AI 분석 | ⭐⭐⭐ |
| **Web Crawler** | @jitsmaster/web-crawler | 빠름 | 보통 | 심플 | ⭐⭐⭐ |

**선택**: Firecrawl - 속도와 Claude 통합 최적

### Database MCP 비교

| MCP 서버 | 패키지명 | DB 지원 | 기능 | 추천도 |
|----------|----------|---------|------|--------|
| **Prisma Postgres** | @prisma/postgres-mcp | PostgreSQL | 백업, 마이그레이션 | ⭐⭐⭐⭐⭐ |
| **PostgreSQL Official** | @modelcontextprotocol/postgres | PostgreSQL | 읽기 전용 | ⭐⭐⭐⭐ |
| **MySQL MCP** | mysql-mcp-server | MySQL | 읽기 전용 | ⭐⭐⭐ |
| **Multi-DB MCP** | multi-database-mcp | 다중 DB | 통합 관리 | ⭐⭐⭐⭐ |

**선택**: Prisma Postgres - 풀 기능 지원

### Diff MCP 비교

| MCP 서버 | 패키지명 | 특징 | 장점 | 단점 | 추천도 |
|----------|----------|------|------|------|--------|
| **mcp-server-diff-typescript** | mcp-server-diff-typescript | TypeScript 기반 | Node.js만 필요 | 시각화 제한 | ⭐⭐⭐⭐ |
| **@gorosun/unified-diff-mcp** | @gorosun/unified-diff-mcp | Bun 런타임 | 아름다운 UI | Bun 필요 | ⭐⭐⭐ |
| **mcp-server-diff-editor** | mcp-server-diff-editor | 고급 편집기 | 패턴 인식 | 복잡 | ⭐⭐⭐⭐⭐ |

**선택**: mcp-server-diff-typescript - Windows Native 최적

### Git MCP 비교

| MCP 서버 | 패키지명 | 특징 | 추천도 |
|----------|----------|------|--------|
| **@cyanheads/git-mcp-server** | @cyanheads/git-mcp-server | 가장 완성도 높음 | ⭐⭐⭐⭐⭐ |
| **git-simple-mcp** | git-simple-mcp | 기본 기능만 | ⭐⭐⭐ |

**선택**: @cyanheads/git-mcp-server

## ⚠️ Windows Native cmd 버그
**모든 설치 후 반드시:**
```javascript
// 자동 체크 및 수정
if (args[0] === "C:/") {
  args[0] = "/c";  // 수정
}
```

## 🎯 추천 우선순위 (2025-08-15)

### 필수 설치
1. ✅ Shrimp Task Manager - 작업 관리
2. ✅ Git MCP - 버전 관리
3. ✅ Diff TypeScript - 코드 비교

### 강력 추천
4. ⏳ Kiro Memory - 대화 지속성
5. ⏳ Firecrawl - 웹 데이터 수집
6. ⏳ Prisma Postgres - DB 관리

### 프로젝트별
7. 🔧 REST Client MCP - API 개발
8. 🔧 Security Scanner - 보안 점검
9. 🔧 Performance Monitor - 성능 모니터링

---
Last Updated: 2025-08-15
Total Compared: 25+ MCP Servers