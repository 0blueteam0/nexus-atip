# Hook Execution Order (훅 실행 순서)

> **버전**: 1.0.0  
> **최종 업데이트**: 2026-01-20  
> **목적**: 세션 훅 중복 방지 및 실행 순서 명확화

---

## 세션 시작 훅 체인

```
[session-start 훅 - 실행 순서]

1. docker-check (highest)
   └─ Docker 상태 확인 + Self-hosted MCP 컨테이너 시작
   
2. session-start (high)
   └─ Unified Task 복원 (후속조치, 최근 작업)
   └─ [REMOVED] Planning 호출 제거됨 (planning-restore로 위임)
   
3. planning-restore (high)
   └─ 활성/완료 플랜 상태 출력
   └─ 단일 경로로 플랜 상태 복원
   
4. atos-init (high)
   └─ ATOS 초기화
   └─ Tool Registry 로드
   └─ PlanExecutor 연동 (Plan-Aware Recommendation)
   
5. self-trigger (high)
   └─ 키워드 감지 → 리소스 자동 로드
```

---

## 작업 중 훅 체인

```
[작업 중 훅]

1. atos-recommend (medium, before-response)
   └─ 맥락 분석 → 도구/워크플로우 추천
   └─ Plan Context 기반 가중치 적용

2. bidirectional-sync (medium, task-complete/phase-change)
   └─ Shrimp → Planning 동기화
   └─ Planning → Unified Task 동기화
   └─ 5분 주기 또는 태스크 완료 시 실행
   
3. atos-track (low, after-tool-call)
   └─ 도구 호출 통계 업데이트
   └─ 체이닝 패턴 기록
```

---

## 세션 종료 훅 체인

```
[session-end 훅 - 실행 순서]

1. session-end (high)
   └─ Unified Task 상태 저장 (후속조치)
   
2. planning-persist (high)
   └─ 플랜 상태 자동 저장
   └─ Git 커밋 (Phase 완료 시)
   
3. bidirectional-sync (medium)
   └─ 최종 동기화 실행
   
4. atos-learn (medium)
   └─ 세션 패턴 분석
   └─ 사용 통계 영구 저장
```

---

## 중복 방지 조치 (2026-01-20)

| 문제 | 해결 |
|------|------|
| session-restore.js에서 planning-restore 중복 호출 | `restorePlanningState()` 내부 로직 비활성화 |
| 동일 플랜 상태 2회 출력 | planning-restore 훅 단일 경로로 통합 |

---

## Planning-Execution Bridge 아키텍처

```
[세션 시작]
    │
    ├─ planning-restore → 활성 플랜 감지
    │
    └─ atos-init
          │
          ├─ PlanExecutor 로드
          ├─ getCurrentPhase() → 현재 단계 파악
          ├─ getPhaseWeights() → 도구 가중치 조정
          └─ recommendation-engine과 연동

[작업 중]
    │
    ├─ recommendation-engine
    │     └─ planContext 추가 고려 (planPhaseBoost)
    │
    └─ bidirectional-sync
          │
          ├─ Shrimp 완료 → Planning 자동 업데이트
          └─ Planning 완료 → Unified Task 반영

[세션 종료]
    │
    └─ planning-persist → checkpoint --auto-save
```

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `atos/plan-executor.js` | Planning-ATOS Bridge 핵심 |
| `atos/bidirectional-sync.js` | 양방향 동기화 |
| `atos/recommendation-engine.js` | Plan-Aware 추천 |
| `.claude-hooks.json` | 훅 설정 |
| `unified-task-system/session-restore.js` | 중복 제거됨 |
