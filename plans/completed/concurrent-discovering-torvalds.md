# ATOS Plan Management System

**생성일**: 2025-12-16
**상태**: completed
**완료일**: 2025-12-16
**목표**: ATOS에 플랜 관리 기능 추가 (상태 추적, 분리 저장, 아카이브)
**분석 방법**: ultrathink + ATOS 구조 분석

---

## [*] Executive Summary

### 문제점
| 항목 | 현재 상태 | 문제 |
|------|----------|------|
| plans/ 폴더 | 26-27개 플랜 혼재 | 상태 구분 없음 |
| watchers.json | 8개 경로 감시 | **plans/ 미포함** |
| 플랜 레지스트리 | 없음 | 메타데이터 추적 불가 |
| 플랜 생성 | 덮어쓰기 | 기존 플랜 손실 위험 |

### 해결책
1. **plan-registry.json** 생성 - 플랜 메타데이터 및 상태 추적
2. **watchers.json** 업데이트 - plans/ 감시 추가
3. **폴더 구조** 개선 - completed/, archived/ 하위 폴더
4. **auto-discovery.js** 확장 - registerPlan 함수 추가

### 완료된 이전 플랜
- **Node.js 업그레이드** (v20.18.1 → v20.19.6): 구현 완료, 아카이브 대상

---

## [+] ATOS 시스템 분석 결과

### ATOS = Active Tool Orchestration System

| 파일 | 기능 | 줄 수 |
|------|------|-------|
| index.js | 메인 오케스트레이터 | 523 |
| auto-discovery.js | 자동 감지 시스템 | 600 |
| context-analyzer.js | Intent/Entity 분석 | 400 |
| recommendation-engine.js | 점수 기반 추천 | 550 |
| execution-monitor.js | 실행 추적 | 450 |
| feedback-loop.js | 학습 및 진화 | 500 |
| tool-registry.json | 도구 레지스트리 | 500 |
| watchers.json | 감시 설정 | 150 |
| usage-stats.json | 사용 통계 | 100 |

### 현재 등록 현황
- **28개** MCP 서버
- **4개** Skills
- **3개** Workflows
- **2개** Agents

---

## [!!!] 구현 계획 (5 Phases)

### Phase 1: plan-registry.json 생성

**위치**: `K:\PortableApps\Claude-Code\atos\plan-registry.json`

```json
{
  "version": "1.0.0",
  "lastUpdated": null,
  "description": "ATOS 플랜 관리 레지스트리",

  "plans": {},

  "statusCounts": {
    "draft": 0,
    "in-progress": 0,
    "completed": 0,
    "archived": 0,
    "total": 0
  },

  "categories": {
    "workflow": { "count": 0, "description": "워크플로우 정의" },
    "feature": { "count": 0, "description": "기능 구현" },
    "bugfix": { "count": 0, "description": "버그 수정" },
    "refactor": { "count": 0, "description": "리팩토링" },
    "documentation": { "count": 0, "description": "문서화" },
    "research": { "count": 0, "description": "조사/분석" },
    "upgrade": { "count": 0, "description": "업그레이드" }
  },

  "settings": {
    "autoArchiveCompletedDays": 7,
    "autoDetectStatus": true,
    "preserveVersions": true,
    "maxVersions": 5
  }
}
```

### Phase 2: watchers.json 업데이트

**추가할 감시 경로**:

```json
{
  "id": "plans",
  "path": "plans/*.md",
  "type": "plan",
  "pattern": "glob",
  "onDetect": "registerPlan",
  "description": "새 플랜 파일 감지",
  "priority": "high"
},
{
  "id": "plans-completed",
  "path": "plans/completed/*.md",
  "type": "plan-archived",
  "pattern": "glob",
  "onDetect": "registerArchivedPlan",
  "description": "완료된 플랜 감지",
  "priority": "low"
}
```

**planSettings 추가**:

```json
"planSettings": {
  "statusKeywords": {
    "draft": ["draft", "wip", "todo", "proposed", "구상"],
    "in-progress": ["in-progress", "ongoing", "active", "진행중"],
    "completed": ["completed", "done", "finished", "완료"],
    "archived": ["archived", "deprecated", "아카이브"]
  },
  "autoStatusDetection": true,
  "titleExtraction": "first-h1"
}
```

### Phase 3: 폴더 구조 생성

```
K:\PortableApps\Claude-Code\plans\
  ├── *.md                    # 활성 플랜 (draft, in-progress)
  ├── completed/              # 완료된 플랜 (새로 생성)
  │   └── *.md
  └── archived/               # 아카이브된 플랜 (새로 생성)
      └── *.md
```

### Phase 4: auto-discovery.js 확장

**추가할 함수들**:

```javascript
// 1. 플랜 메타데이터 추출
function extractPlanMetadata(planPath) {
  // - 첫 H1을 제목으로
  // - 상태 키워드 감지
  // - Phase/Step 감지
  // - 태그 추출
  // - 체크섬 생성
}

// 2. 플랜 상태 자동 감지
function detectPlanStatus(content) {
  // - 명시적 상태 확인
  // - 체크박스 완료율 기반 추론
}

// 3. 플랜 등록
function registerPlan(planPath, source) {
  // - 메타데이터 추출
  // - plan-registry.json 업데이트
  // - 통계 업데이트
}

// 4. 플랜 상태 변경
function updatePlanStatus(planName, newStatus) {
  // - 상태 전이 검증
  // - 파일 이동 (completed → completed/)
  // - 레지스트리 업데이트
}
```

### Phase 5: 기존 플랜 마이그레이션

1. **스캔**: plans/ 폴더의 모든 .md 파일
2. **분석**: 상태 자동 감지 (체크박스 완료율)
3. **등록**: plan-registry.json에 등록
4. **분류**: completed 상태 → plans/completed/ 이동

**예상 분류 결과**:
| 플랜 | 예상 상태 |
|------|----------|
| humble-orbiting-tome.md | in-progress (마스터 플랜) |
| cleanup-analysis-report.md | completed |
| concurrent-discovering-torvalds.md | completed (Node.js 업그레이드) |

---

## [=] 상태 전이 규칙

```
                    ┌──────────────┐
                    │    draft     │  (구상)
                    └──────┬───────┘
                           │ start()
                           ▼
                    ┌──────────────┐
                    │ in-progress  │◄────┐ (진행중)
                    └──────┬───────┘     │
                           │ complete()  │ reopen()
                           ▼             │
                    ┌──────────────┐     │
                    │  completed   │─────┘ (완료)
                    └──────┬───────┘
                           │ archive() (7일 후 자동)
                           ▼
                    ┌──────────────┐
                    │   archived   │  (아카이브)
                    └──────────────┘
```

---

## [참조] Critical Files

| 파일 | 역할 | 작업 |
|------|------|------|
| `atos/plan-registry.json` | 플랜 레지스트리 | **신규 생성** |
| `atos/watchers.json` | 감시 설정 | 수정 (plans/ 추가) |
| `atos/auto-discovery.js` | 자동 감지 | 수정 (registerPlan 추가) |
| `atos/index.js` | CLI 명령어 | 수정 (plan 명령어 추가) |
| `plans/completed/` | 완료 플랜 폴더 | **신규 생성** |
| `plans/archived/` | 아카이브 폴더 | **신규 생성** |

---

## [!] 구현 순서 체크리스트

- [x] Phase 1: plan-registry.json 생성 ✓
- [x] Phase 2: watchers.json 업데이트 ✓
- [x] Phase 3: 폴더 구조 생성 (completed/, archived/) ✓
- [x] Phase 4: auto-discovery.js 확장 (12개 함수 추가) ✓
- [x] Phase 5: 기존 플랜 마이그레이션 (27개 플랜 등록) ✓

### 구현 결과 요약 (2025-12-16)
| 항목 | 결과 |
|------|------|
| plan-registry.json | 생성 완료, 27개 플랜 등록 |
| watchers.json | plans/ 감시 경로 4개 추가 |
| 폴더 구조 | completed/, archived/ 생성 |
| auto-discovery.js | 12개 플랜 관리 함수 추가 |
| 상태 분포 | draft(23), in-progress(4), completed(1) |

---

## [+] 예상 효과

1. **플랜 상태 추적**: draft/in-progress/completed/archived 구분
2. **분리 저장**: 새 플랜 생성 시 기존 플랜 보존
3. **자동 감지**: plans/ 변경 시 자동 등록
4. **아카이브**: 완료 플랜 7일 후 자동 아카이브
5. **검색/조회**: 상태별, 카테고리별 플랜 검색

---

**작성자**: Claude (Plan Mode)
**분석 근거**: ATOS 구조 탐색 (6 JS + 3 JSON 파일)
