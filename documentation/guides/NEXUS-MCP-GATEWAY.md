# NEXUS MCP Gateway - Architecture & Usage Guide

> **Version**: 1.0.0
> **Date**: 2026-03-16
> **Location**: `nexus/gateway/mcp-gateway/`

---

## 1. Problem Statement

### Before: 39 MCP Servers Simultaneously Connected
```
Claude Code Session Start
    |
    v
[Load 39 MCP servers]
    |
    v
[Inject ALL tool schemas into context]
    |
    v
~145,000 tokens consumed PER TURN just for tool definitions
    |
    v
[Actual user prompt processed with remaining context]
```

- 39 MCP 서버가 모두 동시에 연결
- 매 턴마다 모든 도구 스키마가 컨텍스트에 주입
- 대부분의 도구는 해당 턴에서 사용되지 않음
- 컨텍스트 낭비 + 응답 속도 저하

### After: 1 Gateway + On-demand Routing
```
Claude Code Session Start
    |
    v
[Load NEXUS Gateway (1 MCP, 8 tools)]
    |
    v
~500 tokens for gateway tool definitions
    |
    v
[User asks -> Gateway routes -> mcp2cli calls specific MCP]
    |
    v
97.7% token reduction
```

---

## 2. Architecture

```
                    Claude Code
                        |
                        | stdio (JSON-RPC)
                        |
              +-------------------+
              |  NEXUS MCP Gateway |
              |   (8 meta-tools)   |
              +-------------------+
               |       |       |
          +----+   +---+   +---+----+
          |        |       |        |
      Registry  Router   Proxy   Evolution
          |        |       |        |
          |        |       +--------+--------+
          |        |       |        |        |
       .claude  Intent  mcp2cli  NEXUS    ATOS
       .json    Match   (CLI)   Orch.    Rec.
          |        |       |
      39 MCPs  Patterns  On-demand
      catalog  scoring   MCP calls
```

### Core Modules

| Module | File | Role |
|--------|------|------|
| **Registry** | `registry.js` | 39개 MCP 서버 카탈로그, 카테고리별 분류, 상태 관리 |
| **Router** | `router.js` | 자연어 의도 분석, 패턴 매칭, 최적 MCP 서버 추천 |
| **Proxy** | `proxy.js` | mcp2cli를 통한 실제 MCP 도구 호출, 캐싱, 재시도 |
| **Server** | `index.js` | MCP 프로토콜 서버, 8개 메타 도구 정의 |

### Data Flow

```
1. User: "웹 페이지를 스크래핑해줘"
2. Claude calls: nexus_smart_route(task="웹 페이지 스크래핑")
3. Router analyzes: intent=web_scrape, confidence=85%
4. Router recommends: firecrawl (primary), one-search (alt)
5. Claude calls: nexus_call(server="firecrawl", tool="firecrawl_scrape", args={url:"..."})
6. Proxy: mcp2cli --mcp http://localhost:3002 firecrawl_scrape --url "..."
7. Result returned to Claude
```

---

## 3. Tools Reference

### nexus_catalog
카테고리별 MCP 서버 목록 조회.
```
nexus_catalog()                    # 전체 목록
nexus_catalog(category="web_crawl") # 카테고리 필터
nexus_catalog(verbose=true)         # 도구 수 포함
```

### nexus_discover
키워드로 전체 MCP 도구 검색.
```
nexus_discover(query="scrape")                        # 캐시 검색
nexus_discover(query="scrape", server="firecrawl")   # 서버 한정
nexus_discover(query="file", live=true)               # 라이브 검색
```

### nexus_list_tools
특정 MCP 서버의 도구 목록 라이브 조회.
```
nexus_list_tools(server="firecrawl")
nexus_list_tools(server="github")
```

### nexus_call
특정 MCP 서버의 도구 호출 (mcp2cli 프록시).
```
nexus_call(server="firecrawl", tool="firecrawl_scrape", args={"url": "https://..."})
nexus_call(server="github", tool="search_repositories", args={"query": "mcp"})
```

### nexus_smart_route
자연어 작업 설명으로 최적 MCP 서버/도구 추천.
```
nexus_smart_route(task="GitHub에서 코드 검색")
nexus_smart_route(task="PDF 문서에서 텍스트 추출")
nexus_smart_route(task="유튜브 영상 트랜스크립트")
```

### nexus_status
게이트웨이 상태, 서버 통계, 라우팅 통계 조회.
```
nexus_status()
```

### nexus_cli
mcp2cli 직접 실행 (파워 유저용).
```
nexus_cli(args="--spec https://petstore.swagger.io/v2/swagger.json --list")
nexus_cli(args="--mcp http://localhost:3002 --search scrape")
```

### nexus_evolve
진화/학습 상태 조회 및 트리거.
```
nexus_evolve()                # 현재 상태
nexus_evolve(action="learn")  # 학습 트리거
```

---

## 4. MCP Server Categories

| Category | Servers | Description |
|----------|---------|-------------|
| **file_code** | desktop-commander, edit-file-lines, filesystem, git-mcp, github, serena | 파일/코드 작업 |
| **web_crawl** | firecrawl, one-search, crawl4ai-lite, scrapegraph-local, playwright | 웹 크롤링 |
| **research** | deep-research-mcp, paper-search-mcp, context7, websearch | 리서치 |
| **ai_llm** | multi-ai-orchestration, llm-council, sequential-thinking, pal | AI/LLM |
| **database** | sqlite-mcp, supabase | 데이터베이스 |
| **memory** | memory, kiro-memory | 메모리 |
| **task_mgmt** | shrimp-task, vibekanban, task-master-ai | 작업 관리 |
| **media_ocr** | image-recognition, paddleocr-mcp, marker-mcp, ocr-mcp, antv-chart, hfspace | 미디어/OCR |
| **automation** | n8n, e2b, runpod-jupyter | 자동화 |
| **other** | mcp-installer, notion, youtube-data | 기타 |

---

## 5. Direct vs Proxied Servers

### Always Direct (4 servers)
높은 빈도, 낮은 레이턴시가 필요한 핵심 서버:
- `desktop-commander` - P1 파일 작업
- `edit-file-lines` - P2 정밀 편집
- `shrimp-task` - P3 작업 관리
- `sequential-thinking` - 깊은 사고

이 서버들은 `.claude.json`에서 직접 연결을 유지합니다.

### Proxied (35+ servers)
NEXUS Gateway를 통해 on-demand로 호출:
- mcp2cli가 stdio/HTTP 프로토콜 자동 처리
- 필요할 때만 연결 -> 토큰 절감
- 캐싱으로 반복 호출 최적화

---

## 6. Integration Points

### mcp2cli Integration
```
NEXUS Gateway
    |
    v
proxy.js -> child_process.execFileSync("mcp2cli.exe", args)
    |
    v
mcp2cli handles: stdio transport, HTTP/SSE, session management
```

### CLI-Anything Integration
```
nexus_cli(args="cli-anything-gimp --help")  # GUI 앱 CLI 호출
nexus_call(server="cli-anything", ...)      # 향후 MCP 래핑 시
```

### NEXUS Orchestrator Integration
```
router.js -> NEXUS orchestrator (nexus/core/orchestrator.js)
    |
    v
Complexity analysis, evolution weights, team routing
```

### ATOS Integration
```
registry.js -> atos/tool-registry.json (도구 카탈로그)
router.js -> atos/recommendation-engine.js (추천 엔진)
```

---

## 7. Evolution Roadmap

### Phase 1 (Current) - Foundation
- [x] MCP Gateway 서버 구현
- [x] Registry (39 서버 카탈로그)
- [x] Router (의도 분석 + 패턴 매칭)
- [x] Proxy (mcp2cli 프록시)
- [x] 8개 메타 도구
- [x] Claude Code 등록

### Phase 2 - Intelligence
- [ ] Tool schema 라이브 캐싱 (mcp2cli --list 결과 DB화)
- [ ] 라우팅 가중치 학습 (사용 패턴 기반)
- [ ] 자동 health check (주기적 서버 상태 확인)
- [ ] mcp2cli bake 설정 자동 생성

### Phase 3 - Optimization
- [ ] 불필요한 직접 연결 MCP 제거 (Gateway로 전환)
- [ ] Token usage 실측 비교 (before/after)
- [ ] CLI-Anything 생성 CLI를 MCP 도구로 래핑
- [ ] OpenAPI 스펙 자동 발견 및 등록

### Phase 4 - Autonomous
- [ ] 자율적 MCP 서버 발견 (GitHub trending)
- [ ] 자동 설치 + 등록 파이프라인
- [ ] 에이전트 팀 통합 (Agent Teams)
- [ ] 크로스-세션 학습 (진화 상태 영속)

---

## 8. Configuration

### Claude Code (.claude.json)
```json
{
  "mcpServers": {
    "nexus-gateway": {
      "command": "node",
      "args": ["K:/PortableApps/genai/nexus/gateway/mcp-gateway/index.js"],
      "env": {}
    }
  }
}
```

### 향후 최적화: 직접 연결 서버 축소
```json
{
  "mcpServers": {
    "nexus-gateway": { "..." },
    "desktop-commander": { "..." },
    "edit-file-lines": { "..." },
    "shrimp-task": { "..." },
    "sequential-thinking": { "..." }
  }
}
```

39개 -> 5개로 축소 가능 (나머지는 Gateway가 on-demand 프록시)

---

## 9. Troubleshooting

### Gateway 시작 실패
```bash
# 직접 테스트
cd K:/PortableApps/genai/nexus/gateway/mcp-gateway
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node index.js
```

### mcp2cli 프록시 오류
```bash
# mcp2cli 직접 테스트
K:/PortableApps/genai/.local/bin/mcp2cli.exe --spec https://petstore.swagger.io/v2/swagger.json --list
```

### 서버 레지스트리 확인
```bash
node -e "const {MCPRegistry}=require('./nexus/gateway/mcp-gateway/registry'); const r=new MCPRegistry(); console.log(JSON.stringify(r.getStats(),null,2));"
```
