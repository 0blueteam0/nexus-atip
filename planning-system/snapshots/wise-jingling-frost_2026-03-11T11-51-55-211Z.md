# Command Center: Pixel Agent System Redesign

## Decisions
- **Platform**: Electron App (독립 데스크톱, 트레이 아이콘, 항상 표시)
- **실행**: 전체 Phase 1~5 한번에 (3~5 세션 예상)
- **이번 세션**: Phase 1 (Context Elimination) + Phase 2 (Observer Server) + Phase 3 시작

## Context

### 문제
현재 시스템은 **모든 것을 Claude 컨텍스트 안에 텍스트로 주입**하는 설계.
- 86KB (~27,000 토큰) 세션 시작 즉시 소비
- 32개 hooks, 18개 rules 파일, 47,234줄 JS가 "Claude에게 설명하는 텍스트"
- 서브에이전트조차 "Prompt is too long"으로 실패 (이 세션에서 실증됨)
- ATOS, NEXUS, Planning 시스템 → 실제 동작보다 "규칙 문서"가 더 큼

### 목표
Pixel Agents 스타일의 **관찰형 아키텍처**로 전환:
- Claude 컨텍스트 소비: 27,000 토큰 → ~2,000 토큰 (93% 감소)
- 모든 오케스트레이션을 **외부 프로세스**로 이동
- 픽셀 아트 "명령 센터" UI로 실시간 시각화
- 기존 47K줄 JS 인프라를 외부 관찰자로 재구성

### 영감
[pixel-agents](https://github.com/pablodelucca/pixel-agents) - Claude JSONL transcript를 외부에서 관찰, 컨텍스트 소비 0

---

## Architecture: 4-Layer Design

```
┌─────────────────────────────────────────────────┐
│  Layer 4: Command Center UI (Browser Canvas)    │
│  - Pixel art 명령 센터                           │
│  - MCP = 건물, Agent = 캐릭터, Token = HP       │
│  - WebSocket 실시간 업데이트                      │
└──────────────────────┬──────────────────────────┘
                       │ WebSocket
┌──────────────────────┴──────────────────────────┐
│  Layer 3: Observer Server (Node.js)             │
│  - JSONL transcript 감시                         │
│  - Hook 이벤트 수집                              │
│  - 상태 집계 + 브로드캐스트                       │
└──────────────────────┬──────────────────────────┘
                       │ File Watch + Hook POST
┌──────────────────────┴──────────────────────────┐
│  Layer 2: Claude Code (Minimal)                 │
│  - CLAUDE.md ~2KB (핵심 규칙만)                  │
│  - Rules 0~2개 파일                              │
│  - HTTP Hook → Observer에 이벤트 전송            │
└──────────────────────┬──────────────────────────┘
                       │ JSONL Transcript
┌──────────────────────┴──────────────────────────┐
│  Layer 1: State Store (SQLite)                  │
│  - 태스크, 메모리, 세션, 통계                     │
│  - Claude가 읽을 필요 없음                       │
│  - Observer가 관리                               │
└─────────────────────────────────────────────────┘
```

---

## Phase 1: Context Elimination (컨텍스트 제거)

### 1.1 CLAUDE.md 축소 (86KB → ~5KB)

**유지 (essential):**
```
- 한국어 표시 프로토콜 (3줄)
- ASCII 문자 사용 (2줄)
- 배치 파일 규칙 (3줄)
- 포터블 환경 경로 (5줄)
- 기본 도구 우선순위 (10줄, 단순화)
```

**제거:**
```
- xAI 7단계 프로세스 → Observer가 자동 판단
- RIPER+ 워크플로우 → 외부 state machine
- Auto Plan Mode → Observer complexity detector
- FIC/ATOS/STL 설명 → 외부 프로세스 (설명 불필요)
- new-features-v2.md (471줄) → 완전 제거
- design-anti-homogenization (292줄) → 온디맨드 스킬로
- tiered-review (132줄) → 온디맨드 스킬로
- plan-protection (137줄) → Observer가 처리
- workspace-structure (103줄) → 불필요
- development-workflow (218줄) → Observer state machine
- archive/* (7파일 전부) → 삭제
```

### 1.2 Hooks 정리 (32개 → 3개)

**유지:**
| Hook | 트리거 | 역할 |
|------|--------|------|
| `observer-notify` | HTTP Hook (all events) | Observer에 이벤트 전송 |
| `session-start` | session-start | Observer에 세션 시작 알림 |
| `session-end` | session-end | Observer에 세션 종료 알림 |

**제거 (29개):**
- atos-init, atos-recommend, atos-track, atos-learn → Observer 내장
- nexus-init, nexus-learn, nexus-subagent-track, nexus-task-complete, nexus-teammate-idle → Observer 내장
- planning-restore, planning-workflow-start/end, planning-persist → Observer 내장
- dashboard-*, lifecycle-*, hub-sync, bidirectional-sync → Command Center UI가 대체
- self-trigger, context-detection, important-detection → Observer 내장
- design-lint, date-validation, auto-cleanup, periodic-save → 불필요 또는 Observer

### 1.3 기대 효과
| 항목 | Before | After |
|------|--------|-------|
| CLAUDE.md + Rules | 86KB / ~27K tokens | ~5KB / ~1.5K tokens |
| Startup hooks | 7개 (동시) | 1개 |
| Hook 출력 (context) | ~5KB | ~200 bytes |
| **총 초기 컨텍스트** | **~27,000 tokens** | **~2,000 tokens** |
| 서브에이전트 가용성 | 실패 (too long) | 정상 작동 |

---

## Phase 2: Observer Server

### 2.1 구조
```
command-center/
├── server/
│   ├── index.js              # Express + WebSocket 서버
│   ├── transcript-watcher.js # JSONL 파일 감시
│   ├── event-collector.js    # Hook HTTP POST 수신
│   ├── state-machine.js      # 에이전트 상태 관리
│   ├── complexity-detector.js # 작업 복잡도 판단 (ATOS에서 이관)
│   ├── db.js                 # SQLite 상태 저장
│   └── broadcaster.js        # WebSocket 브로드캐스트
```

### 2.2 핵심 기능

**Transcript Watcher** (pixel-agents 방식):
```javascript
// Claude Code의 JSONL transcript 파일 감시
// 위치: ~/.claude/projects/*/sessions/*/transcript.jsonl
// 감지 항목:
//   - tool_use: 어떤 도구를 사용하는지
//   - text: 무엇을 말하는지
//   - error: 에러 발생 여부
//   - sub-agent spawn: 서브에이전트 생성
```

**State Machine** (에이전트 상태):
```
idle → thinking → coding → searching → testing → waiting → idle
  │                                                    ↑
  └── 에러 → recovering ──────────────────────────────┘
```

**Event Collector** (HTTP Hook 수신):
```
POST /event
{
  type: "tool-call" | "response" | "session-start" | "session-end",
  data: { ... }
}
```

### 2.3 기존 시스템 통합
| 기존 시스템 | 이관 방식 |
|------------|----------|
| ATOS recommendation-engine | Observer의 state-machine이 대체 |
| ATOS complexity-detector | Observer의 complexity-detector로 이관 |
| ATOS tool-registry | Observer DB에 정적 데이터로 저장 |
| NEXUS orchestrator | Observer의 multi-agent tracker |
| Planning restore/checkpoint | Observer DB 자동 관리 |
| Unified Task System | Observer DB + Command Center UI |

---

## Phase 3: Command Center UI (Pixel Art)

### 3.1 테마: "명령 센터" (Mission Control)

```
┌──────────────────────────────────────────────────┐
│  ╔═══ COMMAND CENTER ═══╗  [HP: ████████░░ 80%]  │
│  ║                      ║  [Tokens: 45K/200K]    │
│  ║   ┌───┐   ┌───┐     ║                        │
│  ║   │MCP│   │MCP│     ║  ┌─────────────────┐   │
│  ║   │ 1 │   │ 2 │     ║  │ MISSION BOARD   │   │
│  ║   └───┘   └───┘     ║  │ ☐ Task 1        │   │
│  ║      🤖←Claude      ║  │ ☑ Task 2        │   │
│  ║   ┌───┐   ┌───┐     ║  │ ☐ Task 3        │   │
│  ║   │MCP│   │MCP│     ║  └─────────────────┘   │
│  ║   │ 3 │   │ 4 │     ║                        │
│  ║   └───┘   └───┘     ║  [Session: 00:15:32]   │
│  ╚══════════════════════╝  [Cost: $0.42]         │
└──────────────────────────────────────────────────┘
```

### 3.2 시각적 엔티티 매핑

| 시스템 요소 | 픽셀 표현 | 상태 표시 |
|------------|----------|----------|
| **Claude Agent** | 메인 캐릭터 (16x16) | 걷기/타이핑/읽기/대기 |
| **Sub-agents** | 작은 캐릭터들 | 연결선으로 메인과 연결 |
| **MCP 서버 (38개)** | 건물/스테이션 | 불 켜짐=활성, 꺼짐=비활성 |
| **Docker 컨테이너** | 인프라 건물 (파란색) | running=연기, stopped=어두움 |
| **토큰 예산** | HP 바 (상단) | 초록→노랑→빨강 |
| **세션 비용** | 골드 카운터 | 실시간 증가 |
| **태스크** | 미션 보드 | 체크박스 토글 |
| **에러** | 경고 아이콘 + 소리 | 빨간 점멸 |

### 3.3 인터랙션

| 액션 | 효과 |
|------|------|
| MCP 건물 클릭 | 도구 목록, 사용 통계, 상태 표시 |
| 캐릭터 클릭 | 현재 작업, 마지막 도구 호출 표시 |
| 미션 보드 클릭 | 태스크 상세, 진행률 표시 |
| HP 바 클릭 | 토큰 상세 (입력/출력/캐시) |
| 우클릭 | 컨텍스트 메뉴 (복사, 상세, 로그) |

### 3.4 기술 스택
```
- Electron 34+ (데스크톱 앱, 트레이 아이콘)
- Canvas 2D (pixel-perfect rendering)
- React 19 (UI 컴포넌트)
- Vite (빌드)
- WebSocket (Observer ↔ UI 통신)
- BFS pathfinding (캐릭터 이동)
- State machine (애니메이션 제어)
- electron-builder (패키징, portable mode)
```

### 3.4.1 Electron 특화 기능
```
- 트레이 아이콘: 상태 표시 (초록=활성, 회색=유휴, 빨강=에러)
- Always-on-top 옵션: 코딩하면서 모니터링
- 시스템 알림: 태스크 완료, 에러 발생 시
- 글로벌 단축키: Ctrl+Shift+C로 토글
- 자동 시작: claude.bat 실행 시 함께 기동
- Portable: K드라이브에서 설치 없이 실행
```

### 3.5 에셋
- 16x16 픽셀 타일셋 (CC0/MIT 무료 에셋)
- 캐릭터: 커스텀 또는 오픈소스 스프라이트
- 건물: MCP 서버별 구분 가능한 디자인
- 사운드: 8-bit 효과음 (완료, 에러, 알림)

---

## Phase 4: State Store (SQLite)

### 4.1 스키마
```sql
-- 세션 관리
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  started_at DATETIME,
  ended_at DATETIME,
  tokens_used INTEGER,
  cost_usd REAL
);

-- 태스크 관리 (Shrimp/Planning 통합)
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT,
  status TEXT, -- pending/in_progress/completed/blocked
  source TEXT, -- shrimp/manual/cli
  created_at DATETIME,
  completed_at DATETIME
);

-- 도구 사용 통계 (ATOS 대체)
CREATE TABLE tool_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  tool_name TEXT,
  mcp_server TEXT,
  duration_ms INTEGER,
  success BOOLEAN,
  timestamp DATETIME
);

-- 에이전트 상태
CREATE TABLE agent_states (
  agent_id TEXT PRIMARY KEY,
  state TEXT, -- idle/thinking/coding/searching/waiting
  current_tool TEXT,
  last_updated DATETIME
);

-- 학습 데이터 (NEXUS/ATOS 진화 대체)
CREATE TABLE patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_type TEXT,
  data JSON,
  confidence REAL,
  created_at DATETIME
);
```

---

## Phase 5: 마이그레이션 전략

### 5.1 이번 세션 실행 계획

```
[이번 세션]
Step 1: Context Elimination (즉시)
  ├── CLAUDE.md 축소 (86KB → ~5KB)
  ├── .claude/CLAUDE.md 축소
  ├── Rules 18개 → 2개 (archive 전체 삭제)
  └── Hooks 32개 → 3개

Step 2: Observer Server 구축
  ├── command-center/server/ 구조 생성
  ├── transcript-watcher.js (JSONL 감시)
  ├── event-collector.js (HTTP Hook 수신)
  ├── state-machine.js (에이전트 상태)
  ├── db.js (SQLite)
  └── broadcaster.js (WebSocket)

Step 3: Electron + Command Center UI 시작
  ├── Electron 셸 + 트레이
  ├── Canvas 게임 루프
  ├── 기본 엔티티 렌더링
  └── Observer 연결

[다음 세션]
Step 4: 고급 기능
  ├── 38개 MCP 서버 건물 배치
  ├── 미션 보드 (태스크 관리)
  ├── Docker 시각화
  ├── 사운드 + 알림
  └── 레이아웃 에디터

Step 5: 기존 시스템 정리
  ├── ATOS/NEXUS context 주입 완전 제거
  ├── 불필요 hooks 코드 삭제
  └── 최종 검증: 컨텍스트 < 2,000 tokens
```

### 5.2 기존 코드 재활용
| 기존 파일 | 재활용 방식 |
|----------|------------|
| `atos/recommendation-engine.js` | Observer의 패턴 분석 로직 |
| `atos/complexity-detector.js` | Observer의 복잡도 판단 |
| `nexus/core/orchestrator.js` | Observer의 멀티에이전트 추적 |
| `planning-system/checkpoint.js` | Observer DB 자동 저장 |
| `systems/startup-orchestrator.js` | Observer 시작 스크립트로 통합 |

---

## Verification Plan

### 테스트 방법
1. **컨텍스트 측정**: 새 CLAUDE.md로 세션 시작 → 토큰 사용량 확인
2. **Observer 동작**: Claude 세션 실행 → transcript 감시 → WebSocket 이벤트 확인
3. **UI 렌더링**: 브라우저에서 Command Center 열기 → 실시간 업데이트 확인
4. **서브에이전트**: 새 환경에서 Agent 도구 호출 → "Prompt is too long" 해결 확인
5. **기능 동등성**: 기존 ATOS/NEXUS 기능이 Observer에서 동작하는지 확인

### 성공 기준
- [ ] Claude 컨텍스트 초기 소비 < 3,000 tokens
- [ ] 서브에이전트 정상 실행
- [ ] Observer가 도구 호출 실시간 감지
- [ ] Command Center에 캐릭터 표시 + 이동
- [ ] MCP 서버 상태 시각화
- [ ] 토큰 HP 바 실시간 업데이트

---

## 핵심 파일 목록

### 새로 생성
```
command-center/
├── server/
│   ├── index.js
│   ├── transcript-watcher.js
│   ├── event-collector.js
│   ├── state-machine.js
│   ├── complexity-detector.js
│   ├── db.js
│   └── broadcaster.js
├── ui/
│   ├── index.html
│   ├── src/
│   │   ├── App.tsx
│   │   ├── engine/
│   │   │   ├── GameLoop.ts
│   │   │   ├── Renderer.ts
│   │   │   ├── Pathfinder.ts
│   │   │   └── StateMachine.ts
│   │   ├── entities/
│   │   │   ├── Agent.ts
│   │   │   ├── MCPBuilding.ts
│   │   │   ├── MissionBoard.ts
│   │   │   └── TokenBar.ts
│   │   ├── assets/
│   │   │   ├── sprites/
│   │   │   └── tiles/
│   │   └── hooks/
│   │       └── useWebSocket.ts
│   ├── vite.config.ts
│   └── package.json
├── data/
│   └── command-center.db (SQLite)
└── package.json

```

### 수정
```
CLAUDE.md                    # 86KB → ~5KB
.claude/CLAUDE.md            # 삭제 또는 최소화
.claude/rules/*              # 18개 → 2개
.claude-hooks.json           # 32개 → 3개
```

### 참조 (재활용)
```
atos/complexity-detector.js  # 로직 이관
atos/recommendation-engine.js # 패턴 분석 이관
nexus/core/orchestrator.js   # 멀티에이전트 추적 이관
```
