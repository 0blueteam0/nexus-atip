# 지속적 플래닝 시스템 + K드라이브 시스템 정비 통합 플랜

**작성일**: 2026-01-19
**버전**: 3.0.0 (통합 플랜 - 플래닝 시스템 + 시스템 정비)
**목적**:
1. 구체적이고 추적 가능한 플래닝 시스템 구축
2. K드라이브 시스템 정비 및 지속적 관리 체계 확립

---

## [!!] 플랜 메타정보 (세션 시작 시 필수 확인)

### 현재 진행 상황
```
[*] Phase 0: 플래닝 시스템 구축 (NEW)      ← 현재 Phase
[ ] Phase 1: 정리 (Cleanup)
[ ] Phase 2: 통합 (Consolidation)
[ ] Phase 3: 문서화 (Documentation)
[ ] Phase 4: 자동화 (Automation)
[ ] Phase 5: 검증 (Verification)

현재 Phase: 0 (플래닝 시스템 구축)
마지막 완료: 플랜 통합 완료
다음 작업: 0.1 planning-system/ 폴더 구조 생성
진행률: 0/6 Phases (0%)
```

### 플랜 5대 핵심 원칙
| 원칙 | 설명 | 구현 방법 |
|------|------|----------|
| **구체성** | 세부적이고 상세한 플래닝 | 모든 파일 경로, 명령어, 검증 기준 명시 |
| **추적가능성** | 개선사항 파악을 위한 지속 추적 | progress.json + Git 커밋 연동 |
| **지속적 인지** | 항상 기록되고 남아 있음 | ACTIVE-PLAN.md + 세션 훅 |
| **버전관리** | 변경 이력 추적 | Git 자동 커밋 (Phase 완료 시) |
| **백업성** | 데이터 손실 방지 | 3중 백업 (로컬/Git/planning-log) |

### 절대 변경 금지 (CRITICAL)
```
.claude.json                    # MCP 서버 40+ 정의
.claude-hooks.json              # 7개 훅 정의 (확장만 가능)
CLAUDE.md                       # 핵심 지침
atos/index.js                   # ATOS 메인
unified-task-system/session-restore.js  # 세션 복원
```

---

## Phase 0: 플래닝 시스템 구축 (NEW - 최우선)

### 목표
- 5대 원칙을 충족하는 플래닝 인프라 구축
- Git을 Single Source of Truth로 활용
- 세션 간 연속성 확보

### 0.1 폴더 구조 생성
```
[ ] 0.1.1 planning-system/ 생성
    mkdir -p K:/PortableApps/genai/planning-system

    planning-system/
    ├── index.js              # 통합 CLI (node planning-system init)
    ├── checkpoint.js         # Phase 완료 시 상태 저장 + Git 커밋
    ├── restore.js            # 세션 시작 시 마지막 상태 복원
    ├── progress-tracker.js   # progress.json CRUD API
    ├── daily-logger.js       # 일일 작업 로그 기록
    ├── git-integration.js    # Git 자동화 (add, commit, push)
    ├── metrics.js            # 플랜 완료율, 소요 시간 통계 (NEW)
    ├── alert-system.js       # 정체/경고 알림 (NEW)
    └── template-engine.js    # 플랜 템플릿 시스템 (NEW)

[ ] 0.1.2 planning-log/ 생성
    mkdir -p K:/PortableApps/genai/planning-log/daily
    mkdir -p K:/PortableApps/genai/planning-log/milestones
    mkdir -p K:/PortableApps/genai/planning-log/metrics

    planning-log/
    ├── daily/
    │   └── 2026-01-19.json   # 일일 작업 로그
    ├── milestones/
    │   └── [milestone-id].json
    ├── metrics/
    │   └── weekly-report.json # 주간 메트릭스 (NEW)
    └── index.json            # 전체 플래닝 인덱스
```

### 0.2 progress.json 생성 (핵심 추적 파일)
```
[ ] 0.2.1 plans/floofy-sauteeing-alpaca-progress.json 생성

스키마:
{
  "$schema": "planning-progress-v1.0",
  "planId": "floofy-sauteeing-alpaca",
  "planFile": "plans/floofy-sauteeing-alpaca.md",
  "version": "3.0.0",
  "created": "2026-01-19T09:00:00Z",
  "lastModified": "2026-01-19T09:00:00Z",
  "status": "active",
  "currentPhase": "phase-0",
  "currentTask": "0.1.1",
  "phases": [
    {
      "id": "phase-0",
      "name": "플래닝 시스템 구축",
      "status": "in_progress",
      "startedAt": "2026-01-19T09:00:00Z",
      "estimatedMinutes": 45,
      "tasks": [
        {
          "id": "0.1.1",
          "title": "planning-system/ 폴더 생성",
          "status": "pending",
          "command": "mkdir -p planning-system",
          "verifiedBy": "ls -la planning-system/"
        }
        // ... 이하 모든 태스크
      ]
    }
    // ... Phase 1-5
  ],
  "metadata": {
    "totalTasks": 35,
    "completedTasks": 0,
    "progressPercent": 0,
    "estimatedTotalMinutes": 180,
    "actualTotalMinutes": 0
  },
  "alerts": [],
  "dependencies": {
    "phase-1": ["phase-0"],
    "phase-2": ["phase-1"],
    "phase-3": ["phase-1"],
    "phase-4": ["phase-3"],
    "phase-5": ["phase-4"]
  }
}
```

### 0.3 ACTIVE-PLAN.md 생성 (즉시 참조용)
```
[ ] 0.3.1 plans/ACTIVE-PLAN.md 생성

내용:
# Active Plan Reference
**Auto-updated by planning-system**

## Current Status
- **Plan**: floofy-sauteeing-alpaca (지속적 플래닝 시스템 + 시스템 정비)
- **Phase**: 0 - 플래닝 시스템 구축
- **Task**: 0.1.1 - planning-system/ 폴더 생성
- **Progress**: 0/35 tasks (0%)
- **Last Session**: 2026-01-19 09:00
- **Last Commit**: [pending]

## Quick Resume
다음 작업: `0.1.1 planning-system/ 폴더 생성`
명령어: `mkdir -p planning-system`
검증: `ls -la planning-system/`

## Files
- Plan: plans/floofy-sauteeing-alpaca.md
- Progress: plans/floofy-sauteeing-alpaca-progress.json
- Daily Log: planning-log/daily/2026-01-19.json
```

### 0.4 핵심 스크립트 구현

#### 0.4.1 checkpoint.js (Phase 완료 시 자동 실행)
```
[ ] 0.4.1 planning-system/checkpoint.js 구현

기능:
1. progress.json 상태 업데이트
2. daily/[date].json에 로그 추가
3. ACTIVE-PLAN.md 갱신
4. Git add + commit (메시지: "[PLAN] phase-X 완료: {phaseName}")
5. 마일스톤 달성 시 milestones/ 기록

사용:
node planning-system/checkpoint.js --plan floofy-sauteeing-alpaca --phase 0 --task 0.1.1 --status completed
```

#### 0.4.2 restore.js (세션 시작 시 자동 실행)
```
[ ] 0.4.2 planning-system/restore.js 구현

기능:
1. plans/ACTIVE-PLAN.md 읽기
2. 마지막 진행 상황 출력
3. 다음 작업 안내
4. 경고/알림 표시 (정체된 플랜 등)

사용:
node planning-system/restore.js

출력 예시:
[PLAN] 활성 플랜: floofy-sauteeing-alpaca
[PLAN] 현재 Phase: 0 - 플래닝 시스템 구축 (45% 완료)
[PLAN] 다음 작업: 0.4.1 checkpoint.js 구현
[!] 경고: Phase 0이 예상 시간(45분) 초과
```

### 0.5 .claude-hooks.json 확장
```
[ ] 0.5.1 plan-restore 훅 추가 (session-start)

추가할 훅:
{
  "hooks": {
    "PostToolUse": [
      // 기존 훅 유지...
      {
        "id": "plan-status-check",
        "matcher": {
          "toolNames": ["Read"]
        },
        "hook": {
          "command": "node planning-system/restore.js --quiet",
          "timeout": 5000
        }
      }
    ]
  }
}

[!] 주의: .claude-hooks.json 수정 시 기존 7개 훅 보존 필수
```

### 0.6 추가 고급 기능 (선택)

#### 0.6.1 metrics.js - 메트릭스 시스템
```
[ ] 0.6.1 planning-system/metrics.js 구현 (선택)

기능:
- 플랜별 완료율 통계
- Phase별 예상 vs 실제 소요 시간
- 주간/월간 리포트 자동 생성
- planning-log/metrics/weekly-report.json

사용:
node planning-system/metrics.js --report weekly
```

#### 0.6.2 alert-system.js - 경고 시스템
```
[ ] 0.6.2 planning-system/alert-system.js 구현 (선택)

경고 조건:
- 플랜 3일 이상 정체 시 경고
- Phase 예상 시간 2배 초과 시 경고
- 차단된(blocked) 태스크 존재 시 경고

출력:
[!] ALERT: 플랜 'floofy-sauteeing-alpaca' 정체 (3일)
[!] ALERT: Phase 0 예상 시간 초과 (45분 → 90분)
```

#### 0.6.3 template-engine.js - 템플릿 시스템
```
[ ] 0.6.3 planning-system/template-engine.js 구현 (선택)

기능:
- 자주 사용하는 플랜 템플릿 저장
- templates/feature-plan.json
- templates/bugfix-plan.json
- templates/refactor-plan.json

사용:
node planning-system/template-engine.js --create feature --name "새 기능 플랜"
```

### 0.7 Git 초기 커밋
```
[ ] 0.7.1 플래닝 시스템 인프라 커밋

git add planning-system/ planning-log/ plans/ACTIVE-PLAN.md plans/*-progress.json
git commit -m "[PLAN] Phase 0 완료: 플래닝 시스템 인프라 구축

- planning-system/ 모듈 추가 (checkpoint, restore, tracker)
- planning-log/ 로깅 구조 추가
- ACTIVE-PLAN.md 즉시 참조 문서 추가
- progress.json 진행 상황 트래커 추가

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 1: 정리 (Cleanup)

### 목표
- 중복 제거, 폐기 파일 정리
- 예상 절감: ~650KB
- 위험도: 낮음 (백업 후 진행)

### 의존성
- [x] Phase 0 완료 필수 (플래닝 시스템 있어야 추적 가능)

### 1.1 백업 폴더 생성
```
[ ] 1.1.1 backups/ 폴더 구조 생성
    mkdir -p backups/evidence-2025-08-20
    mkdir -p backups/deprecated-mcp
    mkdir -p archive/html-v1
    mkdir -p archive/examples

    검증: ls -la backups/ archive/
```

### 1.2 evidence/ 중복 정리
```
[ ] 1.2.1 중복 백업
    cp -r documentation/evidence/2025-08-20/ backups/evidence-2025-08-20/

[ ] 1.2.2 중복 삭제
    rm -rf documentation/evidence/2025-08-20/

[ ] 1.2.3 원본 존재 확인
    ls documentation/evidence/COMPLETE-TIMESTAMP-ANALYSIS.md
    # 파일 존재해야 삭제 안전

[CHECKPOINT] 1.2 완료 → checkpoint.js 실행
```

### 1.3 MCP 폐기 버전 정리
```
[ ] 1.3.1 firecrawl-stub 백업
    cp -r mcp-servers/firecrawl-stub/ backups/deprecated-mcp/

[ ] 1.3.2 firecrawl-stub 삭제
    rm -rf mcp-servers/firecrawl-stub/

[ ] 1.3.3 중복 백업 폴더 정리
    mv mcp-servers/firecrawl-self-hosted.backup-20251227/ backups/

[ ] 1.3.4 .claude.json 참조 확인
    grep -c "firecrawl-stub" .claude.json
    # 0이어야 안전 (참조 없음)

[CHECKPOINT] 1.3 완료 → checkpoint.js 실행
```

### 1.4 HTML v1 아카이브
```
[ ] 1.4.1 v1 파일 이동 (6개)
    mv ai-security-report.html archive/html-v1/
    mv ai-security-infographic.html archive/html-v1/
    mv ai-security-infographic-images.html archive/html-v1/
    mv ai-security-infographic-visual.html archive/html-v1/
    mv ai-security-mindmap.html archive/html-v1/
    mv ai-security-slides.html archive/html-v1/

[ ] 1.4.2 v2 유지 확인
    ls ai-security-*-v2.html
    # 4개 파일 존재해야 함

[CHECKPOINT] 1.4 완료 → checkpoint.js 실행
```

### 1.5 예제/데모 파일 아카이브
```
[ ] 1.5.1 데모 파일 이동 (7개)
    mv demo-crewai-agents.py archive/examples/
    mv demo-crewai-agents-ip.py archive/examples/
    mv demo-ollama-chat.py archive/examples/
    mv demo-ollama-chat-ip.py archive/examples/
    mv vmware-automation-example.py archive/examples/
    mv vm-playwright-example.py archive/examples/
    mv simple-playwright-test.js archive/examples/

[ ] 1.5.2 이동 확인
    ls archive/examples/
    # 7개 파일 존재

[CHECKPOINT] 1.5 완료 → checkpoint.js 실행
```

### 1.6 배치파일 정리
```
[ ] 1.6.1 start-scripts/ 생성
    mkdir -p start-scripts

[ ] 1.6.2 배치파일 이동 (13개)
    mv FIX-SHRIMP-LANGUAGE.bat start-scripts/
    mv fix-terminal-freeze.bat start-scripts/
    mv INSTALL-SUPABASE-SCHEDULER.bat start-scripts/
    mv PROTECT-CONFIG.bat start-scripts/
    mv RESTORE-CONFIG.bat start-scripts/
    mv SET-MINIMAL-OUTPUT.bat start-scripts/
    mv START-AUTO-BACKUP.bat start-scripts/
    mv START-DC-BACKUP.bat start-scripts/
    mv START-PODMAN.bat start-scripts/
    mv SUPABASE-KEEP-ALIVE.bat start-scripts/
    mv UPDATE-CLAUDE.bat start-scripts/
    mv VERIFY-KIRO-MEMORY.bat start-scripts/
    mv claude-clean.bat start-scripts/

[ ] 1.6.3 필수 배치파일 유지 확인
    ls claude.bat BACKUP-MANAGER.bat
    # 2개 파일 루트에 존재해야 함

[ ] 1.6.4 claude.bat 실행 테스트
    claude.bat --version

[CHECKPOINT] Phase 1 완료 → Git 커밋
git commit -m "[PLAN] Phase 1 완료: 정리 (Cleanup) - 650KB 절감"
```

---

## Phase 2: 통합 (Consolidation)

### 목표
- 분산된 정보 통합, 명명 표준화
- 위험도: 중간

### 2.1 firecrawl 명명 표준화
```
[ ] 2.1.1 활성 버전 확인
    ls -la mcp-servers/firecrawl-*/
    # firecrawl-self-hosted/ = 메인 (Docker)
    # firecrawl-simple/ = API 키 버전

[ ] 2.1.2 README.md 문서화
    # mcp-servers/README.md에 역할 명시
    ## Firecrawl Versions
    - firecrawl-self-hosted/: Docker 기반 self-hosted (메인)
    - firecrawl-simple/: API 키 기반 (백업/테스트용)

[CHECKPOINT] 2.1 완료 → checkpoint.js 실행
```

### 2.2 설정 파일 역할 명확화
```
[ ] 2.2.1 설정 파일 역할 문서화
    # SYSTEM-INVENTORY.md에 추가 (Phase 3에서 생성)

    ## 설정 파일 역할
    | 파일 | 역할 | 수정 권한 |
    |------|------|----------|
    | .claude.json | MCP 서버 40+ 정의 (메인) | 금지 |
    | .mcp.json | e2b 1개 정의 (확장용) | 허용 |
    | .claude-hooks.json | 훅 7개 정의 | 확장만 |

[CHECKPOINT] 2.2 완료 → checkpoint.js 실행
```

### 2.3 core-modules/ 중복 정리
```
[ ] 2.3.1 중복 확인
    diff documentation/core-modules/@bottom-up-paradigm.md .claude/rules/archive/bottom-up-paradigm.md

[ ] 2.3.2 중복 시 아카이브
    # 동일하면 documentation/ 버전 제거 (rules/에 보존)
    mv documentation/core-modules/@bottom-up-paradigm.md archive/

[CHECKPOINT] Phase 2 완료 → Git 커밋
git commit -m "[PLAN] Phase 2 완료: 통합 (Consolidation)"
```

---

## Phase 3: 문서화 (Documentation)

### 목표
- 현황 문서 생성
- 위험도: 없음 (신규 파일)

### 3.1 SYSTEM-INVENTORY.md 생성
```
[ ] 3.1.1 SYSTEM-INVENTORY.md 작성
    위치: K:/PortableApps/genai/SYSTEM-INVENTORY.md

내용:
# System Inventory v1.0.0
**Last Updated**: 2026-01-19 (자동 업데이트)
**Auto-refresh**: 세션 시작 시

## Quick Stats
| 항목 | 수량 |
|------|------|
| MCP Servers | 40+ |
| Skills | 19 |
| Commands | 59 (10 core + 30 library + 19 sc) |
| Rules | 11 (6 active + 5 archived) |
| Hooks | 7+ active |
| Total Size | ~7GB |

## Critical Files (절대 수정 금지)
| 파일 | 역할 | 훼손 시 영향 |
|------|------|-------------|
| .claude.json | MCP 서버 정의 | 전체 도구 사용 불가 |
| .claude-hooks.json | 훅 정의 | 자동화 중단 |
| CLAUDE.md | 핵심 지침 | 작업 일관성 상실 |
| atos/index.js | 도구 오케스트레이션 | 도구 추천 중단 |

## Active Plan
- **현재 플랜**: plans/ACTIVE-PLAN.md 참조
- **진행 상황**: plans/*-progress.json 참조

## Folder Map
[자동 생성 - ls 기반]

## Recent Changes
[Git log 기반 자동 업데이트]

## Health Status
[시스템 상태 체크 결과]

[CHECKPOINT] 3.1 완료 → checkpoint.js 실행
```

### 3.2 CLAUDE.md 참조 추가
```
[ ] 3.2.1 CLAUDE.md에 인벤토리 참조 추가

추가할 내용 (## 환경 정보 섹션에):
---
## [INV] 시스템 현황 참조
- **전체 현황**: SYSTEM-INVENTORY.md
- **활성 플랜**: plans/ACTIVE-PLAN.md
- **플래닝 시스템**: planning-system/
---

[CHECKPOINT] Phase 3 완료 → Git 커밋
git commit -m "[PLAN] Phase 3 완료: 문서화 (Documentation)"
```

---

## Phase 4: 자동화 (Automation)

### 목표
- 지속적 관리 시스템 완성
- 위험도: 중간 (훅 확장)

### 4.1 인벤토리 자동 업데이트
```
[ ] 4.1.1 systems/inventory-updater.js 구현

기능:
- SYSTEM-INVENTORY.md의 Last Updated 타임스탬프 갱신
- Quick Stats 자동 계산 (MCP 수, 스킬 수 등)
- Recent Changes 섹션 Git log 기반 업데이트

[ ] 4.1.2 .claude-hooks.json에 훅 추가
    # session-start 시 inventory-updater.js 실행

[CHECKPOINT] 4.1 완료 → checkpoint.js 실행
```

### 4.2 플래닝-Shrimp 동기화
```
[ ] 4.2.1 planning-system/shrimp-bridge.js 구현

기능:
- Phase 시작 시 Shrimp에 작업 등록
- Shrimp 작업 완료 시 progress.json 동기화
- 양방향 상태 일관성 유지

[ ] 4.2.2 동기화 테스트
    node planning-system/shrimp-bridge.js --test

[CHECKPOINT] Phase 4 완료 → Git 커밋
git commit -m "[PLAN] Phase 4 완료: 자동화 (Automation)"
```

---

## Phase 5: 검증 (Verification)

### 목표
- 전체 시스템 연결성 및 기능 테스트
- 위험도: 없음 (읽기 전용)

### 5.1 플래닝 시스템 검증
```
[ ] 5.1.1 restore.js 테스트
    node planning-system/restore.js
    # 현재 플랜 상태 정상 출력 확인

[ ] 5.1.2 checkpoint.js 테스트
    node planning-system/checkpoint.js --test
    # 상태 저장 + Git 커밋 정상 확인

[ ] 5.1.3 progress.json 정합성 확인
    node planning-system/progress-tracker.js --validate
    # 모든 필드 유효성 검사
```

### 5.2 훅 체인 테스트
```
[ ] 5.2.1 Docker 체커
    node systems/docker-checker.js
    # Docker 상태 정상 출력

[ ] 5.2.2 세션 복원
    node unified-task-system/session-restore.js
    # 세션 상태 정상 복원

[ ] 5.2.3 ATOS 초기화
    node atos/index.js init
    # 도구 레지스트리 정상 로드
```

### 5.3 MCP 서버 테스트
```
[ ] 5.3.1 MCP 연결 확인
    claude --mcp-debug 2>&1 | head -50
    # 40+ 서버 연결 확인

[ ] 5.3.2 삭제 파일 영향 확인
    grep -r "firecrawl-stub" .claude.json
    # 결과 없음 (참조 제거됨)

    grep -r "evidence/2025-08-20" .
    # 결과 없음 (참조 제거됨)
```

### 5.4 최종 기능 테스트
```
[ ] 5.4.1 세션 사이클 테스트
    # 세션 종료 → 재시작 → 플랜 상태 자동 복원 확인

[ ] 5.4.2 Git 이력 확인
    git log --oneline -10
    # Phase별 커밋 5개 이상 존재

[ ] 5.4.3 메트릭스 확인 (선택)
    node planning-system/metrics.js --report
    # 완료율, 소요 시간 통계 출력

[CHECKPOINT] Phase 5 완료 → 최종 Git 커밋
git commit -m "[PLAN] Phase 5 완료: 검증 (Verification) - 플랜 완료"
git tag v3.0.0-planning-system
```

---

## 의존성 그래프

```
Phase 0 (플래닝 시스템)
    │
    ├──→ Phase 1 (정리) ──→ Phase 2 (통합)
    │                            │
    │                            ├──→ Phase 3 (문서화)
    │                            │         │
    │                            │         ├──→ Phase 4 (자동화)
    │                            │         │         │
    │                            │         │         └──→ Phase 5 (검증)
    │                            │         │
    │                            │         └─── (병렬 가능)
    │                            │
    └─── (필수 선행)              └─── (선택적 선행)
```

---

## 예상 결과

| 항목 | 현재 | 완료 후 |
|------|------|---------|
| 플래닝 추적 | 수동/불완전 | 자동/완전 |
| 버전관리 | 산발적 | Phase별 자동 커밋 |
| 세션 연속성 | 불안정 | ACTIVE-PLAN.md 자동 복원 |
| 중복 파일 | ~650KB | 0KB |
| 루트 파일 수 | 140개 | ~100개 |
| 시스템 파악 시간 | 30분+ | 5분 (SYSTEM-INVENTORY) |

---

## 플랜 자체 평가

| 평가 기준 | 점수 | 근거 |
|----------|------|------|
| **구체성** | 10/10 | 모든 명령어, 경로, 검증 기준 명시 |
| **추적가능성** | 10/10 | progress.json + Git + daily log |
| **지속적 인지** | 10/10 | ACTIVE-PLAN.md + 세션 훅 |
| **버전관리** | 10/10 | Phase별 자동 Git 커밋 |
| **백업성** | 10/10 | 3중 백업 (로컬/Git/log) |

---

## 실행 시작 전 최종 확인

```
[x] 플랜 통합 완료 (v3.0.0)
[ ] Phase 0 시작 승인
[ ] 백업 폴더 생성 확인
[ ] 현재 시스템 정상 작동 확인
```

---

**플랜 버전**: 3.0.0 (통합)
**작성 완료**: 2026-01-19
**다음 단계**: 사용자 승인 후 Phase 0부터 순차 실행
**예상 총 소요 시간**: 3시간 (Phase 0-5 전체)
