# Plan: AI Stack Monitor 통합 심층 분석

## 분석 방법
- **CoT/ToT 사고과정**: 3개 브랜치 병렬 평가
- **웹 리서치**: 마이크로서비스 아키텍처, Single Pane of Glass 전략
- **5가지 관점 점수화**: UX, 유지보수성, 성능, 확장성, 개발비용

---

## 핵심 발견: 근본적 충돌

### AI Stack Monitor의 핵심 기능
```javascript
// 호스트 시스템 명령어 실행 (Docker 내에서 불가능)
execCommand('K:/PortableApps/tools/nodejs/npm.cmd list --depth=0');
execCommand('K:/PortableApps/tools/python/python.exe -m pip show ...');
```

### Docker 환경과의 충돌
| 기능 | 네이티브 Node.js | Docker 컨테이너 |
|------|-----------------|-----------------|
| npm 패키지 조회 | O (직접 실행) | X (격리됨) |
| pip 패키지 조회 | O (직접 실행) | X (격리됨) |
| 서비스 헬스체크 | O (localhost) | △ (네트워크 설정 필요) |
| MCP 상태 조회 | O | △ |

**결론**: 통합할수록 이 문제 해결 복잡도가 기하급수적으로 증가

---

## ToT 분석 결과 (점수화)

### 점수표

| 관점 | Branch 1 (최소) | Branch 2 (중간) | Branch 3 (최대) |
|------|----------------|----------------|----------------|
| **UX** | 5 | 8 | 9 |
| **유지보수성** | 8 | 6 | 4 |
| **성능** | 7 | 6 | 5 |
| **확장성** | 6 | 8 | 5 |
| **개발비용** | 9 | 4 | 2 |
| **총점** | **35/50** | **32/50** | **25/50** |

### 각 브랜치 설명

#### Branch 1: 최소 통합 (현재 유지) - 35점
```
[cmd 창] AI Stack Monitor (:13579) - Docker 불필요
[Docker] Plan Ecosystem (:7847) - 플러그인 시스템
```
- 장점: 안정성, Docker 독립, 장애 격리
- 단점: 2개 URL, cmd 창 관리

#### Branch 2: 중간 통합 (플러그인/프록시) - 32점
```
[Docker] Plan Ecosystem (:7847)
    └── /api/plugins/ai-stack-monitor/* (통합)
```
- 장점: 단일 포트, 확장성
- 단점: 호스트 명령어 문제 미해결, Docker 의존

#### Branch 3: 최대 통합 (완전 병합) - 25점
```
[단일 서버] Unified Dashboard (:7847)
```
- 장점: 완전 통합 UX
- 단점: 대규모 리팩토링, 호스트 명령어 문제 심각

---

## 웹 리서치 인사이트

### 2025년 트렌드
- **모듈러 모놀리스**: 마이크로서비스 + 모놀리식 장점 결합
- **Single Pane of Glass**: 데이터 중앙화가 아닌 "뷰 중앙화"

### Grafana 전략
> "데이터를 백엔드로 수집하는 대신, 기존 데이터가 있는 곳에서 통합"

### 개발 환경 권장
| 상황 | 권장 |
|------|------|
| 단일 개발자 | 네이티브 Node.js |
| 다중 서비스 | Docker Compose |
| 포터블 환경 | **네이티브 우선** |

---

## 숨겨진 고려사항

### 1. 포터블 환경 철학
K드라이브 포터블 환경에서 Docker 의존성은 휴대성 저하

### 2. 사용 빈도 차이
- Plan Ecosystem: 상시 사용 (플랜/태스크 추적)
- AI Stack Monitor: 가끔 사용 (패키지 버전 확인)

### 3. 진화 속도 차이
- Plan Ecosystem: 빠르게 확장 중 (v4.0+)
- AI Stack Monitor: 안정적, 큰 변화 없음

### 4. 장애 격리
통합할수록 단일 장애점(SPOF) 증가

---

## 최종 권장안

### 1순위: Branch 1 유지 + 선택적 개선 (35점)

**권장 이유**:
1. 호스트 명령어 문제 회피 (근본적 해결 불필요)
2. 포터블 철학 유지 (Docker 선택적)
3. 개발 비용 최소 (추가 작업 없음)
4. 장애 격리 최대 (독립 시스템)

### 선택적 개선안 (저비용)

| 옵션 | 작업량 | 효과 |
|------|--------|------|
| **A. 링크 버튼 추가** | 30분 | Plan Ecosystem에서 AI Stack Monitor 바로가기 |
| **B. 백그라운드 서비스** | 1-2시간 | cmd 창 숨김, 자동 시작 |
| **C. 상태 요약 프록시** | 2-3시간 | Plan Ecosystem에 AI Stack 요약 정보만 표시 |

### 2순위: Branch 2 (플러그인) (32점)

cmd 창 완전 제거가 필수라면:
- 플러그인으로 변환
- 단, 호스트 명령어 기능(npm/pip 조회)은 제한됨

---

## 구현 계획 (선택적 개선안 B 권장)

### Phase 1: 백그라운드 서비스 설정
- AI Stack Monitor를 pm2 또는 Windows Service로 등록
- cmd 창 없이 백그라운드 실행

### Phase 2: startup-orchestrator 수정
- 이미 구현된 `systems/startup-orchestrator.js` 활용
- AI Stack Monitor를 detached 모드로 시작 (현재 이미 적용됨)

### Phase 3: Plan Ecosystem에 링크 추가 (선택)
- public/index.html에 "AI Stack Monitor" 버튼 추가
- 클릭 시 localhost:13579 새 탭

---

## 결론 (수정됨)

**사용자 선택: 최대 통합 시도**

### 실행 계획

#### Phase 0: 세이브포인트 생성
- 현재 상태를 Git 커밋으로 저장
- 롤백 가능한 상태 확보

#### Phase 1: AI Stack Monitor 플러그인 변환
```
plugins/ai-stack-monitor/
├── manifest.json      # 플러그인 설정
├── router.js          # API 엔드포인트
├── collector.js       # 데이터 수집 로직
└── ui.html            # UI 탭 (선택)
```

#### Phase 2: 호스트 명령어 문제 해결
- **해결책**: Plan Ecosystem이 호스트의 AI Stack Monitor API를 프록시
- Docker 컨테이너 → localhost:13579 (호스트 AI Stack Monitor)
- 호스트에서 npm/pip 실행 후 결과만 Docker로 전달

#### Phase 3: startup-orchestrator 수정
- AI Stack Monitor를 백그라운드 API 서버로만 유지 (UI 없음)
- Plan Ecosystem이 통합 UI 제공

#### Phase 4: 테스트 및 검증
- 모든 API 엔드포인트 작동 확인
- 호스트 명령어 (npm/pip) 정상 실행 확인

### 수정 대상 파일
1. `dashboard/plan-ecosystem/plugins/ai-stack-monitor/manifest.json` (신규)
2. `dashboard/plan-ecosystem/plugins/ai-stack-monitor/router.js` (신규)
3. `dashboard/plan-ecosystem/docker-compose.yml` (네트워크 설정)
4. `systems/startup-orchestrator.js` (AI Stack Monitor 모드 변경)
