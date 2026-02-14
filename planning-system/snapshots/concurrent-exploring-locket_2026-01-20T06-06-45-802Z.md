# Claude.bat 시작 지연 - 시스템 현황 분석 및 최적화 계획

## 최고 원칙
**"모든 변화는 기존 시스템과 연결성을 훼손하지 않는다"**

---

# Part 1: 현재 시스템 완전 현황

## 1. claude.bat 구조 (53줄)

### 실행 흐름
```
1. @echo off + setlocal
2. chcp 65001 (UTF-8)
3. 환경변수 17개 설정
   ├─ UTF-8: LANG, LC_ALL, LESSCHARSET, CHARSET (4개)
   ├─ Python: PYTHONIOENCODING, PYTHONUTF8 (2개)
   ├─ 경로: NPM_CONFIG_CACHE, PREFIX, USERCONFIG, TEMP, HOME (6개)
   └─ Claude: CLAUDE_HOME, CONFIG_FILE, DISABLE_HISTORY 등 (5개)
4. PATH 설정 (5단계 우선순위)
   └─ uv → nodejs → npm-global → git → system
5. .env 파일 로드 (API 키)
6. Node.js로 cli.js 실행
7. endlocal
```

### 환경변수 역할
| 변수 | 값 | 필수 여부 | 훼손 시 영향 |
|------|-----|----------|------------|
| NPM_CONFIG_CACHE | K:\...\npm-cache | 필수 | NPX 매번 다운로드 |
| HOME | K:\PortableApps\Claude-Code | 필수 | Git 설정 손실 |
| CLAUDE_CONFIG_FILE | .claude.json | 필수 | MCP 서버 로드 실패 |
| PATH | 5단계 경로 | 필수 | 도구 실행 실패 |

**결론**: claude.bat 자체는 최적화되어 있음 (지연 원인 아님)

---

## 2. MCP 서버 현황 (41개)

### 서버 분류
| 카테고리 | 개수 | 서버 목록 |
|---------|------|----------|
| Node.js 직접 | 11개 | filesystem, memory, shrimp-task, git-mcp, edit-file-lines, desktop-commander, n8n, sequential-thinking, deep-research, multi-ai |
| NPX 기반 | 15개 | github, firecrawl, crawl4ai-lite, websearch, youtube-data, sqlite, context7, one-search, playwright, supabase, antv-chart, hfspace, task-master-ai, mcp-installer |
| Python 기반 | 11개 | scrapegraph-local, kiro-memory, image-recognition, paddleocr, marker, zen-mcp, llm-council, paper-search (uv), serena (uvx), vibekanban |
| Docker 기반 | 1개 | searxng-crawl4ai |

### 초기화 시간 분석
| 타입 | 서버 수 | 평균 시간 | 총 영향 |
|------|--------|----------|--------|
| NPX 기반 | 15개 | 200-500ms | **3-7.5초** |
| Python 기반 | 11개 | 300-2000ms | **3-10초** |
| Docker 기반 | 1개 | 2-60초 | **2-60초** |
| Node.js 직접 | 11개 | 100-300ms | **1-3초** |

### MCP 서버 의존 관계
```
필수 (5개) - 비활성화 불가:
├─ filesystem / desktop-commander (파일 I/O)
├─ memory / kiro-memory (컨텍스트 관리)
├─ sequential-thinking (사고 기반)
├─ shrimp-task (작업 관리)
└─ github (소스 저장소)

권장 (7개) - 대부분 작업에 필요:
├─ firecrawl / one-search (웹 검색)
├─ edit-file-lines (정밀 편집)
├─ git-mcp (버전 관리)
├─ image-recognition (문서 분석)
├─ deep-research-mcp (리서치)
└─ multi-ai-orchestration (AI 통합)

선택적 (29개) - 특수 목적:
├─ playwright (브라우저)
├─ vibekanban (칸반)
├─ paddleocr-mcp (OCR)
└─ ... 기타
```

---

## 3. Hook 시스템 현황 (12개)

### Hook 실행 순서
```
Session Start (3개, 순차 실행):
├─ [1] docker-check    [HIGHEST] → 2-60초 (바쁜대기)
├─ [2] session-start   [HIGH]    → 0.5초
└─ [3] atos-init       [HIGH]    → 5-10초

Before Response (3개):
├─ self-trigger        [HIGH]    → 0.5초
├─ atos-recommend      [MEDIUM]  → 0.5초
└─ context-detection   [MEDIUM]  → 0.5초

After Tool Call (1개):
└─ atos-track          [LOW]     → 0.2초

Session End (2개):
├─ atos-learn          [MEDIUM]  → 2초
└─ session-end         [HIGH]    → 1초
```

### Hook 연결 관계 (의존성)
```
docker-check
├─ 실행: systems/docker-checker.js
├─ 영향: firecrawl, searxng-crawl4ai MCP 서버
└─ 비활성화 시: Docker 기반 MCP 수동 시작 필요

session-start
├─ 실행: unified-task-system/session-restore.js
├─ 영향: 후속조치 자동 복원
└─ 비활성화 시: 이전 세션 작업 수동 확인 필요

atos-init
├─ 실행: atos/index.js init
├─ 영향: 도구 추천, 자동 발견
└─ 비활성화 시: 도구 추천 기능 미작동
```

---

## 4. ATOS 시스템 현황 (32개 파일)

### 핵심 모듈 (항상 로드)
| 모듈 | 라인 | 역할 | 초기화 시간 |
|------|------|------|-----------|
| load-tracker.js | 269 | 중복 로드 방지 | 0.1ms |
| bootstrap-loader.js | 226 | 지연 로딩 오케스트레이션 | 1.2ms |
| self-trigger/index.js | 303 | 실시간 키워드 감지 | 0.4ms |

### On-Demand 모듈 (키워드 트리거 시 로드)
| 모듈 | 라인 | 트리거 키워드 |
|------|------|-------------|
| context-analyzer.js | 500+ | 분석, analyze |
| recommendation-engine.js | 1032 | 추천, recommend |
| auto-discovery.js | 1300+ | 발견, discover |
| fic-manager.js | 327 | 압축, compact |
| feedback-loop.js | 725 | 학습, learn |

### 파일 I/O 패턴
```
동기 읽기 (블로킹):
├─ module-index.json (2KB) - 부트스트랩 시
├─ tool-index.json (2KB) - 부트스트랩 시
├─ tool-registry.json (50KB) - 키워드 매칭 시
└─ unified-triggers.json (592줄) - STL 매칭 시

동기 쓰기 (블로킹):
├─ load-tracker-session.json - 세션 종료 시
├─ fic-stats.json - 압축 작업 시
└─ discovery-log.json - 자동 발견 시
```

---

## 5. systems 폴더 현황 (23개 파일)

### 주요 파일 역할
| 파일 | 라인 | 역할 | Hook 연결 |
|------|------|------|----------|
| docker-checker.js | 300+ | Docker 자동 시작 | session-start [HIGHEST] |
| anomaly-detector.js | 400+ | 이상 감지 | 없음 (수동) |
| auto-executor.js | 350+ | 자동 실행 | 없음 (수동) |
| context-monitor.js | 280+ | 컨텍스트 감지 | context-detection |
| date-validator-hook.js | 200+ | 날짜 오류 감지 | file-save, pre-commit |

### docker-checker.js 상세 분석 (병목 핵심)
```javascript
// 문제 코드 위치: 라인 80-87, 224-227
while (Date.now() < waitUntil) {
  // 바쁜대기 - CPU 100% 사용
  // 2초 간격으로 docker info 재시도
  // 최대 60초까지 대기
}

// 영향:
// - Docker Desktop 미실행 시 최대 60초 블로킹
// - CPU 사용량 급증
// - 다른 Hook 실행 지연
```

---

## 6. unified-task-system 현황 (8개 JS + 4개 JSON)

### 모듈 구조
```
unified-task-system/
├─ index.js (340줄) - 메인 오케스트레이션
├─ task-manager.js (392줄) - 작업 상태 관리
├─ session-restore.js (135줄) - 세션 복원
├─ session-persist.js (205줄) - 세션 저장
├─ shrimp-adapter.js (380줄) - Shrimp 동기화
├─ kiro-adapter.js (513줄) - kiro-memory 동기화
├─ status-reporter.js (362줄) - 상태 보고
├─ trigger-detector.js (455줄) - 키워드 감지
└─ 데이터 파일:
   ├─ session-state.json
   ├─ tasks.json
   ├─ triggers.json
   └─ kiro-cache.json
```

### Hook 연결
```
session-start Hook
└─ session-restore.js
   ├─ session-state.json 로드
   ├─ 새 세션 ID 생성
   └─ 후속조치 표시

session-end Hook
└─ session-persist.js
   ├─ 현재 상태 로드
   ├─ 통계 계산
   └─ session-state.json 저장
```

---

# Part 2: 시작 지연 근본 원인 분석

## 지연 요인 랭킹

| 순위 | 원인 | 지연 시간 | 위치 | 의존 시스템 |
|------|------|----------|------|-----------|
| **1** | Docker 바쁜대기 | **최대 60초** | systems/docker-checker.js | firecrawl, searxng MCP |
| **2** | MCP 서버 41개 초기화 | **10-25초** | .claude.json | 모든 MCP 도구 |
| **3** | ATOS 동기 파일 I/O | **5-10초** | atos/index.js | 도구 추천, 자동 발견 |
| **4** | Hook 순차 실행 | **3-7초** | .claude-hooks.json | 세션 복원, 상태 저장 |
| **5** | NPX 캐시 미스 | **3-5초** | npm 설정 | NPX 기반 MCP 15개 |

## 총 예상 시작 시간
- **최악 (Docker 콜드스타트)**: 60-120초
- **보통 (Docker 실행 중)**: 15-30초
- **최적 (모든 캐시 활성)**: 5-10초

---

# Part 3: 최적화 계획 (안전 우선)

## Phase 1: 비파괴적 최적화 (환경변수만)

### 1.1 NPX 캐시 강화
**변경**: claude.bat에 2줄 추가

```batch
set NPM_CONFIG_PREFER_OFFLINE=true
set NPM_CONFIG_UPDATE_NOTIFIER=false
```

**영향도 분석**:
| 항목 | 평가 | 상세 |
|------|------|------|
| 기존 기능 | 유지 | 환경변수 추가만 |
| MCP 연결성 | 유지 | NPX 서버 정상 작동 |
| 연결된 시스템 | 없음 | 독립적 설정 |
| 롤백 | 쉬움 | 해당 줄 삭제 |

**예상 효과**: 3-5초 절감

---

## Phase 2: 안전한 코드 개선

### 2.1 Docker 바쁜대기 → 비동기 대기

**현재 코드** (systems/docker-checker.js):
```javascript
// 라인 80-87, 224-227
while (Date.now() < waitUntil) {
  // 바쁜대기 - CPU 100%
}
```

**개선 코드**:
```javascript
// 비동기 대기 - CPU 거의 0%
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await sleep(2000);  // 2초 대기
```

**영향도 분석**:
| 항목 | 평가 | 상세 |
|------|------|------|
| Docker 자동 시작 | **유지** | 기능 동일 |
| firecrawl MCP | **유지** | 연결 정상 |
| searxng MCP | **유지** | 연결 정상 |
| CPU 사용량 | **개선** | 100% → 0% |
| session-start Hook | **유지** | 실행 순서 동일 |
| 롤백 | 쉬움 | 백업 파일 복원 |

**연결된 시스템**:
```
docker-checker.js
├─ .claude-hooks.json (session-start Hook)
├─ firecrawl MCP 서버
├─ searxng-crawl4ai MCP 서버
└─ one_* 도구들 (one_search, one_scrape)
```

**예상 효과**: CPU 사용량 감소, 체감 응답성 향상

---

### 2.2 ATOS 백그라운드 초기화

**현재**: 세션 시작 시 동기 초기화 (차단)
**개선**: 백그라운드 비동기 초기화 (비차단)

**영향도 분석**:
| 항목 | 평가 | 상세 |
|------|------|------|
| 도구 추천 | **유지** | 초기화 완료 후 동일 |
| 자동 발견 | **유지** | 백그라운드 실행 |
| 키워드 감지 | **유지** | STL 정상 작동 |
| 첫 추천 시점 | **지연 가능** | 1-2초 지연 |
| 롤백 | 쉬움 | 백업 파일 복원 |

**연결된 시스템**:
```
atos/index.js
├─ .claude-hooks.json (atos-init Hook)
├─ bootstrap-loader.js
├─ load-tracker.js
├─ recommendation-engine.js
├─ context-analyzer.js
├─ auto-discovery.js
└─ unified-triggers.json
```

**예상 효과**: 5-10초 절감

---

## 변경 사항 요약 (시스템 훼손 검증)

| 변경 | 수정 파일 | 연결 시스템 | 기능 훼손 | 연결성 훼손 | 롤백 |
|------|----------|-----------|----------|------------|------|
| NPX 캐시 | claude.bat | NPX MCP 15개 | 없음 | 없음 | O |
| Docker 비동기 | docker-checker.js | Hook, firecrawl, searxng | 없음 | 없음 | O |
| ATOS 백그라운드 | atos/index.js | Hook, 추천 시스템 | 없음 | 없음 | O |

---

# Part 4: 백업 및 롤백 절차

## 백업 명령 (수정 전 필수)

```powershell
# 백업 폴더 생성
mkdir "K:\PortableApps\Claude-Code\backups\startup-optimization-20260117" -Force

# 1. claude.bat 백업
copy "K:\PortableApps\Claude-Code\claude.bat" `
     "K:\PortableApps\Claude-Code\backups\startup-optimization-20260117\claude.bat.backup"

# 2. docker-checker.js 백업
copy "K:\PortableApps\Claude-Code\systems\docker-checker.js" `
     "K:\PortableApps\Claude-Code\backups\startup-optimization-20260117\docker-checker.js.backup"

# 3. atos/index.js 백업
copy "K:\PortableApps\Claude-Code\atos\index.js" `
     "K:\PortableApps\Claude-Code\backups\startup-optimization-20260117\atos-index.js.backup"
```

## 롤백 명령 (문제 발생 시)

```powershell
# 전체 롤백
copy "K:\PortableApps\Claude-Code\backups\startup-optimization-20260117\claude.bat.backup" `
     "K:\PortableApps\Claude-Code\claude.bat"
copy "K:\PortableApps\Claude-Code\backups\startup-optimization-20260117\docker-checker.js.backup" `
     "K:\PortableApps\Claude-Code\systems\docker-checker.js"
copy "K:\PortableApps\Claude-Code\backups\startup-optimization-20260117\atos-index.js.backup" `
     "K:\PortableApps\Claude-Code\atos\index.js"
```

---

# Part 5: 검증 방법

## 시작 시간 측정

```powershell
# 수정 전 측정
Measure-Command { cmd /c "K:\PortableApps\Claude-Code\claude.bat --version" }

# 수정 후 측정 (동일 명령)
Measure-Command { cmd /c "K:\PortableApps\Claude-Code\claude.bat --version" }
```

## 기능 검증 체크리스트

- [ ] claude.bat 정상 실행
- [ ] MCP 도구 정상 작동
  - [ ] filesystem / desktop-commander
  - [ ] github
  - [ ] shrimp-task
- [ ] Docker 기반 MCP 정상
  - [ ] firecrawl_search
  - [ ] one_search
- [ ] Hook 정상 실행
  - [ ] session-start (후속조치 복원)
  - [ ] session-end (상태 저장)
- [ ] ATOS 기능 정상
  - [ ] 도구 추천
  - [ ] 자동 발견

---

# Part 6: 예상 결과

| 단계 | 시작 시간 | 기능 훼손 | 연결성 훼손 |
|------|----------|----------|------------|
| 현재 | 15-120초 | - | - |
| Phase 1 완료 | 12-115초 | 없음 | 없음 |
| Phase 2 완료 | 5-15초 | 없음 | 없음 |

**목표**: 15-120초 → 5-15초 (60-80% 개선)

---

# Part 7: 사용자 확인 필요 사항

1. **백업 위치**: `K:\PortableApps\Claude-Code\backups\startup-optimization-20260117\`
2. **적용 범위**: Phase 1만? Phase 1+2 함께?
3. **Docker 동작**: 백그라운드 실행 시 첫 firecrawl 호출 지연 허용?
