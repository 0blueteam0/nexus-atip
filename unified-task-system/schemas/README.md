# Unified Task Hub - Schemas

LangGraph 기반 분산 에이전트 시스템을 위한 스키마 정의

## 버전
- **Version**: 2.0.0
- **Created**: 2026-02-04
- **Status**: Phase 1 Complete

## 스키마 구조

```
schemas/
├── index.js              # 통합 export
├── task.schema.js        # 태스크 스키마
├── state-machine.schema.js # LangGraph State Machine
├── agent.schema.js       # 에이전트 풀 스키마
├── queue.schema.js       # Redis/BullMQ 큐 스키마
└── README.md             # 이 파일
```

## 핵심 구성요소

### 1. Task Schema (`task.schema.js`)

| Export | 설명 |
|--------|------|
| `TaskStatus` | 태스크 상태 (pending, in_progress, completed, ...) |
| `TaskPriority` | 우선순위 (critical, high, medium, low, deferred) |
| `AgentRole` | 에이전트 역할 (researcher, coder, tester, reviewer, orchestrator) |
| `createTask(data)` | 태스크 팩토리 |
| `validateTask(task)` | 태스크 검증 |


### 2. State Machine Schema (`state-machine.schema.js`)

| Export | 설명 |
|--------|------|
| `RIPERPhase` | RIPER+ 6단계 (specify, explore, plan, implement, verify, release) |
| `TransitionRules` | Phase 전환 규칙 (회귀 허용) |
| `AgentPhaseMapping` | Phase별 담당 에이전트 |
| `createInitialState()` | 초기 상태 팩토리 |
| `validateTransition(from, to)` | 전환 검증 |
| `checkGate(phase, state)` | Gate 검증 |

### 3. Agent Schema (`agent.schema.js`)

| Export | 설명 |
|--------|------|
| `AgentStatus` | 에이전트 상태 (idle, busy, waiting, error, offline) |
| `AgentProfiles` | 역할별 에이전트 프로필 (도구, 버짓, 동시성) |
| `createAgent(role)` | 에이전트 팩토리 |
| `createAgentPool()` | 전체 에이전트 풀 생성 |
| `getAvailableAgent(pool, role)` | 가용 에이전트 조회 |

### 4. Queue Schema (`queue.schema.js`)

| Export | 설명 |
|--------|------|
| `QueueNames` | 큐 이름 (planning, execution, verification, notification, dead-letter) |
| `JobStatus` | 작업 상태 |
| `QueueConfig` | BullMQ 설정 (Redis 6380) |
| `createJob(data)` | 작업 팩토리 |


## 사용 예시

```javascript
const {
  createTask,
  createInitialState,
  createAgent,
  createJob,
  RIPERPhase,
  validateTransition
} = require('./unified-task-system/schemas');

// 태스크 생성
const task = createTask({
  title: 'Implement login feature',
  priority: 'high',
  phase: 'implement'
});

// 상태 머신 초기화
const state = createInitialState();

// 에이전트 생성
const coder = createAgent('coder');

// 작업 큐에 추가
const job = createJob({
  name: 'execute-task',
  taskId: task.id,
  action: 'implement'
});

// Phase 전환 검증
const { valid, reason } = validateTransition('plan', 'implement');
```

## 다음 단계 (Phase 2)

- [ ] LangGraph State Machine 실제 구현
- [ ] 노드 및 엣지 정의
- [ ] 체크포인트/복원 메커니즘
