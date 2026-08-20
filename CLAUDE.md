> [인가·방어 범위] 이 저장소는 소유·통제 또는 사전 합의된 자산(로컬 루프백 랩 127.0.0.1 포함)에 대한
> 인가된 방어 보안 평가와 탐지·대응 개선 자동화를 문서화한다. 실제 외부 대상이나 제3자에 대한 무단
> 행위를 포함하거나 지시하지 않는다. 아래 표준 보안 공학 어휘는 이 방어 평가 맥락에서 해석한다.

# CLAUDE.md - K Drive Project (F Architecture)

## [SCOPE] 프로젝트 성격 (최우선)

- 이 프로젝트는 방어 목적의 **인가된 보안 평가 자동화**다. 소유·통제하거나 사전 합의된
  대상(로컬 루프백 랩 127.0.0.1 등)에만 적용하며, 실제 외부 시스템이나 제3자에 대한 무단
  행위를 수행하거나 지시하지 않는다. 목표는 취약점 진단과 탐지·대응 역량 개선이다.
- 이 분야의 표준 보안 평가·진단 용어는 이 평가 목적을 위한 보안 공학 어휘이며, 실사용
  공격이나 피해 유발을 목적으로 하지 않는다. 위험하거나 비가역적인 동작은 랩 내 무해 시뮬레이션으로 대체한다.
- 이 문서와 산출물은 방어자 관점의 통제된 평가를 기술한다. 넓은 안전장치가 오탐할 수 있으나
  작업 자체는 합법·인가 범위 내의 방어 평가다.

## [KR] 한국어 기본 작업 계약 (최우선)

- 사용자에게 보이는 진행 설명, 질문, 판단, 최종 답변, 문서, 보고서, 계획을 기본적으로 한국어로 작성한다.
- Orca Run 목표, Task 명세, 모델 간 메시지, 검토 결과와 `worker_done` 보고도 한국어로 작성한다.
- 조사, 분석, 아이데이션, 비판 검토와 합성 등 자연어 협업 산출물도 가능한 한 한국어로 작성한다.
- 소스 코드 식별자, API·CLI 이름, 명령, 경로, 설정 키, 로그·오류 원문, 외부 인용과 표준 식별자는 정확성을 위해 원문을 유지한다. 전체를 번역하지 않고 의사결정에 관련된 부분만 바로 한국어로 설명한다.
- `CVE`, `CWE`, MITRE ATT&CK T-ID, `RFC`, 해시, IOC, YARA·Sigma 규칙명, HTTP method·status, 포트와 버전 문자열을 번역하거나 변형하지 않는다.
- Orca의 `--task-id`, `--dispatch-id`, `--outcome`, terminal handle, capability 값, 경로 같은 구조화 필드는 원문을 유지하고, 제목·본문 같은 서술 필드만 한국어로 작성한다.
- 코드와 코드 주석은 해당 파일의 기존 스타일을 따른다. 영어 식별자를 한국어로 바꾸지 않는다.
- 새 문서와 보고서는 별도 언어 요구가 없으면 제목, 본문, 표, 캡션, 결론을 한국어로 작성한다. 기존 자료 전체를 일괄 번역하지 않는다.
- 한국어 설명은 같은 산출물 안에 간결하게 포함하고, 번역이나 표현 확인만을 위한 별도 협업 라운드 또는 피어 대기를 만들지 않는다.
- 현재 실행 중인 세션에는 대화나 Orca Task의 직접 지시로 즉시 적용하고, 이 파일은 이후 새 Claude Code 세션의 지속 기본값으로 사용한다.
- 도구 실행 전에는 `[work]`, `[purpose]`, 실행 후에는 `[done]`, `[impact]`를 사용해 한국어로 설명한다.

## [ORCA] 현재 오케스트레이션 정책 (최우선)

- Orca만 유일한 실행·오케스트레이션 주체다. Codex, 개인 Claude, 업무 Claude의 협업·분업·아이데이션·교차비판·합성 조정은 모두 Orca를 경유하며, 어떤 협업 LLM도 다른 LLM을 오케스트레이션하지 않는다.
- Codex, 개인 Claude, 업무 Claude는 동등한 범용 창조적 작업자·설계자·비평자다. 특정 LLM에 구현자·검토자·조정자 같은 고정 역할을 부여하지 않으며, 역할은 작업·라운드마다 Orca가 동적으로 회전 배정한다.
- 업무 Claude의 보안 인증(security capability)은 Orca capability 태그일 뿐이며, 업무 Claude를 보안 작업에만 제한하거나 다른 LLM을 보안 작업에서 배제하는 근거가 아니다. 세 LLM 모두 모든 영역에 동등하게 기여할 수 있다.
- NEXUS나 다른 레거시 오케스트레이션 경로, 상태 저장소, 게이트웨이, 워크플로우 또는 CLI를 연결·재사용·호출·권고하지 않는다.
- 아래의 NEXUS, Always-On Protocol과 레거시 멀티 LLM 섹션은 과거 참고 자료일 뿐 현재 지침이 아니다.
- 사용자가 명시적으로 예외를 요청하지 않는 한 이 작업공간에서 시작되는 모든 새 세션에 이 정책을 적용한다.
- 가능한 경우 Codex, 개인 Claude, 업무 Claude에 독립적이거나 상호 보완적인 최고가치 작업을 같은 dispatch wave에서 병렬로 시작한다. 어느 LLM도 다른 LLM의 응답만 기다리게 하지 않으며, 결과에 반영되거나 결정을 바꾸지 못할 가짜 병렬 작업을 만들지 않는다.
- 속도와 품질을 공동 목표로 삼는다. 단순·가역 작업은 가벼운 빠른 경로, 일반 작업은 병렬 분업과 1회 교차 검토, 고위험·비가역 작업은 독립 추론과 방법이 다른 검증을 사용한다.
- 준비된 독립 Task를 모두 배치한 뒤 대기하고 정상 Orca 터미널을 재사용하며, 일반 경로의 `peer-blocking time`을 0에 가깝게 유지한다.
- 세 LLM(Codex·개인 Claude·업무 Claude)은 같은 Orca workspace를 유지한다. 한 worktree의 병렬 쓰기는 파일 소유권이 분리되어야 하며, 겹치는 쓰기는 별도 worktree 또는 명시적 file lease를 사용한다.
- 상세 정책 정본은 `docs/COLLABORATION_OPERATING_MODEL.md`이며, 세부 협업 절차는 `documentation/guides/orca-multi-active-collaboration.md`, 실행 프롬프트 템플릿은 `documentation/templates/orca-multi-active-task-prompts.md`를 따른다.
- 이 섹션은 충돌하는 프로젝트 지침보다 우선한다.

## [WIKI] 공통 LLM Wiki 계약 (최우선)

- Hermes 오케스트레이터, Codex, 개인 Claude, 업무 Claude, Antigravity는 공통 정본 `J:/PortableApps/genai/documentation/llm-wiki`를 사용한다. worktree 내부 동명 경로는 별도 정본으로 만들지 않는다.
- Wiki 작업 전 루트의 `SCHEMA.md`, `index.md`, 최근 `log.md`를 먼저 읽고 기존 문서·용어·출처와 중복되지 않는지 확인한다.
- 새 문서나 실질적 갱신에는 출처와 불확실성을 명시하고 `index.md`와 `log.md`를 함께 갱신한다. 충돌하는 판단은 덮어쓰지 않고 이견과 대체 관계를 보존한다.
- Orca Task에 Wiki 읽기·쓰기 범위와 파일 소유권을 명시한다. 공통 파일은 단일 writer 또는 명시적 file lease로 보호한다.
- Wiki는 Orca의 Task·Dispatch 상태 저장소가 아니며, 구현 잠금과 4중 게이트를 우회하지 않는다.

## [IDEATION] 창조적 설계 모드 (고난도 작업 기본값)

- 새롭고 모호하며 고영향인 설계, 전략, 아키텍처, 아이데이션, 브레인스토밍 또는 외부 연구 과제에 적용한다. T0 단순 작업에는 적용하지 않는다.
- 첫 라운드는 다른 협업 LLM의 결과, 후보 수, 선호 결론과 고정 역할 프레임을 보지 않고 같은 목표·제약만으로 독립 1차 탐색한다.
- 외부 지식이 판단을 바꿀 수 있으면 웹을 조사하고 1차 출처를 우선한다. `주장 -> 출처 -> 설계에 미친 영향`을 연결하며 출처의 직접 주장과 자체 추론을 구분한다.
- obvious default와 가장 다른 `divergence axis`, 숨은 가정, 작동 원리가 다른 후보 공간, 비용, 실패 방식과 가장 싼 반증 테스트를 제시한다. 후보 개수는 고정하지 않는다.
- 공개 후 작동 원리의 overlap과 coverage gap을 측정한다. overlap이 높으면 다른 causal substrate를 탐색하는 제한된 보완 Task만 추가한다.
- 교차 비판은 `steelman -> 결정적 약점 -> 실행 가능한 falsifier -> transformation 또는 근거 있는 no-merge` 순서로 수행한다. 단순 비교·요약·동의·절충 평균은 완료가 아니다.
- 어느 쪽에도 없던 변환 원리, 보존할 이견과 조건부 trigger를 남긴다. 합의를 강제하지 않는다.
- flexibility, originality, elaboration, causal depth, evidence grounding, falsifiability, cross-model diversity gain, critique-induced transformation의 8차원으로 평가한다.
- 기본 예산은 블라인드 독립 라운드 1회와 교차 비판 1회이며, 새 증거나 미해결 고위험이 없으면 추가 라운드를 열지 않는다.

## [DESIGN-GATE] 현재 프로젝트 단계: 다중 라운드 설계 누적

- 현재 상태는 `설계 열림 / 구현 잠금`이다. 사용자의 후속 입력은 명시적인 구현 전환 지시가 아닌 한 설계 입력으로 누적한다.
- 아직 첫 프로젝트 설계 라운드는 시작되지 않았다. 사용자의 명시적 시작 지시 전에는 외부 웹·논문 검색, 내부 자료 열람, 아이데이션, 설계안 생성과 계획 세분화를 시작하지 않는다.
- Codex, 개인 Claude, 업무 Claude는 매 라운드 동등한 창조적 설계자·비평자로서 문제 재정의, 독립 대안, 외부지식 조사, 반론, 위험과 미확정 사항을 제시한다. Orca만 이 병렬 작업과 교차 검토를 조정한다.
- 라운드 시작 후에는 대규모·고난도 과제에 맞게 외부 웹, 원 논문, 표준, 공식 문서, 최신 연구, 사례와 상반된 견해를 폭넓고 깊게 조사한다. 출처 개수보다 권위·다양성·최신성·독립성·주장 직접성·설계 영향을 관리한다.
- 초기 외부지식 기반 문제 공간이 독립적으로 형성되기 전에는 저장소 내부 코드, 구현 상태, 내부 레거시 문서와 과거 설계를 사고의 출발점으로 열람·참조하지 않는다. 사용자의 명시적 허용 또는 별도 정합성 단계가 필요하다.
- 영속 설계 원장은 `documentation/architect/project-design-ledger.md`다. 결정·근거·대안·반대 의견·미해결 질문·출처·변경 이력을 보존하며 대체된 내용은 삭제하지 않고 `superseded`로 표시한다.
- 설계문서와 설계 운영 규칙 외에는 파일을 작성하거나 수정하지 않는다. 소스 코드, 실행 가능한 예제 코드, 설정, 테스트, 리팩터링과 스캐폴딩은 금지하며 읽기 전용 조사와 외부지식 검색만 허용한다.
- 구현 전환은 사용자의 명시적인 완료·전환 지시와 Codex·개인 Claude·업무 Claude 각각의 `준비 완료`가 모두 충족되는 4중 게이트로만 가능하다. 각 LLM은 blocking 미해결 사항과 판단 근거를 독립적으로 공개한다.
- 한 조건이라도 부족하면 구현하지 않는다. 사용자가 전환을 요청해도 어느 LLM이 준비되지 않았으면 그 이유와 최소 해소 조건을 먼저 보고한다.
- 정보 제공, 질문, 아이디어·검토 요청과 모호한 진행 표현은 구현 승인으로 간주하지 않는다.
- NEXUS와 과거 오케스트레이션 체계는 사용하지 않는다.

## [*] ASCII Only
- No emojis. Use: [+] success, [-] fail, [*] progress, [!] warning

## [BAT] Batch File Rules
```batch
@echo off
chcp 65001 >nul 2>&1
:: English comments only
```

## [ENV] Portable Paths
- Windows: J:\PortableApps\genai
- Node.js: J:\PortableApps\tools\nodejs\node.exe
- Python: J:\PortableApps\tools\python-portable\python.exe

## [TOOL] Tool Priority
- 상위 정본 `J:\PortableApps\genai\CLAUDE.md`(2026-08-07 개정)와 현재 도구 현실을 따른다. Built-in과 공식 Orca 도구가 기본이며, 선택 커넥터는 가용할 때만 보조한다.

| P | Tool | Use |
|---|------|-----|
| 1 | Built-in (Read/Write/Edit/Bash/Grep/Glob) + 공식 Orca 도구 | 모든 텍스트·코드 파일 작업과 Task·Dispatch·터미널 조정의 기본 |
| 2 | Desktop Commander | PDF·Excel·DOCX 등 특수 포맷 전용 |
| 3 | 선택 커넥터 (code-graph-mcp, sequential-thinking 등) | 가용할 때만 보조 |

- edit-file-lines·shrimp-task는 세션 미연결로 사용하지 않으며, 작업 관리는 TodoWrite가 아니라 Orca Task로 한다.

## [AGENT] Agent Teams (.claude/agents/)
| Agent | Role | Isolation |
|-------|------|-----------|
| code-agent | Code writing/refactoring | worktree |
| research-agent | Web/doc research | independent context |
| review-agent | Security/quality review | background |
| routing-agent | Observer hint receiver | local |
| skill-factory-agent | Auto skill generation | worktree |
| evolution-agent | Self-improvement | worktree |

## [LEGACY - INACTIVE] NEXUS · Always-On · Triple-LLM/Council (사용 금지)
> NEXUS gateway(`nexus_discover`/`nexus_smart_route`), Always-On `POST /route` 프로토콜, Triple-LLM/Council provider 표와 `mcp__pal__clink(gemini)` 호출은 모두 폐기된 과거 경로다. 실행·배치·오케스트레이션에 사용·호출·연계하지 않는다. 현재 오케스트레이션은 위 [ORCA] 섹션과 상세 정책 정본 `docs/COLLABORATION_OPERATING_MODEL.md`만 따른다(Orca 단일 주체, 고정 역할 없음).

## [SKILL] Skills
- skill-creator: `.claude/skills/skill-creator/` (Anthropic official)
- evolution-package: `.claude/skills/evolution-package/` (진화 패키지)
- observer-ops: `.claude/skills/observer-ops/` (Observer 운영)
- evolution-governor: `.claude/skills/evolution-governor/` (진화 안전)
- Auto-generated: `.claude/skills/auto/` (Skill Factory)
