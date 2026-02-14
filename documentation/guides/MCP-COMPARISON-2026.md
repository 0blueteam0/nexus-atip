# MCP Server Comparison Guide 2026

> **작성일**: 2026-02-04
> **버전**: 1.0.0
> **목적**: 현재 설치된 MCP 서버와 GitHub 인기 도구 비교 및 추천

---

## 목차

1. [현재 설치된 MCP 서버 (38개)](#1-현재-설치된-mcp-서버-38개)
2. [GitHub 인기 MCP 서버](#2-github-인기-mcp-서버)
3. [카테고리별 비교 및 추천](#3-카테고리별-비교-및-추천)
4. [미설치 도구 설치 가이드](#4-미설치-도구-설치-가이드)
5. [종합 추천](#5-종합-추천)

---

## 1. 현재 설치된 MCP 서버 (38개)

### 1.1 Reference/Core Servers

| 서버명 | 주요 기능 | 활용도 |
|--------|----------|--------|
| **filesystem** | 파일 시스템 작업, 읽기/쓰기/검색 | 높음 |
| **memory** | Knowledge graph 기반 영구 메모리 | 중간 |
| **sequential-thinking** | 동적/반성적 문제 해결 | 높음 |
| **github** | GitHub API 통합 (이슈, PR, 코드) | 높음 |
| **git-mcp** | Git 저장소 조작 (blame, branch, diff) | 높음 |

### 1.2 파일 편집/자동화

| 서버명 | Stars | 주요 기능 | 평가 |
|--------|-------|----------|------|
| **desktop-commander** | ~5.1k | 터미널 제어, 파일 시스템, diff 편집 | ★★★★★ |
| **edit-file-lines** | - | 라인 기반 정밀 편집 | ★★★★☆ |
| **mcp-installer** | - | MCP 서버 설치 도우미 | ★★★☆☆ |

### 1.3 작업 관리

| 서버명 | 주요 기능 | 평가 |
|--------|----------|------|
| **shrimp-task** | 작업 계획/분해/실행/검증 | ★★★★★ |
| **task-master-ai** | 의존성 추적 작업 관리 | ★★★★☆ |
| **kiro-memory** | 작업+메모리 통합 관리 | ★★★★☆ |
| **vibekanban** | 칸반 보드 기반 작업 관리 | ★★★☆☆ |

### 1.4 웹 스크래핑/검색

| 서버명 | 특징 | Docker 필요 | 평가 |
|--------|------|-------------|------|
| **firecrawl** | 고급 웹 스크래핑, JS 렌더링 | O (self-hosted) | ★★★★★ |
| **one-search** | Google 검색 + 스크래핑 통합 | X | ★★★★☆ |
| **crawl4ai-lite** | AI 기반 크롤링 (폴백용) | X | ★★★☆☆ |
| **searxng-crawl4ai** | SearXNG + Crawl4AI 통합 | O | ★★★★☆ |
| **websearch** | Tavily 기반 웹 검색 | X | ★★★☆☆ |

### 1.5 데이터베이스/백엔드

| 서버명 | 대상 | 평가 |
|--------|------|------|
| **supabase** | Supabase 전체 스택 | ★★★★★ |
| **sqlite-mcp** | SQLite 로컬 DB | ★★★★☆ |

### 1.6 자동화/워크플로우

| 서버명 | 주요 기능 | 평가 |
|--------|----------|------|
| **n8n** | n8n 워크플로우 생성/실행 | ★★★★☆ |
| **playwright** | 브라우저 자동화 (ExecuteAutomation) | ★★★★☆ |

### 1.7 AI/연구

| 서버명 | 주요 기능 | 평가 |
|--------|----------|------|
| **deep-research-mcp** | 딥 리서치 기능 | ★★★★☆ |
| **multi-ai-orchestration** | 멀티 AI 오케스트레이션 | ★★★★☆ |
| **llm-council** | LLM 합의 메커니즘 | ★★★☆☆ |
| **context7** | 최신 라이브러리 문서 조회 | ★★★★★ |
| **paper-search-mcp** | 학술 논문 검색 (arXiv, PubMed 등) | ★★★★☆ |

### 1.8 미디어/OCR

| 서버명 | 주요 기능 | 평가 |
|--------|----------|------|
| **image-recognition** | 이미지 인식 (Anthropic Vision) | ★★★★☆ |
| **paddleocr-mcp** | OCR (PaddleOCR 기반) | ★★★★☆ |
| **marker-mcp** | PDF 변환/추출 | ★★★★☆ |
| **youtube-data** | YouTube 데이터 조회 | ★★★☆☆ |

### 1.9 기타

| 서버명 | 주요 기능 | 평가 |
|--------|----------|------|
| **antv-chart** | 차트 생성 (AntV) | ★★★★☆ |
| **hfspace** | Hugging Face Spaces 연동 | ★★★☆☆ |
| **runpod-jupyter** | RunPod Jupyter 연동 | ★★★☆☆ |
| **serena** | 심볼 기반 코드 탐색 | ★★★★☆ |
| **scrapegraph-local** | Ollama 기반 로컬 스크래핑 | ★★★☆☆ |
| **zen-mcp** | OpenRouter 기반 다중 모델 | ★★★☆☆ |

---

## 2. GitHub 인기 MCP 서버

### 2.1 최다 Stars 순위 (2026년 2월 기준)

| 순위 | 서버명 | Stars | 카테고리 | 설명 |
|------|--------|-------|----------|------|
| 1 | **Context7** | ~44.6k | 문서화 | 최신 라이브러리 문서 조회 |
| 2 | **Crawl4AI** | ~38.7k | 웹 스크래핑 | AI 기반 웹 크롤링 |
| 3 | **MindsDB** | ~38k | 데이터 | 다중 플랫폼 데이터 통합 |
| 4 | **Microsoft Playwright MCP** | ~26k | 브라우저 | 공식 MS Playwright 자동화 |
| 5 | **Blender MCP** | ~16k | 3D/Art | Blender 3D 작업 |
| 6 | **Desktop Commander** | ~5.1k | 시스템 | 터미널/파일 제어 |
| 7 | **mcp-playwright** | ~5.2k | 브라우저 | ExecuteAutomation Playwright |
| 8 | **BrowserMCP** | ~5.6k | 브라우저 | 로컬 Chrome 자동화 |
| 9 | **GitHub MCP** | ~3.2k | 개발 | GitHub API 통합 |
| 10 | **browserbase MCP** | ~3.1k | 브라우저 | 클라우드 브라우저 자동화 |

### 2.2 공식/Official 서버

| 서버명 | 관리자 | Stars | 설명 |
|--------|--------|-------|------|
| **modelcontextprotocol/servers** | Anthropic/LF | ~77.9k | Reference 서버 컬렉션 |
| **Microsoft Playwright MCP** | Microsoft | ~26k | 공식 Playwright 서버 |
| **Supabase MCP** | Supabase | 공식 | 전체 스택 백엔드 |
| **GitHub MCP** | GitHub | 공식 | 공식 GitHub 통합 |
| **Notion MCP** | Notion | ~850 | 공식 Notion 통합 |
| **Slack MCP** | korotovsky | ~1.2k | Slack 워크스페이스 |
| **Linear MCP** | Linear | 공식 | 이슈/프로젝트 관리 |

### 2.3 주목할 만한 서버

| 서버명 | Stars | 용도 | 특징 |
|--------|-------|------|------|
| **MetaMCP** | ~1.9k | 통합 | MCP 서버 통합 관리 GUI |
| **MCPJungle** | ~830 | 엔터프라이즈 | 셀프호스트 레지스트리 |
| **Obsidian MCP** | ~2.7k | 노트 | Obsidian REST API 연동 |
| **Rube** | - | 통합 | 500+ 앱 연동 (Gmail, Slack 등) |
| **Stripe MCP** | 공식 | 결제 | 결제 처리 API |
| **MongoDB MCP** | 커뮤니티 | DB | MongoDB 쿼리/분석 |
| **Brave Search MCP** | Brave | 검색 | AI 요약 포함 검색 |

---

## 3. 카테고리별 비교 및 추천

### 3.1 브라우저 자동화

| 비교 항목 | 현재 설치 (playwright) | Microsoft Playwright MCP | BrowserMCP |
|-----------|----------------------|--------------------------|------------|
| **Stars** | ~5.2k | ~26k | ~5.6k |
| **특징** | ExecuteAutomation 버전 | 공식 MS, 접근성 트리 기반 | 로컬 Chrome 특화 |
| **속도** | 보통 | 빠름 (스크린샷 불필요) | 빠름 |
| **브라우저** | Chromium, Firefox, WebKit | 전체 + Edge | Chrome only |
| **추천** | 현재 충분 | **업그레이드 권장** | 대안 |

**추천**: Microsoft Playwright MCP로 업그레이드 권장. 접근성 트리 기반으로 더 빠르고 안정적.

### 3.2 웹 스크래핑/검색

| 비교 항목 | Firecrawl (설치됨) | Crawl4AI | Bright Data MCP |
|-----------|-------------------|----------|-----------------|
| **Stars** | 공식 | ~38.7k | 상용 |
| **특징** | JS 렌더링, 구조화 추출 | AI 기반, 오픈소스 | 프록시 네트워크 |
| **자체호스팅** | O (Docker) | O | X |
| **비용** | 무료 (self-hosted) | 무료 | 유료 |
| **추천** | **현재 최적** | 이미 lite 설치됨 | 불필요 |

**현황**: 현재 구성(firecrawl + crawl4ai-lite + searxng-crawl4ai)이 최적. 추가 설치 불필요.

### 3.3 생산성/협업

| 도구 | Stars | 현재 상태 | 설치 권장 |
|------|-------|----------|----------|
| **Notion MCP** | ~850 | 미설치 | **권장** (Notion 사용 시) |
| **Slack MCP** | ~1.2k | 미설치 | **권장** (Slack 사용 시) |
| **Linear MCP** | 공식 | 미설치 | 권장 (Linear 사용 시) |
| **Obsidian MCP** | ~2.7k | 미설치 | 권장 (Obsidian 사용 시) |

### 3.4 데이터베이스

| 도구 | 현재 상태 | 평가 |
|------|----------|------|
| **Supabase** | 설치됨 | ★★★★★ - 최적 |
| **SQLite** | 설치됨 | ★★★★☆ - 충분 |
| **PostgreSQL** | 미설치 | 필요시 추가 |
| **MongoDB** | 미설치 | 필요시 추가 |

### 3.5 개발 도구

| 도구 | Stars | 현재 상태 | 평가 |
|------|-------|----------|------|
| **Desktop Commander** | ~5.1k | 설치됨 | ★★★★★ 최고 |
| **GitHub MCP** | ~3.2k | 설치됨 | ★★★★★ 필수 |
| **Git MCP** | - | 설치됨 | ★★★★☆ 유용 |
| **Context7** | ~44.6k | 설치됨 | ★★★★★ 필수 |
| **Serena** | - | 설치됨 | ★★★★☆ 유용 |

---

## 4. 미설치 도구 설치 가이드

### 4.1 높은 우선순위 (강력 추천)

#### Microsoft Playwright MCP (공식)

```json
// .claude.json에 추가
"microsoft-playwright": {
  "type": "stdio",
  "command": "npx",
  "args": ["@playwright/mcp@latest"]
}
```

**설치 난이도**: 쉬움 (npx)
**장점**:
- 공식 MS 지원
- 접근성 트리 기반으로 스크린샷 불필요
- 더 빠르고 결정적인 동작
- GitHub Copilot과 통합

---

#### Notion MCP (Notion 사용자용)

```json
"notion": {
  "type": "stdio",
  "command": "npx",
  "args": ["@notionhq/mcp-server"],
  "env": {
    "NOTION_API_KEY": "${NOTION_API_KEY}"
  }
}
```

**설치 난이도**: 쉬움
**필요 조건**: Notion API 키 (https://www.notion.so/my-integrations)

---

#### Slack MCP

```json
"slack": {
  "type": "stdio",
  "command": "npx",
  "args": ["@anthropic/mcp-server-slack"],
  "env": {
    "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
    "SLACK_TEAM_ID": "${SLACK_TEAM_ID}"
  }
}
```

**설치 난이도**: 중간 (Slack App 설정 필요)
**필요 조건**:
- Slack Bot Token (xoxb-...)
- Team ID
- 필요한 권한: channels:history, channels:read, users:read

---

### 4.2 중간 우선순위 (선택적)

#### Linear MCP

```json
"linear": {
  "type": "stdio",
  "command": "npx",
  "args": ["@anthropic/mcp-server-linear"],
  "env": {
    "LINEAR_API_KEY": "${LINEAR_API_KEY}"
  }
}
```

**설치 난이도**: 쉬움
**용도**: 이슈/프로젝트 관리 (스타트업에 적합)

---

#### Obsidian MCP

```json
"obsidian": {
  "type": "stdio",
  "command": "npx",
  "args": ["obsidian-mcp"],
  "env": {
    "OBSIDIAN_REST_API_URL": "http://localhost:27123",
    "OBSIDIAN_API_KEY": "${OBSIDIAN_API_KEY}"
  }
}
```

**설치 난이도**: 중간 (Obsidian REST API 플러그인 필요)
**Stars**: ~2.7k

---

#### Brave Search MCP

```json
"brave-search": {
  "type": "stdio",
  "command": "npx",
  "args": ["@anthropic/mcp-server-brave-search"],
  "env": {
    "BRAVE_API_KEY": "${BRAVE_API_KEY}"
  }
}
```

**설치 난이도**: 쉬움
**장점**: AI 요약 포함, 웹/뉴스/이미지/비디오 검색

---

### 4.3 낮은 우선순위 (특수 용도)

#### MongoDB MCP

```json
"mongodb": {
  "type": "stdio",
  "command": "npx",
  "args": ["mongodb-mcp-server"],
  "env": {
    "MONGODB_URI": "${MONGODB_URI}"
  }
}
```

**용도**: MongoDB 쿼리/분석

---

#### Blender MCP

```json
"blender": {
  "type": "stdio",
  "command": "npx",
  "args": ["blender-mcp"]
}
```

**Stars**: ~16k
**용도**: 3D 모델링/렌더링 (Blender 사용자용)

---

#### MetaMCP (MCP 관리)

```json
"metamcp": {
  "type": "stdio",
  "command": "npx",
  "args": ["metamcp"]
}
```

**Stars**: ~1.9k
**용도**: MCP 서버 통합 관리 GUI

---

## 5. 종합 추천

### 5.1 현재 구성 평가

| 카테고리 | 현재 상태 | 평가 |
|----------|----------|------|
| **파일/시스템** | Desktop Commander + Edit File Lines | ★★★★★ 최적 |
| **작업 관리** | Shrimp + Kiro + Task Master | ★★★★★ 과잉 (하나로 충분) |
| **웹 스크래핑** | Firecrawl + Crawl4AI + SearXNG | ★★★★★ 최적 |
| **검색** | One-Search + WebSearch + Context7 | ★★★★☆ 좋음 |
| **데이터베이스** | Supabase + SQLite | ★★★★☆ 충분 |
| **브라우저** | ExecuteAutomation Playwright | ★★★★☆ 업그레이드 권장 |
| **협업** | 미설치 | ★★☆☆☆ 개선 필요 |

### 5.2 즉시 추천 (높은 ROI)

1. **Microsoft Playwright MCP** - 기존 playwright 대체/보완
   - 이유: 공식 지원, 더 빠른 성능, 접근성 트리 기반

2. **Notion MCP** (Notion 사용 시)
   - 이유: 지식 베이스 연동, 문서 검색/생성

3. **Slack MCP** (팀 협업 시)
   - 이유: 채널 히스토리를 지식 베이스로 활용

### 5.3 제거 검토 대상

| 서버 | 이유 | 대안 |
|------|------|------|
| **websearch** | one-search와 중복 | one-search로 통합 |
| **crawl4ai-lite** | searxng-crawl4ai가 더 강력 | 폴백용으로만 유지 |
| **task-master-ai** | shrimp-task와 기능 중복 | shrimp-task로 통합 |
| **scrapegraph-local** | firecrawl이 더 강력 | 제거 검토 |
| **zen-mcp** | multi-ai-orchestration과 중복 | 통합 검토 |

### 5.4 최적화된 구성 제안

```
[필수] 11개
├── desktop-commander (파일/터미널)
├── edit-file-lines (정밀 편집)
├── shrimp-task (작업 관리)
├── github (GitHub API)
├── git-mcp (Git 작업)
├── firecrawl (웹 스크래핑)
├── supabase (백엔드)
├── context7 (문서 조회)
├── sequential-thinking (문제 해결)
├── playwright (Microsoft 버전으로 업그레이드)
└── one-search (검색)

[권장] 5개
├── notion (협업/문서)
├── slack (팀 커뮤니케이션)
├── paper-search-mcp (연구)
├── kiro-memory (메모리)
└── n8n (자동화)

[선택] 5개
├── image-recognition (이미지)
├── paddleocr-mcp (OCR)
├── marker-mcp (PDF)
├── antv-chart (차트)
└── hfspace (AI 모델)
```

---

## 참고 자료

### 공식 리소스
- [MCP Registry](https://registry.modelcontextprotocol.io/) - 공식 MCP 레지스트리
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) - 77.9k stars, Reference 서버
- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp) - 공식 MS Playwright

### 커뮤니티 리소스
- [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) - 큐레이션 목록
- [mcpservers.org](https://mcpservers.org/) - MCP 서버 검색
- [best-of-mcp-servers](https://github.com/tolkonepiu/best-of-mcp-servers) - 410개 서버 랭킹
- [mcp-awesome.com](https://mcp-awesome.com/) - 1200+ 서버 목록
- [Glama MCP](https://glama.ai/mcp/servers) - 16,890개 서버 (2026-02 기준)

### 설치 난이도 기준
- **쉬움**: npx 한 줄로 설치, API 키만 필요
- **중간**: 추가 설정 필요 (OAuth, 앱 생성 등)
- **어려움**: Docker, 자체 호스팅, 복잡한 설정

---

**버전**: 1.0.0
**최종 업데이트**: 2026-02-04
**작성자**: Claude Opus 4.5
