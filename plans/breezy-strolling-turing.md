# Plan Ecosystem Dashboard

> **플랜 ID**: breezy-strolling-turing-v2
> **생성일**: 2026-02-04
> **업데이트**: 2026-02-04 (Phase 3 진행)
> **목적**: 플랜과 구현으로 누적된 시스템/생태계를 구조적으로 확인하는 대시보드 구축

---

## 진행 상태

| Phase | 상태 | 설명 |
|-------|------|------|
| Phase 1 | [x] 완료 | MVP 서버 구축 |
| Phase 2 | [x] 완료 | 실시간 업데이트 |
| Phase 3 | [ ] 진행 중 | 시각화 + 날짜 표시 + 자동 시작 |
| Phase 4 | [ ] 대기 | 검색 및 고급 기능 |
| Phase 5 | [ ] 대기 | 테스트 및 검증 |

---

## 목표

플랜, 구현, 산출물의 누적 현황을 **로컬호스트 웹 페이지**로 확인할 수 있는 시스템 구축

### 핵심 요구사항
1. 플랜 타임라인 (생성 -> 진행 -> 완료)
2. 구현 산출물 목록 (문서, 코드, 설정)
3. 시스템 생태계 맵 (MCP, Hook, 스킬 관계)
4. 통합 검색 및 크롤링
5. 실시간 업데이트 (파일 감시)

---

## 아키텍처

```
Browser (localhost:3030)
    |
    | REST API + WebSocket
    v
Express.js Server
    |
    | File Watcher (chokidar)
    v
File System
- plans/              # 플랜 파일
- planning-log/       # 일일 로그
- ShrimpData/         # 작업 목록
- documentation/      # 산출물
```

---

## Phase 1: MVP 서버 구축 [완료]

### Task 1.1: 프로젝트 구조 생성
- [x] `dashboard/plan-ecosystem/` 폴더 생성
- [x] `dashboard/plan-ecosystem/server.js` - Express 서버
- [x] `dashboard/plan-ecosystem/package.json` - 의존성
- [x] `dashboard/plan-ecosystem/public/index.html` - 기본 UI

### Task 1.2: 데이터 수집기 구현
- [x] `dashboard/plan-ecosystem/collectors/plan-collector.js`
- [x] `dashboard/plan-ecosystem/collectors/log-collector.js`

### Task 1.3: REST API 구현
- [x] GET /api/plans, /api/plans/:id, /api/logs, /api/stats

### Task 1.4: 기본 UI 구현
- [x] 플랜 목록, 상태별 필터, 진행률 표시

---

## Phase 2: 실시간 업데이트 [완료]

- [x] chokidar 파일 감시
- [x] Socket.io WebSocket 연결
- [x] Activity 피드

---

## Phase 3: 고도화 + 자동 시작 [진행 중]

### Task 3.1: 날짜 표시 추가 (UI 개선)
- [ ] 플랜 목록에 생성일/수정일 표시
- [ ] 상대 시간 표시 (예: "2시간 전")
- [ ] 날짜순 정렬 옵션

### Task 3.2: 플랜 상세 분석 (빈 플랜 탐지)
- [ ] 플랜 내용 분석 로직 추가
  - 체크박스 개수
  - 본문 길이
  - Phase 정의 여부
- [ ] "빈 플랜" 경고 표시 (내용 부족 시)
- [ ] 구현 상태 표시 (Empty/Draft/Active/Complete)

### Task 3.3: Claude Code 시작 시 자동 열기
- [ ] `.claude-hooks.json`에 SessionStart hook 추가
- [ ] 서버 자동 시작 스크립트
- [ ] 브라우저 자동 열기 (start http://localhost:3030)

### Task 3.4: 통계 차트 개선
- [ ] 진행률 도넛 차트 (이미 구현됨)
- [ ] 일별/주별 활동 바 차트 추가

---

## Phase 4: 검색 및 고급 기능 [추후]

- [ ] Fuse.js 퍼지 검색
- [ ] documentation/ 폴더 트리
- [ ] Markdown 프리뷰

---

## Phase 5: 테스트 및 검증

- [ ] 서버 시작 확인 (localhost:3030)
- [ ] 날짜 표시 확인
- [ ] 빈 플랜 탐지 확인
- [ ] 자동 시작 Hook 확인

---

## 기술 스택

| 구성요소 | 선택 | 이유 |
|---------|------|------|
| 서버 | Express.js | 단순함, Node.js 환경 |
| 프론트엔드 | Vanilla JS + Tailwind | 빌드 없이 즉시 실행 |
| 파일 감시 | chokidar | 실시간 변경 감지 |
| 검색 | Fuse.js | 클라이언트 퍼지 검색 |
| 차트 | Chart.js | 설정 간단 |
| 실시간 | Socket.io | WebSocket 추상화 |

---

## 핵심 파일

### 데이터 소스
- `plans/*.md` - 활성 플랜
- `plans/completed/*.md` - 완료 플랜
- `plans/*-progress.json` - 진행 상황
- `planning-log/daily/*.json` - 일일 로그
- `ShrimpData/tasks/current-tasks.json` - 작업 목록
- `documentation/guides/*.md` - 산출물

### 생성할 파일
- `dashboard/server.js`
- `dashboard/collectors/*.js`
- `dashboard/public/index.html`
- `dashboard/public/js/app.js`
- `dashboard/package.json`

---

## 검증 계획

### 서버 시작
```bash
cd K:/PortableApps/genai/dashboard
node server.js
# http://localhost:3030 접속
```

### API 테스트
```bash
curl http://localhost:3030/api/plans
curl http://localhost:3030/api/stats
```

### 실시간 테스트
1. 브라우저에서 대시보드 열기
2. plans/ 폴더에 파일 수정
3. 대시보드에서 실시간 반영 확인

---

## 우선순위

| 순위 | 기능 | Phase |
|------|------|-------|
| P0 | 플랜 목록 표시 | 1 |
| P0 | 파일 감시 | 2 |
| P1 | 통계 표시 | 1 |
| P1 | 실시간 업데이트 | 2 |
| P2 | 타임라인 차트 | 3 |
| P2 | 통합 검색 | 4 |
| P3 | 생태계 맵 | 3 |

---

## 지속적 운영 방안

1. **자동 시작**: 세션 시작 Hook에 대시보드 서버 시작 + 브라우저 열기
2. **백그라운드 실행**: 배치 스크립트로 관리
3. **데이터 축적**: 일일 로그 자동 수집 (기존 시스템 활용)

---

## Phase 3 구현 계획 (즉시 실행)

### 수정 파일
1. `dashboard/plan-ecosystem/collectors/plan-collector.js`
   - 날짜 정보 추가 (createdAt, updatedAt)
   - 플랜 상태 분석 로직 (isEmpty, isDraft, hasPhases)

2. `dashboard/plan-ecosystem/public/index.html`
   - 날짜 컬럼 추가
   - 빈 플랜 경고 배지

3. `dashboard/plan-ecosystem/public/js/app.js`
   - 상대 시간 포매팅 (timeago)
   - 날짜순 정렬

4. `.claude-hooks.json`
   - SessionStart hook 추가 (서버 시작 + 브라우저 열기)

### 검증
```bash
# 서버 시작 확인
curl http://localhost:3030/api/plans | jq '.plans[0] | {id, title, createdAt, status}'

# 자동 시작 테스트
# 새 터미널에서 claude 시작 시 대시보드 열림 확인
```
