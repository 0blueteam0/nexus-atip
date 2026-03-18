# Local Page Live Update System + Phase 6 Integration

**Plan ID**: glowing-cooking-snail
**Created**: 2026-02-04
**Status**: Ready for Implementation
**Complexity**: Medium (1-2 days)
**Base Plan**: federated-kindling-quilt.md (Phase 6)

---

## Executive Summary

로컬 페이지(plan-ecosystem-dashboard)에 대한 상시적 업데이트 시스템을 구축한다.
기존 Task Management Ecosystem Phase 6를 기반으로:
1. Dashboard 실시간 업데이트 (WebSocket)
2. 워크플로우 시각화 (Mermaid/D3.js)
3. LangGraph ↔ Hub 양방향 동기화

---

## 1. Current State Analysis

### 1.1 기존 Dashboard 구조 (localhost:7847)

| 파일 | 역할 | 상태 |
|------|------|------|
| `dashboard/plan-ecosystem/server.js` | Express 서버 | Active |
| `dashboard/plan-ecosystem/public/` | 정적 파일 | Active |
| `dashboard/dashboard-bridge.js` | Hub-Dashboard 연동 | Active |

### 1.2 Live Reload 베스트 프랙티스 (연구 결과)

| 방법 | 장점 | 단점 | 선택 |
|------|------|------|------|
| **WebSocket (Socket.io)** | 양방향, 실시간, 저지연 | 연결 관리 필요 | **SELECTED** |
| Server-Sent Events | 단방향, 간단 | 단방향만 가능 | - |
| Long Polling | 호환성 | 비효율적 | - |
| File Watcher + HMR | 개발용 최적 | 프로덕션 부적합 | 개발용 |

### 1.3 구현 대상

```
plan-ecosystem-dashboard (localhost:7847)
├── 실시간 태스크 상태 업데이트
├── RIPER+ 워크플로우 시각화
├── 이벤트 버스 연동
└── 자동 리프레시 (WebSocket fallback)
```

---

## 2. Implementation Plan

### 2.1 Phase 6-A: Event Bus 구현 (Priority 1)

**파일**: `unified-task-system/event-bus.js`

```javascript
// 핵심 이벤트 타입
TASK_CREATED, TASK_UPDATED, TASK_COMPLETED
PHASE_CHANGED, WORKFLOW_STARTED, WORKFLOW_COMPLETED
SESSION_STARTED, SESSION_ENDED
```

**의존성**: 없음 (순수 EventEmitter)

### 2.2 Phase 6-B: Dashboard WebSocket 구현 (Priority 1)

**수정 파일**: `dashboard/plan-ecosystem/server.js`

| 추가 기능 | 설명 |
|----------|------|
| Socket.io 서버 | 실시간 양방향 통신 |
| 이벤트 브로드캐스트 | Hub 변경 → 모든 클라이언트 |
| 자동 재연결 | 연결 끊김 시 자동 복구 |
| 룸 분리 | workflow, tasks, alerts |

**API 추가**:
```
WS  connect              - 클라이언트 연결
WS  task-update          - 태스크 변경 이벤트
WS  phase-change         - RIPER+ 단계 변경
WS  workflow-progress    - 워크플로우 진행률
```

### 2.3 Phase 6-C: 워크플로우 시각화 UI (Priority 2)

**새 파일**:
- `dashboard/plan-ecosystem/public/js/workflow-viz.js`
- `dashboard/plan-ecosystem/public/css/workflow.css`

**기능**:
1. Mermaid.js 기반 RIPER+ 다이어그램
2. 현재 단계 하이라이트 (애니메이션)
3. 클릭 시 상세 정보 패널
4. 실시간 진행률 바

### 2.4 Phase 6-D: LangGraph Hub Adapter (Priority 2)

**새 파일**: `langgraph-system/hub-adapter.js`

| 기능 | 설명 |
|------|------|
| Hub → LangGraph | 태스크 변경 시 State 업데이트 |
| LangGraph → Hub | Phase 변경 시 태스크 업데이트 |
| 양방향 동기화 | Single Source of Truth 유지 |

### 2.5 Phase 6-E: File Watcher (개발용) (Priority 3)

**새 파일**: `dashboard/dev-watcher.js`

- chokidar 기반 파일 감시
- 변경 감지 시 브라우저 자동 리프레시
- 개발 모드에서만 활성화

---

## 3. Critical Files

### 3.1 수정 대상

| 파일 | 변경 내용 |
|------|----------|
| `dashboard/plan-ecosystem/server.js` | Socket.io 통합, 새 API |
| `dashboard/plan-ecosystem/public/index.html` | Socket.io 클라이언트 |
| `unified-task-system/unified-task-hub.js` | EventBus 이벤트 발행 |

### 3.2 신규 생성

| 파일 | 용도 |
|------|------|
| `unified-task-system/event-bus.js` | 통합 이벤트 버스 |
| `dashboard/plan-ecosystem/public/js/workflow-viz.js` | 워크플로우 UI |
| `dashboard/plan-ecosystem/public/js/socket-client.js` | WebSocket 클라이언트 |
| `langgraph-system/hub-adapter.js` | Hub-LangGraph 연동 |
| `dashboard/dev-watcher.js` | 개발용 파일 감시 |

### 3.3 참조 파일 (재사용)

| 파일 | 재사용 내용 |
|------|------------|
| `dashboard/dashboard-bridge.js` | API 클라이언트 패턴 |
| `langgraph-system/graph.js` | State Machine 구조 |
| `unified-task-system/cli.js` | CLI 패턴 |

---

## 4. Implementation Order

```
Step 1: Event Bus (30분)
├── event-bus.js 생성
├── 이벤트 타입 정의
└── 테스트: emit/on 동작

Step 2: Dashboard WebSocket (1시간)
├── server.js에 Socket.io 추가
├── socket-client.js 생성
├── index.html 업데이트
└── 테스트: 실시간 업데이트

Step 3: Workflow Visualization (1시간)
├── workflow-viz.js 생성
├── Mermaid 다이어그램
├── 실시간 하이라이트
└── 테스트: UI 동작

Step 4: Hub Adapter (1시간)
├── hub-adapter.js 생성
├── Hub 이벤트 연동
├── LangGraph State 동기화
└── 테스트: 양방향 동기화

Step 5: Dev Watcher (30분)
├── dev-watcher.js 생성
├── chokidar 설정
└── 테스트: 파일 변경 → 리프레시
```

---

## 5. Verification Plan

### 5.1 기능 테스트

- [ ] Dashboard 접속 (localhost:7847) 정상
- [ ] WebSocket 연결 성공 (개발자 도구 확인)
- [ ] 태스크 생성 시 실시간 UI 업데이트
- [ ] RIPER+ 다이어그램 렌더링
- [ ] 단계 변경 시 하이라이트 업데이트

### 5.2 통합 테스트

```bash
# Hub CLI로 태스크 생성
node unified-task-system/cli.js add "Test Task" --phase specify

# Dashboard에서 실시간 표시 확인
# 브라우저: http://localhost:7847

# Phase 변경
node unified-task-system/cli.js update <taskId> --phase explore

# 워크플로우 다이어그램 업데이트 확인
```

### 5.3 성능 테스트

- [ ] WebSocket 재연결 (3초 이내)
- [ ] 이벤트 지연 (<100ms)
- [ ] 메모리 누수 없음

---

## 6. Dependencies

### 6.1 NPM 패키지 (추가 필요)

```json
{
  "socket.io": "^4.7.0",
  "socket.io-client": "^4.7.0",
  "chokidar": "^4.0.0",
  "mermaid": "^11.0.0"
}
```

### 6.2 Docker 서비스

| 서비스 | 포트 | 필수 |
|--------|------|------|
| plan-ecosystem-dashboard | 7847 | Yes |
| redis | 6380 | Optional (Queue용) |

---

## 7. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| WebSocket 연결 실패 | Polling fallback 구현 |
| 이벤트 누락 | Queue 기반 버퍼링 |
| 브라우저 호환성 | Socket.io 자동 폴백 |
| 메모리 누수 | 이벤트 리스너 정리 |

---

## 8. Post-Implementation

### 8.1 활용 시나리오

1. **실시간 모니터링**: Dashboard 열어두고 작업, 상태 자동 갱신
2. **팀 협업**: 여러 브라우저에서 동시 모니터링
3. **디버깅**: 워크플로우 진행 상황 실시간 추적

### 8.2 확장 가능성

- n8n 워크플로우 트리거 연동
- 알림 시스템 (Desktop Notification)
- 히스토리 리플레이

---

**Ready for Implementation**
