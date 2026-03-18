# NEXUS Factory Floor - Pixel Game Redesign

## Context
현재 Factory Floor(`nexus/monitor/public/js/factory-floor.js`)는 8개 정적 존에 고정 스프라이트만 표시하는 단순 시각화. pixel-agents 프로젝트처럼 **자율 이동하는 픽셀 캐릭터가 걸어다니고, 앉아서 타이핑하고, 말풍선을 띄우는 게임형 시각화**로 전면 재설계한다.

**목표**: NEXUS의 4개 AI 에이전트가 8개 서브시스템 방을 돌아다니며 실시간 이벤트에 반응하는 픽셀 아트 오피스 시뮬레이션

---

## Phase 1: Sprite System (sprites.js 확장)

### 1.1 캐릭터 스프라이트 (16x16, 7프레임 x 3방향)
- **방향**: down(0), up(1), right(2) — left는 right를 ctx.scale(-1,1) 플립
- **프레임**: walk1, walk2, walk3 (걷기 3프레임), type1, type2 (타이핑 2프레임), read1, read2 (읽기 2프레임)
- **4 캐릭터 팔레트**:
  - claude-code: body=#e8a04e, accent=#f5c56d (orange)
  - gemini-cli: body=#4e8be8, accent=#6db5f5 (blue)
  - codex-cli: body=#4ee86b, accent=#6df5a0 (green)
  - ollama-cpu: body=#8b4ee8, accent=#b56df5 (purple)
- 각 캐릭터별 `frames[direction][frameIndex]` = 16x16 pixel array
- 현재 sprites.js의 단일 프레임 구조를 multi-frame 구조로 확장

### 1.2 타일 스프라이트 (8x8 타일)
- **바닥**: floor_default(짙은 회색), floor_highlight(약간 밝은 회색), corridor(중간 회색)
- **벽**: wall_top, wall_side, wall_corner (4방향)
- **장식**: carpet, mat, vent
- 모두 8x8 pixel array로 정의

### 1.3 가구 스프라이트 (8x8 ~ 16x16)
- desk(16x8), chair(8x8), monitor_on/off(8x8), server_rack(8x16), bookshelf(8x16), plant(8x8), whiteboard(16x8), conveyor_belt(8x8), lab_equipment(8x8), dashboard_screen(16x8)
- 각 방 테마에 맞는 가구 배치

### 파일: `nexus/monitor/public/assets/sprites.js` (전면 재작성)

---

## Phase 2: Tile Map & Office Layout

### 2.1 그리드 설정
- **타일 크기**: 8px (렌더링 시 SCALE=4 적용 → 화면상 32px)
- **맵 크기**: 40x24 타일 (320x192 논리 픽셀 → 1280x768 화면 픽셀)
- **캔버스**: 1280x768 (현재 1300x760에서 약간 조정)

### 2.2 8개 방 레이아웃 (40x24 그리드)
```
+----------+--------+----------+----------+
| Workstation (10x7) | A2A Hub  | MCP GW   |
| (0,0)-(9,6)       | (10,0)-  | (20,0)-  |
|  desks x4          | (19,6)   | (29,6)   |
|  monitors x4       | table x1 | servers  |
+----------+--------+----------+----------+
|          Task Pipeline (corridor 40x3)   |
|  (0,7)-(39,9) conveyor belt animation   |
+----------+--------+----------+----------+
| RAG Pipe | Agent FW | Evo Lab | Observe  |
| (0,10)-  | (10,10)- | (20,10)-| (30,10)- |
| (9,17)   | (19,17)  | (29,17) | (39,17)  |
| vectors  | graph    | weights | dashbrd  |
+----------+--------+----------+----------+
|          Lobby / Common Area (40x6)      |
|  (0,18)-(39,23) wander zone, plants     |
+----------+--------+----------+----------+
```

### 2.3 Walkability Matrix
- `tileMap[y][x]` = 0(벽/가구), 1(걸을 수 있음), 2(의자/seat)
- 문(door) 타일로 방 연결 (각 방 1-2개 출입구)
- Task Pipeline은 중앙 복도 역할

### 2.4 Seat 시스템
- 각 방에 2-4개 의자(seat) 배치, seat ID로 관리
- `seats[]` = `{ id, tileX, tileY, deskTileX, deskTileY, room, occupied, agentId }`
- 에이전트가 seat에 도착하면 desk 방향을 바라보며 앉기

### 파일: `nexus/monitor/public/js/tile-map.js` (신규)

---

## Phase 3: Character System (FSM + Pathfinding)

### 3.1 FSM States
```
SPAWNING → IDLE → WALKING → SITTING → TYPING/READING
                ↑          ↓
                └──────────┘ (도착 또는 wander)

DESPAWNING (matrix effect → 제거)
```

| State | 설명 | 스프라이트 |
|-------|------|-----------|
| SPAWNING | Matrix 이펙트 재생 중 | 매트릭스 파티클 |
| IDLE | 제자리 서있음 (약간 bob) | walk1 (down) |
| WALKING | BFS 경로 따라 이동 | walk1→walk2→walk3 루프 |
| SITTING | 의자에 앉아있음 | walk1 (desk 방향) |
| TYPING | 타이핑 애니메이션 | type1↔type2 루프 |
| READING | 읽기 애니메이션 | read1↔read2 루프 |
| DESPAWNING | Matrix 이펙트 → 제거 | 매트릭스 파티클 |

### 3.2 BFS Pathfinding
- `findPath(startX, startY, targetX, targetY)` → `[{x,y}, ...]` 경로 배열
- tileMap walkability 기반, 4방향 이동 (대각선 없음)
- 다른 에이전트가 점유한 타일은 일시적 벽 처리
- 경로 없으면 가장 가까운 walkable 타일로 대체

### 3.3 Wander AI
- IDLE 상태에서 3-8초 후 랜덤 walkable 타일 선택 → WALKING
- 홈 방(home room) 내에서 우선 wander, 20% 확률로 다른 방 방문
- 이벤트 수신 시 wander 중단 → 해당 방으로 이동

### 3.4 에이전트 속성
```js
agent = {
  id, name, palette,
  tileX, tileY,        // 현재 위치 (타일 좌표)
  pixelX, pixelY,      // 부드러운 이동용 서브픽셀 위치
  direction,           // 0=down, 1=up, 2=right, 3=left
  state,               // FSM state
  path: [],            // BFS 경로
  pathIndex: 0,
  currentSeat: null,
  homeRoom: '',        // 기본 배치 방
  animFrame: 0,
  animTimer: 0,
  stateTimer: 0,       // 현재 상태 지속 시간
  bubble: null,        // { text, color, timer }
  walkSpeed: 2,        // tiles per second
}
```

### 3.5 홈 방 배정
- claude-code → Workstation (primary orchestrator)
- gemini-cli → MCP Gateway (web search, multimodal)
- codex-cli → Agent Framework (autonomous coding)
- ollama-cpu → RAG Pipeline (local embedding)

### 파일: `nexus/monitor/public/js/character.js` (신규)

---

## Phase 4: Rendering Pipeline

### 4.1 렌더링 순서
```
1. clearCanvas
2. renderFloorTiles()    — 8x8 타일 × SCALE
3. renderWalls()         — 벽 타일
4. renderFurniture()     — Y좌표 기준 정렬
5. renderCharacters()    — Y좌표 기준 정렬 (가구와 통합 z-sort)
6. renderOverlays()      — 말풍선, 방 이름 라벨, 이펙트
7. renderMatrixEffects() — 스폰/디스폰 이펙트
8. renderHUD()           — 상태 표시 (에이전트 목록, 이벤트 카운트)
```

### 4.2 Z-Sort 통합
- 가구와 캐릭터를 하나의 배열에 넣고 `tileY` 기준 정렬
- 같은 Y면 tileX로 2차 정렬

### 4.3 스프라이트 렌더링
```js
function drawSprite(ctx, spriteData, x, y, scale, flipX) {
  // spriteData = { width, height, pixels: [...] }
  // pixels는 palette index 배열, 0=투명
  // flipX면 ctx.save() → ctx.scale(-1,1) → 그리기 → ctx.restore()
}
```

### 4.4 카메라
- 고정 뷰 (스크롤 없음) — 전체 맵이 캔버스에 fit
- SCALE = Math.floor(Math.min(canvas.width / mapPixelW, canvas.height / mapPixelH))

### 4.5 말풍선
- 캐릭터 머리 위 (tileY - 1 위치)
- 배경: 반투명 검정 (#000000aa), 흰색 텍스트
- 종류: 텍스트("routing..."), 아이콘(체크마크/X), 점(...대기)
- 3초 후 자동 fade out

### 4.6 방 라벨
- 각 방 상단에 방 이름 텍스트 (작은 픽셀 폰트 또는 ctx.fillText)
- 반투명 배경 패널

### 파일: `nexus/monitor/public/js/renderer.js` (신규)

---

## Phase 5: Matrix Effect

### 5.1 스폰 이펙트
- 캐릭터 타일 위치에서 세로 8-16개 녹색 문자 파티클
- 위에서 아래로 떨어지며 fade
- 0.5초 동안 재생 → 완료 시 캐릭터 IDLE로 전환
- 색상: #39d353 (NEXUS 테마 accent-green)

### 5.2 디스폰 이펙트
- 캐릭터가 사라지면서 같은 위치에 역방향 매트릭스 파티클
- 0.5초 → 완료 시 캐릭터 객체 제거

### 5.3 파티클 시스템
```js
particle = { x, y, char, speed, opacity, life }
// char = random from "01アイウエオカキクケコ"
```

### 파일: `nexus/monitor/public/js/matrix-effect.js` (신규)

---

## Phase 6: Event Integration

### 6.1 이벤트 큐
```js
const eventQueue = [];
window.onNexusEvent = (type, data) => eventQueue.push({ type, data, time: Date.now() });
// 매 프레임 processEvents() 에서 큐 소비
```

### 6.2 이벤트 → 행동 매핑

| Event | Action |
|-------|--------|
| `system:init` | 4 에이전트 순차 matrix spawn (0.5초 간격) |
| `system:ready` | 각 에이전트 홈 방 seat로 walk |
| `task:received` | 라우팅 대상 에이전트 → Workstation으로 walk |
| `task:routed` | 도착 후 앉아서 TYPING 시작, bubble("routing to {provider}") |
| `task:completed` | TYPING 중단, bubble("done!", green), 3초 후 홈으로 |
| `task:failed` | bubble("failed!", red), 3초 후 홈으로 |
| `graph:node:start` | Agent Framework에서 TYPING 시작 |
| `graph:node:end` | TYPING 중단 |
| `evolution:weight` | 에이전트 → Evolution Lab walk, READING |
| `evolution:pattern` | Evolution Lab에서 bubble("new pattern") |
| `provider:health` | 에이전트 상태 도트 색상 변경 |
| `team:started` | 여러 에이전트 → A2A Hub로 모임 |
| `team:completed` | 에이전트들 각자 홈으로 복귀 |
| `hitl:request` | TYPING 중단, bubble("...", amber), 대기 |
| `hitl:approved` | bubble("OK", green), TYPING 재개 |
| `subagent:spawned` | 임시 에이전트 matrix spawn (회색 팔레트) |
| `subagent:completed` | 임시 에이전트 matrix despawn |
| `heartbeat` | 미사용 에이전트 wander 트리거 |

### 6.3 행동 우선순위
- 현재 진행 중인 task 이벤트 > 새 이벤트
- TYPING 중 다른 방으로 이동 요청 시: 현재 작업 완료 후 이동
- 동시 다중 이벤트: 큐에서 순차 처리 (100ms 간격)

### 파일: `nexus/monitor/public/js/event-handler.js` (신규)

---

## Phase 7: Game Loop & Integration

### 7.1 메인 루프
```js
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // cap 100ms
  lastTime = timestamp;

  processEvents();        // SSE 이벤트 큐 처리
  updateCharacters(dt);   // FSM 업데이트, 이동, 애니메이션
  updateEffects(dt);      // 매트릭스, 말풍선 타이머
  render();               // 전체 렌더링

  requestAnimationFrame(gameLoop);
}
```

### 7.2 factory-floor.js 재작성
- 기존 1033줄 전면 교체
- 모든 모듈 조합하는 진입점
- `initFactoryFloor()` → 타일맵 생성, 에이전트 초기화, 루프 시작
- `window.onNexusEvent` 체인 연결 유지

### 7.3 Agent Office 탭 통합
- agent-office.js는 factory-floor.js에 흡수
- 별도 탭 유지하되 같은 엔진 사용하거나, Factory Floor 하나로 통합

### 파일: `nexus/monitor/public/js/factory-floor.js` (전면 재작성)

---

## Phase 8: Agent Office 탭 병합 (선택적)

Factory Floor가 에이전트 시각화를 완전히 대체하므로:
- Agent Office 탭을 제거하거나
- Factory Floor과 동일한 뷰를 공유하되 카메라 줌/위치만 다르게

### 파일: `nexus/monitor/public/index.html` (탭 수정)

---

## 수정 파일 요약

| 파일 | 작업 | 크기 예상 |
|------|------|----------|
| `assets/sprites.js` | **전면 재작성** - 캐릭터 7프레임x3방향, 타일, 가구 | ~800줄 |
| `js/tile-map.js` | **신규** - 그리드, walkability, seat, BFS | ~200줄 |
| `js/character.js` | **신규** - FSM, wander AI, 에이전트 관리 | ~300줄 |
| `js/renderer.js` | **신규** - 렌더링 파이프라인, z-sort, 말풍선 | ~250줄 |
| `js/matrix-effect.js` | **신규** - 스폰/디스폰 매트릭스 이펙트 | ~100줄 |
| `js/event-handler.js` | **신규** - 이벤트큐, 이벤트→행동 매핑 | ~200줄 |
| `js/factory-floor.js` | **전면 재작성** - 게임루프, 모듈 통합 | ~150줄 |
| `index.html` | **수정** - script 태그 추가, Agent Office 탭 정리 | 소폭 |
| `css/style.css` | **수정** - 캔버스 크기 조정 | 소폭 |

**총 예상**: ~2,000줄 (현재 ~1,400줄에서 증가하지만 구조화됨)

---

## 구현 순서

```
1. sprites.js        — 모든 스프라이트 데이터 정의
2. tile-map.js       — 맵 레이아웃, BFS
3. character.js      — FSM, 에이전트 로직
4. matrix-effect.js  — 이펙트 시스템
5. renderer.js       — 렌더링 파이프라인
6. event-handler.js  — 이벤트 통합
7. factory-floor.js  — 게임루프, 모듈 통합
8. index.html/css    — HTML/CSS 조정
```

각 단계는 이전 단계에 의존하므로 순차 실행.

---

## 검증 방법

1. **시각 검증**: `http://localhost:7850` 접속 → Factory Floor 탭
2. **스프라이트 확인**: 4 에이전트가 걸어다니는지 확인
3. **이벤트 반응**: `node nexus/core/cli.js status` 실행 → SSE 이벤트 발생 → 에이전트 반응
4. **FSM 전환**: 에이전트가 idle→walk→sit→type 상태를 정상 전환하는지
5. **매트릭스 이펙트**: 페이지 로드 시 4 에이전트 순차 스폰 확인
6. **말풍선**: 이벤트 수신 시 말풍선 표시 및 3초 후 fade 확인
7. **60fps**: 개발자 도구 Performance 탭에서 프레임 드롭 없는지 확인
