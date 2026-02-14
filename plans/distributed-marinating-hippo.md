# Plan: ATOS & Plan Ecosystem - Python/C 리라이트 및 패키징 비교

## 분석 방법
- **ToT (Tree of Thoughts)**: 3개 브랜치 병렬 평가
- **CoT (Chain of Thought)**: 단계별 논리 전개
- **5가지 관점 점수화**: 성능, 유지보수성, 확장성, 개발비용, 포터블성

---

## Phase 1: 현재 시스템 분석

### 1.1 ATOS (Active Tool Orchestration System)
```
atos/
├── index.js                  # 메인 오케스트레이터 (~700줄)
├── recommendation-engine.js  # 추천 엔진 (~1080줄)
├── context-analyzer.js       # 컨텍스트 분석
├── load-tracker.js           # 로딩 추적 (Singleton)
├── feedback-loop.js          # 학습 피드백
├── execution-monitor.js      # 실행 모니터링
├── auto-discovery.js         # MCP 자동 발견
├── bootstrap-loader.js       # 지연 로딩
├── plan-executor.js          # Plan-ATOS Bridge
└── self-trigger/             # 자기 트리거 시스템
    ├── index.js
    ├── loop-guard.js
    └── phase-detector.js
```

**핵심 기능**:
- 도구 추천 (Context → Score → Recommend)
- 세션 관리 (init → track → learn)
- Hook 연동 (session-start, before-response, after-tool-call)
- Auto-Discovery (MCP 서버 자동 감지)

### 1.2 Plan Ecosystem Dashboard
```
dashboard/plan-ecosystem/
├── server.js                 # Express + Socket.IO (~2236줄)
├── collectors/               # 17개 데이터 수집기
│   ├── plan-collector.js
│   ├── log-collector.js
│   ├── tool-collector.js
│   ├── agent-collector.js
│   ├── skill-collector.js
│   ├── task-collector.js
│   ├── cost-collector.js
│   ├── alert-manager.js
│   ├── session-recorder.js
│   └── lifecycle-collector.js
├── plugins/                  # 플러그인 시스템
└── public/                   # 프론트엔드
```

**핵심 기능**:
- 실시간 대시보드 (WebSocket)
- 멀티소스 데이터 수집 (Plans, Tasks, Tools, Agents, Costs)
- 플러그인 아키텍처

---

## Phase 2: ToT 분석 - 3개 브랜치

### Branch 1: Pure Python (FastAPI + asyncio)
```
atos-python/
├── main.py              # FastAPI 앱
├── core/
│   ├── orchestrator.py  # ATOS 메인
│   ├── recommender.py   # 추천 엔진
│   └── analyzer.py      # 컨텍스트 분석
├── collectors/          # 데이터 수집기
└── api/                 # REST API
```

| 관점 | 점수 | 이유 |
|------|------|------|
| 성능 | 7 | asyncio 비동기, 단일 스레드 GIL 제한 |
| 유지보수성 | 9 | 가독성 높음, 타입힌트 지원 |
| 확장성 | 8 | 풍부한 라이브러리 생태계 |
| 개발비용 | 7 | 중간 (전체 재작성) |
| 포터블성 | 6 | Python 런타임 필요 |
| **총점** | **37/50** |

### Branch 2: Python + C Extension (Hybrid)
```
atos-hybrid/
├── main.py              # FastAPI 앱
├── core/
│   ├── orchestrator.py
│   └── recommender.py
├── _cext/               # C Extensions
│   ├── scorer.c         # 점수 계산 (성능 크리티컬)
│   ├── matcher.c        # 패턴 매칭
│   └── setup.py         # Cython/cffi 빌드
└── collectors/
```

| 관점 | 점수 | 이유 |
|------|------|------|
| 성능 | 9 | C 확장으로 핫패스 최적화 |
| 유지보수성 | 6 | C/Python 혼합 복잡도 |
| 확장성 | 7 | 확장 시 C 지식 필요 |
| 개발비용 | 4 | 높음 (C 개발 + 빌드 시스템) |
| 포터블성 | 5 | 플랫폼별 빌드 필요 |
| **총점** | **31/50** |

### Branch 3: Node.js 유지 + 최적화
```
atos-optimized/
├── index.js             # 기존 유지
├── core/
│   ├── orchestrator.js  # 리팩토링
│   └── recommender.js   # 알고리즘 최적화
├── workers/             # Worker Threads
│   └── scorer.worker.js # 병렬 점수 계산
└── native/              # N-API 바인딩 (선택)
```

| 관점 | 점수 | 이유 |
|------|------|------|
| 성능 | 7 | V8 JIT, Worker Threads |
| 유지보수성 | 8 | 기존 코드베이스 재사용 |
| 확장성 | 8 | npm 생태계 |
| 개발비용 | 9 | 최소 (점진적 개선) |
| 포터블성 | 9 | 이미 포터블 환경 검증됨 |
| **총점** | **41/50** |

---

## Phase 3: CoT 분석 - 사용자 요청 해석

### 사용자 의도 분석
```
"파이썬과 C를 활용한 코드를 통해 프로그램화"
   └─→ Python/C 리라이트 요청

"현재보다 더 잘만들면 좋을것 같다"
   └─→ 성능/품질 개선 목표

"기존 시스템이랑 프로그램화 한 것이랑 비교"
   └─→ A/B 비교 테스트 필요

"패키징화 해보세요"
   └─→ 배포 가능한 패키지 생성
```

### 결론: Branch 1 (Pure Python) 선택 + 패키징
- 개발 속도와 비교 용이성 고려
- C Extension은 추후 성능 병목 발견 시 적용
- 기존 JS 시스템과 병렬 운영 가능

---

## Phase 4: 구현 계획 (Python 리라이트 + 패키징)

### 4.1 프로젝트 구조
```
K:/PortableApps/genai/
├── atos/                     # [기존] JavaScript 버전
├── dashboard/plan-ecosystem/ # [기존] JavaScript 버전
│
├── atos-python/              # [신규] Python ATOS
│   ├── pyproject.toml        # 프로젝트 설정
│   ├── atos/
│   │   ├── __init__.py
│   │   ├── core/
│   │   │   ├── orchestrator.py
│   │   │   ├── recommender.py
│   │   │   └── analyzer.py
│   │   ├── models/
│   │   │   ├── session.py
│   │   │   └── recommendation.py
│   │   └── cli.py
│   └── tests/
│
└── plan-ecosystem-python/    # [신규] Python Plan Ecosystem
    ├── pyproject.toml
    ├── planeco/
    │   ├── __init__.py
    │   ├── server.py         # FastAPI
    │   ├── collectors/
    │   └── api/
    └── tests/
```

### 4.2 ATOS Python 핵심 모듈

#### 4.2.1 orchestrator.py
```python
# 세션 관리 + 도구 오케스트레이션
class ATOSOrchestrator:
    def __init__(self):
        self.recommender = Recommender()
        self.session = Session()

    async def init_session(self) -> SessionData
    async def recommend(self, user_input: str) -> List[Recommendation]
    async def track_tool(self, tool_data: ToolCall) -> None
    async def learn_session(self) -> LearningResult
```

#### 4.2.2 recommender.py
```python
# 추천 엔진 (기존 JS 로직 포팅)
class Recommender:
    WEIGHTS = {
        'intent_match': 0.25,
        'keyword_match': 0.15,
        'priority_bonus': 0.10,
        'success_rate': 0.10,
        'context_boost': 0.10,
        'plan_phase_boost': 0.15
    }

    def recommend(self, user_input: str) -> RecommendationResult
    def detect_context(self, user_input: str) -> ContextDetection
    def score_tools(self, analysis: Analysis) -> List[ScoredTool]
```

### 4.3 Plan Ecosystem Python 핵심 모듈

#### 4.3.1 server.py (FastAPI)
```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import socketio

app = FastAPI(title="Plan Ecosystem")
sio = socketio.AsyncServer(async_mode='asgi')

# REST API
@app.get("/api/plans")
@app.get("/api/stats")
@app.get("/api/tools")
@app.get("/api/agents")

# WebSocket
@sio.event
async def connect(sid, environ): ...
```

### 4.4 패키징 전략

#### PyPI 패키지
```toml
# pyproject.toml
[project]
name = "atos-python"
version = "1.0.0"
dependencies = [
    "fastapi>=0.100.0",
    "uvicorn>=0.23.0",
    "pydantic>=2.0.0",
    "aiofiles>=23.0.0"
]

[project.scripts]
atos = "atos.cli:main"
```

#### 실행 가능 바이너리 (PyInstaller)
```bash
# Windows 실행 파일 생성
pyinstaller --onefile --name atos-python atos/cli.py
pyinstaller --onefile --name planeco-python planeco/server.py
```

---

## Phase 5: 비교 테스트 계획

### 5.1 비교 항목
| 항목 | 측정 방법 |
|------|----------|
| **시작 시간** | `time` 명령어 |
| **메모리 사용량** | `psutil` / Task Manager |
| **추천 응답 시간** | 동일 입력 100회 평균 |
| **API 응답 시간** | `ab` (Apache Bench) |
| **코드 라인 수** | `cloc` |

### 5.2 테스트 시나리오
```bash
# 1. ATOS 추천 벤치마크
node atos/index.js recommend "웹 검색해줘"  # JS
python -m atos recommend "웹 검색해줘"       # Python

# 2. Plan Ecosystem API 벤치마크
ab -n 1000 -c 10 http://localhost:7847/api/stats  # JS
ab -n 1000 -c 10 http://localhost:7848/api/stats  # Python

# 3. 메모리 비교
node --max-old-space-size=256 atos/index.js
python -m atos  # 기본 제한
```

### 5.3 결과 보고서 형식
```markdown
# ATOS JavaScript vs Python 비교 보고서

## 1. 성능
| 메트릭 | JavaScript | Python | 차이 |
|--------|-----------|--------|------|
| 시작 시간 | 150ms | 80ms | -47% |
| 추천 응답 | 5ms | 3ms | -40% |
| 메모리 | 80MB | 45MB | -44% |

## 2. 코드 품질
| 메트릭 | JavaScript | Python |
|--------|-----------|--------|
| 라인 수 | 2000 | 1500 |
| 복잡도 | 중간 | 낮음 |
| 테스트 커버리지 | 0% | 80% |
```

---

## Phase 6: 실행 순서

### Step 1: Python 환경 설정 (30분)
- [ ] pyproject.toml 생성
- [ ] 가상환경 설정 (venv)
- [ ] 의존성 설치

### Step 2: ATOS Python 포팅 (3-4시간)
- [ ] models/ 정의 (Pydantic)
- [ ] core/orchestrator.py
- [ ] core/recommender.py (가장 복잡)
- [ ] core/analyzer.py
- [ ] cli.py

### Step 3: Plan Ecosystem Python 포팅 (4-5시간)
- [ ] FastAPI 서버 기본 구조
- [ ] collectors/ 포팅 (plan, tool, agent)
- [ ] WebSocket 설정 (python-socketio)
- [ ] 정적 파일 서빙

### Step 4: 패키징 (1시간)
- [ ] PyInstaller 빌드 설정
- [ ] Windows 실행 파일 생성
- [ ] 테스트

### Step 5: 비교 테스트 (1-2시간)
- [ ] 벤치마크 스크립트 작성
- [ ] 테스트 실행
- [ ] 보고서 생성

---

## 수정/생성 대상 파일

### 신규 생성
```
atos-python/
├── pyproject.toml
├── atos/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── orchestrator.py
│   │   ├── recommender.py
│   │   └── analyzer.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── session.py
│   │   └── recommendation.py
│   └── cli.py
└── tests/
    └── test_recommender.py

plan-ecosystem-python/
├── pyproject.toml
├── planeco/
│   ├── __init__.py
│   ├── server.py
│   ├── collectors/
│   │   ├── __init__.py
│   │   ├── plan_collector.py
│   │   ├── tool_collector.py
│   │   └── agent_collector.py
│   └── api/
│       └── routes.py
└── tests/
```

### 기존 참조 (읽기 전용)
```
atos/index.js                 # 오케스트레이터 로직
atos/recommendation-engine.js # 추천 알고리즘
atos/context-analyzer.js      # 컨텍스트 분석
dashboard/plan-ecosystem/server.js  # Express 서버
dashboard/plan-ecosystem/collectors/*.js  # 데이터 수집기
```

---

## 검증 방법

### 1. 단위 테스트
```bash
cd atos-python && pytest tests/
cd plan-ecosystem-python && pytest tests/
```

### 2. 통합 테스트
```bash
# ATOS CLI 테스트
python -m atos init
python -m atos recommend "파일 수정해줘"
python -m atos status

# Plan Ecosystem 서버 테스트
python -m planeco &
curl http://localhost:7848/api/stats
```

### 3. 비교 벤치마크
```bash
python benchmark/compare.py --js-port 7847 --py-port 7848
```

---

## 결론

**권장 접근법**: Branch 1 (Pure Python) + 점진적 C Extension

| 단계 | 산출물 | 예상 시간 |
|------|--------|----------|
| 1 | Python ATOS 코어 | 4시간 |
| 2 | Python Plan Ecosystem | 5시간 |
| 3 | 패키징 (PyInstaller) | 1시간 |
| 4 | 비교 벤치마크 | 2시간 |
| **총** | **완전한 비교 환경** | **12시간** |

성능 병목 발견 시 → Cython으로 점수 계산 함수만 최적화

---

**플랜 상태**: 구현 준비 완료
**다음 단계**: 사용자 승인 후 Python 코드 작성 시작
