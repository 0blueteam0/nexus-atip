# MCP/Skills/Agent 전체 조사 및 도구 카탈로그 구축

## 목표
현재 시스템의 모든 MCP 도구, Skills, Agent, Subagent, 크롤러 등을 조사하고, GitHub에서 인기 있는 도구들을 발견하여 체계적인 도구 카탈로그 구축

---

## 1. 현재 시스템 현황 (조사 완료)

### 1.1 MCP 서버 현황 (38개)

| 카테고리 | 서버명 | 도구 수 | 상태 |
|----------|--------|--------|------|
| **파일/코드** | desktop-commander | 15+ | 운영중 |
| | filesystem | 10+ | 운영중 |
| | edit-file-lines | 4 | 운영중 |
| | git-mcp | 20+ | 운영중 |
| | serena | 25+ | 운영중 |
| **웹 크롤링** | firecrawl (self-hosted) | 5 | Docker 운영중 |
| | firecrawl-simple | 5 | 운영중 |
| | searxng-crawl4ai-mcp | 4 | MCP 서버 stopped |
| | crawl4ai-lite | 1 | 운영중 |
| | playwright | 25+ | 운영중 |
| | one-search | 4 | 운영중 |
| **리서치** | deep-research-mcp | 3 | 운영중 |
| | paper-search-mcp | 24 | 운영중 (8개 DB) |
| | context7 | 2 | 운영중 |
| | websearch | 1 | 운영중 |
| **AI/LLM** | multi-ai-orchestration | 8 | 운영중 |
| | sequential-thinking | 1 | 운영중 |
| | llm-council | 3 | 운영중 |
| **데이터베이스** | sqlite-mcp | 5 | 운영중 |
| | supabase | 15+ | 운영중 |
| **메모리** | memory | 8 | 운영중 |
| | kiro-memory | 25+ | 운영중 |
| **작업 관리** | shrimp-task | 15 | 운영중 |
| | task-master-ai | 6 | 운영중 |
| | vibekanban | 6 | 운영중 |
| **미디어** | image-recognition | 2 | 운영중 |
| | paddleocr-mcp | 3 | 운영중 |
| | marker-mcp | 3 | 운영중 |
| | antv-chart | 25+ | 운영중 |
| **자동화** | n8n | 20+ | 운영중 |
| | e2b | 1 | 운영중 |
| | runpod-jupyter | 10+ | 운영중 |
| **YouTube** | youtube-data | 10 | 운영중 |
| **설치** | mcp-installer | 2 | 운영중 |
| **기타** | github | 25+ | 운영중 |
| | hfspace | 3 | 운영중 |

### 1.2 Skills 현황 (22개)

| 스킬명 | 트리거 키워드 | 기능 |
|--------|--------------|------|
| **academic-paper-verifier** | 논문 검증, citation check | 학술 논문 5단계 검증 |
| **update-optimizer** | 업데이트, update | Claude Code 업데이트 최적화 |
| **pdf-vision** | PDF 분석, OCR | PDF 시각적 분석 |
| **project-init** | 프로젝트 생성, project init | 새 프로젝트 초기화 |
| **bmad-agents** | 분석가 모드, 아키텍트 모드 | BMAD 에이전트 페르소나 |
| **workspace-switcher** | 워크스페이스 전환 | 워크스페이스 관리 |
| **cleanup-advisor** | 정리, cleanup | 파일 정리 제안 |
| **code-analysis** | 코드 분석, analyze | 코드베이스 분석 |
| **code-reviewer** | 코드 리뷰, review | PR 코드 리뷰 |
| **debugger** | 디버그, debug | 버그 분석/수정 |
| **doc-researcher** | 문서 조사, doc research | 문서 리서치 |
| **fic-research** | 조사, research | FIC 리서치 (25% 컨텍스트) |
| **fic-plan** | 계획, plan | FIC 플래닝 (20% 컨텍스트) |
| **fic-implement** | 구현, implement | FIC 구현 (40% 컨텍스트) |
| **base-skill** | - | 스킬 템플릿 |
| **mcp-health-checker** | MCP 상태, health check | MCP 서버 상태 확인 |
| **multi-agent-workflow** | 멀티 에이전트 | 병렬 에이전트 워크플로우 |
| **refactorer** | 리팩토링, refactor | 코드 리팩토링 |
| **test-writer** | 테스트 작성, write tests | 테스트 코드 생성 |
| **documentation-writer** | 문서 작성, write docs | 문서 자동 생성 |
| **research-workflow** | 리서치 워크플로우 | 체계적 조사 |
| **multi-ai-deliberation** | AI 토의, deliberate | 다중 AI 협력 |

### 1.3 웹 크롤러/리서치 도구 (9개)

| 도구 | Docker | 주요 기능 | 추천 용도 |
|------|--------|----------|----------|
| **firecrawl (self-hosted)** | 예 | 고급 스크래핑, PDF, LLM 추출 | JavaScript 렌더링 |
| **firecrawl-simple** | 아니오 | 간편 스크래핑 | 빠른 테스트 |
| **searxng-crawl4ai** | 예 | 메타 검색 + AI 크롤링 | 자체 호스팅 |
| **crawl4ai-lite** | 아니오 | 경량 클라이언트 | 폴백 |
| **deep-research-mcp** | 아니오 | 5단계 딥 리서치 | 심층 조사 |
| **paper-search-mcp** | 아니오 | 8개 학술 DB | 논문 검색 |
| **one-search** | 아니오 | Google 검색 | 웹 검색 |
| **playwright-mcp** | 아니오 | 브라우저 자동화 | 상호작용 |
| **scrapegraph-local** | 아니오 | OLLAMA 그래프 | 로컬 LLM |

---

## 2. GitHub 인기 MCP 서버 (조사 완료)

### 2.1 필수 추천 (Top 10)

| 순위 | 서버 | Stars | 현재 설치 | 추천 사유 |
|------|------|-------|----------|----------|
| 1 | GitHub MCP | 26.4k | O | 개발자 필수, 공식 |
| 2 | Desktop Commander | 5.1k | O | 올인원 파일/터미널 |
| 3 | Context7 | 30k | O | 최신 문서 주입 |
| 4 | Crawl4AI | 58k | O | 웹 스크래핑 최강 |
| 5 | Playwright MCP | MS공식 | O | 브라우저 자동화 |
| 6 | Sequential Thinking | 공식 | O | 복잡한 문제 해결 |
| 7 | Memory | 공식 | O | 세션 간 기억 |
| 8 | Supabase MCP | 커뮤니티 | O | 풀스택 DB |
| 9 | Notion MCP | 공식 | X | 문서/작업 관리 |
| 10 | PAL-MCP-Server | 10.2k | X | 멀티모델 오케스트레이션 |

### 2.2 미설치 추천 도구

| 카테고리 | 서버명 | Stars | 기능 | 설치 난이도 |
|----------|--------|-------|------|------------|
| **생산성** | Notion MCP | 공식 | 문서/작업 자동화 | 쉬움 |
| | Linear MCP | - | 이슈 트래킹 | 쉬움 |
| | Slack MCP | - | 팀 커뮤니케이션 | 쉬움 |
| **AI 통합** | PAL-MCP-Server | 10.2k | GPT-5, Gemini 3.0, O3 등 | 중간 |
| **OCR** | ocr-mcp | - | DeepSeek-OCR, Florence-2 | 중간 |
| | Nanonets MCP | - | 3.75B OCR 모델 | 쉬움 |
| **DB** | Multi-DB Server | - | SQLite/PostgreSQL/MySQL/MSSQL | 중간 |
| | Graphiti | - | 실시간 지식 그래프 | 중간 |

---

## 3. 구현 계획

### Phase 1: 문서화 (산출물 생성)

#### Task 1: 도구 카탈로그 문서
- **파일**: `documentation/guides/TOOL-CATALOG-2026.md`
- **내용**:
  - 전체 MCP 서버 목록 (38개)
  - 도구별 상세 사용법
  - 카테고리별 분류
  - 추천 조합

#### Task 2: Skills 가이드
- **파일**: `documentation/guides/SKILLS-GUIDE-2026.md`
- **내용**:
  - 22개 스킬 상세 설명
  - 트리거 키워드 목록
  - 사용 예시

#### Task 3: GitHub 인기 도구 비교표
- **파일**: `documentation/guides/MCP-COMPARISON-2026.md`
- **내용**:
  - 현재 vs 미설치 도구 비교
  - 카테고리별 추천
  - 설치 가이드

### Phase 2: 시스템 개선

#### Task 4: 누락 도구 설치 제안서
- **파일**: `documentation/reports/MCP-INSTALLATION-PROPOSAL.md`
- **내용**:
  - Notion MCP 설치 가이드
  - PAL-MCP-Server 설치 가이드
  - ocr-mcp 설치 가이드
  - 우선순위 및 이유

#### Task 5: Docker 상태 수정
- **작업**: searxng-crawl4ai-mcp MCP 서버 재시작
- **명령**: `cd mcp-servers/searxng-crawl4ai-mcp && docker compose up -d mcp-server`

#### Task 6: CLAUDE.md 업데이트
- **파일**: `CLAUDE.md` (도구 인벤토리 섹션)
- **내용**:
  - 전체 MCP 서버 요약 테이블 추가
  - 도구 선택 가이드 추가

### Phase 3: 신규 도구 설치

#### Task 7: Notion MCP 설치
- **대상**: `.claude.json` mcpServers 섹션
- **설정**:
```json
"notion": {
  "command": "npx",
  "args": ["-y", "@notionhq/notion-mcp-server"],
  "env": {
    "NOTION_API_KEY": "{{NOTION_API_KEY}}"
  }
}
```
- **필요**: Notion API 키 (https://www.notion.so/my-integrations)

#### Task 8: PAL-MCP-Server 검토 및 설치
- **저장소**: https://github.com/PalMCP/PAL-MCP-Server (10.2k stars)
- **기능**: GPT-5, Gemini 3.0, O3, Grok 등 멀티모델 지원
- **설치**: 저장소 확인 후 적절한 설정 추가

#### Task 9: ocr-mcp 설치
- **대상**: `.claude.json` mcpServers 섹션
- **기능**: DeepSeek-OCR, Florence-2, PP-OCRv5
- **설치**: sandraschi/ocr-mcp 저장소 확인 후 설정

#### Task 10: 설치 검증
- **테스트**:
  - `claude /mcp` 명령으로 새 서버 확인
  - 각 도구 기본 동작 테스트

---

## 4. 산출물 구조

```
documentation/
├── guides/
│   ├── TOOL-CATALOG-2026.md        # 전체 도구 카탈로그
│   ├── SKILLS-GUIDE-2026.md        # 스킬 상세 가이드
│   └── MCP-COMPARISON-2026.md      # GitHub 인기 도구 비교
│
└── reports/
    └── MCP-INSTALLATION-PROPOSAL.md # 신규 도구 설치 제안

CLAUDE.md                            # 도구 인벤토리 섹션 추가
```

---

## 5. 검증 방법

```bash
# 1. 문서 생성 확인
ls documentation/guides/TOOL-CATALOG-2026.md
ls documentation/guides/SKILLS-GUIDE-2026.md
ls documentation/guides/MCP-COMPARISON-2026.md

# 2. Docker 상태 확인
docker ps | grep searxng-crawl4ai-mcp

# 3. MCP 서버 로드 테스트
node -e "require('./.claude.json')"

# 4. 스킬 목록 확인
ls .claude/skills/*/SKILL.md | wc -l
```

---

## 6. 핵심 인사이트

### 현재 시스템 강점
1. **38개 MCP 서버** - 매우 풍부한 도구 생태계
2. **22개 Skills** - 체계적인 스킬 시스템
3. **웹 크롤러 9개** - 다양한 스크래핑 옵션
4. **AI 통합** - multi-ai, llm-council, sequential-thinking

### 개선 필요 사항
1. **Notion MCP** 미설치 - 생산성 도구 통합 필요
2. **PAL-MCP-Server** 미설치 - 최신 멀티모델 지원 필요
3. **Docker 이슈** - searxng-crawl4ai-mcp 서버 재시작 필요
4. **문서화 부족** - 도구 카탈로그 체계적 정리 필요

### 우선순위 추천
| 순위 | 작업 | 이유 |
|------|------|------|
| 1 | 도구 카탈로그 문서화 | 현재 시스템 파악 필수 |
| 2 | Docker 상태 수정 | 기존 도구 정상화 |
| 3 | Notion MCP 설치 | 생산성 향상 |
| 4 | PAL-MCP-Server 검토 | 멀티모델 확장 |

---

## 7. 참고 출처

### GitHub Awesome 목록
- [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers)
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) (77.5k stars)

### 공식 리소스
- [MCP Registry](https://registry.modelcontextprotocol.io/)
- [Anthropic MCP Documentation](https://docs.anthropic.com/en/docs/mcp)

### 가이드
- [Top 10 Essential MCP Servers (Apidog)](https://apidog.com/blog/top-10-mcp-servers-for-claude-code/)
- [Best MCP Servers 2026 (Builder.io)](https://www.builder.io/blog/best-mcp-servers-2026)

---

**플랜 상태**: Phase 1 준비 완료
**예상 산출물**: 4개 문서 + CLAUDE.md 업데이트
