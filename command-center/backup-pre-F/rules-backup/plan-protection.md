# Plan Protection & Workflow (플랜 보호 및 워크플로우)

## [!!] 핵심 원칙: 플랜 병렬 유지 (CRITICAL)

**"플랜은 절대 덮어쓰지 않는다. 모든 플랜은 병렬적으로 존재한다."**

---

## 강제 워크플로우 (자동 실행)

### 세션 시작 시 (자동)
```
planning-workflow-start Hook 실행:
├── 1. 모든 플랜 스냅샷 생성 (plan-guard)
├── 2. 활성 플랜 목록 로드
├── 3. PLAN PROTECTION RULES 출력
└── 4. 워크플로우 상태 저장
```

### 세션 종료 시 (자동)
```
planning-workflow-end Hook 실행:
├── 1. 플랜 무결성 검증
├── 2. 위반 감지 시 자동 복원
└── 3. 워크플로우 상태 저장
```

---

## 플랜 파일 보호 규칙

### 절대 금지 (시스템이 강제)
```
[X] plans/*.md 파일 덮어쓰기 금지
[X] 기존 플랜 파일에 다른 내용 작성 금지
[X] 플랜 파일을 보고서/문서로 대체 금지
```

### 허용 (검증됨)
```
[O] 새 플랜 → 새 파일명으로 생성
[O] 기존 플랜 → 체크박스 상태 변경만 가능
[O] 완료된 플랜 → plans/completed/로 이동
```

---

## 파일 경로 분리 (필수)

| 콘텐츠 유형 | 저장 위치 |
|------------|----------|
| **활성 플랜** | `plans/` |
| **완료 플랜** | `plans/completed/` |
| **보류 플랜** | `plans/archived/` |
| **보고서** | `documentation/reports/` |
| **분석 문서** | `documentation/analysis/` |

---

## CLI 명령어 (수동 실행)

```bash
# 워크플로우 상태 확인
node planning-system/workflow.js status

# 세션 시작 (수동)
node planning-system/workflow.js session-start

# Plan Mode 진입
node planning-system/workflow.js plan-enter [plan-name]

# Plan Mode 종료
node planning-system/workflow.js plan-exit

# 세션 종료 (수동)
node planning-system/workflow.js session-end

# 새 플랜 이름 생성
node planning-system/plan-guard.js new-name

# 플랜 복원
node planning-system/plan-guard.js restore <filename>
```

---

## 위반 시 자동 복구

```
1. 세션 종료 Hook이 위반 감지
2. 스냅샷에서 자동 복원
3. 손상된 파일은 .corrupted.timestamp로 백업
```

---

## [!!] 자동 아카이빙 프로토콜 (MANDATORY)

**"새 작업 시작 전 기존 플랜을 반드시 아카이빙한다. 플랜은 절대 덮어쓰지 않는다."**

### Plan Mode 재진입 시 필수 행동 순서
1. **기존 플랜 확인**
   - `plans/*.md` 파일 존재 여부 확인 (completed/, archived/ 제외)

2. **상태 판단 및 아카이빙**
   | 상태 | 대상 폴더 | 파일명 규칙 |
   |------|----------|------------|
   | 완료됨 | `plans/completed/` | 원본 파일명 유지 |
   | 미완료/보류 | `plans/archived/` | `[원본]-archived-YYYYMMDD.md` |

3. **로그 기록**
   - 위치: `planning-log/daily/YYYY-MM-DD.md`
   - 형식: 시간, 원본 파일, 대상 폴더, 상태, 사유

4. **새 플랜 생성**
   - 시스템이 생성한 새 파일명 사용
   - 절대 기존 파일 덮어쓰기 금지

### 아카이빙 로그 템플릿
```
# Planning Log - YYYY-MM-DD

## 아카이빙 기록
| 시간 | 원본 파일 | 대상 폴더 | 상태 | 사유 |
|------|----------|----------|------|------|
```

### 이 규칙의 우선순위
- **MANDATORY**: 다른 모든 플래닝 규칙보다 우선
- **예외 없음**: 사용자가 명시적으로 요청해도 덮어쓰기 금지

---

**버전**: 3.0.0
**구현**: planning-system/workflow.js, plan-guard.js
**Hook**: planning-workflow-start, planning-workflow-end
**추가**: 자동 아카이빙 프로토콜 (2026-02-03)
