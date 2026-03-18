# 구독제 기반 멀티 AI 통합 운영 아키텍처
# Subscription-Based Multi-AI Unified Operations Architecture

> **핵심 제약**: API가 아닌 **구독제(Subscription)** 기반 — 프로그래밍 호출이 아닌 인터랙티브 인터페이스 통합
> **설계 철학**: 8개 생성형 AI를 하나의 두뇌처럼 운영하되, 각각의 구독 한도를 최적 활용
> **기반**: Adaptive Agent Architecture v2.1 (헥사고날 아키텍처)
> **버전**: v1.0 | 2026-02-26

---

## 0. 근본적 설계 과제: API vs 구독제

```
┌─────────────────────────────────────────────────────────────────┐
│                    API 기반 통합 (기존)                            │
│                                                                  │
│  코드 → HTTP 호출 → 응답 파싱 → 자동 파이프라인                     │
│  장점: 완전 자동화, 프로그래밍 제어                                  │
│  단점: 토큰당 과금, 비용 폭발, 모델별 별도 계약                       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                  구독제 기반 통합 (본 설계)                          │
│                                                                  │
│  사람 → 인터페이스 → 대화 → 결과 추출 → 공유 메모리                   │
│  장점: 고정 비용, 무제한(상한 내) 사용, 최신 기능 즉시 접근             │
│  단점: 자동화 제한, 인터페이스 간 컨텍스트 단절                        │
│                                                                  │
│  ▶ 설계 핵심: "컨텍스트 단절"을 극복하는 공유 메모리 + 라우팅 전략      │
└─────────────────────────────────────────────────────────────────┘
```

**이 아키텍처가 해결하는 문제:**
구독제 AI 도구 8개를 개별적으로 쓰면, 각 도구가 서로의 맥락을 모릅니다. Claude에서 작업한 내용을 ChatGPT가 모르고, Gemini에서 연구한 결과를 NotebookLM이 모릅니다. 이 "컨텍스트 단절"을 극복하여 8개 도구가 **하나의 연속된 작업 흐름** 안에서 동작하도록 만드는 것이 본 설계의 목표입니다.

---

## 1. 8개 AI 도구 프로파일 + 구독 현황

### 1.1 도구별 특성·역할 매핑

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        8개 AI 도구 역할 스펙트럼                             │
│                                                                            │
│  [사고·분석·기획]                    [실행·코딩·빌드]                          │
│  ◄──────────────────────────────────────────────────────────────►          │
│                                                                            │
│  NotebookLM    Claude Desktop    ChatGPT     Claude Code                   │
│  (연구·정리)    (분석·설계)        (범용·대화)  (터미널 코딩)                   │
│                                                                            │
│  Google Gemini  ─────────────── AMP Code                                   │
│  (멀티모달·검색)                  (에이전틱 코딩)                              │
│                                                                            │
│                Gemini CLI ─── Codex CLI                                     │
│                (GCP 코딩)    (OpenAI 코딩)                                   │
└────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 구독 플랜 + 비용 매트릭스

| # | 도구 | 제공사 | 구독 플랜 | 월 비용 | 핵심 모델 | 주요 한도 | 역할 |
|---|------|-------|----------|--------|----------|----------|------|
| AI-01 | **Claude Desktop** | Anthropic | Max 5x | $100 | Opus 4.6, Sonnet 4.6 | Pro 5배 메시지 | 🧠 사고·분석·설계·문서 |
| AI-02 | **Claude Code** | Anthropic | Max 포함 | (포함) | Sonnet 4.6, Opus 4.6 | Max 한도 공유 | 🔧 터미널 코딩·리팩터링 |
| AI-03 | **ChatGPT** | OpenAI | Plus ($20) 또는 Pro ($200) | $20~200 | GPT-5, o3 | 플랜별 메시지 한도 | 🌐 범용 대화·이미지·연구 |
| AI-04 | **Codex CLI** | OpenAI | ChatGPT 포함 | (포함) | GPT-5.3-Codex-Spark | ChatGPT 한도 공유 | 🔧 터미널 코딩·비동기 에이전트 |
| AI-05 | **Google Gemini** | Google | AI Pro ($20) | $20 | Gemini 3 Pro | 일일 한도 | 🔍 멀티모달·검색·Google 연동 |
| AI-06 | **Gemini CLI** | Google | AI Pro 포함 / 무료 | (포함/무료) | Gemini 3 Flash/Pro | 1000 req/일(무료) | 🔧 GCP 연동 코딩 |
| AI-07 | **AMP Code** | Sourcegraph | Free(광고) / 크레딧 | 무료~ | Claude Opus, GPT-5, Gemini | 크레딧 기반 | 🤖 에이전틱 멀티에이전트 코딩 |
| AI-08 | **NotebookLM** | Google | AI Pro 포함 | (포함) | Gemini 기반 | 500 노트북, 300 소스 | 📚 연구·소스 정리·오디오 요약 |

### 1.3 월간 구독 비용 시나리오

```
┌──────────────────────────────────────────────────┐
│           월간 구독 비용 시뮬레이션                  │
│                                                   │
│  시나리오 A (실용형):                               │
│  ┌─────────────────────────────────┐              │
│  │ Claude Max 5x     $100          │              │
│  │ ChatGPT Plus       $20          │              │
│  │ Google AI Pro       $20          │              │
│  │ AMP Code          무료(광고)     │              │
│  │ ─────────────────────────       │              │
│  │ 합계              $140/월        │              │
│  └─────────────────────────────────┘              │
│                                                   │
│  시나리오 B (파워형):                               │
│  ┌─────────────────────────────────┐              │
│  │ Claude Max 20x    $200          │              │
│  │ ChatGPT Pro        $200          │              │
│  │ Google AI Ultra    $249.99       │              │
│  │ AMP Code 유료      $20~          │              │
│  │ ─────────────────────────       │              │
│  │ 합계             ~$670/월        │              │
│  └─────────────────────────────────┘              │
│                                                   │
│  ※ API 대비: 동일 사용량을 API로 하면               │
│    월 $2,000~5,000+ 예상 → 구독제가 3~10배 절약     │
└──────────────────────────────────────────────────┘
```

---

## 2. 핵심 아키텍처: 공유 메모리 허브 (Shared Memory Hub)

구독제 도구는 API처럼 프로그래밍으로 연결할 수 없습니다. 대신 **공유 메모리 허브**가 모든 도구의 컨텍스트를 중재합니다.

```
                    ┌─────────────────────────────────────┐
                    │       Shared Memory Hub (SMH)        │
                    │                                      │
                    │  ┌──────────┐ ┌──────────┐          │
                    │  │ 장기 메모리│ │ 중기 메모리│          │
                    │  │ (Long)   │ │ (Mid)    │          │
                    │  │          │ │          │          │
                    │  │ • 아키텍처│ │ • 현재   │          │
                    │  │   원칙    │ │   프로젝트│          │
                    │  │ • 설계   │ │ • 이번 주 │          │
                    │  │   패턴    │ │   작업    │          │
                    │  │ • 도메인  │ │ • 진행 중 │          │
                    │  │   지식    │ │   이슈    │          │
                    │  └──────────┘ └──────────┘          │
                    │  ┌──────────┐ ┌──────────┐          │
                    │  │ 단기 메모리│ │ 전환 버퍼 │          │
                    │  │ (Short)  │ │(Handoff) │          │
                    │  │          │ │          │          │
                    │  │ • 현재   │ │ • 도구 A  │          │
                    │  │   세션    │ │   → 도구 B│          │
                    │  │ • 방금   │ │   인수인계│          │
                    │  │   한 대화 │ │   패킷    │          │
                    │  └──────────┘ └──────────┘          │
                    └──────────┬──────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────┴─────┐      ┌──────┴──────┐     ┌──────┴──────┐
    │  사고 계열  │      │  실행 계열   │     │  연구 계열   │
    │            │      │             │     │             │
    │ Claude     │      │ Claude Code │     │ NotebookLM  │
    │ Desktop    │      │ Codex CLI   │     │ Google      │
    │ ChatGPT    │      │ Gemini CLI  │     │ Gemini      │
    │ Gemini     │      │ AMP Code    │     │             │
    └────────────┘      └─────────────┘     └─────────────┘
```

### 2.1 메모리 3계층 설계

```
┌─────────────────────────────────────────────────────────────────┐
│                    메모리 3계층 + 전환 버퍼                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📦 장기 메모리 (Long-Term Memory)                        │    │
│  │                                                         │    │
│  │ 저장소: Git 레포 / Notion DB / 마크다운 파일              │    │
│  │ 갱신 주기: 주 1회 ~ 월 1회                                │    │
│  │ 내용:                                                    │    │
│  │   • 아키텍처 원칙 & 설계 헌법                              │    │
│  │   • 도메인 지식 (비즈니스 규칙, 온톨로지)                    │    │
│  │   • 코딩 컨벤션 & 스타일 가이드                            │    │
│  │   • 프로젝트별 CLAUDE.md / AGENTS.md / AGENT.md          │    │
│  │   • 과거 의사결정 기록 (ADR)                               │    │
│  │   • 누적 아티클 레지스트리                                  │    │
│  │                                                         │    │
│  │ 각 도구에서의 접근 방식:                                    │    │
│  │   Claude Desktop → Projects 기능에 첨부                   │    │
│  │   Claude Code    → CLAUDE.md 자동 로드                   │    │
│  │   ChatGPT       → Custom GPT / 프로젝트에 파일 업로드      │    │
│  │   Codex CLI     → AGENTS.md 자동 로드                    │    │
│  │   Gemini CLI    → GEMINI.md 설정                         │    │
│  │   AMP Code      → AGENT.md 자동 로드                     │    │
│  │   NotebookLM    → 소스로 업로드                            │    │
│  │   Google Gemini → 대화에 첨부                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📋 중기 메모리 (Mid-Term Memory)                         │    │
│  │                                                         │    │
│  │ 저장소: 프로젝트별 마크다운 / Notion 페이지                 │    │
│  │ 갱신 주기: 일 1회 ~ 주 1회                                │    │
│  │ 내용:                                                    │    │
│  │   • 현재 진행 중인 프로젝트 상태                            │    │
│  │   • 이번 스프린트 작업 목록                                 │    │
│  │   • 최근 변경 이력 (git log 요약)                          │    │
│  │   • 미해결 이슈 & 기술 부채                                │    │
│  │   • 도구 간 작업 연속성 로그                                │    │
│  │                                                         │    │
│  │ 형식: PROJECT_STATUS.md                                  │    │
│  │   (모든 도구가 읽을 수 있는 공통 마크다운)                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 💬 단기 메모리 (Short-Term Memory)                       │    │
│  │                                                         │    │
│  │ 저장소: 각 도구의 네이티브 컨텍스트 윈도우                   │    │
│  │ 수명: 현재 세션 ~ 24시간                                  │    │
│  │ 내용:                                                    │    │
│  │   • 현재 대화 히스토리                                     │    │
│  │   • 방금 생성/수정한 코드                                  │    │
│  │   • 현재 작업의 중간 결과                                  │    │
│  │                                                         │    │
│  │ 특성:                                                    │    │
│  │   Claude Desktop → 대화 기록 + 프로젝트 메모리              │    │
│  │   Claude Code    → 세션 컨텍스트 + /compact               │    │
│  │   ChatGPT       → 대화 + Memory 기능                     │    │
│  │   Codex CLI     → /m_update, /m_drop 메모리 관리          │    │
│  │   Gemini        → 대화 히스토리                            │    │
│  │   AMP Code      → Persistent Threads (서버 저장)          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🔄 전환 버퍼 (Handoff Buffer)                             │    │
│  │                                                         │    │
│  │ 목적: 도구 A에서 도구 B로 작업을 넘길 때의 컨텍스트 패킷     │    │
│  │ 저장소: 클립보드 / 공유 파일 / Git commit message           │    │
│  │                                                         │    │
│  │ 형식: HANDOFF.md (표준 전환 문서)                          │    │
│  │   ## 전환 요약                                            │    │
│  │   - 이전 도구: [도구명]                                    │    │
│  │   - 작업 내용: [1~3줄 요약]                                │    │
│  │   - 현재 상태: [완료/진행중/차단]                            │    │
│  │   - 다음 도구에게: [요청사항]                               │    │
│  │   - 핵심 결정사항: [목록]                                  │    │
│  │   - 참조 파일: [경로 목록]                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 도구 간 컨텍스트 동기화 메커니즘

구독제 도구는 API로 연결되지 않으므로, **파일 기반 + 사람 중재** 방식으로 동기화합니다.

```
┌─────────────────────────────────────────────────────────────────┐
│              컨텍스트 동기화 메커니즘 (3가지)                       │
│                                                                  │
│  방법 1: 파일 기반 동기화 (File-Based Sync)                       │
│  ────────────────────────────────────────                        │
│  Git 레포에 공통 파일을 두고 모든 도구가 참조                       │
│                                                                  │
│  project-root/                                                   │
│  ├── .ai/                        ← AI 도구 공용 디렉토리          │
│  │   ├── ARCHITECTURE.md         ← 장기: 아키텍처 원칙            │
│  │   ├── PROJECT_STATUS.md       ← 중기: 현재 프로젝트 상태       │
│  │   ├── HANDOFF.md              ← 전환: 도구 간 인수인계         │
│  │   ├── DECISIONS.md            ← 장기: 의사결정 기록            │
│  │   └── CONVENTIONS.md          ← 장기: 코딩 컨벤션              │
│  ├── CLAUDE.md                   ← Claude Code 전용 지시         │
│  ├── AGENTS.md                   ← Codex CLI 전용 지시           │
│  ├── AGENT.md                    ← AMP Code 전용 지시            │
│  └── GEMINI.md                   ← Gemini CLI 전용 지시          │
│                                                                  │
│  핵심: 각 도구 전용 파일이 .ai/ 공통 파일을 #include              │
│  "이 프로젝트의 아키텍처는 .ai/ARCHITECTURE.md를 참조하라"         │
│                                                                  │
│  방법 2: 사람 중재 전환 (Human-Mediated Handoff)                  │
│  ────────────────────────────────────────                        │
│  도구 A 작업 완료 → HANDOFF.md 생성 →                             │
│  도구 B에 "HANDOFF.md를 읽고 이어서 작업하라" 지시                  │
│                                                                  │
│  방법 3: 네이티브 메모리 활용 (Native Memory)                      │
│  ────────────────────────────────────────                        │
│  Claude Desktop → 프로젝트 메모리 + past chats 검색              │
│  ChatGPT       → Memory 기능 + Custom Instructions              │
│  Codex CLI     → /m_update 메모리 슬래시 커맨드                   │
│  AMP Code      → Persistent Threads (서버 저장)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 태스크 라우팅 전략 (Task Router)

어떤 작업을 어떤 도구에 보낼 것인가? 구독 한도를 고려한 지능적 라우팅입니다.

### 3.1 역할 기반 라우팅 매트릭스

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    태스크 → 도구 라우팅 매트릭스                            │
│                                                                          │
│  태스크 유형              │ 1순위         │ 2순위         │ 한도 초과 시   │
│  ─────────────────────────┼───────────────┼───────────────┼──────────────│
│  아키텍처 설계·분석        │ Claude Desktop│ ChatGPT       │ Gemini       │
│  긴 문서 분석·요약         │ Claude Desktop│ NotebookLM    │ Gemini       │
│  연구·소스 종합            │ NotebookLM   │ Gemini        │ ChatGPT      │
│  코드 구현 (새 기능)       │ Claude Code  │ AMP Code      │ Codex CLI    │
│  코드 리팩터링             │ AMP Code     │ Claude Code   │ Codex CLI    │
│  코드 리뷰                │ AMP Code     │ Codex CLI     │ Claude Code  │
│  디버깅                   │ Claude Code  │ Gemini CLI    │ Codex CLI    │
│  테스트 작성               │ Codex CLI    │ AMP Code      │ Claude Code  │
│  이미지 생성·분석          │ ChatGPT      │ Gemini        │ —            │
│  웹 검색·최신 정보         │ ChatGPT      │ Gemini        │ Claude Desktop│
│  GCP 인프라 작업           │ Gemini CLI   │ Claude Code   │ —            │
│  멀티에이전트 병렬 작업     │ AMP Code     │ Codex Cloud   │ —            │
│  오디오 브리핑 생성         │ NotebookLM   │ —            │ —            │
│  Google Workspace 연동     │ Gemini       │ Claude Desktop│ —            │
│  대용량 코드베이스 탐색     │ AMP Code     │ Gemini CLI    │ Claude Code  │
│  빠른 질문·확인            │ Gemini(무료) │ ChatGPT       │ Claude       │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 한도 인식 라우팅 (Quota-Aware Routing)

```
┌─────────────────────────────────────────────────────────────────┐
│              한도 인식 라우팅 의사결정 트리                         │
│                                                                  │
│  새 작업 도착                                                     │
│      │                                                           │
│      ├─ 1순위 도구 한도 여유 있음?                                 │
│      │   ├─ YES → 1순위 도구에 배정                               │
│      │   └─ NO  ─┐                                               │
│      │            │                                              │
│      │       2순위 도구 한도 여유 있음?                             │
│      │            ├─ YES → 2순위 도구에 배정                       │
│      │            └─ NO  ─┐                                      │
│      │                     │                                     │
│      │                무료 티어 사용 가능?                          │
│      │                     ├─ YES → 무료 도구 사용                 │
│      │                     │  (Gemini CLI 무료 1000/일,           │
│      │                     │   AMP Free)                         │
│      │                     └─ NO → 대기 (한도 리셋 대기)           │
│      │                                                           │
│  비용 최적화 원칙:                                                 │
│  • 단순 질문 → Gemini CLI 무료 티어 우선                           │
│  • 코딩 → Claude Code / AMP Code 교차 사용                       │
│  • 연구 → NotebookLM (Google AI Pro 포함)                        │
│  • 복잡한 추론 → Claude Opus (Max에서만 가능)                      │
│  • 고가 도구는 고가치 작업에만 사용                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 도구 간 "강점 릴레이" 패턴

하나의 작업을 여러 도구가 릴레이하는 워크플로우입니다.

```
[예시: 새 마이크로서비스 설계 + 구현]

Phase 1: 연구 (NotebookLM)
─────────────────────────
• 관련 기술 문서·아티클을 소스로 업로드
• 핵심 패턴 추출, 오디오 브리핑 생성
• 출력: RESEARCH_SUMMARY.md → .ai/ 디렉토리에 저장

Phase 2: 설계 (Claude Desktop)
──────────────────────────────
• .ai/RESEARCH_SUMMARY.md를 프로젝트에 첨부
• 아키텍처 설계, 인터페이스 정의, ADR 작성
• 출력: ARCHITECTURE.md, INTERFACES.md 갱신
• HANDOFF.md 생성: "설계 완료, 구현 시작 가능"

Phase 3: 구현 (Claude Code → AMP Code 병렬)
──────────────────────────────────────────
• Claude Code: 핵심 비즈니스 로직 구현
• AMP Code: 테스트 + 인프라 코드 (서브에이전트 병렬)
• 둘 다 CLAUDE.md / AGENT.md를 통해 .ai/ 파일 참조

Phase 4: 검증 (Codex CLI)
─────────────────────────
• 코드 리뷰 에이전트로 PR 검토
• ChatGPT: 기술 문서 작성 + 다이어그램 생성

Phase 5: 갱신 (사람)
────────────────────
• PROJECT_STATUS.md 업데이트
• DECISIONS.md에 새 ADR 추가
• HANDOFF.md 초기화 (다음 작업 대비)
```

---

## 4. 시스템 디자인 관점: 물리적 구현

### 4.1 파일 시스템 구조 (모든 도구 공통)

```
project-root/
├── .ai/                              ← AI 공용 (Git 추적)
│   ├── memory/
│   │   ├── long-term/
│   │   │   ├── ARCHITECTURE.md       ← 아키텍처 원칙·설계 헌법
│   │   │   ├── DOMAIN_KNOWLEDGE.md   ← 도메인 지식
│   │   │   ├── CONVENTIONS.md        ← 코딩 컨벤션
│   │   │   ├── DECISIONS.md          ← ADR 누적 기록
│   │   │   └── ARTICLE_REGISTRY.md   ← 아티클 레지스트리
│   │   ├── mid-term/
│   │   │   ├── PROJECT_STATUS.md     ← 현재 프로젝트 상태
│   │   │   ├── SPRINT_TASKS.md       ← 이번 스프린트 작업
│   │   │   ├── OPEN_ISSUES.md        ← 미해결 이슈
│   │   │   └── TOOL_LOG.md           ← 어떤 도구가 무슨 작업 했는지
│   │   └── handoff/
│   │       └── HANDOFF.md            ← 도구 간 전환 버퍼
│   ├── prompts/
│   │   ├── system-prompt-base.md     ← 모든 도구 공통 시스템 프롬프트
│   │   ├── architect-role.md         ← 아키텍처 설계자 역할 정의
│   │   └── designer-role.md          ← 시스템 디자이너 역할 정의
│   └── templates/
│       ├── handoff-template.md       ← HANDOFF 표준 템플릿
│       └── idr-template.md           ← IDR 표준 템플릿
│
├── CLAUDE.md                         ← Claude Code가 자동 읽음
│   (내용: "이 프로젝트의 원칙은 .ai/memory/long-term/를 참조.
│    현재 상태는 .ai/memory/mid-term/PROJECT_STATUS.md를 참조.
│    전환 사항은 .ai/memory/handoff/HANDOFF.md를 확인.")
│
├── AGENTS.md                         ← Codex CLI가 자동 읽음
│   (내용: CLAUDE.md와 동일 구조, Codex 전용 지시 추가)
│
├── AGENT.md                          ← AMP Code가 자동 읽음
│   (내용: CLAUDE.md와 동일 구조, AMP 전용 지시 추가)
│
├── GEMINI.md                         ← Gemini CLI 설정
│   (내용: CLAUDE.md와 동일 구조, Gemini 전용 지시 추가)
│
└── src/                              ← 실제 코드
```

### 4.2 도구별 "브릿지 설정" (Bridge Configuration)

각 도구가 공유 메모리에 접근하는 네이티브 방법입니다.

```
┌────────────────────────────────────────────────────────────────────┐
│ 도구           │ 장기 메모리 접근         │ 전환 버퍼 접근             │
├────────────────┼────────────────────────┼────────────────────────── │
│ Claude Desktop │ Project에 .ai/ 파일     │ HANDOFF.md 대화에 첨부    │
│                │ 첨부 + Memory 기능      │                          │
│ Claude Code    │ CLAUDE.md → .ai/ 참조  │ cat .ai/.../HANDOFF.md   │
│                │ 자동 로드               │                          │
│ ChatGPT        │ Custom Instructions +  │ HANDOFF.md 복붙 또는      │
│                │ 파일 업로드             │ 파일 업로드               │
│ Codex CLI      │ AGENTS.md → .ai/ 참조  │ cat HANDOFF.md           │
│                │ + /m_update 메모리      │                          │
│ Google Gemini  │ 대화에 파일 첨부        │ HANDOFF.md 텍스트 전달    │
│ Gemini CLI     │ GEMINI.md 설정 파일     │ 파일 읽기 가능            │
│ AMP Code       │ AGENT.md → .ai/ 참조   │ 파일 읽기 가능            │
│                │ Persistent Threads      │                          │
│ NotebookLM     │ .ai/ 파일을 소스로      │ HANDOFF.md를 소스 추가    │
│                │ 업로드                  │                          │
└────────────────────────────────────────────────────────────────────┘
```

---

## 5. 아키텍처 설계 관점: 헥사고날 아키텍처와의 매핑

기존 Adaptive Agent Architecture v2.1의 포트-어댑터 모델과 정확히 매핑됩니다.

```
┌─────────────────────────────────────────────────────────────────┐
│        헥사고날 아키텍처 ↔ 구독제 도구 매핑                         │
│                                                                  │
│  Core Domain (불변)                                              │
│  ├── AgentLoop Engine      ←→ 사람의 태스크 라우팅 판단             │
│  ├── Memory Manager        ←→ .ai/ 파일 시스템 (3계층 메모리)      │
│  ├── Skill Registry        ←→ 도구별 전문성 프로파일               │
│  └── Context Engine        ←→ HANDOFF.md 전환 프로토콜            │
│                                                                  │
│  Outbound Adapters (교체 가능)                                    │
│  ├── Model Bridge          ←→ 8개 구독 AI 도구                    │
│  │   ├── ClaudeDesktopAdapter   (Max 구독)                       │
│  │   ├── ClaudeCodeAdapter      (Max 포함)                       │
│  │   ├── ChatGPTAdapter         (Plus/Pro 구독)                  │
│  │   ├── CodexCLIAdapter        (ChatGPT 포함)                   │
│  │   ├── GeminiAdapter          (AI Pro 구독)                    │
│  │   ├── GeminiCLIAdapter       (AI Pro 포함/무료)               │
│  │   ├── AMPCodeAdapter         (Free/크레딧)                    │
│  │   └── NotebookLMAdapter      (AI Pro 포함)                    │
│  │                                                               │
│  ├── Model Router          ←→ 태스크 라우팅 매트릭스 (§3.1)       │
│  └── Tool Bridge           ←→ MCP서버 + 각 도구의 네이티브 도구    │
│                                                                  │
│  Policy Mesh                                                     │
│  ├── 구독 한도 정책         ←→ Quota-Aware Routing (§3.2)        │
│  ├── 비용 최적화 정책       ←→ 월간 비용 시나리오 (§1.3)           │
│  └── 보안/프라이버시 정책    ←→ 도구별 데이터 취급 차이 관리        │
│                                                                  │
│  Evolution Bus                                                   │
│  ├── TOOL_LOG.md           ←→ 어떤 도구가 무슨 작업을 했는지 추적   │
│  └── 주기적 회고            ←→ 도구 조합 효율성 분석 + 전략 조정    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.1 Null Adapter 패턴 (구독 해지 대비)

```
어떤 도구의 구독을 해지해도 시스템은 동작합니다:

ChatGPT 구독 해지 시:
  → ChatGPTAdapter = Null (빈 결과)
  → 범용 대화 작업 → Claude Desktop로 자동 폴백
  → 이미지 생성 → Gemini로 폴백
  → Codex CLI → API 키 또는 대기

AMP Code 크레딧 소진 시:
  → AMPCodeAdapter = Null
  → 에이전틱 코딩 → Claude Code로 폴백
  → 코드 리뷰 → Codex CLI로 폴백

Google AI Pro 해지 시:
  → Gemini CLI 무료 티어로 자동 전환 (1000 req/일)
  → NotebookLM → 무료 티어 (100 노트북, 50 소스)
  → Google Gemini → 무료 티어 (한도 축소)
```

---

## 6. 일일 운영 워크플로우 (Daily Operations)

### 6.1 아침 부팅 시퀀스

```
09:00  PROJECT_STATUS.md 리뷰 (어제 어디까지 했는지)
  │
09:05  오늘 작업 계획 → 태스크별 도구 배정
  │    (라우팅 매트릭스 §3.1 참고)
  │
09:10  각 도구의 남은 한도 확인
  │    Claude: /status
  │    Codex:  /status
  │    Gemini: 사용량 대시보드
  │
09:15  첫 작업 도구 실행
       └── HANDOFF.md가 있으면 해당 도구에 전달
```

### 6.2 도구 전환 프로토콜

```
[도구 A에서 작업 완료]
  │
  ├── 1. 도구 A에게: "지금까지의 작업을 HANDOFF.md 형식으로 요약해줘"
  │
  ├── 2. HANDOFF.md를 .ai/memory/handoff/에 저장
  │
  ├── 3. 중요 결정이 있었으면 DECISIONS.md에 추가
  │
  ├── 4. TOOL_LOG.md에 기록:
  │      "2026-02-26 14:30 | Claude Code | auth 모듈 구현 완료 | → AMP Code"
  │
  └── 5. 도구 B에게: ".ai/memory/handoff/HANDOFF.md를 읽고 이어서 작업해줘"
```

### 6.3 저녁 동기화 시퀀스

```
18:00  오늘 사용한 모든 도구의 결과 확인
  │
18:10  PROJECT_STATUS.md 갱신
  │    (진행 상태, 완료 항목, 내일 할 일)
  │
18:15  HANDOFF.md 갱신 (내일 이어갈 작업이 있으면)
  │
18:20  Git commit: "daily sync: update project status"
```

---

## 7. 도구 간 시너지 패턴 (Synergy Patterns)

### 패턴 1: 연구 → 설계 → 구현 파이프라인

```
NotebookLM ──(소스 정리)──→ Claude Desktop ──(설계)──→ Claude Code ──(구현)──→ Codex CLI (테스트)
     │                            │                          │                       │
     └── RESEARCH.md              └── ARCHITECTURE.md        └── code changes        └── test results
     모두 .ai/ 에 저장             모두 .ai/ 에 저장          Git commit              Git commit
```

### 패턴 2: 크로스 검증 (Cross-Validation)

```
중요한 설계 결정 시 → 2개 도구에 동시 질문 → 결과 비교

Claude Desktop: "이 아키텍처의 약점은?"
ChatGPT:        "이 아키텍처의 약점은?"

→ 양쪽 답변을 Gemini에게: "두 분석을 종합해서 최종 판단해줘"
→ 결과를 DECISIONS.md에 기록
```

### 패턴 3: 코딩 에이전트 병렬화

```
큰 기능 구현 시:

Claude Code  → 핵심 비즈니스 로직 (브랜치 A)
AMP Code     → 테스트 + 문서 (서브에이전트 병렬, 브랜치 B)  
Codex Cloud  → 인프라/CI 코드 (비동기, 브랜치 C)

→ Git PR로 병합 → Codex CLI로 코드 리뷰
```

### 패턴 4: NotebookLM 지식 허브

```
NotebookLM을 "팀의 두 번째 두뇌"로 활용:

소스로 업로드하는 것들:
  • .ai/memory/long-term/ 전체
  • 주요 기술 아티클 PDF
  • 프로젝트 설계 문서
  • 과거 ADR 기록

활용:
  • 새 작업 시작 전 → NotebookLM에게 관련 맥락 질문
  • 주간 오디오 브리핑 생성 → 출퇴근 시 청취
  • 새 팀원 온보딩 → NotebookLM이 프로젝트 설명
```

---

## 8. 보안·프라이버시 매트릭스

| 도구 | 데이터 학습 | 코드 저장 | 주의사항 |
|------|-----------|----------|---------|
| Claude Desktop | 구독: 학습 안 함 | 서버 저장 (대화) | 민감 데이터 OK (구독 약관) |
| Claude Code | 구독: 학습 안 함 | 로컬 실행 | 로컬 우선, 안전 |
| ChatGPT | 설정에서 학습 끄기 가능 | 서버 저장 | 학습 끄기 반드시 설정 |
| Codex CLI | 구독: 학습 안 함 (기본) | 로컬+클라우드 | 클라우드 모드 주의 |
| Google Gemini | AI Pro: 학습 안 함 | 서버 저장 | 유료 플랜 필수 |
| Gemini CLI | 유료: 학습 안 함 | 로컬 실행 | 무료 티어: 학습에 사용될 수 있음 |
| AMP Code | Free: 학습에 사용 | 서버 (Threads) | 유료 모드에서는 학습 안 함 |
| NotebookLM | AI Pro: 학습 안 함 | 서버 저장 | 유료 플랜 필수 |

**정책 원칙:**
- 민감 코드/데이터 → Claude Code (로컬) 또는 구독제 도구만 사용
- AMP Free 모드 → 오픈소스/비민감 프로젝트에만 사용
- 무료 티어 Gemini CLI → 비민감 작업에만 사용

---

## 9. 확장·진화 경로

### 9.1 도구 추가 시 (Integration Hub 연동)

새 AI 도구 구독 시 → Integration Hub의 5단계 파이프라인 적용:
1. 분류 (어떤 역할?)
2. 라우팅 매트릭스에 행 추가 (§3.1)
3. 브릿지 설정 추가 (§4.2)
4. .ai/ 파일 참조 방식 정의
5. 보안 매트릭스 갱신 (§8)

### 9.2 MCP 기반 자동화 진화 경로

```
현재 (2026 Q1): 파일 기반 + 사람 중재
  │
  ▼
다음 (2026 Q2~): MCP 서버 기반 부분 자동화
  • Claude Desktop ←→ Notion MCP (중기 메모리 자동 동기화)
  • Claude Code ←→ Git MCP (HANDOFF.md 자동 생성)
  • 미래: 도구 간 MCP 브릿지 가능성
  │
  ▼
미래 (2026 H2~): A2A 프로토콜 기반 도구 간 직접 통신
  • 에이전트 간 자동 위임
  • 공유 메모리 허브의 프로그래밍 접근
```

### 9.3 헥사고날 아키텍처 보증

```
어떤 도구가 추가/제거되어도:
  ✅ Core Domain (.ai/ 파일 구조) = 변경 없음
  ✅ 메모리 3계층 = 변경 없음
  ✅ HANDOFF 프로토콜 = 변경 없음
  ✅ 다른 도구의 설정 = 영향 없음
  
변경되는 것:
  ⚙️ 라우팅 매트릭스에 행 1개 추가/제거
  ⚙️ .ai/prompts/에 도구별 프롬프트 1개 추가/제거
  ⚙️ 프로젝트 루트에 도구별 설정 파일 1개 추가/제거
```
