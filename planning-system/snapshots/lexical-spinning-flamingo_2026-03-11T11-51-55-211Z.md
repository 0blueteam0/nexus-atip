# NEXUS v2.0 Evolution Plan
# Hexagonal Architecture + Compound/Context/Harness Engineering

> **Status**: Plan Review
> **Created**: 2026-02-27
> **Architect Docs**: `documentation/architect/` (7 files, 4000+ lines)
> **Current System**: `nexus/` (36 files, v1.0)
> **Savepoint Tag**: `nexus-v1.0-baseline`
> **Archive Branch**: `nexus-v1.0-archive`

---

## Context

NEXUS v1.0은 3개 AI Provider(claude-code, gemini-cli, codex-cli)를 라우팅하는 간단한 오케스트레이터입니다. 7개의 아키텍트 문서는 이를 **자기 개선, 컨텍스트 최적화, 신뢰성 거버넌스 시스템**으로 진화시키는 청사진을 제시합니다.

핵심 격차 10가지:
1. 헥사고날 Port-Adapter 분리 없음 (직접 require 결합)
2. Context Pipeline 없음 (gather/scope/format 3단계 컴파일)
3. Compound Loop 없음 (Plan/Work/Review/Compound 사이클)
4. Harness Layer 없음 (세션 orientation/incremental-progress)
5. Policy Mesh 없음 (횡단 안전/거버넌스)
6. Solutions Library 없음 (지식 축적)
7. Triple-Store 없음 (SQLite + .ai/ + Notion)
8. Minimal Instruction Principle 미적용 (CLAUDE.md 400줄+)
9. 상태 머신 Model Router 없음 (정적 라우팅만)
10. progress.json / feature_list.json 없음

---

## Implementation Order (구현 순서)

### Step 0: Pre-Work Baseline (최우선 실행)

1. **기존 plans/ 아카이빙** (plan-protection 규칙 준수)
2. **현재 상태 세이브포인트 커밋**
3. **v1.0 Baseline 태그 생성**: `nexus-v1.0-baseline`
4. **v1.0 아카이브 브랜치**: `nexus-v1.0-archive`
5. **물리 백업**: `nexus-v1.0-backup/`
6. **Baseline 검증**: CLI 4개 명령어 출력 저장

### Phase 1: Hexagonal Refactor (Foundation)

**새 파일 (4~5개):**
- `nexus/ports/index.js` - 8개 Port 인터페이스
- `nexus/ports/null-adapters.js` - Null Object 안전 기본값
- `nexus/core/container.js` - DI 컨테이너
- `nexus/core/port-validator.js` - 런타임 계약 검증

**수정 파일 (6~7개):**
- `nexus/core/orchestrator.js` - DI 전환
- `nexus/adapters/base-adapter.js` - Port 선언 추가
- `nexus/adapters/claude-adapter.js`, `gemini-adapter.js`, `codex-adapter.js`
- `nexus/core/cli.js` - 컨테이너 기반

**검증:** port-validator --all, CLI 8개 명령어 동일 출력, null adapter 폴백

### Phase 2: Context Pipeline + Minimal Instructions

**새 파일 (6~8개):**
- `nexus/context/pipeline.js`, `gatherer.js`, `scoper.js`, `formatter.js`
- `nexus/context/scoping-rules.json`
- `.ai/context/format-templates/` (3개 도구별)

**수정:** container.js, orchestrator.js

**검증:** 컨텍스트 40% 감소, 3 도구 포맷, null 시 v1.0 유지

### Phase 3: Compound Loop

**새 파일 (4~5개):**
- `nexus/compound/loop.js`, `solutions-library.js`, `fifty-fifty-tracker.js`
- `.ai/memory/solutions/`, `.ai/templates/SOLUTION_TEMPLATE.md`

**수정:** workflow-engine.js, orchestrator.js, event-bus.js

**검증:** 3 태스크 4단계 완주, 솔루션 검색, 비활성화 시 v1.0

### Phase 4: Harness Layer

**새 파일 (5~6개):**
- `nexus/harness/session-manager.js`, `progress-tracker.js`, `feature-tracker.js`
- `.ai/harness/feature_list.json`, `.ai/harness/orientation.md`

**수정:** session-start.js, session-end.js

**검증:** orientation 우선순위, progress.json 갱신, HANDOFF.md 생성

### Phase 5: Policy Mesh

**새 파일 (6~7개):**
- `nexus/policy/mesh.js`, `permission-policy.js`, `rate-governor.js`
- `nexus/policy/audit-trail.js`, `context-hygiene.js`, `policy-rules.json`

**수정:** container.js

**검증:** write->승인필요, read->자유통과, rate limit, 비활성화 시 직접접근

### Phase 6: Triple-Store + Evolution Bus

**새 파일 (8~9개):**
- `nexus/store/sqlite-adapter.js`, `schema.sql`, `ai-files-adapter.js`, `sync-engine.js`
- `nexus/evolution/consumers/` (5개 소비자)

**수정:** event-bus.js, knowledge-index.js

**검증:** 7 도메인 CRUD, .ai/->SQLite 반영, SQLite 비활성화 시 작동, K드라이브 포터블

---

## Phase 의존성

```
Phase 1 (FOUNDATION - 필수)
    +---> Phase 2 ---> Phase 3 ---> Phase 4
    +---> Phase 5 (병렬 가능)
    +---> Phase 6 (병렬 가능)
```

## 세이브포인트 전략

매 Phase마다: 시작 전 태그 + 완료 후 태그 (총 13개 태그)

```
nexus-v1.0-baseline -> pre-phase1 -> phase1-done -> ... -> nexus-v2.0-complete
```

## 총 파일: ~35 신규, ~10 수정

## End-to-End 검증

1. Phase별 단위 검증
2. Phase 1+2+3 통합 Compound Loop 실행
3. CLI 기존 출력 호환성
4. K드라이브 포터블 확인
5. 각 컴포넌트 비활성화 시 지속 작동
