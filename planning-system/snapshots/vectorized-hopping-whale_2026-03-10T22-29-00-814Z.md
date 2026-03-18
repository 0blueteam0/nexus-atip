# Plan Mode 자율 활용 체계 구축

## Context

### 문제
Plan Mode는 큰 작업에서 더 유리하지만(30~40% 토큰 절약, 재작업 방지), 현재 시스템에는 **복잡도 자동 감지 -> Plan Mode 자동 활용** 로직이 없음. 사용자가 수동으로 Shift+Tab 하거나 `/plan` 명령어를 입력해야만 작동.

### 현재 상태
| 구성요소 | 존재 | 자동화 |
|---------|------|--------|
| complexity-assessment.md | O (정적 문서) | X |
| planning-system/workflow.js | O (수동 CLI) | X |
| atos/plan-executor.js | O (Phase 가중치) | 부분적 |
| atos/context-analyzer.js | O (키워드 분석) | X (복잡도 판단 없음) |
| 자동 Plan Mode 진입 | X | X |

### 목표
사용자 지시 없이도 작업 복잡도에 따라 Plan Mode를 자율적으로 활용하는 체계 구축

---

## 구현 계획

### Phase 1: 복잡도 자동 감지 엔진 (context-analyzer.js 확장)

**파일**: `atos/complexity-detector.js` (신규)

```
사용자 입력 분석 → 복잡도 점수 산출 → Plan Mode 필요 여부 판단
```

**감지 기준 (가중치 점수제)**:

| 신호 | 점수 | 감지 방법 |
|------|------|----------|
| 파일 수 언급 (>3) | +3 | 정규식: "여러 파일", "across files", 파일명 3개+ |
| 아키텍처 키워드 | +4 | "리팩토링", "마이그레이션", "시스템 변경", "architecture" |
| 보안/인증 키워드 | +3 | "auth", "보안", "security", "인증" |
| 새 기능 (대규모) | +3 | "새 기능", "new feature" + 규모 수식어 |
| 코드량 수식어 | +2 | "대규모", "전체", "모든", "comprehensive" |
| DB/API 변경 | +3 | "스키마", "migration", "API 변경" |
| 불확실성 | +2 | "어떻게", "방법", "best approach", "어떤 것이" |
| 단순 수정 | -3 | "수정", "fix", "오타", "typo", 파일 1개 명시 |
| 명시적 지시 | -5 | "바로 해줘", "just do it", "간단히" |

**임계값**:
- 0~4점: **Direct** (Plan Mode 불필요)
- 5~7점: **Suggest** (Plan Mode 제안, 사용자 선택)
- 8+점: **Auto** (Plan Mode 자동 진입 권장 + xAI 설명)

### Phase 2: CLAUDE.md 규칙 통합 (.claude/rules/auto-plan-mode.md)

**파일**: `.claude/rules/auto-plan-mode.md` (신규)

기존 xAI 7단계 프로세스 + complexity-assessment를 **실행 가능한 규칙**으로 통합:

```
[작업 수신]
    |
    v
[복잡도 자동 판단]
    |
    +-- Trivial/Simple (0~4점) --> 직접 실행
    |
    +-- Medium (5~7점) --> Plan Mode 제안
    |   "이 작업은 [N]개 파일에 영향을 줄 수 있습니다.
    |    Plan Mode에서 먼저 분석할까요?"
    |
    +-- Complex/Critical (8+점) --> Plan Mode 권장
        "[xAI] 대형 작업 감지. Plan Mode 진입을 권장합니다.
         이유: [복잡도 근거]
         예상 영향: [파일 수, 의존성]"
```

### Phase 3: Plan Mode 내부 자율 워크플로우

Plan Mode 진입 후 **자동으로 수행할 단계**:

```
[Plan Mode 진입]
    |
    v
[1] 자동 탐색 (Explore Agent)
    - 관련 파일 자동 식별
    - 의존성 그래프 파악
    - 기존 패턴 분석
    |
    v
[2] 영향 분석 보고
    - 변경 대상 파일 목록
    - 위험 요소 식별
    - 기존 테스트 커버리지 확인
    |
    v
[3] 선택지 제시 (최소 3개)
    - Option A: 최소 변경 (보수적)
    - Option B: 권장 접근 (균형)
    - Option C: 최적 아키텍처 (이상적)
    |
    v
[4] 실행 계획 생성
    - 태스크 분해 (Task 리스트)
    - 의존성 순서
    - 검증 계획
    |
    v
[5] 사용자 승인 대기
    - ExitPlanMode로 승인 요청
```

### Phase 4: 대규모 작업 전용 전략 통합

**파일**: `.claude/rules/auto-plan-mode.md` 내 포함

#### 전략 A: 컨텍스트 분할 실행
```
Plan Mode (분석) → compact → 일반 Mode (태스크별 실행)
    - 각 태스크 완료 시 checkpoint
    - 컨텍스트 50% 도달 시 자동 compact 제안
```

#### 전략 B: Sub-agent 격리 탐색
```
Plan Mode에서 Explore Agent 활용:
    - 메인 컨텍스트: 계획 + 의사결정만
    - Sub-agent: 파일 탐색 (격리된 컨텍스트)
    - 결과만 메인으로 반환 → 컨텍스트 절약
```

#### 전략 C: 태스크 영속성
```
계획 완료 시:
    1. .claude/plans/[name].md에 저장 (디스크 영속)
    2. TaskCreate로 태스크 리스트 생성 (압축 생존)
    3. ACTIVE-PLAN.md 업데이트
    4. 일반 모드 전환 후에도 계획 참조 가능
```

---

## 수정 대상 파일

| # | 파일 | 작업 | 유형 |
|---|------|------|------|
| 1 | `atos/complexity-detector.js` | 복잡도 자동 감지 엔진 | **신규** |
| 2 | `.claude/rules/auto-plan-mode.md` | Plan Mode 자율 활용 규칙 | **신규** |
| 3 | `atos/context-analyzer.js` | complexity-detector 연동 | 수정 |
| 4 | `atos/recommendation-engine.js` | Plan Mode 추천 로직 추가 | 수정 |
| 5 | `CLAUDE.md` | 자동 Plan Mode 규칙 참조 추가 | 수정 |
| 6 | `.claude/templates/complexity-assessment.md` | 점수 체계 반영 업데이트 | 수정 |

---

## 검증 계획

### 테스트 시나리오

| # | 입력 예시 | 예상 복잡도 | 예상 동작 |
|---|----------|-----------|----------|
| 1 | "README 오타 수정해줘" | Trivial (0점) | 직접 실행 |
| 2 | "로그인 함수에 에러 핸들링 추가" | Simple (3점) | 직접 실행 |
| 3 | "인증 시스템을 JWT로 마이그레이션" | Critical (11점) | Plan Mode 자동 권장 |
| 4 | "새 API 엔드포인트 3개 추가" | Medium (6점) | Plan Mode 제안 |
| 5 | "전체 프로젝트 TypeScript 전환" | Critical (12점) | Plan Mode 자동 권장 |

### 검증 방법
```bash
# 1. complexity-detector 단위 테스트
node atos/complexity-detector.js test

# 2. 통합 테스트 (recommendation-engine 경유)
node atos/recommendation-engine.js recommend "인증 시스템 리팩토링"

# 3. 실제 세션에서 자동 판단 확인
# (Claude Code 세션 시작 → 복잡한 작업 요청 → Plan Mode 제안 확인)
```

---

## 요약

- **핵심**: 복잡도 점수 기반 자동 Plan Mode 활용 (0~4: 직접, 5~7: 제안, 8+: 권장)
- **파일 수**: 신규 2개 + 수정 4개 = 총 6개
- **효과**: 사용자 개입 없이 작업 규모에 맞는 최적 워크플로우 자동 선택
- **호환성**: 기존 xAI 7단계 + RIPER+ + complexity-assessment 모두 통합
