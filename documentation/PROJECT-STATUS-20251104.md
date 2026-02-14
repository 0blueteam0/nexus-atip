# AI Stack Monitor 프로젝트 상태 보고서
**작성일:** 2025-11-04
**작성자:** Claude (Sonnet 4.5)
**프로젝트:** AI Stack Centralized Monitor & Control System

---

## [1] 프로젝트 개요

### 목표
K드라이브 포터블 환경에서 실행되는 AI Stack 서비스들을 중앙에서 모니터링하고 제어하는 웹 기반 대시보드 시스템 구축

### 핵심 서비스 (5개)
1. **Ollama** (v0.12.9) - 로컬 LLM 실행 엔진
   - Port: 11434
   - 의존성: 없음
   - 시작: K:/PortableApps/genai/start-scripts/start-ollama.bat

2. **n8n** (v1.97.1) - 워크플로우 자동화
   - Port: 5678
   - 의존성: Ollama
   - 시작: K:/PortableApps/genai/start-scripts/start-n8n.bat

3. **Flowise** (v3.0.8) - LLM 앱 빌더
   - Port: 3000
   - 의존성: Ollama
   - 시작: K:/PortableApps/genai/start-scripts/start-flowise.bat

4. **Qdrant** (v1.15.1) - 벡터 데이터베이스
   - Port: 6333
   - 의존성: 없음
   - 시작: K:/PortableApps/genai/start-scripts/start-qdrant.bat

5. **LangChain** (v0.3.33) - Python 라이브러리 (시작/중지 불가)
   - Type: library
   - Package: @langchain/anthropic

---

## [2] 기술 스택 및 아키텍처

### Backend
- **Node.js Express** (Port 3002)
- **서버 위치:** K:/PortableApps/genai/dashboard/server.js
- **설정 파일:** K:/PortableApps/genai/service-registry.json

### Frontend (예정)
- **Vanilla JavaScript** + Fetch API
- **UI 위치:** K:/PortableApps/genai/dashboard/ai-stack-monitor.html
- **스타일:** monitor.html의 다크 테마 재사용

### 주요 알고리즘
- **Topological Sort** (Kahn's Algorithm) - 의존성 기반 시작 순서 계산
- **Cache System** - Health check 30초, Version 1일, Packages 5일 캐시

### API 엔드포인트 (10개)
```
GET  /api/mcp-status          - MCP 서버 연결 상태
GET  /api/npm-packages         - npm 패키지 목록
GET  /api/python-packages      - Python 패키지 목록
GET  /api/global-tools         - 글로벌 npm 도구
GET  /api/all-status           - 전체 상태 통합
GET  /api/services/health      - 서비스 헬스체크
GET  /api/services/versions    - 서비스 버전 정보
POST /api/services/:id/start   - 개별 서비스 시작 (MVP: batch 경로 반환)
POST /api/services/:id/stop    - 개별 서비스 중지
POST /api/services/start-all   - 전체 스택 topological 순서 시작
```

---

## [3] 완료된 작업 (4/6 Tasks)

### Task 1: Service Registry 스키마 생성 ✅
**완료 시간:** 2025-11-04 01:57:30
**점수:** 95/100

**생성 파일:**
- `K:/PortableApps/genai/service-registry.json`

**스키마 구조:**
```json
{
  "serviceId": {
    "name": "서비스 이름",
    "version": "버전",
    "path": "실행 파일 경로 (binary type만)",
    "healthCheck": "http://localhost:port/health",
    "startCommand": "시작 배치 파일 경로",
    "stopCommand": "중지 명령어",
    "dependencies": ["의존 서비스 ID"],
    "type": "npm|python|binary|library",
    "package": "패키지 이름 (npm/python type)"
  }
}
```

**주요 성과:**
- 5개 서비스 메타데이터 완전 정의
- 의존성 그래프 명확화 (ollama → n8n, flowise)
- 타입 기반 버전 감지 전략 수립

---

### Task 2: Health Check API 구현 ✅
**완료 시간:** 2025-11-04 02:10:07
**점수:** 98/100

**구현 위치:**
- `K:/PortableApps/genai/dashboard/server.js` (lines 149-177, 342-360)

**핵심 함수:**
1. `httpGet(url, timeout)` - HTTP 요청 헬퍼 (3초 타임아웃)
2. `getServiceHealth(serviceId)` - 개별 서비스 상태 확인 (30초 캐시)
3. `GET /api/services/health` - 전체 서비스 병렬 헬스체크

**기술적 특징:**
- `Promise.allSettled()` 사용 → 하나 실패해도 전체 결과 반환
- AbortController로 타임아웃 구현
- 30초 캐시로 불필요한 재확인 방지

**응답 형식:**
```json
{
  "services": {
    "ollama": {
      "status": "running|stopped|error",
      "lastCheck": "2025-11-04T10:30:00.000Z",
      "httpStatus": 200
    }
  },
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

---

### Task 3: Version Detection API 구현 ✅
**완료 시간:** 2025-11-04 03:25:09
**점수:** 99/100

**구현 위치:**
- `K:/PortableApps/genai/dashboard/server.js` (lines 94-147, 402-421)

**핵심 함수:**
1. `parseNpmVersion(output, packageName)` - npm list 출력 파싱
2. `parsePipVersion(output)` - pip show 출력 파싱
3. `parseBinaryVersion(output)` - --version 출력 파싱
4. `detectVersion(serviceId)` - 타입별 버전 감지 (1일 캐시)

**타입별 감지 전략:**
```javascript
switch (service.type) {
    case 'npm':
        // npm list packageName --depth=0
        version = parseNpmVersion(output, service.package);
        break;
    case 'python':
        // python -m pip show packageName
        version = parsePipVersion(output);
        break;
    case 'binary':
        // path/to/binary --version
        version = parseBinaryVersion(output);
        break;
    case 'library':
        // registry에서 직접 가져오기
        version = service.version;
        break;
}
```

**응답 형식:**
```json
{
  "versions": {
    "ollama": {
      "version": "0.12.9",
      "detectedAt": "2025-11-04T10:30:00.000Z"
    }
  },
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

---

### Task 4: Service Control API 구현 ✅
**완료 시간:** 2025-11-04 (방금 완료)
**점수:** 98/100

**구현 위치:**
- `K:/PortableApps/genai/dashboard/server.js` (lines 362-513)

**핵심 기능:**

#### 1. Topological Sort (Kahn's Algorithm)
```javascript
function getStartOrder(serviceIds) {
    // lines 363-400
    // 의존성 그래프 구축 → in-degree 계산 → 순차 정렬
}
```
**예시 순서:** ollama → qdrant → n8n → flowise

#### 2. 개별 서비스 시작 (MVP)
```javascript
POST /api/services/:id/start
// lines 424-465

// MVP: 배치 파일 경로만 반환 (사용자가 수동 실행)
Response: {
    "started": "pending",
    "service": "ollama",
    "message": "Please run the following batch file manually",
    "batchFile": "K:/PortableApps/genai/start-scripts/start-ollama.bat",
    "instruction": "Run: K:/PortableApps/genai/start-scripts/start-ollama.bat",
    "timestamp": "2025-11-04T10:30:00.000Z"
}
```

#### 3. 의존성 검증
```javascript
// lines 440-449
const deps = service.dependencies || [];
for (const dep of deps) {
    const depHealth = await getServiceHealth(dep);
    if (depHealth.status !== 'running') {
        return res.status(400).json({ 
            error: `Dependency ${dep} is not running`,
            suggestion: `Start ${dep} first`
        });
    }
}
```

#### 4. 전체 스택 시작
```javascript
POST /api/services/start-all
// lines 491-513

// Topological 순서로 하나씩 시작 (2초 간격)
Response: {
    "results": [
        { "service": "ollama", "status": "started" },
        { "service": "qdrant", "status": "started" },
        { "service": "n8n", "status": "started" },
        { "service": "flowise", "status": "started" }
    ],
    "order": ["ollama", "qdrant", "n8n", "flowise"],
    "timestamp": "2025-11-04T10:30:00.000Z"
}
```

**테스트 결과:**
- 파일: `K:/PortableApps/genai/test-service-control.js`
- 결과: 6/6 테스트 통과 (100%)
- Test 1: ollama start ✓
- Test 2: n8n start ✓
- Test 3: ollama stop ✓
- Test 4: dependency check (ollama 중지 시 n8n 거부) ✓
- Test 5: library check (langchain 시작 거부) ✓
- Test 6: start-all (topological order) ✓

---

## [4] 진행 중인 작업

**현재 상태:** Task 4 완료 후 대기 중
**서버 상태:** Express 서버 실행 중 (bash ID: 06a37e, Port 3002)
**다음 작업:** Task 5 (AI Stack Monitor UI 개발) 시작 대기

---

## [5] 남은 작업 (2/6 Tasks)

### Task 5: AI Stack Monitor UI 개발 ⏸️
**예상 소요 시간:** 2시간
**의존성:** Task 2, 3, 4 완료 ✅

**목표:**
- `K:/PortableApps/genai/dashboard/ai-stack-monitor.html` 생성
- 기존 monitor.html의 다크 테마 스타일 재사용
- 5개 서비스를 카드 그리드로 표시

**UI 요구사항:**
1. **서비스 카드 (5개)**
   - 서비스 이름 + 아이콘
   - 상태 표시 (running/stopped/error)
   - 버전 정보
   - Start/Stop 버튼
   - Dependency 표시

2. **자동 새로고침**
   - 10초마다 `/api/services/health` 호출
   - 상태 변경 시 카드 업데이트

3. **에러 처리**
   - API 실패 시 사용자 알림
   - 타임아웃 표시

4. **반응형 디자인**
   - 카드 그리드 레이아웃
   - 모바일 대응

**참고 파일:**
- 스타일: `K:/PortableApps/genai/dashboard/monitor.html`
- API 스펙: server.js 참조

---

### Task 6: 통합 테스트 및 검증 ⏸️
**예상 소요 시간:** 1시간
**의존성:** Task 5 완료 필요

**테스트 시나리오:**
1. **서비스 라이프사이클 테스트**
   - Ollama 시작 → UI에서 상태 확인
   - n8n 시작 (dependency 체크) → UI 업데이트
   - Ollama 중지 → n8n 에러 발생 확인

2. **UI 동작 테스트**
   - 자동 새로고침 10초 간격 확인
   - Start/Stop 버튼 동작
   - 에러 메시지 표시

3. **캐시 시스템 검증**
   - Health check 30초 캐시 동작 확인
   - Version 1일 캐시 동작 확인

4. **문서화**
   - README.md 업데이트
   - 사용자 가이드 작성
   - API 문서 정리

---

## [6] 주요 파일 위치

### 핵심 파일
```
K:/PortableApps/genai/
├── dashboard/
│   ├── server.js                    # Express 서버 (Port 3002)
│   ├── monitor.html                 # 기존 모니터 (스타일 참조용)
│   └── ai-stack-monitor.html        # 신규 UI (Task 5에서 생성 예정)
├── service-registry.json            # 서비스 메타데이터
├── test-service-control.js          # API 테스트 스크립트
├── start-scripts/
│   ├── start-ollama.bat
│   ├── start-n8n.bat
│   ├── start-flowise.bat
│   └── start-qdrant.bat
└── documentation/
    └── PROJECT-STATUS-20251104.md   # 이 문서
```

### 실행 파일
```
K:/PortableApps/genai/ollama/ollama.exe
K:/PortableApps/tools/nodejs/node.exe
K:/PortableApps/tools/python/python.exe
```

---

## [7] 문제 해결 이력

### Issue 1: 500 에러 미스터리 (해결됨 ✅)
**발생 시기:** Task 4 테스트 중
**증상:**
- POST `/api/services/ollama/start` → 500 에러
- POST `/api/services/n8n/start` → 500 에러
- POST `/api/services/ollama/stop` → 200 OK (정상)
- 응답: 빈 JSON `{}`

**조사 과정:**
1. 코드 문법 검증 → 문제 없음 (server.js:520-531 확인)
2. Debug 로깅 추가 (lines 427-428) → 로그 출력 없음
3. Background bash 프로세스 분석 → 서버가 즉시 종료됨 발견
4. 포트 확인: `netstat -ano | findstr ":3002"`
   - **발견:** PID 572가 포트 3002 점유 중
   - 다수의 ESTABLISHED 연결 존재

**해결 방법:**
```bash
# 시도 1: taskkill (실패 - bash 경로 해석 문제)
taskkill /F /PID 572
# 에러: /F가 F:/ 경로로 해석됨

# 시도 2: cmd wrapper (실패 - 출력 없음)
cmd /c "taskkill /FI \"PID eq 572\""

# 시도 3: PowerShell (성공 ✅)
powershell.exe -Command "Stop-Process -Id 572 -Force"

# 검증
netstat -ano | findstr ":3002" | findstr "LISTENING"
# Exit code: 1 (포트 해제 확인)
```

**새 서버 시작:**
```bash
cd K:/PortableApps/genai/dashboard && K:/PortableApps/tools/nodejs/node.exe server.js
# Bash ID: 06a37e
# Status: running (not completed)
```

**검증 테스트:**
```bash
curl -X POST http://localhost:3002/api/services/ollama/start
# HTTP 200 OK ✅
# Response: { "started": "pending", "batchFile": "..." }
```

**교훈:**
- 환경 문제 vs 코드 문제 구분 중요
- 포트 충돌은 netstat으로 즉시 확인 가능
- MSYS2 bash의 경로 해석 주의 (PowerShell 대안 활용)

---

### Issue 2: Bash 경로 해석 문제
**증상:** `/F` → `F:/` 변환
**원인:** MSYS2 bash가 `/`로 시작하는 인자를 Windows 경로로 자동 변환
**해결:** PowerShell 명령 사용
**향후 개선:** cmd.exe 래퍼 또는 경로 이스케이프 고려

---

## [8] 기술적 의사결정

### 1. MVP 패턴 채택
**결정:** 서비스 시작 시 배치 파일 경로만 반환 (자동 실행 없음)
**이유:**
- PID 추적 없이 간단한 구현
- 사용자가 수동 실행으로 제어권 보유
- 향후 자동 실행 기능 추가 가능한 구조

**향후 개선 방향:**
- child_process.spawn()으로 자동 실행
- PID 추적 및 프로세스 관리
- 로그 수집 및 표시

### 2. Topological Sort (Kahn's Algorithm)
**결정:** 의존성 기반 시작 순서 계산
**이유:**
- Circular dependency 자동 감지
- O(V+E) 시간 복잡도로 효율적
- 표준 알고리즘으로 검증됨

**구현:**
```javascript
// In-degree 기반 정렬
// 1. 의존성 그래프 구축
// 2. In-degree 0인 노드부터 시작
// 3. 방문한 노드의 이웃 in-degree 감소
// 4. 새로 in-degree 0된 노드 큐에 추가
```

### 3. Cache 전략
**Health Check:** 30초 TTL
- 빈번한 UI 새로고침 대응
- 실시간성과 성능 균형

**Version:** 1일 TTL
- 버전은 자주 변경되지 않음
- 불필요한 명령 실행 방지

**Packages:** 5일 TTL
- npm/pip 패키지 목록은 거의 변경 없음
- 디스크 I/O 최소화

---

## [9] 다음 세션 시작 가이드

### 즉시 실행할 명령어
```bash
# 1. 현재 작업 위치로 이동
cd K:/PortableApps/genai

# 2. 서버 상태 확인
netstat -ano | findstr ":3002"
# 결과: LISTENING 있으면 서버 실행 중

# 3. 서버가 실행 중이 아니면 시작
cd dashboard && K:/PortableApps/tools/nodejs/node.exe server.js &

# 4. Shrimp Task 목록 확인
# MCP 도구 사용: mcp__shrimp-task__list_tasks

# 5. Task 5 시작
# MCP 도구 사용: mcp__shrimp-task__execute_task
# Task ID: 54cf5f64-5be2-4a93-bb2a-2e16f3ee49a5
```

### 작업 재개 순서
1. **문서 확인**
   - 이 파일 (PROJECT-STATUS-20251104.md) 정독
   - Task 5 요구사항 파악

2. **환경 검증**
   - Express 서버 실행 확인 (Port 3002)
   - API 엔드포인트 테스트
   ```bash
   curl http://localhost:3002/api/services/health
   curl http://localhost:3002/api/services/versions
   ```

3. **Task 5 시작**
   - monitor.html 스타일 분석
   - ai-stack-monitor.html 구조 설계
   - API 연동 로직 구현
   - 자동 새로고침 구현
   - 테스트

4. **Task 6 준비**
   - 테스트 시나리오 작성
   - README.md 업데이트 계획

---

## [10] 주요 참고 자료

### API 스펙
