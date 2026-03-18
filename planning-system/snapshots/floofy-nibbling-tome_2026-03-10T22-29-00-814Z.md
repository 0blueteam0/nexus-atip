# NEXUS v3.0 Phase 8+ - LangGraph + DeepAgent + Claude Features + Live Monitor + Obsidian

> **Status**: Phase 8-12 완료, Phase 13 계획 중
> **Created**: 2026-03-05
> **Base**: NEXUS v3.0 Phase 0-7 완료 (14 Port, 7-Layer, 12/12 E2E 통과)
> **성격**: v3.0의 **계속** (별도 버전이 아님, v3는 진행 중)

---

## Phase 8 (A): LangGraph 1.0 실전 통합 -- [+] 완료

- checkpoint-store.js (SQLite+JSON), HITL/Summarizer/Tracer 미들웨어
- langgraph-engine.js 네이티브 통합, graph-engine.js 리라이트
- E2E 체크 3개 추가 (checkpoint, middleware, streaming)

## Phase 9 (B): Deep Agent + Claude 최신 기능 -- [+] 완료

- deep-agent: planner, context-fs, subagent-manager
- claude-features: team-orchestrator, plugin-manifest, thinking-advisor, hook-server, memory-sync, remote-bridge
- orchestrator.js thinking advisor + team routing 통합
- a2a-hub.js TeammateTool 패턴 추가

## Phase 10 (C): 실시간 동적 모니터링 시각화 -- [+] 완료

- monitor/ 웹 서버 (포트 7850) + SSE Bridge
- 5개 뷰: Architecture Map, Flow Timeline, Agent Office (픽셀 아트), Event Stream, Savepoint Inspector
- 바닐라 HTML/CSS/JS, 프레임워크 0

## Phase 11 (D): 통합 검증 + 로그 영속화 -- [+] 완료

- E2E 18/18 통과 (Steps 11-16 추가)
- CLI 명령어 3종: monitor, checkpoint, team
- TracerMiddleware JSONL 로그 영속화

---

## Phase 12 (E): NEXUS x Obsidian 통합 -- [+] 완료

### Context

NEXUS의 모든 데이터(이벤트, 체크포인트, 태스크, 비용, 패턴)가
CLI JSON 출력과 웹 모니터(7850)에만 존재함.
Obsidian을 "Second Brain"으로 활용하면:
- 모든 AI 세션/태스크/학습이 검색 가능한 지식 노트로 축적
- 그래프 뷰로 태스크 간 관계 시각화 (`[[wikilink]]`)
- Dataview 쿼리로 비용/품질/패턴 분석
- 세션 간 지식 영속 (Claude auto-memory와 동기화)

### 기존 자산

| 자산 | 상태 | 활용 |
|------|------|------|
| Obsidian Local REST API | C드라이브 볼트에 설치됨 (포트 27124) | K드라이브 볼트에도 설정 |
| K드라이브 볼트 경로 | obsidian.json에 등록됨 (폴더 미생성) | 폴더 + .obsidian 초기화 |
| NEXUS EventBus | 완성 (와일드카드, 미들웨어) | obsidian 미들웨어 등록 |
| SSE Bridge | 완성 (포트 7850) | 실시간 이벤트 소스 |
| CheckpointStore | 완성 (JSON fallback) | 체크포인트 노트 생성 |
| TracerMiddleware | 완성 (JSONL 로그) | 세션 히스토리 변환 |
| MemorySync | 완성 | memory <-> obsidian 연동 |
| vault-optimizer.md | 에이전트 정의 존재 | 볼트 최적화 자동화 |

### 아키텍처

```
NEXUS System                          Obsidian Vault (K드라이브)
==================                    ========================
EventBus ──┐
           │                          NEXUS/
CheckpointStore ──┐                   ├── Sessions/        (AI 세션 기록)
                  │   obsidian-       ├── Tasks/           (태스크 추적)
TracerMiddleware ──┤── bridge.js ──>  ├── Knowledge/       (학습 패턴)
                  │   (Sync Engine)   ├── Checkpoints/     (세이브포인트)
DeepPlanner ──────┤                   ├── Providers/       (프로바이더 상태)
                  │                   ├── Costs/           (비용 일별)
MemorySync ───────┘                   ├── Dashboard.md     (MOC)
                                      └── Templates/       (Obsidian 템플릿)
```

### 구현 세부

#### E-1: 볼트 초기화 + Bridge 코어

**볼트 폴더 구조 생성:**
```
K:\Obsidian Project\K드라이브의 멋진 보관함\
├── .obsidian/           (설정, 플러그인)
├── NEXUS/
│   ├── Dashboard.md     (Dataview MOC)
│   ├── Sessions/
│   ├── Tasks/
│   ├── Knowledge/
│   ├── Checkpoints/
│   ├── Providers/
│   ├── Costs/
│   └── Events/
├── Templates/           (노트 템플릿 4종)
└── README.md
```

**Obsidian Bridge** (`nexus/obsidian/bridge.js`):
- Obsidian Local REST API (포트 27124) HTTPS 클라이언트
- `PUT /vault/{path}` 노트 생성/업데이트
- `GET /vault/{path}` 노트 읽기
- YAML frontmatter 자동 생성 (Dataview 호환)
- 배치 큐잉 → 주기적 플러시 (기본 모드)
- Obsidian 미실행 시 graceful skip

#### E-2: EventBus -> Obsidian 노트 자동 생성

**Event Writer** (`nexus/obsidian/event-writer.js`):

| NEXUS 이벤트 | Obsidian 노트 | 폴더 |
|-------------|-------------|------|
| `task:completed` | 태스크 완료 노트 | Tasks/ |
| `graph:end` | 세션 요약 추가 | Sessions/ |
| `checkpoint:saved` | 세이브포인트 노트 | Checkpoints/ |
| `evolution:pattern` | 패턴 노트 | Knowledge/ |
| 일별 집계 | 비용 리포트 | Costs/ |

**노트 형식 (Dataview 호환 frontmatter):**
```yaml
---
type: task
task_id: a2a-xxx
task_type: code_review
provider: gemini-cli
status: completed
cost: 0.05
quality_score: 0.92
date: 2026-03-05
tags: [nexus/task, code-review]
---
```

**Wikilink 자동 생성:**
- 태스크 노트 → 세션 노트 `[[Session-2026-03-05-1430]]`
- 체크포인트 → 태스크 `[[Task-code-review-001]]`
- 그래프 뷰에서 관계 시각화

#### E-3: Dashboard MOC (Dataview 쿼리)

`NEXUS/Dashboard.md` - 전체 현황:
- Recent Sessions 테이블 (Dataview)
- Provider Performance 집계
- Cost Trend (7일)
- Active Patterns 목록
- Quick Stats (노트 수 카운트)

#### E-4: Memory <-> Obsidian 양방향

**Memory Bridge** (`nexus/obsidian/memory-bridge.js`):
- Claude auto-memory → Obsidian Knowledge/ 동기화
- Obsidian Knowledge/ 수동 노트 → NEXUS 라우팅 힌트로 활용
- 변경 감지 기반 증분 동기화

#### E-5: CLI + 설정 통합

**CLI 명령어:**
- `nexus obsidian sync` - 수동 동기화
- `nexus obsidian status` - REST API 연결 확인
- `nexus obsidian dashboard` - Dashboard.md 재생성

**동기화 모드 (nexus.config.json):**
- `batch` (기본): 세션 종료 시 일괄 동기화
- `realtime`: EventBus 미들웨어로 즉시 동기화
- `manual`: CLI로만 동기화

**Obsidian 플러그인 추천:**
| 플러그인 | 용도 | 필수 |
|---------|------|------|
| Dataview | 쿼리/테이블/통계 | O (Dashboard) |
| Local REST API | NEXUS 연동 | O (이미 설치) |
| Templater | 노트 템플릿 | 선택 |
| Calendar | 일별 세션 탐색 | 선택 |

### 파일 인벤토리

| # | 파일 | 유형 | 역할 |
|---|------|------|------|
| 1 | `nexus/obsidian/bridge.js` | 새 파일 | REST API 클라이언트 |
| 2 | `nexus/obsidian/event-writer.js` | 새 파일 | EventBus -> 노트 변환 |
| 3 | `nexus/obsidian/templates.js` | 새 파일 | MD 템플릿 생성기 |
| 4 | `nexus/obsidian/memory-bridge.js` | 새 파일 | Memory <-> Obsidian |
| 5 | 볼트 초기 구조 | 새 파일 (~8개) | 폴더, 템플릿, Dashboard |
| 6 | `nexus/core/cli.js` | 수정 | obsidian 명령어 추가 |
| 7 | `nexus/nexus.config.json` | 수정 | obsidian 설정 섹션 |
| 8 | `nexus/scripts/e2e-scenario.js` | 수정 | obsidian 체크 추가 |

**새 파일: ~12개, 수정: 3개**

### 설계 원칙

1. **포터블**: K드라이브 완결, C드라이브 의존 없음
2. **Graceful Degradation**: Obsidian 미실행 시 동기화 스킵
3. **Dataview 호환**: 모든 노트에 YAML frontmatter
4. **Lazy Sync**: 기본 배치 모드, 실시간은 옵션
5. **양방향**: NEXUS -> Obsidian (자동) + Obsidian -> NEXUS (수동)
6. **Wikilink**: `[[]]` 링크로 Obsidian 그래프 뷰 활용

### 검증

1. `nexus obsidian status` → REST API 연결 확인
2. `nexus obsidian sync` → 볼트에 노트 생성 확인
3. Obsidian → Dashboard.md Dataview 쿼리 작동
4. E2E 테스트 → obsidian bridge 로드 확인
5. 그래프 뷰 → 세션-태스크-체크포인트 링크 시각화

---

## Phase 13 (F): Multi-CLI Parity - Codex/Gemini 설정 동등화 -- [*] 계획 중

### Context

NEXUS가 3개 프로바이더(Claude Code, Gemini CLI, Codex CLI)를 오케스트레이션하지만,
실제로 Gemini/Codex를 **직접 켜서** 사용할 때 Claude Code와 동일한 경험을 제공하지 못함.

현재 상태:
- Claude Code: 31개 훅, CLAUDE.md, 38개 MCP, 스킬, 에이전트, NEXUS 완전 통합
- Gemini CLI: GEMINI.md (미완성, routing "undefined"), 훅 없음, MCP 없음, 스킬 없음
- Codex CLI: CODEX.md 없음, AGENTS.md만 존재, 훅 없음, MCP 없음, 스킬 없음

### 조사 결과: 각 CLI 설정 메커니즘 비교

| 기능 | Claude Code | Gemini CLI | Codex CLI |
|------|------------|------------|-----------|
| **Hooks** | 17 이벤트 (전체) | 11 이벤트 (전체) | 1 이벤트 (notify만) |
| **MCP 서버** | 전체 지원 | 전체 지원 | 전체 지원 |
| **지침 파일** | CLAUDE.md | GEMINI.md + system.md | AGENTS.md |
| **계층 탐색** | repo walk | repo walk + JIT | repo walk |
| **설정 형식** | JSON (.claude.json) | JSON (settings.json) | TOML (config.toml) |
| **스킬** | .claude/skills/ | .gemini/skills/ | .agents/skills/ |
| **에이전트** | .claude/agents/ | .gemini/agents/ | config.toml [agents] |
| **세션 관리** | 있음 | 있음 + checkpoint | 있음 + SQLite |
| **Fallback 파일명** | 없음 | context.fileName | project_doc_fallback_filenames |

### 핵심 발견: Codex의 AGENTS.md 호환

Codex CLI는 `project_doc_fallback_filenames`로 **CLAUDE.md도 읽을 수 있음**.
Gemini CLI는 `context.fileName`으로 **AGENTS.md, CLAUDE.md도 읽을 수 있음**.
-> **공통 AGENTS.md를 Single Source of Truth로 활용 가능**

### 아키텍처

```
K:/PortableApps/genai/
├── AGENTS.md              <- 공통 지침 (3 CLI 모두 읽음)
├── CLAUDE.md              <- Claude 전용 지침 (기존 유지)
├── GEMINI.md              <- Gemini 전용 지침 (NEXUS 역할 + 라우팅)
│
├── .gemini/
│   ├── settings.json      <- MCP + Hooks + 스킬 설정
│   ├── GEMINI.md          <- Gemini 프로젝트 컨텍스트
│   ├── skills/            <- Gemini 스킬 (symlink -> .claude/skills/)
│   └── agents/            <- Gemini 에이전트 정의
│
├── .codex/
│   ├── config.toml        <- MCP + 스킬 + 에이전트 설정
│   └── AGENTS.md          <- Codex 프로젝트 컨텍스트
│
├── .agents/
│   └── skills/            <- Codex 스킬 (symlink -> .claude/skills/)
│
├── nexus/hooks/
│   ├── gemini-session-start.js   <- Gemini SessionStart hook
│   ├── gemini-session-end.js     <- Gemini SessionEnd hook
│   ├── gemini-before-tool.js     <- Gemini BeforeTool hook
│   └── gemini-after-tool.js      <- Gemini AfterTool hook
│
└── nexus/sync/
    └── config-sync.js     <- 설정 동기화 엔진
```

### 구현 세부

#### F-1: 공통 AGENTS.md 강화 + CLI별 컨텍스트 파일

**AGENTS.md 강화** (이미 존재, NEXUS 섹션 있음):
- 코드 스타일 가이드 + NEXUS 아키텍처 (기존)
- xAI 태그 시스템 추가 (3 CLI 공통)
- 도구 우선순위 + 한국어 병기 규칙 추가
- MCP 서버 목록 + 사용법

**GEMINI.md 재생성** (기존 "undefined" 수정):
- NEXUS 역할: collaborator 상세 설명
- 라우팅 테이블 (태스크별 담당)
- 결과 포맷 (JSON structured output)
- NEXUS CLI 명령어 가이드

**CODEX.md 생성** (신규):
- NEXUS 역할: specialist 상세 설명
- approval-mode 가이드
- 결과 포맷 (JSON structured output)

#### F-2: Gemini CLI 설정 (.gemini/settings.json)

**MCP 서버 미러링** (Claude와 동일한 서버 구성):
```json
{
  "mcpServers": {
    "desktop-commander": {
      "command": "node",
      "args": ["K:/PortableApps/genai/mcp-servers/desktop-commander-mcp/dist/index.js"],
      "timeout": 30000
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": { "MEMORY_FILE_PATH": "K:/PortableApps/genai/mcp-data/memory.json" }
    },
    "sqlite-mcp": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-sqlite"]
    }
  }
}
```

**Hooks 설정** (11개 중 핵심 6개):
```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{ "name": "nexus-init", "type": "command",
        "command": "node K:/PortableApps/genai/nexus/hooks/gemini-session-start.js" }]
    }],
    "SessionEnd": [{
      "hooks": [{ "name": "nexus-learn", "type": "command",
        "command": "node K:/PortableApps/genai/nexus/hooks/gemini-session-end.js" }]
    }],
    "BeforeTool": [{
      "hooks": [{ "name": "nexus-track", "type": "command",
        "command": "node K:/PortableApps/genai/nexus/hooks/gemini-before-tool.js" }]
    }],
    "AfterTool": [{
      "hooks": [{ "name": "nexus-track", "type": "command",
        "command": "node K:/PortableApps/genai/nexus/hooks/gemini-after-tool.js" }]
    }]
  },
  "context": {
    "fileName": ["AGENTS.md", "GEMINI.md"]
  }
}
```

#### F-3: Codex CLI 설정 (.codex/config.toml)

**MCP 서버 미러링**:
```toml
[mcp_servers.desktop-commander]
command = ["node", "K:/PortableApps/genai/mcp-servers/desktop-commander-mcp/dist/index.js"]
enabled = true

[mcp_servers.github]
command = ["npx", "-y", "@modelcontextprotocol/server-github"]
[mcp_servers.github.env]
GITHUB_PERSONAL_ACCESS_TOKEN = "$GITHUB_TOKEN"

[mcp_servers.memory]
command = ["npx", "-y", "@modelcontextprotocol/server-memory"]
[mcp_servers.memory.env]
MEMORY_FILE_PATH = "K:/PortableApps/genai/mcp-data/memory.json"
```

**에이전트 + 기타 설정**:
```toml
project_doc_fallback_filenames = ["AGENTS.md", "CLAUDE.md", "CODEX.md"]
project_doc_max_bytes = 65536
notify = ["node", "K:/PortableApps/genai/nexus/hooks/codex-notify.js"]

[history]
persistence = "save-all"
```

#### F-4: 스킬 심링크 (3 CLI 공유)

기존 `.claude/skills/`를 다른 CLI에서도 사용:
```bash
# Gemini: .gemini/skills/ -> .claude/skills/ 심링크
# Codex: .agents/skills/ -> .claude/skills/ 심링크
```

모든 스킬의 SKILL.md는 3 CLI에서 호환되는 형식 (YAML frontmatter + Markdown)

#### F-5: Gemini Hook 핸들러 (4개)

| 핸들러 | 이벤트 | 역할 |
|--------|--------|------|
| `gemini-session-start.js` | SessionStart | NEXUS 초기화 + HookServer 브릿지 |
| `gemini-session-end.js` | SessionEnd | NEXUS 학습 + 상태 저장 |
| `gemini-before-tool.js` | BeforeTool | 도구 추적 + ATOS 연동 |
| `gemini-after-tool.js` | AfterTool | 결과 기록 + Dashboard POST |

모든 핸들러는 HookServer(7851) POST로 NEXUS EventBus에 브릿지.

#### F-6: Codex Notify 핸들러 (1개)

| 핸들러 | 이벤트 | 역할 |
|--------|--------|------|
| `codex-notify.js` | agent-turn-complete | NEXUS 기록 + HookServer 브릿지 |

Codex는 1개 이벤트만 지원하므로 최대한 활용.

#### F-7: Config Sync 엔진

`nexus/sync/config-sync.js`:
- `.claude.json`의 MCP 서버 목록 -> `.gemini/settings.json` + `.codex/config.toml` 자동 변환
- CLI 명령어: `nexus sync configs`
- 핵심 MCP만 선별 (Docker 의존 서버 제외)
- ENV 변수 매핑 (ANTHROPIC_API_KEY -> GEMINI_API_KEY/OPENAI_API_KEY)

#### F-8: launcher 강화

**gemini.bat 업데이트**:
- `GEMINI_CLI_HOME=K:\PortableApps\genai` 설정
- NEXUS ENV 변수 추가

**codex.bat 업데이트**:
- `CODEX_HOME=K:\PortableApps\genai` 확인
- NEXUS ENV 변수 추가

### 파일 인벤토리

| # | 파일 | 유형 | 역할 |
|---|------|------|------|
| 1 | `AGENTS.md` | 수정 | 공통 지침 강화 |
| 2 | `GEMINI.md` | 수정 | Gemini 역할 재생성 |
| 3 | `CODEX.md` | 새 파일 | Codex 역할 정의 |
| 4 | `.gemini/settings.json` | 새 파일 | MCP + Hooks + 스킬 |
| 5 | `.codex/config.toml` | 새 파일 | MCP + 에이전트 + 스킬 |
| 6 | `nexus/hooks/gemini-session-start.js` | 새 파일 | Gemini SessionStart |
| 7 | `nexus/hooks/gemini-session-end.js` | 새 파일 | Gemini SessionEnd |
| 8 | `nexus/hooks/gemini-before-tool.js` | 새 파일 | Gemini BeforeTool |
| 9 | `nexus/hooks/gemini-after-tool.js` | 새 파일 | Gemini AfterTool |
| 10 | `nexus/hooks/codex-notify.js` | 새 파일 | Codex notify |
| 11 | `nexus/sync/config-sync.js` | 새 파일 | 설정 동기화 엔진 |
| 12 | `gemini.bat` | 수정 | ENV 추가 |
| 13 | `codex.bat` | 수정 | ENV 확인/추가 |
| 14 | `.gemini/skills/` | 심링크 | -> .claude/skills/ |
| 15 | `.agents/skills/` | 심링크 | -> .claude/skills/ |

**새 파일: ~11개, 수정: 4개, 심링크: 2개**

### Codex Hooks 제약 사항

Codex CLI는 `notify` 1개 이벤트만 지원 (PR #9796 거절됨).
따라서 Claude Code / Gemini CLI 수준의 hook 통합은 **불가능**.
대안:
- `notify` handler에서 최대한 정보 추출
- `AGENTS.md` 지침으로 행동 유도
- NEXUS CLI를 통한 수동 연동 (`nexus codex sync`)

### 설계 원칙

1. **Single Source of Truth**: AGENTS.md + NEXUS config가 3 CLI 공통 기반
2. **설정 자동 동기화**: `.claude.json` 변경 -> 다른 CLI 설정 자동 반영
3. **Graceful Degradation**: CLI별 미지원 기능은 조용히 스킵
4. **스킬 공유**: 심링크로 중복 없이 3 CLI 공유
5. **Codex 한계 인정**: hooks 1개 제약은 우회 불가, 지침으로 보완
6. **포터블**: 모든 경로 K드라이브 기준

### 검증

1. `gemini` 실행 -> GEMINI.md + AGENTS.md 로드 확인
2. `codex` 실행 -> AGENTS.md 로드 확인
3. Gemini hooks -> NEXUS HookServer(7851) 이벤트 도달
4. MCP 서버 -> 3 CLI 모두 동일 서버 접근
5. `nexus sync configs` -> 설정 파일 자동 생성
6. E2E -> multi-cli parity 체크 추가

---

---

## Phase 14 (G): Factory Floor - 통합 동적 시각화 -- [*] 계획 중

### Context

현재 NEXUS Monitor(포트 7850)의 "Agent Office" 뷰는 4개 에이전트가 **고정 위치**에서 idle/working/thinking 3개 상태만 표시.
pixel-agents 프로젝트(github.com/pablodelucca/pixel-agents) 분석 + 유사 프로젝트 8개 조사 완료.

**목표**: 기존 Agent Office 전체 기능 + pixel-agents 전체 기능 + Factory Floor 컨셉을 **하나의 뷰**로 통합.

### 통합 범위 (3계층 머지)

| 소스 | 포함 기능 |
|------|----------|
| **Agent Office (현재)** | 4 에이전트 스프라이트, SSE 이벤트 핸들링, 팀/그래프 이벤트, 상태 라벨, 태스크 말풍선, 작업 인디케이터 |
| **pixel-agents** | BFS pathfinding, 상태 머신 (idle/walk/type/read/think), 자연스러운 이동 애니메이션, 가구/오브젝트 상호작용, 말풍선 대화 |
| **Factory Floor** | 컨베이어 벨트, 태스크 박스(제품), 입력 호퍼, 출력 빈, 워크스테이션, QC 검사대, 경고등, 게이지, 이젝트 존 |

### 아키텍처

```
Factory Floor (Canvas 1400x700)
===========================================

  [HOPPER] -> ===MAIN BELT=== -> [OUTPUT BIN]
                |   |   |   |
              [CL] [GE] [CO] [OL]  <- Worker Stations
               ^    ^    ^    ^
               |    |    |    |
          Agents WALK between stations
          via BFS pathfinding (pixel-agents style)

  [QC STATION]  [WARNING LIGHTS]  [GAUGE]

  Floor: Grid tiles with walkable paths
  Agents: Move freely, go to assigned station when task arrives
  Furniture: Desks, monitors, server racks, coffee machine
```

### 핵심 설계

#### G-1: Factory Sprites (factory-sprites.js)

**새 스프라이트 (16x16 또는 8x8 격자)**:

| 스프라이트 | 크기 | 색상 | 설명 |
|-----------|------|------|------|
| `conveyor-segment` | 16x16 | Gray #4B5563/#6B7280 | 벨트 세그먼트, 롤러 마크 |
| `conveyor-roller` | 16x16 | Gray #374151/#9CA3AF | 롤러 엔드캡 |
| `hopper` | 16x16 | Yellow #92400E/#D97706 | 입력 깔때기 |
| `output-bin` | 16x16 | Green #065F46/#10B981 | 완료 제품 저장소 |
| `task-box` | 8x8 | Dynamic (프로바이더 색) | 태스크 패키지 |
| `task-box-fail` | 8x8 | Red #991B1B/#F87171 | 실패 패키지 (X 마크) |
| `station-desk` | 16x16 | Dark #1F2937/#374151 | 워크스테이션 테이블 |
| `warning-light` | 8x8 | Red/Yellow | 경고 비콘 (2프레임) |
| `qc-stamp` | 8x8 | Green #065F46/#34D399 | QC 체크마크 스탬프 |
| `gauge` | 16x16 | Cyan #164E63/#22D3EE | 처리량 게이지 |
| `monitor-screen` | 16x16 | Blue #1E3A5F/#3B82F6 | 모니터 (가구) |
| `server-rack` | 16x16 | Dark #1F2937/#4B5563 | 서버 랙 (가구) |
| `coffee-machine` | 8x8 | Brown #78350F/#A16207 | 커피 머신 (가구) |
| `hard-hat` | 8x4 | Yellow #D97706 | 에이전트 위 안전모 오버레이 |

**기존 스프라이트 재사용**: sprites.js의 4 에이전트(Claude/Gemini/Codex/Ollama) 그대로 사용.

**애니메이션 프레임**: 기존 1프레임 -> 4프레임 확장
- `idle`: 1프레임 (기존)
- `walk`: 4프레임 (좌발-중립-우발-중립, pixel-agents 스타일)
- `type`: 2프레임 (팔 움직임)
- `read`: 2프레임 (고개 움직임)
- `think`: 2프레임 (말풍선 점)
- `working`: 4프레임 (기존 bob + 회전 점)

#### G-2: Tile Map + Pathfinding (factory-floor.js 내)

**pixel-agents 핵심 기능 통합**:

```javascript
// 타일맵: 0=바닥(이동가능), 1=벽/가구(이동불가), 2=벨트, 3=스테이션
const TILE_SIZE = 16; // 16px per tile
const MAP_W = 87;     // 1400/16 = 87.5 -> 87 tiles
const MAP_H = 43;     // 700/16 = 43.75 -> 43 tiles

// BFS Pathfinding (pixel-agents에서 가져온 알고리즘)
function findPath(startTile, endTile) {
  const queue = [[startTile]];
  const visited = new Set();
  visited.add(tileKey(startTile));

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (current.x === endTile.x && current.y === endTile.y) return path;

    for (const neighbor of getWalkableNeighbors(current)) {
      const key = tileKey(neighbor);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push([...path, neighbor]);
      }
    }
  }
  return null; // no path
}
```

**에이전트 이동**: 태스크 할당 시 에이전트가 BFS 경로를 따라 해당 스테이션으로 걸어감.
- 유휴 시: 공장 내 랜덤 위치로 배회 (커피 머신, 다른 스테이션 방문)
- 태스크 수신 시: 할당된 스테이션으로 이동 -> type/working 애니메이션
- 태스크 완료 시: 잠시 대기 -> 유휴 배회 재개
- 팀 태스크 시: 2+ 에이전트가 같은 위치로 모여서 talk 애니메이션

#### G-3: 에이전트 상태 머신 (pixel-agents 완전 이식)

```
          ┌─────────────────────────────────┐
          │                                 │
          v                                 │
    ┌──────────┐   task:routed    ┌─────────+───┐
    │   IDLE   │ ──────────────> │   WALKING    │
    │ (배회/대기) │               │ (스테이션으로) │
    └─────+────┘                 └──────+───────┘
          │                             │
          │ random timer                │ arrives
          v                             v
    ┌──────────┐                 ┌──────────────┐
    │ WANDERING│                 │   TYPING     │
    │ (walk)   │                 │ (작업 중)     │
    └──────────┘                 └──────+───────┘
                                       │
                              task:completed
                                       │
                                       v
                                ┌──────────────┐
                                │   READING    │
                                │ (결과 확인)   │
                                └──────+───────┘
                                       │
                                       v
                                ┌──────────────┐
                                │   IDLE       │
                                └──────────────┘

추가 상태:
- THINKING: graph:node 이벤트 시 (말풍선 "...")
- TALKING: team 태스크 시 (다른 에이전트와 대화)
- COFFEE: 유휴 시 랜덤으로 커피 머신 방문
- OFFLINE: provider:health down 시 (빨간색)
```

#### G-4: 컨베이어 벨트 시스템

**레이아웃** (캔버스 1400x700):

```
Y=80    [HOPPER] 입력 깔때기
         |||
Y=110  ===MAIN BELT (수평, 좌->우, 롤러 마크 애니메이션)=== [OUTPUT BIN]
         |           |          |          |
Y=180  [Branch]    [Branch]   [Branch]   [Branch]
         |           |          |          |
Y=250  [CLAUDE]   [GEMINI]   [CODEX]    [OLLAMA]
        Station     Station    Station    Station
        X=180       X=430      X=680     X=930

Y=350  바닥 영역 (에이전트 배회 공간, 가구 배치)
        [커피머신]  [서버랙]   [모니터]

Y=450  ===RETURN BELT=== QC -> Output
Y=500  [QC Station]

Y=550  [WARNING LIGHTS]  [GAUGE]  [REJECT BIN]
```

**벨트 애니메이션**:
- 롤러 마크가 `BELT_SPEED=30px/s`로 스크롤
- 태스크 박스가 벨트 위에서 이동 (waypoint 시스템)
- 에이전트가 벨트 아래 바닥에서 자유롭게 이동

#### G-5: 태스크 박스 상태 머신

```
INTAKE -> ROUTING -> BRANCHING -> PROCESSING -> RETURNING -> QC -> OUTPUT -> DONE
                                       |
                                  task:failed
                                       |
                                  EJECTING -> EJECTED -> DONE
```

| 상태 | 시각 | 지속시간 | 전환 트리거 |
|------|------|---------|-----------|
| `intake` | 호퍼에서 페이드인 | ~0.5s | 자동 |
| `routing` | 메인 벨트 위 이동 | ~1-3s | 분기점 도착 |
| `branching` | 수직 분기 이동 | ~0.5s | 스테이션 도착 |
| `processing` | 스테이션에 정지, 에이전트 작업 | SSE 대기 | task:completed/failed |
| `returning` | 메인 벨트로 복귀 | ~1-2s | QC/출력 도착 |
| `qc` | QC 스테이션 정지, 스탬프 | ~0.3s | 자동 |
| `output` | 출력 빈으로 이동, 축소 페이드 | ~0.5s | 자동 |
| `ejecting` | 빨간색 변환, 대각선 사출 | ~0.8s | 자동 |

#### G-6: 가구/오브젝트 시스템 (pixel-agents 스타일)

```javascript
const FURNITURE = [
  // 워크스테이션 (벨트 아래 각 에이전트 자리)
  { type: 'desk', x: 180, y: 270, w: 2, h: 1, owner: 'claude-code' },
  { type: 'desk', x: 430, y: 270, w: 2, h: 1, owner: 'gemini-cli' },
  { type: 'desk', x: 680, y: 270, w: 2, h: 1, owner: 'codex-cli' },
  { type: 'desk', x: 930, y: 270, w: 2, h: 1, owner: 'ollama-cpu' },

  // 공용 가구 (에이전트가 유휴 시 방문)
  { type: 'coffee-machine', x: 100, y: 380, w: 1, h: 1, interactable: true },
  { type: 'server-rack', x: 600, y: 380, w: 2, h: 2, interactable: false },
  { type: 'monitor-screen', x: 1100, y: 380, w: 1, h: 1, interactable: true },
];
```

에이전트가 가구에 도착하면:
- `coffee-machine`: 잠시 멈추고 "sip" 애니메이션
- `monitor-screen`: read 상태로 화면 보기
- `desk`: type 상태로 작업

#### G-7: 말풍선 시스템 (pixel-agents 이식)

```javascript
function drawSpeechBubble(ctx, agent, text, time) {
  if (!text) return;

  const bubbleW = Math.min(text.length * 7 + 16, 160);
  const bubbleH = 24;
  const bx = agent.x + 32 - bubbleW / 2;
  const by = agent.y - bubbleH - 12;

  // 배경
  ctx.fillStyle = '#f0f0f0';
  roundRect(ctx, bx, by, bubbleW, bubbleH, 4);
  ctx.fill();

  // 꼬리 삼각형
  ctx.beginPath();
  ctx.moveTo(agent.x + 28, by + bubbleH);
  ctx.lineTo(agent.x + 32, by + bubbleH + 6);
  ctx.lineTo(agent.x + 36, by + bubbleH);
  ctx.fill();

  // 텍스트
  ctx.fillStyle = '#1a1a1a';
  ctx.font = '10px Consolas, monospace';
  ctx.textAlign = 'center';
  const label = text.length > 20 ? text.slice(0, 20) + '..' : text;
  ctx.fillText(label, bx + bubbleW / 2, by + 16);
}
```

**말풍선 트리거**:
- `task:routed`: "On it!" / 태스크 설명
- `task:completed`: "Done!" / 소요시간
- `task:failed`: "Error!" / 오류 메시지
- `team:started`: "Let's collaborate!"
- 유휴 배회 시: 랜덤 (가끔) "..."  "Hmm..."  "Checking logs..."

#### G-8: SSE 이벤트 -> Factory 통합 매핑

| SSE 이벤트 | 벨트 액션 | 에이전트 액션 |
|-----------|----------|-------------|
| `task:received` | 호퍼에 박스 생성 | - |
| `task:routed` | 박스 -> 메인벨트 -> 분기 | 에이전트가 스테이션으로 walk |
| `task:completed` | 박스 -> 리턴벨트 -> QC -> 출력 | 에이전트 "Done!" 말풍선, idle |
| `task:failed` | 박스 빨강 -> 이젝트 | 에이전트 "Error!" 말풍선, 경고등 점등 |
| `team:started` | 여러 박스 생성 | 에이전트들 한 곳으로 모여서 talk |
| `team:completed` | 모든 팀 박스 출력 | 에이전트들 흩어지며 idle |
| `graph:node:start` | - | Claude 에이전트 think 상태 |
| `graph:node:end` | - | Claude 에이전트 idle 복귀 |
| `provider:health(down)` | 해당 스테이션 경고등 | 에이전트 offline (빨간 색조) |
| `subagent:spawned` | 미니 박스 생성 | 부모 스테이션에 작은 에이전트 표시 |
| `evolution:weight` | 게이지 업데이트 | - |
| `hitl:request` | QC 스테이션 점멸 | - |

#### G-9: Stats Panel (DOM + Canvas 하이브리드)

**Canvas 내부** (좌하단):
- 게이지 (처리량 바늘)
- 경고등 (에러 시 점멸)

**DOM Panel** (캔버스 아래):
```html
<div id="factory-stats-panel">
  Active: 2 | Completed: 15 | Failed: 1 | Tasks/min: 3.2 | Avg: 2.1s | Cost: $0.045
</div>
```

### 파일 인벤토리

| # | 파일 | 유형 | 크기(예상) | 역할 |
|---|------|------|----------|------|
| 1 | `nexus/monitor/public/assets/factory-sprites.js` | 새 파일 | ~400줄 | 모든 공장 스프라이트 + 에이전트 워크 프레임 |
| 2 | `nexus/monitor/public/js/factory-floor.js` | 새 파일 | ~800줄 | 메인 렌더러, 타일맵, BFS, 상태머신, 이벤트 핸들러 |
| 3 | `nexus/monitor/public/index.html` | 수정 | +15줄 | Factory Floor 탭 + canvas + script 태그 |
| 4 | `nexus/monitor/public/css/style.css` | 수정 | +30줄 | factory-canvas, stats-panel CSS |
| 5 | `nexus/scripts/e2e-scenario.js` | 수정 | +10줄 | Factory Floor 로드 체크 |

**새 파일: 2개, 수정: 3개**

### 구현 순서

| Step | 내용 | 의존 |
|------|------|------|
| 1 | `factory-sprites.js` - 모든 스프라이트 데이터 + 워크 프레임 | 없음 |
| 2 | `factory-floor.js` - 레이아웃 상수, 타일맵, 배경 렌더 | Step 1 |
| 3 | 컨베이어 벨트 렌더링 + 롤러 애니메이션 | Step 2 |
| 4 | 호퍼, 출력빈, 스테이션, QC 렌더링 | Step 3 |
| 5 | BFS pathfinding + 에이전트 이동 시스템 | Step 4 |
| 6 | 에이전트 상태 머신 (7상태) + 워크 애니메이션 | Step 5 |
| 7 | 가구/오브젝트 배치 + 상호작용 | Step 6 |
| 8 | 태스크 박스 상태 머신 + 렌더링 | Step 5 |
| 9 | SSE 이벤트 핸들러 (전체 매핑) | Step 6, 8 |
| 10 | 말풍선 시스템 | Step 9 |
| 11 | 경고등, 게이지, Stats 패널 | Step 9 |
| 12 | `index.html` + `style.css` 수정 | Step 1, 2 |
| 13 | E2E 테스트 체크 추가 | 전체 |

### 설계 원칙

1. **Agent Office 대체 아님**: 새 탭으로 추가 (기존 Agent Office 유지)
2. **pixel-agents 완전 이식**: BFS, 상태머신, 가구, 말풍선 모두 포함
3. **바닐라 JS 유지**: 프레임워크 0, Canvas 2D만
4. **기존 SSE 활용**: 서버 수정 없음, 클라이언트만 추가
5. **성능**: 동시 태스크 20개 제한, requestAnimationFrame 기반

### 검증

1. 브라우저에서 Factory Floor 탭 클릭 -> 캔버스 렌더링
2. SSE 이벤트 수신 시 -> 벨트 위 박스 이동 + 에이전트 걸어감
3. 팀 태스크 시 -> 에이전트 모여서 대화
4. 에러 시 -> 빨간 박스 사출 + 경고등
5. 유휴 시 -> 에이전트 배회 (커피, 모니터)
6. E2E 테스트 통과

---

## Phase 번호 매핑 (전체)

| Phase | 내용 | 상태 |
|-------|------|------|
| 0-7 | 14 Port, 7-Layer, E2E 12/12 | [+] 완료 |
| 8 (A) | LangGraph 1.0 실전 통합 | [+] 완료 |
| 9 (B) | Deep Agent + Claude 전체 기능 | [+] 완료 |
| 10 (C) | 실시간 모니터링 시각화 | [+] 완료 |
| 11 (D) | 통합 검증 + 영속화 (18/18) | [+] 완료 |
| 12 (E) | NEXUS x Obsidian 통합 | [+] 완료 |
| 13 (F) | Multi-CLI Parity (Codex/Gemini 동등화) | [+] 완료 |
| **14 (G)** | **Factory Floor - 통합 동적 시각화** | **[*] 계획 중** |
