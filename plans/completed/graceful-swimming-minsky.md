# NEXUS - Network of Evolving eXtensible Unified Services
## 377개 사례 기반 자기진화형 멀티 AI 오케스트레이션 시스템

> 플랜 ID: graceful-swimming-minsky
> 작성일: 2026-02-24
> 상태: PLAN REVIEW

---

## Context (왜 이 변경이 필요한가)

377개 멀티 AI 에이전트 사례 분석 결과, **단일 AI 도구에서 멀티 도구 오케스트레이션으로의 전환**이 2026년 핵심 트렌드임을 확인했다. 현재 K드라이브에는 Claude Code, Gemini CLI, Codex CLI가 모두 설치되어 있고, ATOS와 multi-ai-orchestration 시스템이 존재하지만:

1. **설정이 분산됨** - config.json, tool-registry.json, 개별 bridge 설정이 각각 존재
2. **정적 라우팅** - 라우팅 가중치가 코드에 하드코딩되어 학습하지 않음
3. **Codex CLI 미통합** - codex.bat은 있지만 오케스트레이션에 연결되지 않음
4. **워크플로우 패턴이 지식으로만 존재** - 377개 패턴이 문서에만 있고 실행 가능한 템플릿이 아님
5. **자기 진화 메커니즘 부재** - 세션 간 학습은 있지만 시스템 자체가 진화하지 않음

**핵심 목표**: 완료되는 작업이 아닌, **매 세션마다 스스로 개선하고 진화하는 영속 시스템**

---

## Architecture Overview

```
                    +-------------------+
                    |   Architect.md    |  <-- Layer 1: Human-Readable Config
                    |  (Single Truth)   |
                    +--------+----------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v---+  +------v-----+  +-----v-------+
     | Claude Code |  | Gemini CLI |  | Codex CLI   |  <-- Layer 2: Provider Adapters
     | (Primary)   |  | (1M ctx)   |  | (Sandbox)   |
     +--------+---+  +------+-----+  +-----+-------+
              |              |              |
              +--------------+--------------+
                             |
                    +--------v----------+
                    |  Workflow Engine   |  <-- Layer 3: Composable Patterns
                    |  (YAML Templates) |
                    +--------+----------+
                             |
                    +--------v----------+
                    |  Evolution Engine  |  <-- Layer 4: Self-Improving
                    |  (Weight+Pattern)  |
                    +--------+----------+
                             |
                    +--------v----------+
                    | Knowledge Accum.  |  <-- Layer 5: Growing Memory
                    | (Cross-Session)   |
                    +--------+----------+
                             |
              +--------------+--------------+
              |                             |
     +--------v----------+     +------------v--------+
     | Self-Evolution     |     |  Auto-Research      |
     | Loop (Layer 6)     |     |  Loop (Layer 7)     |  <-- NEW: 자기진화
     +--------------------+     +---------------------+
```

---

## Phase 1: Foundation (Core + Architect.md)

### 1.1 Architect.md 생성
**파일**: `nexus/Architect.md`

Central config - 모든 프로바이더, 라우팅 규칙, 비용 제어를 하나의 읽기 쉬운 마크다운으로 관리.

```markdown
## Providers
### claude-code
- command: K:/PortableApps/genai/claude.bat
- strengths: [mcp_tools, architecture, long_sessions, code_generation]
- cost_tier: included (Max subscription)
- context: 200K | role: primary_orchestrator

### gemini-cli
- command: K:/PortableApps/genai/gemini.bat
- strengths: [web_search, 1M_context, fast, multimodal]
- cost_tier: free | context: 1M | role: collaborator

### codex-cli
- command: K:/PortableApps/genai/codex.bat
- strengths: [autonomous_coding, sandboxed, fast_iteration]
- cost_tier: api_usage | context: 128K | role: specialist

## Routing Rules (task -> provider)
## Cost Controls (budgets, tiering)
## Workflow Patterns (trigger -> template)
## Evolution Settings (learning_rate, decay, persistence)
## Self-Evolution Schedule (auto-research intervals)
```

### 1.2 Config Parser
**파일**: `nexus/core/config-parser.js`
- Architect.md 마크다운 파싱 -> 런타임 config 객체
- 캐시: `nexus/nexus.config.json` (파싱 실패 시 폴백)

### 1.3 Event Bus
**파일**: `nexus/core/event-bus.js`
- 레이어 간 이벤트 통신 (task:routed, step:complete, provider:down, pattern:discovered)

### 1.4 Orchestrator Skeleton
**파일**: `nexus/core/orchestrator.js`
- init() -> route() -> learn() 세션 라이프사이클
- 기존 ATOS, multi-ai-orchestration과의 브릿지 포인트

**재사용할 기존 코드**:
- `atos/file-lock.js` - 동시 접근 제어
- `atos/complexity-detector.js` - 작업 복잡도 분류

---

## Phase 2: Provider Adapters

### 2.1 Base Adapter Interface
**파일**: `nexus/adapters/base-adapter.js`

```javascript
class BaseAdapter {
  async query(prompt, options) {}      // 프롬프트 전송, 응답 수신
  async healthCheck() {}                // { status, latency }
  async getCapabilities() {}            // 능력 목록
  async estimateCost(prompt) {}         // 비용 추정
  getMetrics() {}                       // { calls, successes, failures, avgLatency }
}
```

### 2.2 Gemini Adapter (기존 gemini-bridge.js 래핑)
**파일**: `nexus/adapters/gemini-adapter.js`
**재사용**: `multi-ai-orchestration/gemini-bridge.js` - queryGemini(), parseGeminiResponse()

### 2.3 Codex Adapter (신규)
**파일**: `nexus/adapters/codex-adapter.js`
- `codex.bat` subprocess 스폰
- `--approval-mode full-auto` 모드 지원
- 응답 정규화

### 2.4 Claude Adapter
**파일**: `nexus/adapters/claude-adapter.js`
- 세션 내 MCP 모드 + 헤드리스 CLI 모드 이중 지원
- `claude.bat -p "prompt" --output-format json`

### 2.5 Registry + Health Monitor
**파일**: `nexus/adapters/adapter-registry.js`, `nexus/adapters/health-monitor.js`
- 동적 어댑터 등록/해제
- 3회 연속 실패 시 unavailable 마킹
- 폴백 체인 자동 활성화

---

## Phase 3: Integration Bridges (기존 시스템 연동)

### 3.1 ATOS Bridge
**파일**: `nexus/bridges/atos-bridge.js`
**연동 대상**:
- `atos/recommendation-engine.js` - recommend() 결과에 NEXUS 라우팅 추가
- `atos/execution-monitor.js` - afterCall()로 결과 피드백
- `atos/feedback-loop.js` - learnFromSuccess()로 학습 데이터 전달

### 3.2 Multi-AI Bridge
**파일**: `nexus/bridges/multi-ai-bridge.js`
**연동 대상**:
- `multi-ai-orchestration/external-router.js` - SERVICE_IDS, TASK_SERVICE_MAP 활용
- `multi-ai-orchestration/consensus-engine.js` - 합의 프로토콜 재사용

### 3.3 Hooks Bridge
**파일**: `nexus/bridges/hooks-bridge.js`
- `.claude-hooks.json`에 nexus-init, nexus-route, nexus-learn 훅 등록
- 세션 시작 시 자동 초기화, 종료 시 자동 학습

---

## Phase 4: Workflow Templates (377개 패턴 실행화)

### 4.1 Workflow Engine
**파일**: `nexus/workflows/workflow-engine.js`
- YAML 템플릿 파싱 + 단계별 실행
- 프로바이더 변수 해석 ($primary, $secondary)
- 조건부 분기, 반복, 병렬 실행 지원

### 4.2 핵심 8개 워크플로우 템플릿
**위치**: `nexus/workflows/templates/`

| 파일 | 패턴 | 기반 사례 |
|------|------|----------|
| `builder-reviewer.yaml` | 구현+리뷰 분리 | Case 1,306,312 |
| `planner-implementer.yaml` | 계획+실행 분리 | Case 302,305 |
| `cross-verification.yaml` | 교차 검증 | Case 304 |
| `parallel-worktree.yaml` | Git worktree 병렬 | Case 9,307,309 |
| `detection-fix-loop.yaml` | 자율 감지+수정 | Case 304 |
| `model-tiering.yaml` | 복잡도별 라우팅 | Case 6,374 |
| `queen-led-swarm.yaml` | 계층적 스웜 | Case 372 |
| `file-size-routing.yaml` | 파일 크기 라우팅 | Case 368 |

### 4.3 Claude Code 커맨드 등록
**파일**: `.claude/commands/core/nexus.md`
```
/nexus research <topic>   -> cross-verification workflow
/nexus build <desc>       -> planner-implementer workflow
/nexus verify <file>      -> builder-reviewer workflow
/nexus parallel <tasks>   -> parallel-worktree workflow
/nexus auto-fix <target>  -> detection-fix-loop workflow
/nexus status             -> 프로바이더 상태 표시
/nexus evolve             -> 진화 상태 표시
```

---

## Phase 5: Evolution Engine (자기 개선)

### 5.1 Weight Adjuster
**파일**: `nexus/evolution/weight-adjuster.js`
- 베이지안 가중치 조정: `adjusted = base * (1 + lr * (observed - expected))`
- [0.05, 0.95] 범위 클램핑 (프로바이더 완전 배제 방지)
- 시간 감쇠: 오래된 데이터 가중치 감소

### 5.2 Pattern Learner
**파일**: `nexus/evolution/pattern-learner.js`
- 워크플로우 실행 이력에서 패턴 자동 추출
- 성공/실패 패턴 분류
- 안티패턴 감지 (특정 프로바이더가 특정 작업에서 반복 실패)

### 5.3 Evolution State
**파일**: `nexus/evolution/evolution-state.json`
- 프로바이더별 점수 (successRate, avgLatency, avgQuality)
- 작업 유형별 가중치 조정값
- 발견된 패턴 목록

---

## Phase 6: Self-Evolution Loop (핵심 신규 - 자기 진화)

**사용자 핵심 요구**: "완료가 아닌 계속 진화하는 시스템"

### 6.1 Self-Evolution Engine
**파일**: `nexus/self-evolution/evolution-loop.js`

```
+--> [1. Analyze] 현재 시스템 상태 분석
|         |
|    [2. Diagnose] 병목/비효율/실패 패턴 진단
|         |
|    [3. Research] 외부 검색으로 개선안 탐색
|         |
|    [4. Propose] Architect.md 수정 제안 생성
|         |
|    [5. Test] 안전한 샌드박스 실행으로 검증
|         |
|    [6. Apply] 사용자 확인 후 적용 (또는 자동)
|         |
+----[7. Log] 진화 이력 기록 --> 다음 사이클
```

### 6.2 Auto-Research Agent
**파일**: `nexus/self-evolution/auto-researcher.js`

- **트리거**: 세션 시작 시, 또는 5세션마다 자동 실행
- **검색 대상**:
  - GitHub trending: 새로운 MCP 서버, AI CLI 도구
  - npm registry: @google/gemini-cli, @openai/codex 새 버전
  - Anthropic docs: Claude Code 새 기능
  - Reddit/HN: 새로운 멀티 에이전트 패턴
- **도구**: firecrawl_search, paper-search-mcp, one_search
- **출력**: `nexus/self-evolution/research-findings/YYYY-MM-DD.md`

### 6.3 Config Proposer
**파일**: `nexus/self-evolution/config-proposer.js`

- Evolution Engine의 가중치 변화 분석 -> Architect.md 수정 제안
- 새로 발견된 도구 -> Providers 섹션 추가 제안
- 새 패턴 발견 -> Workflow Templates 추가 제안
- **결코 자동 수정하지 않음** - 항상 diff 형태로 제안하고 사용자 확인 대기
- 단, `auto_apply_threshold: 0.95` 이상 확신도면 자동 적용 옵션 제공

### 6.4 Evolution Log (감사 추적)
**파일**: `nexus/self-evolution/evolution-log/`

```
nexus/self-evolution/evolution-log/
  2026-02-24.md   # 오늘의 진화 기록
  2026-02-25.md   # 내일의 진화 기록...
  summary.json    # 전체 진화 요약 (누적)
```

각 로그 항목:
```markdown
### [2026-02-24 14:30] Weight Adjustment
- codex-cli code_generation: 0.70 -> 0.75 (+0.05)
- Reason: 최근 10회 코드 생성 작업에서 95% 성공률
- Confidence: 0.82

### [2026-02-24 15:00] New Pattern Discovered
- Pattern: "Gemini plans better for React projects"
- Evidence: 8/10 React 프로젝트에서 Gemini 계획 -> Claude 구현이 최적
- Added to: pattern-library.json
```

### 6.5 Self-Improvement Checklist (자동 실행)
**파일**: `nexus/self-evolution/improvement-checklist.js`

매 세션 종료 시 자동 실행:
```
[+] 이번 세션 통계 수집
[+] 가중치 조정 필요 여부 판단
[+] 새 패턴 추출
[+] Architect.md 수정 필요 여부 판단
[+] 외부 리서치 필요 여부 판단 (5세션 주기)
[+] 워크플로우 템플릿 추가/수정 필요 여부 판단
[+] 진화 로그 기록
```

---

## Phase 7: Knowledge Accumulator (성장하는 지식)

### 7.1 Pattern Library
**파일**: `nexus/knowledge/pattern-library.json`
- 377개 보고서 패턴 + 실행 중 발견된 패턴
- 최대 1000개 (초과 시 낮은 확신도 제거)
- 구조: `{ id, name, conditions, optimalFlow, confidence, observations, lastSeen }`

### 7.2 Best Practices DB
**파일**: `nexus/knowledge/best-practices.json`
- 자동 추출된 모범 사례
- 예: "300줄 이상 파일은 Gemini에 라우팅하면 성공률 92%"

### 7.3 Session Summaries
**파일**: `nexus/knowledge/session-summaries/`
- 세션별 학습 요약
- 누적 통계 추적

### 7.4 Knowledge Index
**파일**: `nexus/knowledge/knowledge-index.js`
- 축적된 지식 검색/조회
- 컨텍스트 매칭으로 관련 패턴 제안

---

## Phase 8: CLI + GEMINI.md + CODEX.md 동기화

### 8.1 NEXUS CLI
**파일**: `nexus/core/cli.js`
```
node nexus/core/cli.js init          # 초기화
node nexus/core/cli.js status        # 프로바이더 상태
node nexus/core/cli.js route "task"  # 작업 라우팅
node nexus/core/cli.js evolve        # 진화 상태
node nexus/core/cli.js research      # 자동 리서치 실행
node nexus/core/cli.js knowledge     # 지식 검색
```

### 8.2 GEMINI.md 자동 동기화
**파일**: `nexus/sync/gemini-sync.js`
- Architect.md의 Gemini 관련 설정 -> `.gemini/settings.json` 동기화
- Gemini CLI가 NEXUS 컨텍스트를 인식하도록 GEMINI.md 자동 생성

### 8.3 AGENTS.md 통합
- 기존 AGENTS.md에 NEXUS 섹션 추가
- Codex CLI가 AGENTS.md를 읽으므로 자동 컨텍스트 공유

---

## File Structure Summary

```
nexus/
+-- Architect.md                        # Layer 1: Central Config
+-- nexus.config.json                   # Parsed cache
+-- core/
|   +-- orchestrator.js                 # Main entry
|   +-- config-parser.js                # Architect.md parser
|   +-- event-bus.js                    # Cross-layer events
|   +-- cli.js                          # CLI interface
+-- adapters/
|   +-- base-adapter.js                 # Interface
|   +-- claude-adapter.js               # Claude Code
|   +-- gemini-adapter.js               # Gemini CLI (wraps gemini-bridge.js)
|   +-- codex-adapter.js                # Codex CLI (new)
|   +-- adapter-registry.js             # Dynamic registry
|   +-- health-monitor.js               # Health checks
+-- workflows/
|   +-- workflow-engine.js              # Template executor
|   +-- workflow-registry.json          # Index
|   +-- templates/                      # 8 YAML templates
+-- evolution/
|   +-- weight-adjuster.js              # Bayesian weights
|   +-- pattern-learner.js              # Pattern extraction
|   +-- discovery-agent.js              # New tool discovery
|   +-- evolution-state.json            # Persisted state
+-- self-evolution/                     # [NEW] 자기 진화 루프
|   +-- evolution-loop.js               # 7-step cycle
|   +-- auto-researcher.js              # 외부 리서치 자동화
|   +-- config-proposer.js              # Architect.md 수정 제안
|   +-- improvement-checklist.js        # 세션 종료 시 자동 검사
|   +-- evolution-log/                  # 일별 진화 기록
|   +-- research-findings/              # 리서치 결과 보관
+-- knowledge/
|   +-- pattern-library.json            # 성장하는 패턴 DB
|   +-- best-practices.json             # 자동 추출 모범사례
|   +-- session-summaries/              # 세션별 요약
|   +-- knowledge-index.js              # 검색 인덱스
+-- bridges/
|   +-- atos-bridge.js                  # ATOS 연동
|   +-- multi-ai-bridge.js             # multi-ai-orchestration 연동
|   +-- hooks-bridge.js                 # .claude-hooks.json 연동
+-- sync/
    +-- gemini-sync.js                  # GEMINI.md 동기화
```

---

## Critical Files to Reuse (덮어쓰지 않고 래핑)

| 기존 파일 | NEXUS 활용 |
|-----------|-----------|
| `multi-ai-orchestration/gemini-bridge.js` | gemini-adapter.js에서 래핑 |
| `multi-ai-orchestration/external-router.js` | multi-ai-bridge.js에서 SERVICE_IDS, TASK_SERVICE_MAP 참조 |
| `multi-ai-orchestration/consensus-engine.js` | cross-verification 워크플로우에서 재사용 |
| `atos/recommendation-engine.js` | atos-bridge.js에서 recommend() 보강 |
| `atos/feedback-loop.js` | atos-bridge.js에서 learnFromSuccess() 연동 |
| `atos/complexity-detector.js` | orchestrator.js에서 작업 분류에 활용 |
| `atos/file-lock.js` | 동시 접근 제어에 재사용 |
| `atos/auto-discovery.js` | discovery-agent.js에서 확장 |
| `gemini.bat` | gemini-adapter.js에서 subprocess 경로 |
| `codex.bat` | codex-adapter.js에서 subprocess 경로 |

---

## Implementation Order (8 Phases)

| Phase | 파일 수 | 핵심 산출물 |
|-------|--------|------------|
| **1. Foundation** | 4 | Architect.md, config-parser, event-bus, orchestrator skeleton |
| **2. Adapters** | 6 | base/claude/gemini/codex adapters, registry, health monitor |
| **3. Bridges** | 3 | ATOS, multi-AI, hooks 연동 |
| **4. Workflows** | 10 | Engine + 8 YAML templates + registry |
| **5. Evolution** | 4 | Weight adjuster, pattern learner, discovery, state |
| **6. Self-Evolution** | 5 | Evolution loop, auto-researcher, config proposer, checklist, log |
| **7. Knowledge** | 4 | Pattern library, best practices, summaries, index |
| **8. CLI + Sync** | 3 | CLI, GEMINI.md sync, AGENTS.md integration |

**총: ~39 파일** (기존 파일 수정 0, 모두 신규 생성)

---

## Self-Evolution Process (자기 진화 프로세스 상세)

### 매 세션 자동 실행
```
Session Start:
  [+] Architect.md 로드
  [+] 프로바이더 헬스체크
  [+] 진화 상태 복원
  [+] 지식 인덱스 로드

Session During:
  [*] 모든 라우팅 결정 기록
  [*] 성공/실패 추적
  [*] 패턴 실시간 감지

Session End:
  [+] 가중치 조정
  [+] 패턴 추출
  [+] 진화 로그 기록
  [+] 지식 베이스 업데이트
```

### 5세션마다 자동 실행
```
Auto-Research Cycle:
  [+] GitHub trending AI CLI 도구 검색
  [+] npm @google/gemini-cli, @openai/codex 새 버전 확인
  [+] Anthropic docs 새 기능 확인
  [+] Reddit/HN 새 멀티에이전트 패턴 검색
  [+] 발견 사항 -> research-findings/ 저장
  [+] Architect.md 수정 제안 생성
```

### 월간 자동 실행
```
Deep Evolution Review:
  [+] 전체 가중치 추이 분석
  [+] 패턴 라이브러리 정리 (저확신도 제거)
  [+] 워크플로우 템플릿 효과 분석
  [+] 비용 추이 분석 + 최적화 제안
  [+] 종합 진화 보고서 생성
```

---

## Verification (검증 방법)

### Phase 1 검증
```bash
node nexus/core/cli.js init    # Architect.md 파싱 성공 확인
```

### Phase 2 검증
```bash
node nexus/core/cli.js status  # 3개 프로바이더 health OK 확인
# Claude Code: active, Gemini CLI: active, Codex CLI: active
```

### Phase 4 검증
```bash
node nexus/core/cli.js workflow list   # 8개 워크플로우 표시
node nexus/core/cli.js route "review this code"  # builder-reviewer 매칭
```

### Phase 6 검증
```bash
node nexus/core/cli.js evolve    # 진화 상태 표시
# Weight adjustments: [표시]
# Patterns discovered: [표시]
# Last research: [날짜]
```

### End-to-End 검증
1. `nexus init` 실행 -> 3개 프로바이더 연결 확인
2. `/nexus build "create a REST API"` -> planner-implementer 워크플로우 실행
3. 세션 종료 -> evolution-log에 기록 확인
4. 다음 세션 시작 -> 이전 세션 학습 반영 확인
5. 5세션 후 -> auto-research 실행 확인

---

## Sources (참조)

- [Multi-Agent System Architecture Guide 2026](https://www.clickittech.com/ai/multi-agent-system-architecture/)
- [Enterprise Agentic AI Architecture 2026](https://www.kellton.com/kellton-tech-blog/enterprise-agentic-ai-architecture)
- [AI Agent Architecture: Build Systems That Work in 2026](https://redis.io/blog/ai-agent-architecture/)
- [Claude Code vs Codex vs Gemini Code Assist 2026](https://www.educative.io/blog/claude-code-vs-codex-vs-gemini-code-assist)
- [2026 Guide to Coding CLI Tools: 15 AI Agents Compared](https://www.tembo.io/blog/coding-cli-tools-comparison)
- [One Gateway for 3 Coding CLIs](https://evolink.ai/blog/one-endpoint-coding-clis)
- [cc-switch: All-in-One for Claude/Codex/Gemini CLI](https://github.com/farion1231/cc-switch)
- 377개 사례 보고서: `documentation/reports/MULTI-AI-AGENT-BEST-PRACTICES-2026.md`
