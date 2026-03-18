# AI 에이전트 도구·스택 지속 통합 허브 (Integration Hub)

> **목적**: 새로운 도구, 스킬, 에이전트, 서비스가 추가될 때마다 기존 헥사고날 아키텍처와 **자동 호환·통합**되는 프로세스를 정의한다.
> **기반 아키텍처**: Adaptive Agent Architecture v2.1 (Contract-First Hexagonal, 18개 아티클 기반)
> **버전**: v1.0 | 최종 업데이트: 2026-02-26
> **협업 모델**: 시스템 디자이너 × 아키텍처 설계자 듀얼 역할

---

## 0. 듀얼 역할 협업 프로토콜

새로운 도구나 스택을 통합할 때, **두 역할이 동시에 작동**합니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                     통합 요청 (새 도구/스택/에이전트)                │
│                              │                                   │
│              ┌───────────────┼───────────────┐                   │
│              ▼                               ▼                   │
│  ┌─────────────────────┐         ┌─────────────────────┐         │
│  │   🔧 시스템 디자이너   │         │  🏗️ 아키텍처 설계자   │         │
│  │                     │         │                     │         │
│  │  • 기술 평가         │         │  • 포트 매핑         │         │
│  │  • 의존성 분석       │   교차   │  • 계약 검증         │         │
│  │  • 구현 가능성 판단   │◄─검증──▶│  • 호환성 체크        │         │
│  │  • 성능 벤치마크      │         │  • 진화 경로 설계     │         │
│  │  • 보안 점검         │         │  • 부작용 영향 분석   │         │
│  └──────────┬──────────┘         └──────────┬──────────┘         │
│             │                               │                    │
│             └───────────┬───────────────────┘                    │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │   통합 결정서 (IDR)   │                             │
│              │  Integration        │                             │
│              │  Decision Record    │                             │
│              └──────────┬──────────┘                             │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │  어댑터 작성 + 등록   │                             │
│              └──────────┬──────────┘                             │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │  레지스트리 갱신      │                             │
│              └─────────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

### 역할별 책임 매트릭스

| 판단 영역 | 시스템 디자이너 | 아키텍처 설계자 | 공동 |
|----------|--------------|--------------|------|
| "이 도구가 기술적으로 쓸만한가?" | ✅ 주도 | — | — |
| "기존 포트에 맞는가, 새 포트 필요한가?" | — | ✅ 주도 | — |
| "기존 어댑터와 충돌하는가?" | — | ✅ 주도 | — |
| "보안/성능 기준을 충족하는가?" | ✅ 주도 | — | — |
| "Policy Mesh에 새 규칙이 필요한가?" | — | — | ✅ 공동 |
| "Evolution Bus 이벤트를 발행하는가?" | — | — | ✅ 공동 |
| "Schema Registry에 새 스키마가 필요한가?" | — | ✅ 주도 | — |
| "Null Adapter 폴백이 준비됐는가?" | — | ✅ 주도 | — |

---

## 1. 통합 프로세스: 5단계 파이프라인

새로운 도구/스택이 들어올 때마다 이 파이프라인을 거칩니다.

### Stage 1: 분류 (Classify)

```
새 요소 → 어떤 유형인가?

┌──────────────┬─────────────────────────────────────────┐
│ 유형          │ 아키텍처 위치                             │
├──────────────┼─────────────────────────────────────────┤
│ LLM 모델      │ Outbound → Model Bridge (Model Router)  │
│ 도구/API      │ Outbound → Tool Bridge                  │
│ DB/저장소     │ Outbound → Storage Bridge               │
│ 프로토콜      │ Compatibility Layer                      │
│ 스킬/에이전트 │ Core → Skill Registry                   │
│ 메모리 전략   │ Core → Memory Manager                   │
│ 검색/RAG     │ Core → Context Engine                   │
│ 샌드박스      │ Outbound → Sandbox Bridge               │
│ 정책/가드레일 │ Policy Mesh                              │
│ 학습/최적화   │ Evolution Bus Consumer                   │
│ 입력 채널     │ Inbound Adapter                          │
│ 모니터링      │ Cross-cutting → Observability            │
└──────────────┴─────────────────────────────────────────┘
```

### Stage 2: 포트 매핑 (Port Mapping)

```
아키텍처 설계자가 판단:

질문 1: 기존 Port를 재사용할 수 있는가?
  → YES: 해당 Port의 새 Adapter만 작성
  → NO: 질문 2로

질문 2: 기존 Port를 확장할 수 있는가? (하위 호환 유지)
  → YES: Port에 optional 메서드 추가 + Null Adapter 업데이트
  → NO: 질문 3으로

질문 3: 새 Port가 필요한가?
  → YES: Contract-First로 새 Port 정의 → Null Adapter 동시 생성
  → NO: 아키텍처에 맞지 않는 요소 → 거부 또는 재설계 요청
```

### Stage 3: 호환성 검증 (Compatibility Check)

```
┌────────────────────────────────────────────────────────┐
│              Compatibility Checklist                    │
│                                                        │
│  □ 수평 호환: 기존 프로토콜(MCP/REST/Open Resp.)과 공존?│
│  □ 수직 호환: Schema Registry에 버전 등록?              │
│  □ 시간축 호환: 레거시 어댑터 영향 없음?                  │
│  □ Policy Mesh: 필요한 정책 규칙 식별?                   │
│  □ Evolution Bus: 발행할 이벤트 정의?                    │
│  □ Null Adapter: 미사용 시 graceful degradation?        │
│  □ Core Domain: 변경 0줄 확인?                          │
│  □ 기존 어댑터 충돌: Side-effect 분석 완료?              │
│  □ 모니터링: 메트릭/로그 포인트 정의?                     │
│  □ 롤백 전략: 문제 시 제거 절차 확인?                     │
└────────────────────────────────────────────────────────┘
```

### Stage 4: 구현 + 등록 (Implement & Register)

```
시스템 디자이너가 실행:

1. Adapter 코드 작성 (Port 계약 구현)
2. 설정 파일에 등록 (config.yaml 1줄 추가)
3. Policy Mesh 규칙 추가 (필요 시)
4. Evolution Bus 이벤트 핸들러 등록 (필요 시)
5. Null Adapter가 기존 동작 유지 확인 (회귀 테스트)
6. 도구/스택 레지스트리에 등록
```

### Stage 5: 검증 + 문서화 (Verify & Document)

```
아키텍처 설계자가 확인:

1. Core Domain 변경 0줄 확인
2. 기존 어댑터 회귀 테스트 통과
3. IDR (Integration Decision Record) 작성
4. 아키텍처 다이어그램 갱신
5. 레지스트리 테이블 업데이트
```

---

## 2. 도구·스택 통합 레지스트리 (Living Registry)

### 2.1 현재 통합된 모델 (Model Bridge → Model Router)

| ID | 모델/서비스 | 포트 | 어댑터 | Router 등급 | 상태 | 비고 |
|----|-----------|------|--------|------------|------|------|
| M-001 | Claude (Anthropic) | AgentLoopPort | ClaudeAdapter | Pro/Auto | ✅ 활성 | Opus/Sonnet/Haiku 자동 라우팅 |
| M-002 | GPT-5 (OpenAI) | AgentLoopPort | OpenAIAdapter | All (Instant/Thinking/Auto/Pro) | ✅ 활성 | #18 라우팅 패턴 적용 |
| M-003 | Gemini (Google) | AgentLoopPort | GeminiAdapter | Auto/Pro | 🔲 예약 | Flash/Pro 자동 전환 |
| M-004 | Llama (Meta) | AgentLoopPort | LlamaAdapter | Instant/Auto | 🔲 예약 | 로컬/클라우드 듀얼 모드 |
| M-005 | Mistral | AgentLoopPort | MistralAdapter | Instant/Auto | 🔲 예약 | — |

**Router 등급 설명:**
- **Instant**: 단순 분류/추출, 최저 비용
- **Thinking**: 추론 필요, 중간 비용
- **Auto**: 범용 밸런스
- **Pro**: 복잡한 멀티스텝, 최고 품질

### 2.2 현재 통합된 도구 (Tool Bridge)

| ID | 도구/서비스 | 연결 방식 | 3-Pillar 분류 | 상태 | 비고 |
|----|-----------|----------|-------------|------|------|
| T-001 | MCP Servers | MCP Adapter | 혼합 | ✅ 활성 | #6 5원시타입 기반 |
| T-002 | Web Search | REST Adapter | 읽기(Read) | ✅ 활성 | 검색 도구 |
| T-003 | Web Fetch | REST Adapter | 읽기(Read) | ✅ 활성 | URL 직접 접근 |
| T-004 | Code Execution | Sandbox Adapter | 행동(Action) | ✅ 활성 | #2 샌드박싱 적용 |
| T-005 | File Creation | Direct Function | 행동(Action) | ✅ 활성 | — |
| T-006 | Image Search | REST Adapter | 읽기(Read) | ✅ 활성 | — |
| T-007 | Image Generation | API Adapter | 행동(Action) | ✅ 활성 | Z-Image Turbo |
| T-008 | Figma Integration | MCP Adapter | 혼합 | ✅ 활성 | Design-to-Code |
| T-009 | Hugging Face Hub | MCP Adapter | 읽기(Read) | ✅ 활성 | 모델/데이터셋 검색 |
| T-010 | Context7 Docs | MCP Adapter | 읽기(Read) | ✅ 활성 | 라이브러리 문서 검색 |
| T-011 | Google Calendar | MCP Adapter | 혼합 | ✅ 활성 | 일정 읽기/쓰기 |
| T-012 | Gmail | MCP Adapter | 혼합 | ✅ 활성 | 메일 읽기/전송 |
| T-013 | Notion | MCP Adapter | 혼합 | ✅ 활성 | 노트/DB 연동 |
| T-014 | Canva | MCP Adapter | 행동(Action) | ✅ 활성 | 디자인 생성 |
| T-015 | Sports Data | API Adapter | 읽기(Read) | ✅ 활성 | 스포츠 점수/통계 |
| T-016 | Places/Maps | API Adapter | 읽기(Read) | ✅ 활성 | 장소 검색/지도 |
| T-017 | Weather | API Adapter | 읽기(Read) | ✅ 활성 | 날씨 정보 |
| T-018 | Past Chats Search | Internal Port | 읽기(Read) | ✅ 활성 | 대화 기록 검색 |
| T-019 | Memory Edits | Internal Port | 행동(Action) | ✅ 활성 | 메모리 관리 |

### 2.3 현재 통합된 스킬 (Skill Registry)

| ID | 스킬 | 유형 | Progressive Disclosure | 상태 |
|----|------|------|----------------------|------|
| S-001 | DOCX 생성/편집 | 문서 | 요청 시 SKILL.md 로드 | ✅ 활성 |
| S-002 | PDF 생성/처리 | 문서 | 요청 시 SKILL.md 로드 | ✅ 활성 |
| S-003 | PPTX 프레젠테이션 | 문서 | 요청 시 SKILL.md 로드 | ✅ 활성 |
| S-004 | XLSX 스프레드시트 | 문서 | 요청 시 SKILL.md 로드 | ✅ 활성 |
| S-005 | Frontend Design | 코드 | 요청 시 SKILL.md 로드 | ✅ 활성 |
| S-006 | Algorithmic Art | 창작 | 요청 시 SKILL.md 로드 | ✅ 활성 |
| S-007 | Canvas Design | 창작 | 요청 시 SKILL.md 로드 | ✅ 활성 |
| S-008 | Skill Creator | 메타 | 요청 시 SKILL.md 로드 | ✅ 활성 |
| S-009 | Theme Factory | 스타일 | 요청 시 SKILL.md 로드 | ✅ 활성 |
| S-010 | MCP Builder | 인프라 | 요청 시 SKILL.md 로드 | ✅ 활성 |
| S-011 | Internal Comms | 커뮤니케이션 | 요청 시 SKILL.md 로드 | ✅ 활성 |
| S-012 | Brand Guidelines | 스타일 | 요청 시 SKILL.md 로드 | ✅ 활성 |
| S-013 | Slack GIF Creator | 미디어 | 요청 시 SKILL.md 로드 | ✅ 활성 |
| S-014 | Product Self-Knowledge | 지식 | 요청 시 SKILL.md 로드 | ✅ 활성 |

### 2.4 현재 통합된 프로토콜 (Compatibility Layer)

| ID | 프로토콜 | 방향 | 용도 | 상태 |
|----|---------|------|------|------|
| P-001 | MCP (Model Context Protocol) | 양방향 | 도구 연결 표준 | ✅ 활성 |
| P-002 | REST API | Outbound | 범용 API 호출 | ✅ 활성 |
| P-003 | Chat Completion | Outbound | 레거시 모델 호출 | ✅ 활성 |
| P-004 | Open Responses | Outbound | 에이전트 네이티브 | ✅ 활성 |
| P-005 | WebSocket/SSE | Inbound | 실시간 스트리밍 | ✅ 활성 |
| P-006 | A2A (Agent-to-Agent) | 양방향 | 에이전트 간 통신 | 🔲 예약 |
| P-007 | GraphQL | Outbound | 구조화 쿼리 | 🔲 예약 |

### 2.5 Policy Mesh 현재 규칙

| ID | 정책 유형 | 적용 범위 | 규칙 요약 |
|----|----------|----------|----------|
| PM-001 | Permission | Tool Bridge | Action 도구 = 사전 승인 필요 |
| PM-002 | Ontology | Context Engine | 환각 감지 시 자동 롤백 |
| PM-003 | Audit | 전체 | 모든 포트 호출 로깅 |
| PM-004 | Rate | Model Bridge | 모델별 비용 임계값 초과 시 다운그레이드 |
| PM-005 | Context Hygiene | Context Engine | Poisoning/Distraction/Confusion/Clash 감지 |
| PM-006 | Compatibility Guard | 전체 | 스키마 버전 불일치 시 Migration 트리거 |
| PM-007 | Sandbox | Code Execution | 위험도 기반 격리 수준 자동 선택 |
| PM-008 | Copyright | Web Search/Fetch | 인용·저작권 규칙 강제 |

---

## 3. 통합 패턴 라이브러리 (Integration Patterns)

새 도구/스택 추가 시 가장 흔한 패턴별 레시피입니다.

### 패턴 A: 새 LLM 모델 추가

```
[시스템 디자이너]                    [아키텍처 설계자]
                                    
1. 모델 API 문서 분석               1. AgentLoopPort 계약 매핑
2. 토큰 가격/성능 벤치마크           2. Model Router 등급 분류
3. 응답 형식 정규화 방안             3. Canonical Response 변환 규칙
4. 인증/보안 방식 확인               4. 폴백 체인 위치 결정
                                    
         ┌──── 교차 검증 ────┐
         │                   │
         ▼                   ▼
     
구현: XxxAdapter implements AgentLoopPort
등록: config.yaml → model_router.adapters += "xxx"
테스트: 기존 모델 회귀 0건 확인
IDR: "ADR #0xx: Xxx 모델 추가"
```

**Core Domain 변경: 0줄**

### 패턴 B: 새 MCP 서버 연결

```
[시스템 디자이너]                    [아키텍처 설계자]
                                    
1. MCP 서버 도구 목록 수집           1. 3-Pillar 분류 (Read/Compute/Action)
2. 인증 방식 확인                    2. Policy Mesh 규칙 필요 여부
3. 응답 형식/에러 처리               3. Tool Registry 등록 위치
4. 속도/안정성 테스트                4. BEACON 인덱스 갱신 여부
                                    
구현: MCP 설정에 서버 URL 추가
등록: tool_registry.json에 도구 정의 추가
정책: Action 도구 → PM-001 자동 적용
```

**Core Domain 변경: 0줄**

### 패턴 C: 새 저장소/DB 추가

```
[시스템 디자이너]                    [아키텍처 설계자]
                                    
1. DB 특성 분석 (벡터/관계형/그래프) 1. MemoryPort or ContextPort 매핑
2. 드라이버/SDK 의존성               2. 기존 저장소와의 공존 전략
3. 마이그레이션 경로                  3. Schema Registry 버전 추가
4. 백업/복구 전략                    4. Null Adapter 폴백 확인
                                    
구현: XxxStorageAdapter implements MemoryPort
등록: config.yaml → storage.adapters += "xxx"
```

**Core Domain 변경: 0줄**

### 패턴 D: 새 스킬 추가

```
[시스템 디자이너]                    [아키텍처 설계자]
                                    
1. 스킬 내용 작성 (SKILL.md)        1. Skill Registry 카탈로그 등록
2. 의존성 패키지 확인                2. Progressive Disclosure 트리거 정의
3. 예제 입출력 작성                  3. Evolution Bus 이벤트 연결
4. 에러 핸들링                       4. 기존 스킬과의 충돌 검사
                                    
구현: /mnt/skills/에 SKILL.md 배치
등록: 스킬 카탈로그에 description 추가
```

**Core Domain 변경: 0줄**

### 패턴 E: 새 프로토콜/API 표준 추가

```
[시스템 디자이너]                    [아키텍처 설계자]
                                    
1. 프로토콜 스펙 분석                1. Compatibility Layer 위치 결정
2. 기존 프로토콜과의 변환 매핑       2. Canonical ↔ 외부 형식 변환 규칙
3. 에러 코드 매핑                    3. 레거시 프로토콜 공존 확인
4. 보안/인증 체계                    4. Schema Registry 업데이트
                                    
구현: XxxProtocolAdapter implements CompatibilityPort
등록: compatibility.config에 프로토콜 추가
```

**Core Domain 변경: 0줄**

### 패턴 F: 새 에이전트/서브에이전트 추가

```
[시스템 디자이너]                    [아키텍처 설계자]
                                    
1. 에이전트 역할 정의               1. Agent Loop Engine과의 위임 관계
2. 필요 도구/메모리 범위             2. A2A 프로토콜 매핑 (P-006)
3. 성능/비용 예산                    3. Policy Mesh 권한 범위 정의
4. 실패 시 폴백 전략                4. Evolution Bus 이벤트 구독
                                    
구현: SubAgent implements AgentLoopPort + 위임 규칙
등록: agent_registry에 에이전트 프로필 추가
```

**Core Domain 변경: 0줄 (AgentLoop은 이미 위임 패턴 지원)**

---

## 4. 아키텍처 호환성 매트릭스

새 요소 추가 시 아래 매트릭스로 영향 범위를 즉시 파악합니다.

```
            │ Core  │ Model │ Tool  │Storage│ Policy│ Evol. │ Compat│
            │Domain │Bridge │Bridge │Bridge │ Mesh  │ Bus   │ Layer │
────────────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┤
새 LLM 모델  │   —   │ ✅새   │   —   │   —   │ 규칙?  │ 메트릭 │ 형식변환│
새 MCP 서버  │   —   │   —   │ ✅새   │   —   │ 규칙?  │ 메트릭 │   —   │
새 REST API │   —   │   —   │ ✅새   │   —   │ 규칙?  │ 메트릭 │   —   │
새 DB/저장소 │   —   │   —   │   —   │ ✅새   │   —   │ 메트릭 │   —   │
새 스킬      │ 등록  │   —   │   —   │   —   │   —   │ 학습   │   —   │
새 에이전트  │ 위임  │ 라우팅 │ 범위  │ 범위  │ ✅권한  │ 이벤트 │ A2A   │
새 프로토콜  │   —   │   —   │   —   │   —   │   —   │   —   │ ✅새   │
새 정책 규칙 │   —   │   —   │   —   │   —   │ ✅새   │ 감사   │   —   │
새 학습 전략 │   —   │   —   │   —   │   —   │   —   │ ✅새   │   —   │
새 입력 채널 │   —   │   —   │   —   │   —   │ 인증   │ 메트릭 │ ✅새   │

✅새 = 새 어댑터 작성  |  등록/위임/라우팅 = 설정 변경  |  규칙? = 검토 후 결정
메트릭 = 자동 수집  |  학습/감사/이벤트 = 자동 연결  |  — = 영향 없음
```

**핵심 보증: Core Domain 열은 항상 "—" 또는 "설정 변경"만 존재. 코드 변경 없음.**

---

## 5. 통합 결정 기록 템플릿 (IDR Template)

새 도구/스택이 추가될 때마다 아래 형식으로 기록합니다.

```markdown
### IDR-XXX: [통합 대상명]

**일자**: YYYY-MM-DD
**유형**: 모델 | 도구 | 저장소 | 스킬 | 에이전트 | 프로토콜 | 정책 | 학습전략
**요청자**: [이름/역할]

**시스템 디자이너 평가**:
- 기술 적합성: [상/중/하]
- 의존성: [목록]
- 보안 등급: [안전/주의/위험]
- 성능 영향: [무시/경미/상당]

**아키텍처 설계자 평가**:
- 포트 매핑: [기존 포트명] 또는 [새 포트 필요]
- 호환성: [수평 ✅/❌] [수직 ✅/❌] [시간축 ✅/❌]
- Core 변경: 0줄 확인 ✅/❌
- Null Adapter: 준비 ✅/❌

**결정**: 승인 | 조건부 승인 | 거부 | 보류
**조건**: [있을 경우]

**구현 요약**:
- 어댑터: [파일명]
- 설정: [변경 내용]
- 정책: [추가 규칙]
- 테스트: [회귀 테스트 결과]
```

---

## 6. 현재 아키텍처 전체 맵 (통합 현황)

```
                         ┌─────────────────────────────────────┐
                         │          Policy Mesh (8 규칙)        │
                         │   PM-001~008 모든 포트 호출 인터셉트   │
                         └──────────────┬──────────────────────┘
                                        │
    ┌───────────────────────────────────┼───────────────────────────────────┐
    │                                   │                                   │
    │  ┌────────────────────┐    ┌──────┴──────┐    ┌────────────────────┐  │
    │  │   Inbound (5)      │    │   CORE      │    │   Outbound (4)     │  │
    │  │                    │    │   DOMAIN    │    │                    │  │
    │  │ • API Gateway      │    │             │    │ • Model Bridge     │  │
    │  │ • CLI              │───▶│ • AgentLoop │◀───│   └ Model Router   │  │
    │  │ • Event Stream     │    │   Engine    │    │   └ 5 LLM Adapters │  │
    │  │ • MCP Client       │    │ • Memory    │    │                    │  │
    │  │ • Open Responses   │    │   Manager   │    │ • Tool Bridge      │  │
    │  │                    │    │ • Skill     │    │   └ 19 도구 연결    │  │
    │  └────────────────────┘    │   Registry  │    │   └ 4 실행 어댑터   │  │
    │                            │   (14 스킬)  │    │                    │  │
    │                            │ • Context   │    │ • Storage Bridge   │  │
    │                            │   Engine    │    │   └ 벡터/관계형     │  │
    │                            │             │    │                    │  │
    │                            └─────────────┘    │ • Sandbox Bridge   │  │
    │                                               │   └ 격리 스펙트럼   │  │
    │                                               └────────────────────┘  │
    │                                                                       │
    │   ┌───────────────────────────────────────────────────────────────┐   │
    │   │              Evolution Bus (6 소비자)                          │   │
    │   │  Pattern Detector · Performance Optimizer · Schema Evolver    │   │
    │   │  Skill Generator · Nested Optimizer · Anomaly Detector       │   │
    │   └───────────────────────────────────────────────────────────────┘   │
    │                                                                       │
    │   ┌───────────────────────────────────────────────────────────────┐   │
    │   │              Compatibility Layer (7 프로토콜)                   │   │
    │   │  MCP · REST · Chat Completion · Open Responses · WSS/SSE     │   │
    │   │  A2A(예약) · GraphQL(예약)                                     │   │
    │   └───────────────────────────────────────────────────────────────┘   │
    └───────────────────────────────────────────────────────────────────────┘
```

**통합 현황 숫자 요약:**

| 영역 | 항목 수 | 활성 | 예약 |
|------|--------|------|------|
| LLM 모델 | 5 | 2 | 3 |
| 도구/서비스 | 19 | 19 | 0 |
| 스킬 | 14 | 14 | 0 |
| 프로토콜 | 7 | 5 | 2 |
| Policy 규칙 | 8 | 8 | 0 |
| Evolution 소비자 | 6 | 6 | 0 |
| **총계** | **59** | **55** | **5** |

---

## 7. 지속 진화 원칙 (Continuous Evolution Rules)

### Rule 1: 추가만 하고, 제거하지 않는다 (Additive Only)
새 어댑터를 추가할 때 기존 어댑터를 제거하지 않습니다. 더 이상 사용하지 않는 어댑터는 `deprecated` 태그를 붙이고 sunset 기간을 운영합니다.

### Rule 2: Core는 절대 건드리지 않는다 (Core Immutability)
새 도구, 새 모델, 새 프로토콜이 추가되어도 Core Domain(AgentLoop, MemoryManager, SkillRegistry, ContextEngine)의 코드는 변경 0줄입니다.

### Rule 3: 계약이 먼저, 구현은 나중이다 (Contract-First)
새 포트가 필요하면 TypeScript interface를 먼저 정의하고, Null Adapter를 먼저 만들고, 그 다음에 실제 구현을 합니다.

### Rule 4: 모든 추가는 이벤트를 발행한다 (Event-Driven)
새로 추가된 어댑터는 반드시 Evolution Bus에 이벤트를 발행합니다. 이 이벤트가 시스템 전체의 학습과 최적화 연료가 됩니다.

### Rule 5: 실패는 무시가 아니라 우아한 퇴보다 (Graceful Degradation)
새 어댑터가 실패하면 Null Adapter가 자동으로 대체합니다. 시스템은 기능이 줄어들 뿐 멈추지 않습니다.

### Rule 6: 호환성은 3축 모두 확인한다 (Triple Compatibility)
수평(다른 프로토콜과 공존) + 수직(버전 진화) + 시간축(과거 레거시 유지 + 미래 확장 예약) 세 축 모두 통과해야 통합이 승인됩니다.

---

## 8. 다음 통합 대기열 (Integration Backlog)

향후 통합이 예상되는 항목들입니다. 우선순위는 필요에 따라 조정됩니다.

| 우선순위 | 대상 | 유형 | 아키텍처 위치 | 기대 효과 |
|---------|------|------|-------------|----------|
| 높음 | A2A Protocol (Google) | 프로토콜 | Compatibility Layer | 멀티에이전트 협업 |
| 높음 | Gemini Flash/Pro | 모델 | Model Router | 비용 최적화 |
| 중간 | Qdrant/Weaviate | 저장소 | Storage Bridge | 벡터 검색 성능 |
| 중간 | LangGraph / CrewAI | 에이전트 프레임워크 | Agent Loop 위임 | 복잡한 워크플로우 |
| 중간 | Slack Integration | 도구 | Tool Bridge (MCP) | 팀 커뮤니케이션 |
| 낮음 | GraphQL Support | 프로토콜 | Compatibility Layer | 구조화 쿼리 |
| 낮음 | Kafka/Pulsar | 인프라 | Evolution Bus 백엔드 | 이벤트 스케일링 |

---

## 9. 근거 아티클 ↔ 아키텍처 매핑 (18개)

| # | 아티클 | 아키텍처 반영 |
|---|--------|-------------|
| 01 | MIT BEACON | Tool Bridge → Selection Strategy |
| 02 | 샌드박싱 | Sandbox Bridge |
| 03 | Agent Lightning | Evolution Bus → Performance Optimizer |
| 04 | Anthropic Skills | Skill Registry |
| 05 | OpenAI Agent Loop | Agent Loop Engine |
| 06 | MCP 5원시타입 | MCP Adapter + Core 분리 |
| 07 | Open Responses | Model Bridge + Compatibility Layer |
| 08 | Tool Calling 3-Pillar | Tool Bridge → 3-Pillar Tagger |
| 09 | MIT Recursive LM | Context Engine → RLM Retriever |
| 10 | 장기 메모리 3종 | Memory Manager |
| 11 | 컨텍스트 엔지니어링 | Context Engine + Policy Mesh |
| 12 | 온톨로지 가드레일 | Policy Mesh → Ontology Validator |
| 13 | Acontext 자가학습 | Evolution Bus → Pattern Detector |
| 14 | 장기 실행 에이전트 | Agent Loop Engine → 장기 하네스 |
| 15 | Claude Skills 역설계 | Skill Registry → 메타-툴 |
| 16 | 고급 Tool Use | Tool Bridge → Execution Adapters |
| 17 | Google Nested Learning | Memory Manager → Continuum Memory |
| 18 | ByteByteGo MCP/RAG/Agent | Model Router + 헥사고날 검증 |

---

## 10. 운영 가이드: "새 도구가 들어왔을 때"

```
1. 사용자가 새 도구/스택 URL 또는 요구사항을 제시
                    │
2. [시스템 디자이너] 기술 분석 + [아키텍처 설계자] 포트 매핑
                    │
3. 5단계 파이프라인 (분류→포트매핑→호환성→구현→검증)
                    │
4. 레지스트리 테이블 갱신 (§2.1~2.5)
                    │
5. 아키텍처 맵 갱신 (§6)
                    │
6. IDR 기록 (§5 템플릿 사용)
                    │
7. 아티클이면 → Source Registry도 갱신
                    │
8. 다음 통합 대기열 업데이트 (§8)
```

**이 문서 자체가 살아있는 문서입니다. 새 도구가 추가될 때마다 갱신됩니다.**
