# Auto Plan Mode (자동 Plan Mode 활용 규칙)

> **목적**: 작업 복잡도에 따라 Plan Mode를 자율적으로 활용
> **엔진**: `atos/complexity-detector.js`
> **우선순위**: CRITICAL (xAI 7단계 프로세스와 통합)

---

## [!!] 자동 활용 프로토콜 (MANDATORY)

### 작업 수신 시 즉시 판단

모든 작업 요청 수신 시, 다음을 **내부적으로** 평가:

```
[사용자 입력 수신]
      |
      v
[복잡도 신호 감지]
  - 아키텍처 변경 키워드? (+4)
  - 보안/인증 관련? (+3)
  - 여러 파일 영향? (+3)
  - 대규모 전환/변환? (+3)
  - DB/API 변경? (+3)
  - 복합 작업? (+2)
  - 불확실성? (+2)
  - 단순 수정? (-3)
  - 즉시 실행 요청? (-5)
      |
      v
[점수 합산 → 행동 결정]
```

### 행동 매트릭스

| 점수 | 레벨 | 행동 | 예시 |
|------|------|------|------|
| 0~4 | Direct | 즉시 실행 (Plan Mode 불필요) | 오타 수정, 단일 함수 변경 |
| 5~7 | Suggest | Plan Mode 제안 (사용자 선택) | API 엔드포인트 추가, 패턴 통일 |
| 8+ | Auto | Plan Mode 진입 권장 + xAI 설명 | 시스템 마이그레이션, 대규모 리팩토링 |

---

## [FLOW] 레벨별 상세 행동

### Direct (0~4점): 즉시 실행

Plan Mode 없이 바로 구현. 추가 설명 불필요.

### Suggest (5~7점): Plan Mode 제안

사용자에게 선택권 제시:
```
[?] Plan Mode 제안 (복잡도 점수: N점)
    감지된 신호: [신호 목록]
    이 작업은 Plan Mode에서 먼저 분석하면 효율적일 수 있습니다.
    Plan Mode에서 탐색할까요?
```

사용자가 거부하면 즉시 실행. 수락하면 Plan Mode 진입.

### Auto (8+점): Plan Mode 자동 권장

xAI 태그와 함께 Plan Mode 진입 권장:
```
[!] Plan Mode 권장 (복잡도 점수: N점)
    감지된 신호: [신호 목록]
    [작업] 대형 작업 감지 - Plan Mode 진입 권장
    [목적] 실행 전 탐색으로 재작업 방지 + 토큰 30~40% 절약
    [방법] Plan Mode에서 영향 분석 -> 선택지 제시 -> 승인 후 실행
```

EnterPlanMode 도구 호출하여 진입.

---

## [INSIDE] Plan Mode 내부 자율 워크플로우

Plan Mode 진입 후 **자동으로 수행할 5단계**:

### Step 1: 자동 탐색
- Explore Agent로 관련 파일 자동 식별
- 의존성 그래프 파악
- 기존 패턴/컨벤션 분석

### Step 2: 영향 분석 보고
- 변경 대상 파일 목록 작성
- 위험 요소 식별 (보안, 호환성, 성능)
- 기존 테스트 커버리지 확인

### Step 3: 선택지 제시 (최소 2개)
- Option A: 최소 변경 (보수적, 빠름)
- Option B: 권장 접근 (균형)
- Option C: 최적 아키텍처 (이상적, 시간 소요)

### Step 4: 실행 계획 생성
- 태스크 분해 (TaskCreate 활용)
- 의존성 순서 정의
- 검증 계획 포함

### Step 5: 사용자 승인
- ExitPlanMode로 승인 요청

---

## [ENTERPRISE] 대규모 작업 전략

### 컨텍스트 보호 전략
```
Plan Mode 탐색 시:
  1. Explore Agent로 격리 탐색 (메인 컨텍스트 보호)
  2. 탐색 결과 요약만 메인으로 반환
  3. 50% 컨텍스트 도달 시 /compact 제안
  4. 계획은 반드시 .claude/plans/에 파일로 저장
```

### 태스크 영속성
```
계획 승인 후:
  1. TaskCreate로 모든 태스크 등록 (압축 생존)
  2. plans/ACTIVE-PLAN.md 업데이트
  3. 일반 모드 전환 시 계획 파일 참조 가능
  4. 각 태스크 완료 시 TaskUpdate로 추적
```

### 단계별 실행 (컨텍스트 분할)
```
복잡도 8+점 작업:
  Plan Mode -> 계획 수립 -> compact -> 일반 Mode
  Task 1 실행 -> checkpoint -> Task 2 실행 -> ...
  컨텍스트 50% 시 compact + 계획 파일 재참조
```

---

## [SIGNAL] 복잡도 신호 상세

| 신호 | 점수 | 키워드 예시 |
|------|------|-----------|
| architecture_change | +4 | 리팩토링, 마이그레이션, 아키텍처, redesign |
| security_related | +3 | auth, 보안, 인증, token, encrypt |
| multi_file | +3 | 여러 파일, 전체 프로젝트, cross-module |
| large_new_feature | +3 | 새 시스템, 처음부터, from scratch |
| large_scale | +3 | 대규모, 전체, 모든, comprehensive |
| conversion_transform | +3 | 전환, 통일, 표준화, 개편 |
| db_api_change | +3 | 스키마, migration, API 변경 |
| multi_task_combined | +2 | A하고 B도, and also, 동시에 |
| uncertainty | +2 | 어떻게, 방법, best practice |
| simple_task | -3 | 오타, 간단한 수정, 한 줄 |
| explicit_direct | -5 | 바로 해, just do it, 즉시 |
| single_file | -2 | 이 파일, 파일 하나 |

---

## [REF] 연관 시스템

| 파일 | 역할 |
|------|------|
| `atos/complexity-detector.js` | 복잡도 감지 엔진 (이 규칙의 구현체) |
| `atos/context-analyzer.js` | 컨텍스트 분석기 (연동) |
| `atos/recommendation-engine.js` | 도구 추천 (Plan Mode 추천 포함) |
| `.claude/templates/complexity-assessment.md` | 복잡도 기준 문서 |
| `planning-system/workflow.js` | 플래닝 워크플로우 오케스트레이터 |

---

**버전**: 1.0.0
**작성일**: 2026-02-24
**엔진**: atos/complexity-detector.js
