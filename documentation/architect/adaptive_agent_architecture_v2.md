# AI 에이전트 적응형 아키텍처 (Adaptive Agent Architecture)

> 설계 철학: **유연성(Flexibility) · 지속 진화(Continuous Evolution) · 최대 호환성(Maximum Compatibility)**
> AI Sparkup + 외부 아티클 기반 | v2.2 — 아키텍처 설계자 관점 재구성
> 최종 업데이트: 2026-02-19 | 누적 아티클: 18개

---

## ★ 누적 아티클 레지스트리 (Source Registry)

이 아키텍처의 모든 설계 결정은 아래 아티클에 근거합니다.
새 아티클이 추가될 때마다 이 레지스트리가 갱신되며, 아키텍처 반영 위치가 추적됩니다.

| # | 포스트 | 제목 | 날짜 | 핵심 키워드 | 아키텍처 반영 위치 |
|---|--------|------|------|-----------|-----------------|
| 01 | [9095](https://aisparkup.com/posts/9095) | MIT BEACON 탐색 알고리즘 | 2026-02-12 | 도구 선택, 계층 탐색 | Tool Bridge → Selection Strategy |
| 02 | [8954](https://aisparkup.com/posts/8954) | 샌드박싱으로 코드 실행 안전하게 | 2026-02-07 | bubblewrap, Deno Sandbox | Sandbox Bridge |
| 03 | [8900](https://aisparkup.com/posts/8900) | Agent Lightning (Microsoft) | 2026-02-04 | 강화학습, 비침습적 최적화 | Evolution Bus → Performance Optimizer |
| 04 | [8681](https://aisparkup.com/posts/8681) | Anthropic Skills 아키텍처 | 2026-01-30 | Progressive Disclosure, 도메인 전문성 | Skill Registry |
| 05 | [8645](https://aisparkup.com/posts/8645) | OpenAI Agent Loop (Codex CLI) | 2026-01-29 | 추론→도구호출 루프, 프롬프트 캐싱 | Agent Loop Engine |
| 06 | [8512](https://aisparkup.com/posts/8512) | MCP 5가지 원시 타입 | 2026-01-24 | Resources, Tools, Prompts, Sampling, Roots | MCP Adapter + Core 분리 원칙 |
| 07 | [8419](https://aisparkup.com/posts/8419) | Open Responses (HuggingFace) | 2026-01-20 | 에이전트 API 표준, sub-agent loops | Model Bridge + Compatibility Layer |
| 08 | [8091](https://aisparkup.com/posts/8091) | Tool Calling 3-Pillar Framework | 2026-01-11 | 데이터 접근, 계산, 행동 | Tool Bridge → 3-Pillar Tagger |
| 09 | [8008](https://aisparkup.com/posts/8008) | MIT Recursive Language Models | 2026-01-09 | 컨텍스트 100배 확장, 재귀 호출 | Context Engine → RLM Retriever |
| 10 | [7854](https://aisparkup.com/posts/7854) | AI 에이전트 3가지 장기 메모리 | 2026-01-02 | 에피소드, 의미론적, 절차적 | Memory Manager |
| 11 | [7359](https://aisparkup.com/posts/7359) | 컨텍스트 엔지니어링 (Weaviate) | 2025-12-14 | Context Poisoning/Distraction/Confusion/Clash | Context Engine + Policy Mesh |
| 12 | [7138](https://aisparkup.com/posts/7138) | 온톨로지 기반 가드레일 | 2025-12-05 | 비즈니스 맥락, 환각 방지 | Policy Mesh → Ontology Validator |
| 13 | [7153](https://aisparkup.com/posts/7153) | Acontext 자가학습 플랫폼 | 2025-12-04 | 저장-관찰-학습, SOP 추출 | Evolution Bus → Pattern Detector |
| 14 | [7101](https://aisparkup.com/posts/7101) | Anthropic 장기 실행 에이전트 | 2025-12-02 | Initializer + Coding Agent, Git 기반 | Agent Loop Engine → 장기 하네스 |
| 15 | [7032](https://aisparkup.com/posts/7032) | Claude Skills 역설계 | 2025-12-02 | 프롬프트 기반 메타-툴 | Skill Registry → 메타-툴 패턴 |
| 16 | [6883](https://aisparkup.com/posts/6883) | Claude 고급 Tool Use | 2025-11-25 | Tool Search, Programmatic Calling, Examples | Tool Bridge → Execution Adapters |
| 17 | [6623](https://aisparkup.com/posts/6623) | Google Nested Learning (치명적 망각 해결) | 2025-11-21 | CMS, 업데이트 빈도 스펙트럼, Hope | Memory Manager → Continuum Memory + Evolution Bus → Nested Optimizer |
| 18 | [ByteByteGo EP202](https://blog.bytebytego.com/p/ep202-mcp-vs-rag-vs-ai-agents) | MCP vs RAG vs AI Agents + GPT-5 라우팅 | 2026-02-14 | 관심사 분리, 모델 라우팅, Instant/Thinking/Auto/Pro | Model Bridge → Model Router + 헥사고날 검증 |

> **레지스트리 운영 규칙**: 새 아티클 추가 시 ① 이 테이블에 행 추가 ② 아키텍처 반영 위치 명시 ③ 해당 섹션에 설계 변경 반영

---

## 0. 설계 헌법 (Architecture Constitution)

이 아키텍처의 모든 결정은 3가지 불변 원칙에 의해 심판됩니다.
어떤 기술이 유행하든, 어떤 모델이 등장하든, 이 원칙은 변하지 않습니다.

### 원칙 1: 교체 가능성 (Replaceability)

> **"어떤 구성 요소든 나머지를 건드리지 않고 교체할 수 있어야 한다."**

모델이 GPT에서 Claude로, Llama로 바뀌어도 시스템은 동작해야 합니다.
벡터DB가 Pinecone에서 Weaviate로, Qdrant로 바뀌어도 마찬가지입니다.
이를 위해 모든 레이어 간 소통은 **계약(Contract)**을 통해서만 이루어집니다.

### 원칙 2: 점진적 성장 (Incremental Growth)

> **"시스템은 빅뱅 배포 없이, 한 번에 하나씩 능력을 추가할 수 있어야 한다."**

Day 1에는 단일 도구 + 단일 모델로 시작합니다.
Day 100에는 1,000개 도구 + 3종 메모리 + 자가학습이 돌아갑니다.
중간에 시스템을 멈추거나 재설계하는 일은 없어야 합니다.

### 원칙 3: 경계의 명시성 (Explicit Boundaries)

> **"모든 레이어, 모든 컴포넌트의 책임 범위가 명시적이어야 한다."**

MCP의 Roots가 스코프를 정의하듯, 아키텍처의 모든 경계가 선언적으로 정의됩니다.
암묵적 의존, 숨겨진 결합, 매직 넘버는 아키텍처의 적입니다.

---

## 1. 아키텍처 전체 구조: Contract-First Hexagonal

기존 5레이어 스택을 **헥사고날(포트-어댑터) 아키텍처**로 재설계합니다.
핵심은 중앙의 불변 코어와, 교체 가능한 외부 어댑터의 분리입니다.

```
                    ┌─────────────────────────────┐
                    │     Policy Mesh (Layer 5)    │
                    │  안전·권한·온톨로지·감사 정책    │
                    │  ── 모든 레이어를 관통 ──       │
                    └──────────┬──────────────────┘
                               │ (정책 주입)
    ┌──────────────────────────┼──────────────────────────┐
    │                          │                          │
    │  ┌───────────┐    ┌──────┴──────┐    ┌───────────┐  │
    │  │ Inbound   │    │             │    │ Outbound  │  │
    │  │ Adapters  │───▶│  CORE       │◀───│ Adapters  │  │
    │  │           │    │  DOMAIN     │    │           │  │
    │  │ • API GW  │    │             │    │ • Tool    │  │
    │  │ • CLI     │    │ • AgentLoop │    │   Bridge  │  │
    │  │ • Event   │    │ • Memory    │    │ • Model   │  │
    │  │   Stream  │    │   Manager   │    │   Bridge  │  │
    │  │ • MCP     │    │ • Skill     │    │ • Storage │  │
    │  │   Client  │    │   Registry  │    │   Bridge  │  │
    │  │ • Open    │    │ • Context   │    │ • Sandbox │  │
    │  │   Resp.   │    │   Engine    │    │   Bridge  │  │
    │  └───────────┘    └─────────────┘    └───────────┘  │
    │                                                     │
    │              Evolution Bus (이벤트 백본)               │
    │    학습 신호 · 성능 메트릭 · 스키마 변경 이벤트 전파       │
    └─────────────────────────────────────────────────────┘
```

### 왜 이 구조인가

| 기존 (레이어 스택) | 개선 (헥사고날) | 이점 |
|------------------|---------------|------|
| 레이어 간 상하 의존 | 코어는 외부를 모름 | 모델·DB·도구 자유 교체 |
| 안전성이 최상위 레이어 | 정책이 모든 곳에 관통 | 어느 지점에서든 가드레일 적용 |
| 학습이 레이어 4에 한정 | Evolution Bus가 전체 순환 | 모든 레이어가 진화에 기여 |
| 각 레이어 독자 통신 | 계약 기반 포트로 통일 | 호환성 보장, 어댑터만 교체 |

**외부 검증 (#18 ByteByteGo "MCP vs RAG vs AI Agents"):**

ByteByteGo가 명확히 정리한 핵심 — MCP, RAG, AI Agents는 **경쟁 개념이 아니라 서로 다른 레이어의 관심사**입니다:

```
우리 아키텍처와의 매핑:

MCP  = "도구를 어떻게 연결하는가"  →  Tool Bridge (MCP Adapter)
RAG  = "런타임에 무엇을 아는가"    →  Context Engine (Retriever)
Agent = "무엇을 관찰·판단·실행하는가" →  Core Domain (Agent Loop Engine)
```

이 분리가 우리 헥사고날 설계를 검증합니다:
- MCP는 **Outbound Adapter** (Tool Bridge)에 위치 — 도구 연결 방식만 담당
- RAG는 **Context Engine의 한 전략** — 다른 검색 전략(RLM, 키워드 등)과 교체/병행 가능
- Agent Loop은 **Core Domain** — MCP와 RAG에 의존하지 않고 독립 동작
- 세 관심사가 Port를 통해 느슨하게 연결되어 **각각 독립적으로 진화**

---

## 2. Core Domain: 변하지 않는 것들

Core Domain은 외부 기술에 의존하지 않는 **순수 비즈니스 로직**입니다.
여기에 있는 코드는 특정 모델, 특정 DB, 특정 프레임워크를 모릅니다.

### 2.1 Agent Loop Engine

Agent Loop은 16개 아티클에서 가장 보편적인 패턴입니다.
이를 **모델에 독립적인 상태 머신**으로 정의합니다.

```
                        ┌─────────────┐
                        │   IDLE      │
                        └──────┬──────┘
                               │ receive(UserRequest)
                        ┌──────▼──────┐
                        │  REASONING  │◀──────────────────┐
                        └──────┬──────┘                   │
                               │                          │
                     ┌─────────┴─────────┐                │
                     ▼                   ▼                │
              ┌────────────┐     ┌─────────────┐          │
              │ RESPONDING │     │ TOOL_CALLING │          │
              └─────┬──────┘     └──────┬──────┘          │
                    │                   │                  │
                    ▼                   ▼                  │
              ┌────────────┐     ┌─────────────┐          │
              │ TURN_DONE  │     │ TOOL_RESULT  │──────────┘
              └────────────┘     └─────────────┘
```

**계약 (Contract):**

```typescript
// 이 인터페이스는 변하지 않는다. 구현체만 바뀐다.
interface AgentLoopPort {
  reason(context: AgentContext): Promise<ReasoningResult>;
  // ReasoningResult = TextResponse | ToolCallRequest
}

interface ToolExecutionPort {
  execute(call: ToolCall, policy: PolicyContext): Promise<ToolResult>;
}

interface ContextCompactionPort {
  compact(history: Message[], threshold: number): Promise<Message[]>;
}
```

**진화 포인트:**
- `reason()` 뒤의 모델이 교체되어도 AgentLoop 상태 머신은 변하지 않음
- `compact()` 전략이 단순 요약 → RLM 재귀 호출로 진화해도 인터페이스 동일
- Open Responses의 sub-agent loops도 이 상태 머신의 중첩(nested) 인스턴스로 표현

### 2.2 Memory Manager

3종 장기 메모리를 **통합 인터페이스** 아래에 두되, 구현은 완전히 독립적입니다.
추가로 Google의 Nested Learning(#17)에서 도출한 **Continuum Memory** 원칙을 적용하여,
메모리를 이산적 3종이 아닌 **업데이트 빈도 스펙트럼**으로 관리합니다.

#### 치명적 망각 방지 원칙 (Anti-Catastrophic Forgetting)

새로운 경험을 학습할 때 기존 지식을 잊는 "치명적 망각"은 AI 에이전트 아키텍처에서도 발생합니다.
새 Skill을 추가하면 기존 Skill과 충돌하고, 새 도메인 지식이 기존 정책을 덮어쓰는 식입니다.
Nested Learning의 핵심 통찰을 아키텍처 레벨로 번역하면:

> **"각 메모리 컴포넌트는 자신만의 업데이트 빈도(update frequency)를 가지며,
> 빈도가 다른 메모리는 서로의 내용을 덮어쓰지 않는다."**

```
업데이트 빈도 스펙트럼 (Continuum Memory System)

  고빈도 (매 턴)                                저빈도 (거의 불변)
  ◀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶

  [작업 컨텍스트]  [에피소드]  [의미론적]  [절차적]  [온톨로지]  [정책]
   현재 대화의      최근 경험    도메인      검증된    비즈니스    핵심
   즉각적 맥락      기록        사실 지식    루틴      개념 정의   가드레일

  ── 자주 변함 ──  ── 축적 ──  ── 정제 ──  ── 안정 ──  ── 불변에 가까움 ──
```

**이 스펙트럼이 해결하는 문제:**
- 고빈도 메모리(에피소드)의 변경이 저빈도 메모리(온톨로지)를 오염시키지 않음
- 새 경험 학습이 검증된 절차적 스킬을 덮어쓰지 않음
- 각 빈도 레벨은 독립적 저장소 + 독립적 업데이트 정책을 가짐
- 승격(에피소드→의미론적→절차적)은 명시적 검증을 거쳐야만 발생

```typescript
// 이 인터페이스는 변하지 않는다. 구현체만 바뀐다.
interface MemoryPort {
  // 에피소드 메모리: "이전에 무슨 일이 있었나?" [업데이트 빈도: 높음]
  recallEpisodes(query: SemanticQuery, limit: number): Promise<Episode[]>;
  storeEpisode(episode: Episode): Promise<void>;

  // 의미론적 메모리: "내가 무엇을 아는가?" [업데이트 빈도: 중간]
  queryKnowledge(query: StructuredQuery): Promise<KnowledgeFact[]>;
  updateKnowledge(fact: KnowledgeFact): Promise<void>;

  // 절차적 메모리: "이걸 어떻게 하는가?" [업데이트 빈도: 낮음]
  findProcedure(taskSignature: string): Promise<Procedure | null>;
  promoteToProcedure(episodes: Episode[]): Promise<Procedure>;

  // Continuum Memory: 빈도 레벨 간 승격/강등 관리 [#17 Nested Learning 반영]
  getUpdatePolicy(level: MemoryLevel): UpdatePolicy;
  requestPromotion(from: MemoryLevel, to: MemoryLevel, candidate: MemoryItem): Promise<PromotionDecision>;
}

// 승격은 반드시 검증을 거쳐야 함 (치명적 망각 방지)
interface PromotionDecision {
  approved: boolean;
  conflictsDetected: ConflictReport[];  // 기존 메모리와의 충돌 검사
  rollbackPlan: RollbackPlan;           // 승격 후 문제 발생 시 복원 경로
}
```

**진화 포인트:**
- Day 1: 에피소드만 구현 (벡터DB 하나)
- Day 30: 의미론적 메모리 추가 (그래프DB 연결)
- Day 90: 절차적 메모리 + Acontext 자가학습 파이프라인 통합
- 각 단계에서 기존 코드 수정 **0줄**. 새 어댑터만 플러그인.

**메모리 간 승격 흐름 (Continuum Memory 적용):**

```
에피소드 축적
     │
     ▼
[패턴 탐지] ── "이 패턴이 N회 이상 반복되었는가?"
     │
     ▼
[충돌 검사] ── "기존 의미론적 지식과 모순되지 않는가?" ◀── #17 치명적 망각 방지
     │                                                    게이트: 기존 지식을
     │            ┌── 충돌 발견 → [사람 검토 큐]             덮어쓰지 않고
     ▼            │                                        공존 또는 버전 관리
의미론적 지식으로 정제
     │
     ▼
[반복 실행 감지] ── "동일 절차가 M회 이상 성공했는가?"
     │
     ▼
[안정성 검증] ── "기존 절차적 스킬을 깨뜨리지 않는가?" ◀── #17 업데이트 빈도 격리
     │                                                    저빈도 메모리 보호
     ▼
절차적 스킬로 승격
(SOP化 / Skills化)
     │
     ▼
[롤백 플랜 등록] ── 승격 후 성능 저하 감지 시 자동 복원 경로
```

**Nested Learning에서 가져온 핵심 제약:**
- 고빈도 레벨의 변경은 즉시 반영 (에피소드 = 매 턴)
- 저빈도 레벨의 변경은 **검증 게이트** 통과 필수 (절차적 = 수일~수주 주기)
- 온톨로지/정책은 **가장 저빈도** → 자동 변경 불가, 반드시 사람 승인
- 승격 시 기존 메모리와의 충돌 검사가 항상 선행됨 (덮어쓰기 = 금지)

### 2.3 Skill Registry

Skills의 핵심 통찰: **Skills는 코드가 아니라 프롬프트 템플릿이다.**
이를 아키텍처적으로 **컨텐츠 저장소 + Progressive Disclosure 프로토콜**로 정의합니다.

```typescript
interface SkillRegistryPort {
  // Level 0: 메타데이터만 (~50 토큰)
  listAvailable(): Promise<SkillMeta[]>;

  // Level 1: 핵심 지시사항 로드 (~500 토큰)
  loadSkill(id: string): Promise<SkillInstruction>;

  // Level 2: 참조 문서 + 스크립트 로드 (2,000+ 토큰)
  loadDetail(id: string, section: string): Promise<SkillDetail>;

  // 스킬 진화
  registerSkill(skill: SkillPackage): Promise<void>;
  deprecateSkill(id: string, successor?: string): Promise<void>;
}
```

**호환성 설계:**
- Anthropic Skills 형식(`SKILL.md` + 디렉토리)과 직접 호환
- MCP Prompts를 Skill로 래핑하는 어댑터 제공
- Enterprise 내부 문서(Notion, Confluence)를 Skill로 변환하는 어댑터 제공
- **버전 관리**: 스킬은 semver로 관리, deprecated 스킬은 successor 매핑

### 2.4 Context Engine

컨텍스트 엔지니어링의 6요소를 **파이프라인 패턴**으로 조합합니다.

```
UserInput
  │
  ▼
[Query Augmenter] ─── 애매한 입력을 구조화
  │
  ▼
[Retriever]       ─── 관련 정보 검색 (RAG, DB, API)
  │
  ▼
[Context Scorer]  ─── 검색 결과 관련성 평가 + 오염/충돌 탐지
  │
  ▼
[Context Budget   ─── 토큰 예산 내에서 최적 조합
  Optimizer]           (Skills + 메모리 + 검색 결과 + 도구 정의)
  │
  ▼
[Prompt Assembler]─── 최종 프롬프트 조립 (캐시 prefix 보존)
  │
  ▼
AgentLoop.reason()
```

**진화 포인트:**
- 파이프라인의 각 스테이지는 독립 교체 가능
- Context Scorer에 컨텍스트 실패 4패턴 탐지 로직 플러그인
- RLM은 Retriever의 한 전략으로 플러그인 (초대규모 입력일 때 자동 전환)
- Context Budget Optimizer가 Progressive Disclosure 레벨을 자동 결정

---

## 3. Ports & Adapters: 교체 가능한 외부 세계

Core Domain은 **Port(인터페이스)**만 알고, 실제 기술은 **Adapter**가 담당합니다.
기술이 바뀌면 어댑터만 교체합니다.

### 3.1 Model Bridge (모델 교체 + 지능형 라우팅)

GPT-5의 라우팅 아키텍처(#18)에서 핵심 통찰이 나옵니다:
**하나의 만능 모델이 아니라, 작업 복잡도에 따라 적합한 모델로 라우팅하는 것이 최적입니다.**
GPT-5는 Instant(빠른 모델) / Thinking(추론 모델) / Auto(자동 분류) / Pro(다중 샘플링)
4가지 모드를 운영합니다. 이 원칙을 우리 아키텍처의 **Model Router**로 일반화합니다.

```
┌─────────────────────────────────────────────────────────────┐
│                       Model Bridge                          │
│                                                             │
│  Port: AgentLoopPort.reason()                               │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Model Router (#18 반영)                    │ │
│  │                                                        │ │
│  │  [입력 쿼리] → [경량 분류기] → 복잡도 판정               │ │
│  │                                                        │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │ │
│  │  │ Instant  │ │ Standard │ │ Reasoning│ │ Pro      │  │ │
│  │  │ Mode     │ │ Mode     │ │ Mode     │ │ Mode     │  │ │
│  │  │          │ │          │ │          │ │          │  │ │
│  │  │ 단순 응답│ │ 일반 작업│ │ 복잡 추론│ │ 다중 샘플│  │ │
│  │  │ 저지연   │ │ 균형     │ │ 다단계   │ │ + 보상   │  │ │
│  │  │ 최우선   │ │          │ │ 사고     │ │ 모델 선별│  │ │
│  │  └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘  │ │
│  │        │            │            │            │        │ │
│  └────────┼────────────┼────────────┼────────────┼────────┘ │
│           ▼            ▼            ▼            ▼          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐     │
│  │ Haiku /  │ │ Sonnet / │ │ Opus /   │ │ Multi-     │     │
│  │ GPT-mini │ │ GPT-main │ │ GPT-think│ │ Sample +   │     │
│  │ / Llama  │ │ / Gemini │ │ / o-ser. │ │ Reward     │     │
│  │ Light    │ │ Pro      │ │          │ │ Model      │     │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘     │
│                                                             │
│  공통 관심사:                                                 │
│  • 프롬프트 캐싱 prefix 보존                                   │
│  • 토큰 사용량 계측                                            │
│  • 응답 형식 정규화 (추론 trace 포함)                           │
│  • 폴백 체인 (primary → secondary → fallback)                 │
│  • 라우팅 결정 로그 → Evolution Bus 발행 (최적화 피드백)         │
└─────────────────────────────────────────────────────────────┘
```

**Model Router 계약:**

```typescript
interface ModelRouterPort {
  // 쿼리 복잡도를 분석하여 최적 모드 결정
  classify(query: UserInput, context: AgentContext): Promise<RoutingDecision>;
}

interface RoutingDecision {
  mode: 'instant' | 'standard' | 'reasoning' | 'pro';
  selectedModel: string;           // 실제 모델 식별자
  confidence: number;              // 분류 확신도
  fallbackChain: string[];         // 실패 시 대안 모델 체인
  costEstimate: TokenEstimate;     // 예상 비용
}
```

**유연성 설계:**
- Router 자체가 교체 가능 (규칙 기반 → ML 분류기 → RL 최적화)
- 새 모델 등급(예: 미래의 Ultra 급)이 나오면 모드 1개 추가 + 어댑터 1개 작성
- 라우팅 결정이 Evolution Bus에 발행 → Performance Optimizer가 라우팅 정책 자동 튜닝
- 비용 최적화: 단순 작업에 고가 모델을 쓰지 않음 (댓글 사례: 70% 비용 절감)

**호환성 전략:**
- Chat Completion과 Open Responses를 **동시 지원** (전환 강제 없음)
- 모델 응답을 내부 정규형(Canonical Response)으로 변환 후 Core에 전달
- 새 모델/API 추가 시 어댑터 1개 작성 + 설정 파일 1줄 추가

### 3.2 Tool Bridge (도구 통합)

```
┌─────────────────────────────────────────────────────┐
│                    Tool Bridge                       │
│                                                      │
│  Port: ToolExecutionPort.execute()                   │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │           Tool Registry (도구 카탈로그)         │    │
│  │                                              │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │    │
│  │  │ 3-Pillar│ │ BEACON  │ │ Tool    │        │    │
│  │  │ Tagger  │ │ 계층    │ │ Search  │        │    │
│  │  │         │ │ Index   │ │ Engine  │        │    │
│  │  │ 읽기    │ │         │ │         │        │    │
│  │  │ 계산    │ │ 카테고리│ │ defer_  │        │    │
│  │  │ 행동    │ │ →서브   │ │ loading │        │    │
│  │  │ 자동태깅│ │ →개별   │ │         │        │    │
│  │  └─────────┘ └─────────┘ └─────────┘        │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │           Execution Adapters                  │    │
│  │                                              │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│    │
│  │  │  MCP   │ │ Direct │ │ Progr. │ │ REST   ││    │
│  │  │ Server │ │ Func.  │ │ Tool   │ │ API    ││    │
│  │  │ Adapter│ │ Call   │ │ Call   │ │ Adapter││    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘│    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  Tool Use Examples 저장소 (파라미터 정확도 향상)         │
└─────────────────────────────────────────────────────┘
```

**유연성 설계:**
- 도구 추가 = 카탈로그에 JSON 정의 1개 등록 (코드 변경 0)
- 3-Pillar 태깅이 자동으로 Policy Mesh와 연동 (Actions → 승인 필요)
- 도구 개수 10개 이하 → 직접 나열, 100개+ → BEACON 자동 전환, 1000개+ → Tool Search 자동 전환
- **도구 선택 전략이 도구 개수에 따라 자동 스케일링**

### 3.3 Storage Bridge (저장소 교체)

```
┌─────────────────────────────────────────────────────┐
│                   Storage Bridge                     │
│                                                      │
│  Port: MemoryPort.*                                  │
│                                                      │
│  에피소드        의미론적          절차적               │
│  ┌──────────┐  ┌──────────┐    ┌──────────┐          │
│  │ Pinecone │  │ Neo4j    │    │ Workflow │          │
│  │ Weaviate │  │ Ontotext │    │ Engine   │          │
│  │ Qdrant   │  │ RelDB    │    │ RL State │          │
│  │ pgvector │  │ FIBO/UMLS│    │ Cache    │          │
│  └──────────┘  └──────────┘    └──────────┘          │
│       ↕              ↕               ↕               │
│  ┌──────────────────────────────────────────────┐    │
│  │  Unified Query Translator                     │    │
│  │  SemanticQuery → 각 저장소 네이티브 쿼리로 변환  │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**점진적 성장 설계:**
- Day 1: 에피소드 메모리만 + 단일 벡터DB → 완전히 동작
- 의미론적/절차적은 null adapter (빈 결과 반환) → 시스템 정상 동작
- 나중에 실제 구현체 연결 시 **무중단 전환**

### 3.4 Sandbox Bridge (실행 격리)

```
┌─────────────────────────────────────────────────────┐
│                  Sandbox Bridge                      │
│                                                      │
│  Port: ToolExecutionPort → Policy Mesh 경유           │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ bubblewrap│ │  Deno    │ │  Docker  │             │
│  │ (로컬)    │ │ Sandbox  │ │ (범용)    │             │
│  │          │ │ (서비스)  │ │          │             │
│  │ • 읽기전용│ │ • egress │ │ • 완전   │             │
│  │   마운트  │ │   제어   │ │   격리   │             │
│  │ • 프로젝트│ │ • secret │ │ • 이미지 │             │
│  │   쓰기만  │ │   proxy  │ │   기반   │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│                                                      │
│  Context에 따라 자동 선택:                              │
│  • 로컬 개발 → bubblewrap                              │
│  • 서비스 + API키 → Deno Sandbox                       │
│  • 알 수 없는 코드 → Docker                             │
│  • 읽기 전용 도구 → 샌드박스 없이 직접 실행               │
└─────────────────────────────────────────────────────┘
```

---

## 4. Policy Mesh: 모든 곳에 스며드는 정책 레이어

기존 설계에서 안전성은 "최상위 레이어"였습니다.
이는 구조적 결함입니다. 안전은 레이어가 아니라 **모든 곳에 존재하는 직물(Mesh)**이어야 합니다.

```
┌──────────────────────────────────────────────────────────────┐
│                        Policy Mesh                           │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ Permission │  │ Ontology   │  │ Audit      │             │
│  │ Policies   │  │ Validator  │  │ Trail      │             │
│  │            │  │            │  │            │             │
│  │ • 3-Pillar │  │ • 용어 검증 │  │ • 모든 도구 │             │
│  │   기반 권한 │  │ • 관계 검증 │  │   호출 기록 │             │
│  │ • 읽기=자유│  │ • 환각 탐지 │  │ • 정책 위반 │             │
│  │ • 계산=샌박│  │ • 도메인별  │  │   경보     │             │
│  │ • 행동=승인│  │   규칙 적용 │  │ • 비용 추적 │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐    │
│  │ Rate       │  │ Context    │  │ Compatibility       │    │
│  │ Governor   │  │ Hygiene    │  │ Guard               │    │
│  │            │  │            │  │                     │    │
│  │ • 토큰/분  │  │ • Poisoning│  │ • 스키마 변경 감지    │    │
│  │ • 비용/작업│  │   탐지     │  │ • 하위 호환성 검증    │    │
│  │ • 도구호출 │  │ • 충돌 해소 │  │ • deprecated 경고    │    │
│  │   횟수 제한│  │ • TTL 관리 │  │ • migration 자동 제안│    │
│  └────────────┘  └────────────┘  └─────────────────────┘    │
│                                                              │
│  적용 방식: AOP(Aspect-Oriented) — 모든 Port 호출을 인터셉트    │
│  적용 시점: BEFORE (사전 검증) / AFTER (사후 감사) / AROUND (래핑)│
└──────────────────────────────────────────────────────────────┘
```

**정책 적용 흐름 예시:**

```
에이전트가 "고객 데이터 삭제" 도구를 호출하려 함
    │
    ├─ [Permission] Actions 도구 → 사용자 승인 필요 ✓
    ├─ [Ontology]   "고객" = 재무 시스템의 paying client인지 확인 ✓
    ├─ [Sandbox]    Deno Sandbox 내에서 실행 (egress 제한) ✓
    ├─ [Rate]       분당 삭제 횟수 제한 미초과 ✓
    ├─ [Context]    이 작업의 근거 데이터가 오염되지 않았는지 ✓
    ├─ [Compat]     삭제 API v2 → v3 마이그레이션 필요 여부 ✓
    └─ [Audit]      전체 과정 기록 ✓
```

**유연성:** 정책은 YAML/JSON 선언형 규칙으로 정의, 코드 수정 없이 실시간 변경 가능

---

## 5. Evolution Bus: 시스템 전체의 학습 신경계

이 아키텍처에서 가장 중요한 혁신입니다.
기존에 학습은 Layer 4에 한정되었지만, 진화는 **시스템 전체에서 일어나야** 합니다.

### 5.1 이벤트 기반 진화

```
┌─────────────────────────────────────────────────────────────┐
│                      Evolution Bus                          │
│                                                             │
│  이벤트 생산자 (모든 컴포넌트)                                  │
│  ─────────────────────────────────────                      │
│  AgentLoop    → turn.completed, turn.failed                 │
│  ToolBridge   → tool.called, tool.error, tool.latency       │
│  MemoryMgr    → episode.stored, knowledge.updated           │
│  ContextEng   → context.poisoned, context.budget_exceeded   │
│  PolicyMesh   → policy.violated, policy.approved            │
│  SkillReg     → skill.activated, skill.deprecated           │
│  ModelBridge  → model.response_time, model.token_usage      │
│                                                             │
│  이벤트 소비자 (진화 에이전트들)                                 │
│  ─────────────────────────────────                          │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐  │
│  │ Pattern       │  │ Performance   │  │ Schema         │  │
│  │ Detector      │  │ Optimizer     │  │ Evolver        │  │
│  │               │  │               │  │                │  │
│  │ 반복 작업 탐지 │  │ 병목 식별     │  │ 스키마 변경     │  │
│  │ → SOP 추출    │  │ → RL 최적화   │  │ 감지 → 자동    │  │
│  │ → Skill 생성  │  │ → 프롬프트    │  │ migration 제안 │  │
│  │ 제안          │  │   튜닝 제안   │  │                │  │
│  └───────────────┘  └───────────────┘  └────────────────┘  │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐  │
│  │ Compatibility │  │ Health        │  │ Nested         │  │
│  │ Monitor       │  │ Dashboard     │  │ Optimizer      │  │
│  │               │  │               │  │ (#17 반영)     │  │
│  │ 외부 API 변경 │  │ 전체 시스템    │  │                │  │
│  │ 감지 → 어댑터 │  │ 상태 시각화   │  │ 메모리 빈도별   │  │
│  │ 업데이트 알림  │  │ + 진화 이력   │  │ 충돌 검사      │  │
│  └───────────────┘  └───────────────┘  │ 승격 게이트     │  │
│                                        │ 망각 방지 감시   │  │
│                                        └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 진화 루프의 4단계

```
[1. 관찰]                    [2. 분석]
 모든 컴포넌트가               Pattern Detector가
 이벤트를 Evolution            반복 패턴, 실패 패턴,
 Bus에 발행                    성능 병목을 식별
     │                             │
     ▼                             ▼
[4. 적용]                    [3. 제안]
 승인된 개선사항을              Performance Optimizer가
 무중단으로 반영               구체적 개선안 생성
 (어댑터 교체,                 (새 Skill, 프롬프트 수정,
  Skill 추가,                  도구 재배치, 정책 변경)
  정책 업데이트)                   │
     ▲                            │
     └────── [사람 승인 또는 자동 승인 정책] ──┘
```

**이것이 Acontext + Agent Lightning + Nested Learning을 포괄하는 이유:**
- Acontext의 저장-관찰-학습 = Evolution Bus의 이벤트 → Pattern Detector → Skill 생성
- Agent Lightning의 RL 최적화 = Evolution Bus의 메트릭 → Performance Optimizer → 정책 가중치 업데이트
- Nested Learning의 빈도별 보호 = Evolution Bus의 메모리 이벤트 → Nested Optimizer → 승격 게이트 관리
- 셋 다 Evolution Bus의 **소비자(consumer)**로 플러그인되며, 서로를 대체하거나 병행 가능
- Nested Optimizer는 다른 소비자의 학습 결과가 **기존 메모리를 파괴하지 않는지** 최종 검증하는 안전망 역할

---

## 6. 호환성 보장 전략 (Compatibility Matrix)

### 6.1 수평 호환: 외부 생태계

```
┌────────────────────────────────────────────────────────┐
│                  Compatibility Layer                    │
│                                                        │
│  Protocol Adapters                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   MCP    │ │  Open    │ │  Chat    │ │  A2A     │  │
│  │ (도구    │ │ Responses│ │ Complet. │ │ (에이전트│  │
│  │  연결)   │ │ (에이전트│ │ (레거시  │ │  간 통신)│  │
│  │          │ │  네이티브)│ │  호환)   │ │          │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                        │
│  Data Format Adapters                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ JSON     │ │  XML     │ │ Protobuf │ │ GraphQL  │  │
│  │ Schema   │ │ /RDF     │ │          │ │          │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                        │
│  원칙: 내부 정규형(Canonical) ↔ 외부 형식 간 변환만 담당   │
│  새 프로토콜 추가 = 어댑터 1개 작성 (Core 수정 0)         │
└────────────────────────────────────────────────────────┘
```

### 6.2 수직 호환: 버전 진화

```
Schema Registry
─────────────────────────────────────────────
  v1.0  SkillPackage   { name, description, content }
  v1.1  SkillPackage   { name, description, content, version }     ← 필드 추가
  v2.0  SkillPackage   { name, description, content, version,     ← 구조 변경
                          dependencies[], deprecated_by? }

Migration Chain:
  v1.0 → v1.1: 자동 (version = "1.0.0" 기본값 주입)
  v1.1 → v2.0: 반자동 (dependencies = [] 주입, 사람 확인 권장)
```

**버전 관리 원칙:**
- 필드 추가 = 하위 호환 (자동 마이그레이션)
- 필드 제거/변경 = 메이저 버전 업 (Schema Evolver가 migration 스크립트 제안)
- deprecated 컴포넌트는 즉시 제거하지 않고 **sunset 기간** 운영
- Compatibility Guard가 모든 포트 호출 시 스키마 버전 검증

### 6.3 시간축 호환: 과거와 미래

| 시간 방향 | 전략 | 구현 |
|----------|------|------|
| **과거 호환** (Backward) | 레거시 어댑터 유지 | Chat Completion 어댑터는 Open Responses 시대에도 동작 |
| **현재 공존** (Coexistence) | 다중 프로토콜 동시 지원 | MCP + REST + GraphQL 동시 운영 |
| **미래 대비** (Forward) | 확장 포인트 예약 | 모든 Contract에 `metadata: Record<string, unknown>` 포함 |

---

## 7. 점진적 성장 경로 (Growth Path)

### Maturity Model: 5단계 성숙도

```
Level 0: Stateless        단일 모델 + 직접 API 호출
│                         도구 없음, 메모리 없음
│                         ── 이미 여기서도 Core Loop은 동작 ──
▼
Level 1: Tool-Augmented   도구 5~10개 직접 나열
│                         3-Pillar 태깅, MCP 기본 연결
│                         단기 메모리 (대화 히스토리)
▼
Level 2: Context-Aware    Context Engine 파이프라인 가동
│                         에피소드 메모리 + 프롬프트 캐싱
│                         Skills 10~20개 등록
│                         기본 샌드박싱
▼
Level 3: Self-Improving   Evolution Bus 활성화
│                         3종 메모리 완성
│                         자가학습 (Pattern Detector)
│                         Tool Search + Programmatic Calling
│                         온톨로지 기반 가드레일
▼
Level 4: Autonomous       RL 기반 자동 최적화
                          멀티 에이전트 오케스트레이션
                          RLM 초대규모 컨텍스트
                          장기 실행 하네스 (일~주 단위)
                          Schema Evolver 자동 마이그레이션
```

**핵심: 어느 레벨에서든 시스템은 완전히 동작합니다.**
Level 0도 유효한 시스템이고, Level 4도 Level 0의 코드를 포함합니다.
레벨업 = 새 어댑터/소비자 플러그인. 기존 코드 수정 = 0.

### 레벨업 체크리스트

| 전환 | 추가되는 것 | 제거되는 것 | 리스크 |
|------|-----------|-----------|--------|
| 0→1 | Tool Bridge + 5개 도구 | 없음 | 🟢 낮음 |
| 1→2 | Context Engine + 벡터DB + Skills | 없음 | 🟡 중간 (인프라 추가) |
| 2→3 | Evolution Bus + 그래프DB + 온톨로지 | 없음 | 🟡 중간 (복잡도 증가) |
| 3→4 | RL Optimizer + 멀티 에이전트 | 없음 | 🔴 높음 (운영 복잡도) |

---

## 8. 진화 시나리오 시뮬레이션

### 시나리오 A: "내일 새 LLM이 나온다" + "비용을 70% 줄이고 싶다"

```
[모델 추가]
현재: OpenAI GPT-5 사용 중
내일: Google Gemini Ultra 2가 더 저렴하고 빠름

변경:
  1. GeminiAdapter implements AgentLoopPort  (새 어댑터 1개)
  2. config.yaml: model_bridge.adapters += "gemini-ultra-2"
  3. Model Router가 자동으로 새 모델을 라우팅 후보에 포함

영향 범위: Model Bridge 어댑터 1개
Core Domain 변경: 0줄
다운타임: 0

[비용 최적화 — #18 GPT-5 라우팅 패턴 적용]
현재: 모든 작업에 Opus 급 모델 사용 → 비용 과다

변경:
  1. Model Router 활성화 (경량 분류기 플러그인)
  2. 라우팅 정책 설정:
     - 단순 응답/요약 → Instant 모드 (Haiku/GPT-mini) : 비용 1x
     - 일반 코딩/분석 → Standard 모드 (Sonnet/GPT-main) : 비용 3x
     - 복잡 추론/계획 → Reasoning 모드 (Opus/GPT-think) : 비용 10x
     - 고위험 의사결정 → Pro 모드 (다중 샘플 + 보상 모델) : 비용 30x
  3. Evolution Bus가 라우팅 결과 수집 → 분류기 자동 튜닝

결과: 쿼리의 ~60%가 Instant/Standard로 처리 → 전체 비용 60~70% 절감
영향 범위: Model Router 설정 파일
Core Domain 변경: 0줄
품질 저하: 0 (복잡한 작업은 여전히 고급 모델 사용)
```

### 시나리오 B: "도구가 50개에서 500개로 늘었다"

```
현재: 도구 50개, 직접 나열 방식
변경 후: 도구 500개

자동 전환:
  Tool Bridge 내부의 Selection Strategy가 자동 감지
  50개 → 직접 나열
  100개+ → BEACON 계층 탐색 활성화
  500개+ → Tool Search Tool 온디맨드 검색 전환

영향 범위: Tool Bridge 내부 전략 자동 전환
Core Domain 변경: 0줄
설정 변경: 0줄 (자동 스케일링)
```

### 시나리오 C: "MCP 다음 버전이 나왔다"

```
현재: MCP v1 (Resources, Tools, Prompts, Sampling, Roots)
미래: MCP v2 (새로운 원시 타입 추가)

변경:
  1. MCPv2Adapter extends MCPv1Adapter  (하위 호환 유지)
  2. Compatibility Guard가 v1 서버와 v2 서버 자동 감지
  3. v1 서버에는 v1 프로토콜, v2 서버에는 v2 프로토콜 사용

영향 범위: MCP Adapter 1개 확장
Core Domain 변경: 0줄
v1 서버 영향: 0 (계속 동작)
```

### 시나리오 D: "운영 중 환각이 감지됐다"

```
발생: 에이전트가 존재하지 않는 "고객 ID"를 생성

자동 대응 흐름:
  1. [Ontology Validator] 환각 감지 이벤트 발행
  2. [Audit Trail] 해당 작업 전체 체인 기록
  3. [Policy Mesh] 해당 도구 호출 자동 롤백
  4. [Evolution Bus] → Pattern Detector가 유사 패턴 분석
  5. [Performance Optimizer] 해당 시나리오용 검증 단계 추가 제안
  6. [사람 승인] → 새 정책 규칙 Policy Mesh에 추가

결과: 같은 유형의 환각은 Policy Mesh에서 사전 차단
```

### 시나리오 E: "에이전트가 3일짜리 프로젝트를 수행한다"

```
Agent Loop Engine + 장기 실행 하네스 조합:

Session 1 (Initializer):
  AgentLoop → SkillRegistry.load("project-scaffolding")
           → ToolBridge.execute(create_checklist)
           → ToolBridge.execute(git_init)
           → MemoryManager.storeEpisode(session_1_summary)

Session 2~N (Worker):
  AgentLoop → MemoryManager.recallEpisodes("last_session")
           → ToolBridge.execute(git_log)  ← 인수인계
           → ContextEngine.assemble(progress + next_task)
           → [작업 수행]
           → ToolBridge.execute(git_commit)
           → MemoryManager.storeEpisode(session_N_summary)

Evolution Bus:
  매 세션 완료 시 turn.completed 이벤트 발행
  Pattern Detector가 반복 패턴 감지 → 절차적 메모리 승격 제안
```

### 시나리오 F: "새 도메인 지식이 기존 스킬과 충돌한다" (#17 Nested Learning)

```
상황: 금융 에이전트에 새로운 규제 정보가 추가됨
     → 기존에 학습된 "대출 심사 절차" 스킬과 부분 충돌

기존 방식 (치명적 망각):
  새 규제 학습 → 기존 대출 심사 스킬 덮어쓰기 → 이전 케이스 처리 불가

Continuum Memory 적용:

1. [에피소드 저장] 새 규제 관련 에피소드 기록
   → 업데이트 빈도: 높음 → 즉시 반영 ✓

2. [승격 요청] Pattern Detector가 "새 규제를 의미론적 지식으로 승격" 제안
   → Nested Optimizer가 충돌 검사 실행
   → 결과: 기존 "대출 심사 절차"와 부분 충돌 감지

3. [충돌 해소 전략]
   ├─ 기존 절차적 스킬: 삭제하지 않음 (저빈도 보호)
   ├─ 새 규제: 의미론적 지식으로 승격 (중빈도)
   ├─ 양립 불가 부분: 사람 검토 큐로 전달
   └─ 롤백 플랜 등록: 새 규제 적용 후 성능 저하 시 이전 스킬 복원

4. [검증 후 적용]
   사람 승인 → 기존 절차에 "조건부 분기" 추가
   ("2026년 이전 신청 → 구 절차" / "2026년 이후 → 신 절차")
   → 기존 지식과 새 지식이 공존 (덮어쓰기 없음)

영향 범위: Nested Optimizer + Memory Manager 내부
Core Domain 변경: 0줄 (승격 게이트 정책만 업데이트)
기존 스킬 손상: 0건
```

---

## 9. 아키텍처 결정 기록 (ADR 요약)

| ADR# | 결정 | 근거 | 트레이드오프 |
|------|------|------|------------|
| 001 | 헥사고날 아키텍처 채택 | 모든 외부 의존성 교체 가능 | 초기 추상화 비용 증가 |
| 002 | Policy를 레이어가 아닌 Mesh로 | 안전은 모든 곳에 있어야 함 | AOP 복잡도 |
| 003 | Evolution Bus 도입 | 학습이 특정 레이어에 한정되면 안 됨 | 이벤트 스톰 관리 필요 |
| 004 | Contract-First 설계 | 구현 전에 인터페이스 확정 | 초기 설계 시간 증가 |
| 005 | Null Adapter 패턴 | 미구현 기능도 시스템 정상 동작 | 빈 결과의 의미 관리 |
| 006 | 자동 스케일링 전략 | 도구/메모리/컨텍스트 규모에 따라 전략 자동 전환 | 전환 임계값 튜닝 필요 |
| 007 | 다중 프로토콜 공존 | 레거시 지원 + 미래 대비 | 어댑터 유지 비용 |
| 008 | Schema Registry + Migration Chain | 하위 호환 보장하며 진화 | 스키마 관리 오버헤드 |
| 009 | 사람-in-the-loop 진화 승인 | 자동 최적화의 안전망 | 승인 병목 가능 |
| 010 | Maturity Model 정의 | 어느 수준에서든 동작하는 시스템 | 레벨 간 경계 모호 가능 |
| 011 | Continuum Memory (업데이트 빈도 스펙트럼) | #17 치명적 망각 방지. 고빈도 변경이 저빈도 메모리를 파괴하면 안 됨 | 승격 게이트로 인한 학습 속도 지연 가능 |
| 012 | 메모리 승격 충돌 검사 필수화 | #17 기존 지식과 새 지식의 공존 보장 | 충돌 해소 로직의 복잡도 |
| 013 | Model Router 도입 (복잡도 기반 라우팅) | #18 모든 작업에 최고급 모델을 쓰는 것은 비용 낭비이자 지연 증가. 작업 복잡도별 최적 모델 자동 선택 | 분류기 오판 시 품질 저하 가능 (폴백 체인으로 완화) |
| 014 | MCP/RAG/Agent 관심사 명시적 분리 | #18 세 개념이 경쟁이 아닌 다른 레이어임을 아키텍처로 보장 | 추가 설계 복잡도 (이미 헥사고날로 해결) |

---

## 10. 아티클 → 아키텍처 매핑 (역추적표)

| 아키텍처 컴포넌트 | 근거 아티클 | 설계 반영 방식 |
|----------------|-----------|--------------|
| Agent Loop Engine | #5 OpenAI Agent Loop, #14 장기 실행 | 상태 머신 + 장기 하네스 통합 |
| Model Bridge | #7 Open Responses | 다중 프로토콜 어댑터 |
| Tool Bridge - 3-Pillar | #8 Tool Calling | 자동 태깅 + Policy 연동 |
| Tool Bridge - Selection | #1 BEACON, #16 Tool Search | 규모별 자동 스케일링 전략 |
| Tool Bridge - Execution | #16 Programmatic Calling | 코드 오케스트레이션 어댑터 |
| MCP Adapter | #6 MCP 원시 타입 | Resources/Tools 분리 원칙 |
| Memory Manager - 3종 메모리 | #10 장기 메모리 3종 | 통합 Port + 독립 Adapter |
| Memory Manager - Continuum Memory | #17 Nested Learning | 업데이트 빈도 스펙트럼 + 승격 게이트 + 치명적 망각 방지 |
| Model Bridge - Model Router | #18 GPT-5 라우팅 | 복잡도 기반 Instant/Standard/Reasoning/Pro 모드 자동 라우팅 |
| 헥사고날 검증 (MCP/RAG/Agent 분리) | #18 ByteByteGo | MCP=Tool Bridge, RAG=Context Engine, Agent=Core Loop 매핑 확인 |
| Context Engine | #11 컨텍스트 엔지니어링 | 6요소 파이프라인 |
| Context Engine - RLM | #9 Recursive LM | Retriever 전략 플러그인 |
| Skill Registry | #4 Anthropic Skills, #15 역설계 | Progressive Disclosure 프로토콜 |
| Evolution Bus - Pattern | #13 Acontext | 저장-관찰-학습 이벤트화 |
| Evolution Bus - RL | #3 Agent Lightning | Performance Optimizer 소비자 |
| Evolution Bus - Nested Optimizer | #17 Nested Learning | 메모리 빈도별 충돌 검사 + 승격 안전망 |
| Policy Mesh - Sandbox | #2 샌드박싱 | 컨텍스트별 자동 선택 |
| Policy Mesh - Ontology | #12 온톨로지 | Ontology Validator 정책 |
| Compatibility Layer | #7 Open Responses | 다중 프로토콜 동시 지원 |

---

## 부록: 핵심 Contract 전체 목록

```typescript
// ──── Core Ports (변하지 않는 계약) ────

interface AgentLoopPort {
  reason(context: AgentContext): Promise<ReasoningResult>;
}

interface ModelRouterPort {
  classify(query: UserInput, context: AgentContext): Promise<RoutingDecision>;
  // RoutingDecision = { mode, selectedModel, confidence, fallbackChain, costEstimate }
}

interface ToolExecutionPort {
  execute(call: ToolCall, policy: PolicyContext): Promise<ToolResult>;
}

interface MemoryPort {
  recallEpisodes(query: SemanticQuery, limit: number): Promise<Episode[]>;
  storeEpisode(episode: Episode): Promise<void>;
  queryKnowledge(query: StructuredQuery): Promise<KnowledgeFact[]>;
  updateKnowledge(fact: KnowledgeFact): Promise<void>;
  findProcedure(taskSignature: string): Promise<Procedure | null>;
  promoteToProcedure(episodes: Episode[]): Promise<Procedure>;
}

interface SkillRegistryPort {
  listAvailable(): Promise<SkillMeta[]>;
  loadSkill(id: string): Promise<SkillInstruction>;
  loadDetail(id: string, section: string): Promise<SkillDetail>;
  registerSkill(skill: SkillPackage): Promise<void>;
  deprecateSkill(id: string, successor?: string): Promise<void>;
}

interface ContextEnginePort {
  assemble(input: UserInput, budget: TokenBudget): Promise<AssembledContext>;
  compact(history: Message[], threshold: number): Promise<Message[]>;
  detectAnomaly(context: AssembledContext): Promise<ContextAnomaly[]>;
}

interface PolicyPort {
  evaluate(action: ProposedAction): Promise<PolicyDecision>;
  audit(event: SystemEvent): Promise<void>;
}

interface EvolutionPort {
  publish(event: EvolutionEvent): Promise<void>;
  subscribe(pattern: string, handler: EventHandler): Promise<void>;
}

// ──── 모든 어댑터는 위 Port 중 하나를 구현 ────
// ──── Core는 Port만 알고, 어댑터는 모름 ────
// ──── 어댑터 교체 = 설정 파일 1줄 변경 ────
```
