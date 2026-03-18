# NEXUS v3.0 - 7-Layer AI Ecosystem Evolution

> **Status**: Ready for Implementation
> **Created**: 2026-03-04
> **Base**: NEXUS v2.0 (Audit GREEN - 모든 핵심 모듈 작동 확인)
> **Constraint**: GPU 없음 (Ollama CPU-only, 임베딩 API 기반)

---

## Audit Results (Phase 0.5 완료)

| 자산 | 상태 | 세부 |
|------|------|------|
| NEXUS v2.0 Core | GREEN | 8 Port, 4 실제 어댑터, CLI 8 cmd, Orchestrator 완전 |
| multi-ai-orchestration | GREEN | 34+ 모듈 require 성공, A2A Server 5파일 존재 |
| ATOS | GREEN | recommendation-engine, complexity-detector, feedback-loop 정상 |
| Bridges | GREEN | atos-bridge, multi-ai-bridge, hooks-bridge 모두 로드 성공 |
| Infra Scripts | YELLOW | bat 파일 존재, 서비스 기동은 Docker/Ollama에 의존 |
| @langchain/langgraph | GREEN | 이미 package.json에 설치됨 |

### v2.0 Port 현황 (container.js 부트스트랩)
- [+] AgentLoopPort -> CompoundLoop (실제)
- [*] ModelRouterPort -> null
- [*] ToolExecutionPort -> null
- [*] MemoryPort -> null
- [*] SkillRegistryPort -> null
- [+] ContextEnginePort -> ContextPipeline (실제)
- [+] PolicyPort -> PolicyMesh (실제)
- [+] EvolutionPort -> EvolutionEngine (실제)

---

## 구현 순서 (7 Phase)

### Phase 0: Savepoint
```bash
git add -A && git commit -m "Savepoint: before NEXUS v3.0 evolution"
git tag -a nexus-v2.0-final -m "NEXUS v2.0 final state before v3.0"
```

### Phase 1: Port Registry 확장 + InfraPort (L1)

**새 파일 (4개):**
- `nexus/ports/index.js` (수정) - 6개 신규 Port 추가
- `nexus/ports/null-adapters.js` (수정) - 6개 null adapter 추가
- `nexus/infra/docker-manager.js` - Docker 컨테이너 관리
- `nexus/infra/process-manager.js` - Ollama/Qdrant 프로세스 관리
- `nexus/infra/infra-adapter.js` - InfraPort 구현

**수정 파일 (3개):**
- `nexus/core/container.js` - bootstrapDefaults에 신규 Port 추가
- `nexus/core/cli.js` - `infra` 명령어 추가
- `nexus/nexus.config.json` - 인프라 설정 추가

**신규 Port 인터페이스 6개:**
```
InfraPort          - manage(service, action), status(), healthCheck(service)
LocalLLMPort       - generate(prompt, model, opts), listModels(), status()
AgentFrameworkPort - runGraph(graph, input), listGraphs(), status()
WorkflowPort       - trigger(workflowId, data), list(), status()
RAGPort            - index(docs), search(query, opts), status()
ObservabilityPort  - record(event), query(filter), dashboard()
```

**검증:** `node nexus/core/port-validator.js --all` -> 14/14 PASS

### Phase 2: 로컬 LLM + Provider 확장 (L2)

**새 파일 (4개):**
- `nexus/local-llm/ollama-client.js` - Ollama REST API (localhost:11434)
- `nexus/local-llm/model-registry.json` - CPU 추천 모델 목록
- `nexus/adapters/ollama-adapter.js` - LocalLLMPort 구현
- `nexus/adapters/api-direct-adapter.js` - API 직접 호출 어댑터

**수정 파일 (3개):**
- `nexus/nexus.config.json` - ollama, api-direct provider 추가
- `nexus/core/orchestrator.js` - 5개 provider 라우팅
- `nexus/adapters/adapter-registry.js` - 신규 어댑터 등록

**GPU-free:** qwen2.5-coder:7b (CPU), llama3.2:3b (CPU), API fallback

### Phase 3: Agent Framework 브릿지 (L3)

**새 파일 (4개):**
- `nexus/agent-framework/langgraph-bridge.js` - LangGraph.js 실행기 (이미 npm 설치됨)
- `nexus/agent-framework/crewai-bridge.js` - CrewAI Python subprocess
- `nexus/agent-framework/framework-adapter.js` - AgentFrameworkPort 구현
- `nexus/agent-framework/graph-templates/` - 사전 정의 패턴

**수정 파일 (2개):**
- `nexus/core/container.js` - AgentFrameworkPort 등록
- `nexus/workflows/workflow-engine.js` - 프레임워크 워크플로우 타입

**핵심:** @langchain/langgraph 이미 설치 -> Node.js 네이티브 실행 (Python 불필요)

### Phase 4: n8n 딥 통합 + Workflow (L4)

**새 파일 (4개):**
- `nexus/workflow/n8n-connector.js` - n8n REST API 클라이언트
- `nexus/workflow/n8n-templates/` - 사전 정의 워크플로우 JSON 3개
- `nexus/workflow/workflow-adapter.js` - WorkflowPort 구현

**수정 파일 (2개):**
- `nexus/core/container.js` - WorkflowPort 등록
- `nexus/core/cli.js` - `workflow trigger <name>` 명령어

### Phase 5: RAG + 벡터DB (L5)

**새 파일 (6개):**
- `nexus/rag/qdrant-client.js` - Qdrant REST API (localhost:6333)
- `nexus/rag/embedder.js` - 임베딩 (OpenAI API / Ollama nomic 폴백)
- `nexus/rag/indexer.js` - 문서 청킹 + 인덱싱
- `nexus/rag/retriever.js` - 유사도 검색
- `nexus/rag/rag-adapter.js` - RAGPort 구현
- `nexus/rag/rag-config.json` - 설정

**수정 파일 (3개):**
- `nexus/core/container.js` - RAGPort + MemoryPort 등록
- `nexus/context/gatherer.js` - RAG 소스 추가
- `nexus/core/cli.js` - `rag index/search/status` 명령어

### Phase 6: Observability + 비용 대시보드 (L6)

**새 파일 (4개):**
- `nexus/observability/cost-tracker.js` - 실시간 비용 추적
- `nexus/observability/quality-scorer.js` - 품질 자동 평가
- `nexus/observability/dashboard-data.js` - 대시보드 데이터
- `nexus/observability/observability-adapter.js` - ObservabilityPort 구현

**수정 파일 (3개):**
- `nexus/core/container.js` - ObservabilityPort 등록
- `nexus/core/event-bus.js` - 관측성 이벤트 타입 추가
- `nexus/core/cli.js` - `dashboard` 명령어

### Phase 7: MCP Gateway + A2A Hub (L7)

**새 파일 (5개):**
- `nexus/gateway/mcp-router.js` - MCP 서버 라우팅 + 헬스체크
- `nexus/gateway/mcp-registry.json` - 38개 서버 메타데이터
- `nexus/gateway/a2a-hub.js` - A2A 태스크 위임 허브
- `nexus/gateway/agent-cards/` - 에이전트별 Agent Card (4개 JSON)
- `nexus/gateway/protocol-adapter.js` - 통합 어댑터

**수정 파일 (3개):**
- `nexus/core/container.js` - 게이트웨이 부트스트랩
- `nexus/core/cli.js` - `gateway status/agents/mcp` 명령어
- `multi-ai-orchestration/a2a-server/` - NEXUS 연동 확장

---

## 파일 인벤토리 총합

| Phase | 새 파일 | 수정 파일 |
|-------|--------|----------|
| 1 | 3 | 3 |
| 2 | 4 | 3 |
| 3 | 4 | 2 |
| 4 | 3 | 2 |
| 5 | 6 | 3 |
| 6 | 4 | 3 |
| 7 | 5 | 3 |
| **Total** | **~29** | **~19** |

## 불변 파일 (v2.0 그대로 유지)
- `nexus/compound/*`, `nexus/context/*` (gatherer.js RAG추가만), `nexus/harness/*`
- `nexus/policy/*`, `nexus/store/*`, `nexus/evolution/*`, `nexus/knowledge/*`

## Graceful Degradation 원칙
- 모든 신규 Port는 null adapter 폴백
- 서비스(Ollama/Qdrant/n8n) 미실행시 자동 비활성화
- 각 Phase 독립 롤백 가능

## 검증 계획
1. Phase별: `node nexus/core/port-validator.js --all` + CLI 명령어 테스트
2. 통합: `node nexus/core/cli.js ecosystem` -> 7-Layer 전체 상태
3. Graceful Degradation: 각 Port null adapter 시 v2.0 동작 유지 확인
