# LangGraph/LangChain 기반 시스템 고도화 계획

## 현재 시스템 분석

### 1. 기존 LangChain/LangGraph 구현
| 파일 | 역할 | 상태 |
|------|------|------|
| `security-hub/langchain_server.py` | CVE 분석 LangChain 서버 | 구현됨 |
| `security-hub/langgraph_server.py` | StateGraph 기반 CVE 워크플로우 | 구현됨 |

### 2. 현재 오케스트레이션 시스템 (ATOS)
```
atos/
├── index.js                 # 메인 오케스트레이터 (690줄)
├── context-analyzer.js      # 맥락 분석
├── recommendation-engine.js # 도구 추천
├── execution-monitor.js     # 실행 추적
├── feedback-loop.js         # 학습 루프
├── auto-discovery.js        # 도구 자동 발견
├── self-trigger/            # Claude 출력 키워드 감지
└── pipeline-manager.js      # 파이프라인 관리
```

### 3. MCP 생태계 (38+ 서버)
| 카테고리 | 주요 서버 |
|----------|----------|
| **File/Code** | desktop-commander, edit-file-lines, git-mcp, github |
| **Web** | firecrawl, one-search, crawl4ai-lite, playwright |
| **Research** | deep-research-mcp, paper-search-mcp, context7 |
| **AI** | multi-ai-orchestration, llm-council, sequential-thinking |
| **Task** | shrimp-task, vibekanban, task-master-ai |
| **Automation** | n8n, e2b |

### 4. Docker 인프라
- `firecrawl-self-hosted`: 웹 스크래핑
- `searxng-crawl4ai-mcp`: 메타 검색
- `plan-ecosystem-dashboard`: 모니터링

### 5. Hook 시스템
- 세션 시작/종료 자동화
- 도구 호출 추적 (Dashboard 연동)
- 양방향 동기화 (Shrimp ↔ Planning ↔ Unified)

---

## LangGraph + MCP 통합 아키텍처

### 핵심 기술 스택
```
┌─────────────────────────────────────────────────────────┐
│                    Bot Interfaces                        │
│         (Slack / Discord / Telegram / n8n)              │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              LangGraph Orchestrator                      │
│   ┌─────────────────────────────────────────────────┐   │
│   │              StateGraph Engine                   │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐         │   │
│   │  │ Planner │→│ Executor│→│ Verifier│→...      │   │
│   │  └─────────┘  └─────────┘  └─────────┘         │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│           langchain-mcp-adapters                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │  MCP Tools → LangChain Tools Conversion          │   │
│   │  MultiServerMCPClient (38+ MCP Servers)          │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   MCP Servers                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │firecrawl │ │ github   │ │shrimp-task│ │playwright│   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: LangGraph + MCP 어댑터 구축

### 1.1 langchain-mcp-adapters 설치 및 구성
```bash
pip install langchain-mcp-adapters langchain-anthropic langgraph
```

### 1.2 MCP 클라이언트 구성
```python
# langgraph-mcp-orchestrator/mcp_client.py
from langchain_mcp_adapters import MultiServerMCPClient

mcp_client = MultiServerMCPClient({
    "firecrawl": {"transport": "sse", "url": "http://localhost:3002/sse"},
    "github": {"transport": "stdio", "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"]},
    "desktop-commander": {"transport": "stdio", "command": "npx", "args": ["desktop-commander"]},
    "shrimp-task": {"transport": "stdio", "command": "npx", "args": ["shrimp-mcp"]},
})
```

### 1.3 핵심 파일 구조
```
langgraph-mcp-orchestrator/
├── __init__.py
├── mcp_client.py          # MultiServerMCPClient 구성
├── state.py               # TypedDict 상태 정의
├── nodes/
│   ├── planner.py         # 계획 노드
│   ├── executor.py        # 실행 노드
│   ├── researcher.py      # 연구 노드
│   └── verifier.py        # 검증 노드
├── graphs/
│   ├── research_graph.py  # 연구 워크플로우
│   ├── coding_graph.py    # 코딩 워크플로우
│   └── task_graph.py      # 태스크 관리 워크플로우
└── main.py                # FastAPI 서버
```

---

## Phase 2: Multi-Agent 아키텍처

### 2.1 Supervisor-Worker 패턴
```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import create_react_agent

# Supervisor 노드
def supervisor_node(state):
    """작업 분배 및 조정"""
    task_type = classify_task(state["input"])
    return {"next_worker": task_type}

# Worker 노드들
workers = {
    "researcher": create_react_agent(llm, [firecrawl_tools, paper_search_tools]),
    "coder": create_react_agent(llm, [github_tools, desktop_commander_tools]),
    "planner": create_react_agent(llm, [shrimp_task_tools, vibekanban_tools]),
}

# StateGraph 구성
graph = StateGraph(AgentState)
graph.add_node("supervisor", supervisor_node)
for name, worker in workers.items():
    graph.add_node(name, worker)
```

### 2.2 에이전트 역할 정의
| 에이전트 | 역할 | MCP 도구 |
|----------|------|----------|
| **Supervisor** | 작업 분류 및 라우팅 | - |
| **Researcher** | 웹 검색, 논문 조사 | firecrawl, paper-search, context7 |
| **Coder** | 코드 작성/수정 | github, desktop-commander, git-mcp |
| **Planner** | 태스크 관리 | shrimp-task, vibekanban |
| **Tester** | 테스트 실행 | playwright, e2b |

---

## Phase 3: 봇 인터페이스 구축

### 3.1 Slack Bot
```python
# bots/slack_bot.py
from slack_bolt import App
from langgraph_mcp_orchestrator import run_graph

app = App(token=os.environ["SLACK_BOT_TOKEN"])

@app.message("")
def handle_message(message, say):
    result = run_graph(message["text"])
    say(result)
```

### 3.2 Discord Bot
```python
# bots/discord_bot.py
import discord
from langgraph_mcp_orchestrator import run_graph

@bot.event
async def on_message(message):
    result = await run_graph(message.content)
    await message.channel.send(result)
```

### 3.3 Telegram Bot
```python
# bots/telegram_bot.py
from telegram.ext import Application, MessageHandler
from langgraph_mcp_orchestrator import run_graph

async def handle_message(update, context):
    result = await run_graph(update.message.text)
    await update.message.reply_text(result)
```

---

## Phase 4: n8n 워크플로우 통합

### 4.1 Webhook 엔드포인트
```python
# api/webhooks.py
from fastapi import FastAPI

@app.post("/webhook/n8n/trigger")
async def n8n_trigger(payload: dict):
    """n8n에서 트리거되는 자동화"""
    result = await run_graph(payload["prompt"], graph_type=payload["workflow"])
    return {"result": result}
```

### 4.2 n8n 워크플로우 예시
| 워크플로우 | 트리거 | 동작 |
|------------|--------|------|
| **Daily CVE Report** | Schedule (09:00) | CVE 수집 → 분석 → Slack 알림 |
| **PR Review** | GitHub Webhook | PR 생성 → 코드 리뷰 → 코멘트 작성 |
| **Research Pipeline** | Keyword Alert | 키워드 감지 → 딥리서치 → 보고서 생성 |

---

## Phase 5: ATOS 마이그레이션

### 5.1 JavaScript → Python 마이그레이션 전략
| ATOS 모듈 | LangGraph 대응 |
|-----------|---------------|
| `context-analyzer.js` | LangChain Prompt Template |
| `recommendation-engine.js` | Router Node |
| `execution-monitor.js` | LangSmith Tracing |
| `feedback-loop.js` | Memory + Vector Store |
| `self-trigger/` | Conditional Edge |

### 5.2 하이브리드 운영 (과도기)
```
┌─────────────────────────────────────────┐
│              Claude Code CLI             │
│  ┌───────────────┐  ┌────────────────┐  │
│  │   ATOS (JS)   │  │ LangGraph (Py) │  │
│  │   - Hooks     │←→│   - Graphs     │  │
│  │   - Session   │  │   - MCP Tools  │  │
│  └───────────────┘  └────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 검증 방법

### 1. 단위 테스트
```bash
pytest tests/test_mcp_client.py
pytest tests/test_graphs.py
```

### 2. 통합 테스트
- MCP 서버 연결 확인
- 봇 인터페이스 응답 테스트
- n8n 웹훅 트리거 테스트

### 3. E2E 테스트
- Slack에서 "오늘 CVE 리포트 보여줘" → 전체 파이프라인 실행

---

## 핵심 참조

### 공식 문서
- [LangGraph Docs](https://www.langchain.com/langgraph)
- [langchain-mcp-adapters](https://github.com/langchain-ai/langchain-mcp-adapters)
- [MCP Specification](https://docs.langchain.com/oss/python/langchain/mcp)

### 현재 시스템 파일
- `security-hub/langgraph_server.py` - 기존 LangGraph 구현 참조
- `atos/index.js` - 오케스트레이션 패턴 참조
- `.claude-hooks.json` - Hook 시스템 연동

---

## 예상 결과물

1. **langgraph-mcp-orchestrator/**: LangGraph + MCP 통합 패키지
2. **bots/**: Slack, Discord, Telegram 봇
3. **api/**: FastAPI 웹훅 서버
4. **n8n-workflows/**: n8n 워크플로우 JSON

---

## 확정된 구현 전략

### 사용자 선택 결과
- **봇 플랫폼**: Slack Bot
- **구현 전략**: Phase 1+3 병렬 (MCP 어댑터 + Slack 봇 동시 개발)
- **범위**: 전체 통합 (ATOS 대체 + 새 워크플로우)

---

## 실행 계획 (Phase 1+3 병렬)

### Sprint 1: 기반 구축
- [ ] **Task 1.1**: langchain-mcp-adapters 설치 및 환경 구성
- [ ] **Task 1.2**: MultiServerMCPClient 구성 (주요 MCP 서버 연결)
- [ ] **Task 3.1**: Slack Bot 기본 구조 생성 (slack-bolt)

### Sprint 2: 핵심 기능
- [ ] **Task 1.3**: StateGraph 기본 워크플로우 구현 (Planner → Executor)
- [ ] **Task 1.4**: MCP 도구 → LangChain 도구 변환 테스트
- [ ] **Task 3.2**: Slack Bot 메시지 핸들러 구현

### Sprint 3: 통합
- [ ] **Task 2.1**: Multi-Agent 패턴 구현 (Supervisor-Worker)
- [ ] **Task 3.3**: Slack Bot + LangGraph 연동
- [ ] **Task 4.1**: n8n 웹훅 엔드포인트 추가

### Sprint 4: ATOS 마이그레이션
- [ ] **Task 5.1**: context-analyzer → LangChain Prompt
- [ ] **Task 5.2**: recommendation-engine → Router Node
- [ ] **Task 5.3**: Hook 시스템 통합

---

## 핵심 산출물

| 산출물 | 위치 | 우선순위 |
|--------|------|----------|
| LangGraph MCP 오케스트레이터 | `langgraph-mcp-orchestrator/` | P0 |
| Slack Bot | `bots/slack/` | P0 |
| FastAPI 서버 | `api/` | P1 |
| n8n 워크플로우 | `n8n-workflows/` | P2 |
| ATOS 마이그레이션 | `langgraph-mcp-orchestrator/atos_compat/` | P2 |

---

## 즉시 시작 가능한 작업

```bash
# 1. Python 환경 준비
cd K:/PortableApps/Claude-Code
python -m venv langgraph-env
source langgraph-env/bin/activate  # Windows: langgraph-env\Scripts\activate

# 2. 의존성 설치
pip install langchain-mcp-adapters langchain-anthropic langgraph slack-bolt fastapi uvicorn

# 3. 프로젝트 구조 생성
mkdir -p langgraph-mcp-orchestrator/{nodes,graphs}
mkdir -p bots/slack
mkdir -p api
```
