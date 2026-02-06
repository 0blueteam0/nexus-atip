# Plan Ecosystem Dashboard v3.0 - 완전 고도화

> **플랜 ID**: breezy-frolicking-finch
> **생성일**: 2026-02-04
> **버전**: 3.0.0
> **목적**: Plan Ecosystem Dashboard 완전 고도화 (v2.0 + v3.0 신규 기능)

---

## 작업 완료 상태 (Phase 1-11: v2.0 완료)

| Phase | 상태 | 설명 |
|-------|------|------|
| Phase 1-3 | [x] 완료 | MVP + 실시간 + UI 기본 |
| Phase 4-8 | [x] 완료 | 프롬프트/도구/에이전트/스킬/작업 추적 |
| Phase 9-11 | [x] 완료 | 시스템 그래프/타임라인/비용 |

---

## v3.0 신규 Phase (12-20) - ALL COMPLETED

| Phase | 상태 | 설명 | 우선순위 |
|-------|------|------|----------|
| Phase 12 | [x] 완료 | Hook 자동 연동 (3개 Hook 추가) | P1 |
| Phase 13 | [x] 완료 | 알림 시스템 (alert-manager.js) | P1 |
| Phase 14 | [x] 완료 | 세션 리플레이 (session-recorder.js) | P1 |
| Phase 15 | [x] 완료 | D3.js 인터랙티브 그래프 | P2 |
| Phase 16 | [x] 완료 | 통합 검색 (/api/search) | P2 |
| Phase 17 | [x] 완료 | 데이터 내보내기 (CSV/JSON) | P2 |
| Phase 18 | [x] 완료 | 다크/라이트 테마 (CSS Variables) | P3 |
| Phase 19 | [x] 완료 | 모바일 반응형 (Media Queries) | P3 |
| Phase 20 | [x] 완료 | 플러그인 시스템 (plugins/) | P3 |

### 완료일: 2026-02-04

### 기술 스택 평가 결과 (2026-02-04)
**결정: 현재 스택 유지 (Rails/React 불필요)**

| 현재 스택 | 규모 | 평가 |
|----------|------|------|
| Node.js + Express | ~400 LOC | 적정 |
| Vanilla JS | ~1100 LOC | 관리 가능 |
| HTML + Tailwind | ~300 LOC | 적정 |
| 8개 Collectors | ~1000 LOC | 모듈화됨 |

- 전체 ~2,100 LOC로 풀스택 프레임워크 전환 불필요
- K드라이브 포터블 환경에 최적화
- 빌드 과정 없이 Docker로 즉시 배포

---

## 고도화 목표 (v2.0)

### 핵심 비전
**"AI 에이전트 작업의 완전한 가시성과 추적성 확보"**

단순 플랜 대시보드에서 → **AI Agent Observability Platform**으로 진화

### 추가 기능 요약

| # | 기능 | 설명 | 우선순위 |
|---|------|------|----------|
| 1 | 프롬프트 로깅 | 사용자 프롬프트 기록/보관/검색 | P0 |
| 2 | MCP 도구 추적 | 도구 사용 현황, 성공률, 체이닝 | P0 |
| 3 | 에이전트 추적 | Task/Explore 에이전트 실행 기록 | P0 |
| 4 | 스킬 사용 기록 | 활성화된 스킬 로깅 | P1 |
| 5 | 계층적 작업 관리 | Shrimp + Task Master AI 통합 | P1 |
| 6 | 시스템 연결성 | 의존성 그래프 시각화 | P2 |
| 7 | 실행 타임라인 | 세션별 실행 흐름 시각화 | P1 |
| 8 | 비용 추적 | 토큰 사용량/비용 모니터링 | P2 |

---

## Phase 4: 프롬프트 로깅 시스템

### 4.1 Prompt Logger 모듈

**파일**: `dashboard/plan-ecosystem/collectors/prompt-collector.js`

**기능**:
- 세션별 프롬프트 저장
- 타임스탬프, 컨텍스트 포함
- 검색/필터 지원

**데이터 구조**:
```json
{
  "sessionId": "session-xxx",
  "timestamp": "2026-02-04T07:30:00Z",
  "prompt": "사용자 프롬프트 내용",
  "context": {
    "activePlan": "breezy-frolicking-finch",
    "currentTask": "task-001"
  },
  "response": {
    "toolsUsed": ["Read", "Write"],
    "agentsSpawned": ["Explore"],
    "duration": 15000
  }
}
```

**저장 위치**: `planning-log/prompts/YYYY-MM-DD.json`

### 4.2 Hook 통합

**수정 파일**: `.claude-hooks.json`

```json
"prompt-logger": {
  "enabled": true,
  "command": "node planning-system/prompt-logger.js",
  "triggers": ["user-input"],
  "priority": "high"
}
```

---

## Phase 5: MCP 도구 추적 시스템

### 5.1 Tool Tracing Collector

**파일**: `dashboard/plan-ecosystem/collectors/tool-collector.js`

**기능**:
- ATOS execution-monitor.js 연동
- 도구별 사용 횟수, 성공률
- 체이닝 패턴 분석
- 실시간 통계

**연동 파일**:
- `atos/usage-stats.json` - 도구 사용 통계
- `atos/execution-monitor.js` - 실행 추적

**데이터 구조**:
```json
{
  "tools": {
    "mcp__desktop-commander__write_file": {
      "totalCalls": 150,
      "successRate": 0.95,
      "avgResponseTime": 120,
      "lastUsed": "2026-02-04T07:30:00Z",
      "chainedWith": ["Read", "Edit"]
    }
  },
  "sessionStats": {
    "totalToolCalls": 500,
    "uniqueTools": 25,
    "mostUsed": "Read"
  }
}
```

### 5.2 Tool Usage Dashboard UI

**위치**: `public/index.html` 새 섹션

**표시 항목**:
- 도구 사용 빈도 차트 (Bar Chart)
- 성공/실패 비율 (Donut Chart)
- 최근 도구 호출 목록
- 도구 체이닝 플로우

---

## Phase 6: 에이전트/서브에이전트 추적

### 6.1 Agent Activity Tracker

**파일**: `dashboard/plan-ecosystem/collectors/agent-collector.js`

**추적 대상**:
| 에이전트 유형 | 설명 |
|--------------|------|
| `Explore` | 코드베이스 탐색 |
| `Plan` | 구현 계획 설계 |
| `Bash` | 명령어 실행 |
| `general-purpose` | 범용 작업 |

**데이터 구조**:
```json
{
  "agentId": "a5feb8c",
  "type": "Explore",
  "prompt": "Dashboard 현재 구조 탐색",
  "startTime": "2026-02-04T07:30:00Z",
  "endTime": "2026-02-04T07:31:20Z",
  "status": "completed",
  "toolsUsed": 6,
  "parentSession": "session-xxx",
  "result": "truncated..."
}
```

### 6.2 Agent Timeline View

**UI 요소**:
- 세션 타임라인 (Gantt-style)
- 에이전트 spawn/complete 이벤트
- 병렬 실행 시각화

---

## Phase 7: 스킬 사용 추적

### 7.1 Skill Tracker

**연동 파일**: `atos/usage-stats.json` (skills 섹션)

**추적 항목**:
- 스킬 활성화 횟수
- 트리거 키워드
- 성공률
- 마지막 사용 시간

**현재 등록된 스킬**:
- `academic-paper-verifier`
- `update-optimizer`
- `pdf-vision`
- `project-init`
- `bmad-agents`

---

## Phase 8: 계층적 작업 관리 통합

### 8.1 Multi-Source Task Aggregator

**통합 대상**:
| 시스템 | MCP 도구 | 데이터 위치 |
|--------|----------|-------------|
| Shrimp Task Manager | `mcp__shrimp-task__*` | `ShrimpData/tasks/` |
| Task Master AI | `mcp__task-master-ai__*` | `data/tasks.json` |
| Unified Task System | (local) | `unified-task-system/` |
| Claude Code Tasks | `TaskCreate/Update` | (memory) |

### 8.2 Task Hierarchy Viewer

**UI 요소**:
- 트리 뷰 (부모-자식 관계)
- 상태별 필터 (pending, in-progress, completed)
- 의존성 표시
- 진행률 바

**데이터 통합**:
```javascript
// shrimp-adapter.js 확장
async function aggregateTasks() {
  const shrimpTasks = loadShrimpTasks();
  const taskMasterTasks = await mcp__task-master-ai__get_tasks();
  const unifiedTasks = loadUnifiedTasks();

  return mergeAndDeduplicate(shrimpTasks, taskMasterTasks, unifiedTasks);
}
```

---

## Phase 9: 시스템 연결성 시각화

### 9.1 System Dependency Graph

**파일**: `dashboard/plan-ecosystem/collectors/system-graph.js`

**시각화 대상**:
```
Plans ──┬── Planning Log
        ├── Shrimp Tasks
        └── Unified Tasks

ATOS ───┬── Execution Monitor
        ├── Recommendation Engine
        └── Feedback Loop

Dashboard ─── WebSocket ─── Collectors
```

### 9.2 Interactive Graph UI

**라이브러리**: D3.js 또는 Mermaid.js

**기능**:
- 클릭 시 상세 정보
- 실시간 데이터 플로우 애니메이션
- 노드별 상태 표시 (active/inactive)

---

## Phase 10: 실행 타임라인

### 10.1 Session Timeline Collector

**데이터 소스**:
- `unified-task-system/session-state.json`
- `atos/logs/` (세션 로그)
- `planning-log/daily/` (일일 로그)

### 10.2 Timeline UI

**표시 항목**:
- 세션 시작/종료
- 도구 호출 이벤트
- 에이전트 spawn 이벤트
- 플랜 상태 변경
- 에러/경고

---

## Phase 11: 비용 추적 (선택적)

### 11.1 Cost Tracker

**추적 항목**:
- 입력 토큰 수
- 출력 토큰 수
- 세션별 비용 (USD)
- 일/주/월별 통계

**데이터 소스**: Claude Code statusline (`{cost}` 변수)

---

## 남은 구현 계획 (Phase 9, 11)

### Phase 9: 시스템 연결성 시각화
**파일**: `collectors/system-graph.js`

```javascript
// 시스템 노드 정의
const SYSTEM_NODES = {
  'Plans': { type: 'data', connections: ['Planning Log', 'Dashboard'] },
  'ATOS': { type: 'service', connections: ['Tools', 'Recommendations'] },
  'Dashboard': { type: 'ui', connections: ['WebSocket', 'API'] },
  // ...
};
```

**UI**: Mermaid.js 또는 D3.js force-directed graph
**API**: `GET /api/system-graph`

### Phase 11: 비용 추적
**파일**: `collectors/cost-collector.js`

**데이터 수집**:
1. Claude Code statusline에서 `{cost}` 변수 파싱
2. 세션별 토큰 사용량 기록
3. 일/주/월별 집계

**UI 요소**:
- 세션 비용 카드
- 일별 비용 차트
- 토큰 사용량 그래프

---

## 핵심 파일 목록

### 생성 예정
| 파일 | 용도 |
|------|------|
| `collectors/prompt-collector.js` | 프롬프트 수집 |
| `collectors/tool-collector.js` | 도구 사용 수집 |
| `collectors/agent-collector.js` | 에이전트 추적 |
| `collectors/system-graph.js` | 시스템 연결성 |
| `planning-system/prompt-logger.js` | 프롬프트 로깅 Hook |
| `public/js/timeline.js` | 타임라인 UI |
| `public/js/graph.js` | 그래프 UI |

### 수정 예정
| 파일 | 변경 내용 |
|------|----------|
| `server.js` | 새 API 엔드포인트 추가 |
| `public/index.html` | 새 UI 섹션 추가 |
| `.claude-hooks.json` | 새 Hook 추가 |
| `docker-compose.yml` | 볼륨 마운트 추가 |

---

## 새 API 엔드포인트

```
GET  /api/prompts          - 프롬프트 기록
GET  /api/tools            - 도구 사용 통계
GET  /api/tools/timeline   - 도구 호출 타임라인
GET  /api/agents           - 에이전트 실행 기록
GET  /api/skills           - 스킬 사용 통계
GET  /api/system-graph     - 시스템 연결 그래프
GET  /api/timeline         - 통합 타임라인
GET  /api/costs            - 비용 통계
```

---

## 검증 계획

### 기능 테스트
1. 프롬프트 로깅 → 실제 프롬프트 입력 후 저장 확인
2. 도구 추적 → 도구 호출 후 통계 업데이트 확인
3. 에이전트 추적 → Task 에이전트 spawn 후 기록 확인
4. UI 테스트 → 브라우저에서 새 섹션 표시 확인

### 통합 테스트
1. 전체 세션 흐름 테스트
2. 실시간 WebSocket 업데이트 확인
3. Docker 컨테이너 재시작 후 데이터 유지 확인

---

## 스킬화 제안

### `/dashboard` 스킬
**트리거**: "대시보드", "dashboard", "모니터링"

**기능**:
- 대시보드 상태 확인
- 빠른 통계 요약
- 특정 기간 리포트 생성

---

## 연결 시스템 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    Plan Ecosystem Dashboard v2.0            │
│                         (Docker: 7847)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Prompts  │  │  Tools   │  │ Agents   │  │  Tasks   │    │
│  │ Collector│  │ Collector│  │ Collector│  │ Collector│    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
├───────┼─────────────┼─────────────┼─────────────┼───────────┤
│       ▼             ▼             ▼             ▼           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Express Server                      │   │
│  │  REST API + WebSocket (Socket.io)                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ planning-log │ │   ATOS   │ │  Plans   │ │ ShrimpData   │
│   /prompts   │ │  stats   │ │  folder  │ │   /tasks     │
└──────────────┘ └──────────┘ └──────────┘ └──────────────┘
```

---

## 사용자 선택 (2026-02-04)

| 항목 | 선택 |
|------|------|
| **구현 순서** | P0 전체 (프롬프트+도구+에이전트 동시 진행) |
| **데이터 저장** | 하이브리드 (JSON 실시간 + SQLite 장기 보관) |
| **작업 통합** | 양방향 동기화 (대시보드에서 상태 변경 가능) |

---

## 구현 전략 (P0 Phase 병렬 진행)

### 에이전트 활용 전략

| 작업 | 에이전트 | 역할 |
|------|----------|------|
| 코드베이스 탐색 | `Explore` | 기존 collector 패턴, ATOS 구조 분석 |
| 설계 검토 | `Plan` | 구현 계획 최적화 |
| 코드 생성 | `general-purpose` | 새 collector 모듈 생성 |
| 테스트 | `Bash` | 빌드/테스트 실행 |

### 하이브리드 저장 구조

```
planning-log/
├── prompts/
│   ├── 2026-02-04.json      # 실시간 JSON (당일)
│   └── prompts.db           # SQLite 장기 보관
├── tools/
│   ├── today.json           # 실시간 도구 통계
│   └── tools.db             # SQLite 히스토리
└── agents/
    ├── sessions.json        # 실시간 에이전트 기록
    └── agents.db            # SQLite 히스토리
```

### 양방향 동기화 API

```
POST /api/tasks/:id/status     - 작업 상태 변경
POST /api/tasks/sync           - Shrimp + Task Master 동기화 트리거
WebSocket event: task-updated  - 실시간 상태 푸시
```

---

## 다음 단계 (병렬 구현)

### Step 1: 코드베이스 탐색 (Explore 에이전트)
- 기존 collector 패턴 분석 (plan-collector.js, log-collector.js)
- ATOS execution-monitor.js 구조 파악
- kiro-memory SQLite 스키마 확인

### Step 2: 새 Collector 모듈 생성
- `prompt-collector.js` (Phase 4)
- `tool-collector.js` (Phase 5)
- `agent-collector.js` (Phase 6)

### Step 3: 서버 API 확장
- 새 엔드포인트 8개 추가
- WebSocket 이벤트 확장

### Step 4: UI 확장
- 탭 기반 네비게이션 추가
- 각 추적 섹션 UI 구현

### Step 5: Docker 볼륨 업데이트
- 새 데이터 폴더 마운트 추가

### Step 6: 테스트 및 검증
- 단위 테스트
- 통합 테스트
- Docker 재시작 테스트

---

# v3.0 신규 기능 상세 명세 (Phase 12-20)

---

## Phase 12: Hook 자동 연동 (P1)

### 12.1 목표
Claude Code Hook 시스템과 대시보드 자동 연동

### 12.2 구현 내용

**수정 파일**: `.claude-hooks.json`

```json
{
  "dashboard-prompt-track": {
    "enabled": true,
    "command": "curl -X POST http://localhost:7847/api/hooks/prompt -H 'Content-Type: application/json' -d '{\"prompt\": \"$PROMPT\", \"sessionId\": \"$SESSION_ID\"}'",
    "triggers": ["user-input"],
    "priority": "low"
  },
  "dashboard-cost-track": {
    "enabled": true,
    "command": "curl -X POST http://localhost:7847/api/hooks/cost -H 'Content-Type: application/json' -d '{\"inputTokens\": $INPUT_TOKENS, \"outputTokens\": $OUTPUT_TOKENS}'",
    "triggers": ["after-response"],
    "priority": "low"
  }
}
```

**새 API 엔드포인트**:
```
POST /api/hooks/prompt    - 프롬프트 자동 기록
POST /api/hooks/cost      - 비용 자동 기록
POST /api/hooks/tool      - 도구 사용 자동 기록
POST /api/hooks/agent     - 에이전트 spawn 자동 기록
```

### 12.3 파일 목록
| 파일 | 변경 |
|------|------|
| `server.js` | Hook API 엔드포인트 4개 추가 |
| `.claude-hooks.json` | 대시보드 연동 Hook 4개 추가 |

---

## Phase 13: 알림 시스템 (P1)

### 13.1 목표
비용 임계값, 장기 실행 에이전트 등 실시간 알림

### 13.2 구현 내용

**새 파일**: `collectors/alert-manager.js`

```javascript
const ALERT_RULES = {
  costThreshold: {
    type: 'cost',
    condition: (cost) => cost > 5.00,  // $5 초과
    message: '일일 비용 $5 초과',
    severity: 'warning'
  },
  longRunningAgent: {
    type: 'agent',
    condition: (duration) => duration > 300000,  // 5분 초과
    message: '에이전트 실행 5분 초과',
    severity: 'info'
  },
  highTokenUsage: {
    type: 'tokens',
    condition: (tokens) => tokens > 100000,  // 10만 토큰
    message: '세션 토큰 10만 초과',
    severity: 'warning'
  }
};
```

**WebSocket 이벤트**:
```javascript
socket.emit('alert', {
  type: 'cost_threshold',
  message: '일일 비용 $5 초과',
  severity: 'warning',
  timestamp: new Date().toISOString()
});
```

**UI 요소**:
- 우측 상단 알림 벨 아이콘
- 알림 드롭다운 목록
- 알림 설정 페이지 (임계값 조정)

### 13.3 파일 목록
| 파일 | 변경 |
|------|------|
| `collectors/alert-manager.js` | 신규 생성 |
| `server.js` | 알림 WebSocket 이벤트 추가 |
| `public/index.html` | 알림 UI 추가 |
| `public/js/app.js` | 알림 핸들러 추가 |

---

## Phase 14: 세션 리플레이 (P1)

### 14.1 목표
전체 세션 흐름 시각적 리플레이

### 14.2 구현 내용

**새 파일**: `collectors/session-recorder.js`

```javascript
// 세션 이벤트 타입
const EVENT_TYPES = {
  PROMPT: 'prompt',
  TOOL_CALL: 'tool_call',
  AGENT_SPAWN: 'agent_spawn',
  AGENT_COMPLETE: 'agent_complete',
  RESPONSE: 'response',
  ERROR: 'error'
};

// 이벤트 기록 구조
{
  sessionId: 'session-xxx',
  events: [
    { type: 'prompt', timestamp: '...', data: {...} },
    { type: 'tool_call', timestamp: '...', data: {...} },
    // ...
  ]
}
```

**API 엔드포인트**:
```
GET /api/sessions                    - 세션 목록
GET /api/sessions/:id                - 세션 상세
GET /api/sessions/:id/events         - 세션 이벤트 목록
GET /api/sessions/:id/replay         - 리플레이 데이터
```

**UI 요소**:
- 세션 선택 드롭다운
- 타임라인 슬라이더 (재생 위치 조절)
- 재생/일시정지/속도 조절 버튼
- 이벤트별 상세 패널

### 14.3 파일 목록
| 파일 | 변경 |
|------|------|
| `collectors/session-recorder.js` | 신규 생성 |
| `server.js` | 세션 API 4개 추가 |
| `public/index.html` | 리플레이 UI 추가 |
| `public/js/app.js` | 리플레이 로직 추가 |

---

## Phase 15: D3.js 인터랙티브 그래프 (P2)

### 15.1 목표
Force-directed 그래프로 시스템 연결성 시각화 고도화

### 15.2 구현 내용

**라이브러리**: D3.js v7 (CDN)

**기능**:
- 드래그 앤 드롭 노드 이동
- 마우스 휠 줌/팬
- 노드 클릭 시 상세 정보 사이드 패널
- 연결선 하이라이트
- 노드 필터링 (카테고리별)
- 실시간 데이터 플로우 애니메이션

**새 파일**: `public/js/d3-graph.js`

```javascript
const simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(links).id(d => d.id))
  .force('charge', d3.forceManyBody().strength(-300))
  .force('center', d3.forceCenter(width / 2, height / 2));
```

### 15.3 파일 목록
| 파일 | 변경 |
|------|------|
| `public/js/d3-graph.js` | 신규 생성 |
| `public/index.html` | D3.js CDN + 그래프 컨테이너 |
| `public/js/app.js` | 그래프 초기화 연동 |

---

## Phase 16: 통합 검색 (P2)

### 16.1 목표
모든 탭(플랜, 도구, 에이전트, 프롬프트 등) 통합 검색

### 16.2 구현 내용

**API 엔드포인트**:
```
GET /api/search?q=keyword&type=all|plans|tools|agents|prompts
```

**검색 대상**:
| 대상 | 검색 필드 |
|------|----------|
| Plans | name, tasks, description |
| Tools | name, server, category |
| Agents | type, prompt, status |
| Prompts | content, context |
| Costs | sessionId, model |

**UI 요소**:
- 상단 네비게이션에 검색창
- 검색 결과 드롭다운 (타입별 그룹핑)
- 결과 클릭 시 해당 탭으로 이동 + 하이라이트

### 16.3 파일 목록
| 파일 | 변경 |
|------|------|
| `server.js` | 통합 검색 API 추가 |
| `public/index.html` | 검색창 UI 추가 |
| `public/js/app.js` | 검색 로직 + 하이라이트 |

---

## Phase 17: 데이터 내보내기 (P2)

### 17.1 목표
CSV, JSON 형식 데이터 다운로드

### 17.2 구현 내용

**API 엔드포인트**:
```
GET /api/export/plans?format=csv|json
GET /api/export/tools?format=csv|json&period=7d|30d
GET /api/export/costs?format=csv|json&period=7d|30d
GET /api/export/sessions?format=csv|json
```

**UI 요소**:
- 각 탭에 "Export" 버튼
- 형식 선택 (CSV/JSON)
- 기간 선택 (7일/30일/전체)

### 17.3 파일 목록
| 파일 | 변경 |
|------|------|
| `server.js` | Export API 4개 추가 |
| `public/index.html` | Export 버튼 UI |
| `public/js/app.js` | 다운로드 트리거 로직 |

---

## Phase 18: 다크/라이트 테마 (P3)

### 18.1 목표
사용자 선호 테마 지원

### 18.2 구현 내용

**CSS 변수**:
```css
:root {
  --bg-primary: #0f172a;    /* 다크 */
  --text-primary: #f8fafc;
}

[data-theme="light"] {
  --bg-primary: #ffffff;
  --text-primary: #1e293b;
}
```

**LocalStorage**:
```javascript
localStorage.setItem('dashboard-theme', 'dark' | 'light');
```

**UI 요소**:
- 상단 네비게이션에 테마 토글 버튼 (해/달 아이콘)
- 시스템 설정 자동 감지 옵션

### 18.3 파일 목록
| 파일 | 변경 |
|------|------|
| `public/index.html` | CSS 변수 + 테마 토글 버튼 |
| `public/js/app.js` | 테마 전환 로직 |

---

## Phase 19: 모바일 반응형 (P3)

### 19.1 목표
모바일/태블릿 기기 지원

### 19.2 구현 내용

**반응형 브레이크포인트**:
```css
/* 모바일 */
@media (max-width: 640px) {
  .sidebar { display: none; }
  .nav-tabs { flex-direction: column; }
}

/* 태블릿 */
@media (max-width: 1024px) {
  .grid-cols-3 { grid-template-columns: repeat(2, 1fr); }
}
```

**UI 변경**:
- 사이드바 → 햄버거 메뉴
- 탭 → 드롭다운 선택
- 차트 크기 자동 조절
- 터치 친화적 버튼 크기

### 19.3 파일 목록
| 파일 | 변경 |
|------|------|
| `public/index.html` | 반응형 CSS + 햄버거 메뉴 |
| `public/js/app.js` | 모바일 메뉴 토글 |

---

## Phase 20: 플러그인 시스템 (P3)

### 20.1 목표
커스텀 Collector 추가 지원

### 20.2 구현 내용

**플러그인 구조**:
```
dashboard/plan-ecosystem/
├── plugins/
│   └── my-custom-collector/
│       ├── manifest.json
│       ├── collector.js
│       └── ui.html (선택)
```

**manifest.json 예시**:
```json
{
  "name": "my-custom-collector",
  "version": "1.0.0",
  "description": "Custom data collector",
  "main": "collector.js",
  "api": "/api/custom/my-data",
  "tab": {
    "id": "custom",
    "label": "Custom",
    "icon": "star"
  }
}
```

**자동 로딩**:
```javascript
// server.js 시작 시 plugins/ 폴더 스캔
const plugins = loadPlugins('./plugins');
plugins.forEach(p => {
  app.use(p.api, p.router);
});
```

### 20.3 파일 목록
| 파일 | 변경 |
|------|------|
| `server.js` | 플러그인 로더 추가 |
| `plugins/README.md` | 플러그인 개발 가이드 |
| `plugins/example/` | 예제 플러그인 |

---

## v3.0 구현 순서 (권장)

```
P1 (높음)         P2 (중간)         P3 (낮음)
────────────      ────────────      ────────────
Phase 12: Hook    Phase 15: D3.js   Phase 18: 테마
Phase 13: 알림    Phase 16: 검색    Phase 19: 모바일
Phase 14: 리플레이 Phase 17: 내보내기 Phase 20: 플러그인
```

### 예상 작업량
| Phase | 파일 수 | 예상 LOC |
|-------|--------|---------|
| 12 | 2 | ~100 |
| 13 | 4 | ~200 |
| 14 | 4 | ~300 |
| 15 | 3 | ~250 |
| 16 | 3 | ~150 |
| 17 | 3 | ~150 |
| 18 | 2 | ~80 |
| 19 | 2 | ~100 |
| 20 | 3 | ~200 |
| **합계** | **26** | **~1,530** |

---

## 검증 계획 (v3.0)

### Phase별 테스트
1. **Phase 12**: Hook 트리거 시 대시보드 API 호출 확인
2. **Phase 13**: 비용 임계값 초과 시 알림 표시 확인
3. **Phase 14**: 세션 선택 후 리플레이 재생 확인
4. **Phase 15**: 노드 드래그/줌 동작 확인
5. **Phase 16**: 검색어 입력 시 결과 표시 확인
6. **Phase 17**: CSV/JSON 파일 다운로드 확인
7. **Phase 18**: 테마 전환 시 UI 변경 확인
8. **Phase 19**: 모바일 뷰포트에서 레이아웃 확인
9. **Phase 20**: 플러그인 로드 및 API 등록 확인

### 통합 테스트
- Docker 재빌드 후 모든 기능 정상 동작
- WebSocket 연결 안정성
- 대용량 데이터 (1000+ 이벤트) 성능
