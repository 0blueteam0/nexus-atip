# RedTeam AX 대규모 개편 상세 계획

문서 상태: draft  
작성일: 2026-07-01  
대상 경로: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio`  
관련 실행 경로:

- Frontend: `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react`
- Backend: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime`
- Previous work index: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-work-folder-inventory-20260701/WORK_FOLDER_INDEX.md`
- ChatShare package: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/chatshare-output/chatgpt/레드팀_수행과정_20260701-110739.HANDOFF_PACKAGE_MANIFEST.json`
- LLM wiki home: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/llm-wiki/LLM_WIKI_HOME.md`

## 1. 목표

`http://127.0.0.1:5177/`의 Report Studio 안에 있는 기존 `레드팀 분석` 탭을 기준 기능으로 삼아, 옆에 `레드팀 분석2` 탭을 만든다. `레드팀 분석2`는 단순 복사본이 아니라 RedTeam AX v2 개편 워크벤치다. 기존 백엔드와 프론트엔드 구현은 참고하되 그대로 확장하지 않고, Red Team Studio 전체 자료, ChatShare의 레드팀 수행과정, 기존 runtime 구현, evidence/guardrail/report v2 요구사항을 통합해 다음을 만족하도록 설계한다.

1. 승인된 레드팀, 모의침투, 펜테스트 업무만 Case와 ROE 안에서 운영한다.
2. 모든 도구, 스크립트, MCP, LLM 에이전트 실행은 Policy Engine, Tool Guard, HITL, Audit를 통과한다.
3. 모든 자료, 이미지, 로그, 도구 결과, 분석 판단은 Evidence Card와 Claim-Evidence Matrix로 추적한다.
4. 웹앱의 실행 버튼은 직접 실행 버튼이 아니라 ToolActionCard 상태 전이 버튼이다.
5. 고위험 실행은 사람이 승인, 수행, 검토하고 AI는 계획, 증거화, 분석, 보고서 초안, 재시험 계획을 보조한다.
6. 한국어 Red Team Report v2는 Volkis식 Campaign Walkthrough와 악성코드 보고서식 문서 통제/증적 양식을 결합해 생성한다.
7. 종료 조건은 전체 테스트, 보안 게이트, 보고서 검증, 샘플 케이스 E2E, 회귀 검증 통과이며 unsupported claim, 승인 없는 고위험 실행, 증거 없는 Finding은 0건이어야 한다.

## 2. 현재 확인 결과

### 2.1 ChatShare 레드팀 수행과정

`$chatshare-artifact-lab`로 `https://chatgpt.com/share/6a4471ca-75b0-83ee-a10d-8d36dee74aa7`을 추출했다.

| 항목 | 값 |
|---|---:|
| Provider | ChatGPT |
| 상태 | `likely-shared-chat` |
| 본문 길이 | 16,662자 |
| HTML 길이 | 4,057,160자 |
| 코드 블록 | 27개 |
| 다운로드 후보 | 0개 |
| 다운로드된 파일 | 0개 |
| 로그인/숨김 artifact | 0개 |
| completeness 상태 | `complete_for_public_snapshot` |

반영할 핵심 원칙:

- Guardrails are applied at every trust boundary.
- Tool output and retrieved documents are data, not instruction.
- Screenshot is evidence, not conclusion.
- LLM은 Tool을 직접 호출하지 않는다.
- Tool Adapter와 DB/API 사이에는 Query Template, SQL AST, RBAC/RLS, masking, result limit이 필요하다.
- Tool output은 Evidence candidate로 정규화된 뒤 EvidenceCard로 승격된다.
- ToolHub, ScriptFactory, ToolActionCard, ManualRunRecorder, ToolResultNormalizer, OSS adapter가 RedTeam AX에 필수다.

### 2.2 Red Team Studio 폴더 인벤토리

전체 파일 수는 4,687개, 총 크기는 약 248MB다. 전체 파일 목록은 LLM 호출용 manifest로 저장했다.

| 위치 | 파일 수 | 역할 |
|---|---:|---|
| `Agentic RAG SPEC` | 9 | Agentic RAG/GraphRAG 상세 스펙 |
| `SPEC` | 39 | RedTeam AX SDD, Guardrail, Tooling, API, Acceptance Spec |
| `v1.0` | 84 | 초기 스타터팩과 기본 모델 |
| `v1.1` | 113 | Visual Evidence 보강 버전 |
| `v1.2` | 4,397 | MCP Gateway 포함 최신 스타터팩과 의존 가상환경 |
| `logs` | 3 | 작업 로그 |
| `고도화` | 생성 중 | 이번 개편 산출물, ChatShare, LLM wiki, sanity test |

호출 가능한 LLM 위키 산출물:

- `고도화/llm-wiki/RED_TEAM_STUDIO_FILE_MANIFEST.json`
- `고도화/llm-wiki/RED_TEAM_STUDIO_EXTENSION_SUMMARY.json`
- `고도화/llm-wiki/RED_TEAM_STUDIO_TOP_DIR_SUMMARY.json`
- `고도화/llm-wiki/LLM_WIKI_HOME.md`

### 2.3 기존 프론트엔드

주요 파일:

- `src/store/methods/reports.js`
- `src/data.js`
- `src/views/ReportsView.jsx`

기존 `레드팀 분석` 탭은 `reports.js` 내부의 다음 함수군으로 구성된다.

- `redTeamReports()`
- `redTeamReportById()`
- `redTeamAssessmentBrief()`
- `redTeamAnalysisDraft()`
- `updateRedTeamAnalysisDraft()`
- `loadRedTeamAnalysisStatus()`
- `submitRedTeamAnalysisTabRun()`
- `redTeamAnalysisPanel()`
- `reportStudioTabs()`
- `reportStudioTabContent()`

현재 탭 구조는 `reports`, `malax`, `redteam` 세 개다. `레드팀 분석2`는 `redteam2` 탭으로 추가하되, 상태 키와 API 호출을 분리해야 한다.

### 2.4 기존 백엔드

주요 파일:

- `runtime/redteam_api_router.py`
- `runtime/redteam_analysis_flow_sync.py`
- `runtime/redteam_safe_tool_adapter.py`
- `runtime/redteam_scope_analysis.py`
- `runtime/redteam_asm_analyzer.py`
- `runtime/redteam_operation_graph.py`
- `runtime/redteam_evidence_graph.py`
- `runtime/redteam_report_compiler.py`
- `runtime/redteam_release_gate.py`
- `runtime/redteam_toolchain_readiness.py`
- `runtime/redteam_agentic_rag.py`
- `runtime/redteam_knowledge_db.py`

현재 API prefix는 `/api/redteam`이다. `레드팀 분석2`는 초기에는 같은 엔진을 versioned orchestrator로 재사용할 수 있지만, 프론트 상태와 route contract는 `/api/redteam2` 또는 `/api/redteam/v2`로 분리한다.

현재 확인된 주요 API:

- `GET /api/redteam/health`
- `GET /api/redteam/tools/readiness`
- `GET /api/redteam/rag/knowledge/status`
- `POST /api/redteam/reports/{report_id}/analysis/run`
- `GET /api/redteam/reports/{report_id}/analysis/latest`
- `GET /api/redteam/cases/{case_id}/reports/latest`
- `GET /api/redteam/cases/{case_id}/graph/latest`
- `POST /api/redteam/cases/{case_id}/claims/verify`
- `POST /api/redteam/cases/{case_id}/release/evaluate`
- `POST /api/redteam/visual/capture-requests`
- `POST /api/redteam/mcp/evaluate`
- `POST /api/redteam/timeline/metrics`

현재 `127.0.0.1:5177`과 `127.0.0.1:8765`는 실행 중이 아니었다. 계획 검증 단계에서는 서버를 재기동해 live smoke를 수행한다.

## 3. 상세 요구사항

### 3.1 Report Studio UI 요구사항

1. 기존 `레드팀 분석` 옆에 `레드팀 분석2` 탭을 추가한다.
2. `레드팀 분석2`는 기존 탭의 UI 구조를 복제하되 state namespace를 분리한다.
3. 기존 탭을 깨지 않기 위해 `redteam`과 `redteam2`는 서로 다른 draft/run/cache key를 사용한다.
4. `레드팀 분석2`는 다음 화면 블록을 포함한다.
   - 개편 개요와 운영 원칙
   - Case/ROE/HITL 상태
   - Scope 대상 지정
   - ToolHub/ToolActionCard 큐
   - ScriptFactory 요청/검토 큐
   - MCP Gateway 평가 큐
   - Evidence/Visual Evidence Matrix
   - Campaign Walkthrough Builder
   - Finding v2 Builder
   - Report v2 Section Sync
   - Release Gate와 unsupported claim blocker
   - Purple Team Retest Board
5. 실행 버튼은 모두 `ToolActionCard`를 조회한 뒤 상태에 따라 활성화한다.
6. 고위험 실행은 브라우저에서 disabled 상태로 표시하고 승인/수동 수행/결과 import 흐름만 제공한다.
7. `레드팀 분석2`는 ChatShare에서 추출한 수행과정 지식과 Red Team Studio SDD를 직접 열 수 있는 reference panel을 제공한다.

### 3.2 백엔드 요구사항

1. `/api/redteam/v2` 또는 `/api/redteam2` route namespace를 만든다.
2. 기존 `/api/redteam` 기능은 유지한다.
3. v2 API는 실행 중심이 아니라 case orchestration, tool action planning, evidence validation, report validation 중심으로 설계한다.
4. 모든 v2 응답에는 다음 audit envelope를 포함한다.
   - `case_id`
   - `request_id`
   - `policy_decision`
   - `evidence_refs`
   - `audit_refs`
   - `unsupported_claim_count`
   - `requires_human_review`
5. Tool/MCP/Script 실행은 기본 deny-by-default다.
6. `T5`, credential collection, phishing sender, exploit execution, persistence, evasion, destructive action은 승인 여부와 무관하게 production 자동 실행을 금지한다.

### 3.3 Evidence/LLM Wiki 요구사항

1. Red Team Studio 전체 폴더는 파일 manifest로 호출 가능해야 한다.
2. 주요 SDD, SPEC, v1.2 starter, ChatShare transcript는 LLM wiki home에서 연결한다.
3. 모든 새 산출물은 `고도화` 폴더에 둔다.
4. LLM wiki 문서는 frontmatter, source paths, collected_via, evidence_level, related links를 포함한다.
5. 개발 중 스펙이 바뀌면 `고도화/spec-updates`에 addendum을 추가한다.
6. official source 문서와 운영 메타를 섞지 않는다.

### 3.4 보고서 요구사항

Red Team Report v2 필수 섹션:

1. 문서 정보 및 개정 이력
2. Executive Summary
3. 레드팀 평가 체크리스트
4. 평가 개요 및 거버넌스
5. Scope, ROE, 법무/개인정보/안전 통제
6. Crown Jewel 분석
7. Threat Intelligence / Threat Model
8. Objectives and Scenarios
9. Threat Cards
10. Telemetry Readiness
11. Attack Surface
12. Campaign Walkthrough
13. Attack Narrative Timeline
14. Detection & Response Deep Dive
15. Findings v2
16. ATT&CK / ATLAS / OWASP Mapping
17. Evidence & Visual Capture Index
18. Effective Security Practices
19. Additional Recommendations
20. Remediation Roadmap
21. Purple Team Retest Plan
22. Residual Risk & Risk Acceptance
23. AI/AX/MCP/Tooling Automation Audit
24. Conclusion
25. Appendices
26. References
27. Glossary
28. Analyst and Reviewer Info

## 4. 화면/기능 명세

### 4.1 탭 구성

| 탭 ID | 화면명 | 목적 | 기존 연동 |
|---|---|---|---|
| `reports` | Reports | 보고서 목록 | 유지 |
| `malax` | 악성코드 분석 | 기존 malware workflow | 유지 |
| `redteam` | 레드팀 분석 | 기존 RTA 분석 탭 | 유지 |
| `redteam2` | 레드팀 분석2 | 대규모 개편 AX v2 워크벤치 | 신규 |

### 4.2 `레드팀 분석2` 화면 블록

| 블록 | 기능 | 데이터 소스 |
|---|---|---|
| AX v2 Overview | 목표, 안전 경계, 현재 case 상태 | `redteam_ax_plan.md`, SPEC |
| Reference Pack | ChatShare, SDD, v1.2, 기존 WORK_FOLDER_INDEX 링크 | LLM wiki |
| Case/ROE Gate | case 생성, ROE 상태, HITL 요구사항 | `/api/redteam/v2/cases`, `/roe/evaluate` |
| Scope Builder | IP/URL/domain/CIDR 입력, loopback lab preset | `/scope/evaluate` |
| ToolHub | 등록 도구, risk class, readiness, adapter 상태 | `/tools`, `/tools/readiness` |
| ToolAction Cards | 버튼 상태, dry-run, approval, manual import | `/tool-actions/*` |
| ScriptFactory | helper script request, static scan, sandbox dry-run | `/scripts/*` |
| MCP Gateway | 서버/도구 평가, dry-run, output sanitizer | `/mcp/*` |
| Evidence Matrix | EvidenceCard, VisualEvidence, ToolRunRecord | `/evidence/*` |
| Campaign Walkthrough | 목적, Activity Narrative, Detection, Outcome | `/campaigns/*` |
| Finding v2 | root cause, business impact, retest criteria | `/findings/*` |
| Report v2 Builder | claim validation, section sync, export gate | `/reports/*` |
| Purple Team Board | remediation backlog, retest evidence | `/retests`, `/remediation` |
| Audit Timeline | LLM/MCP/tool/HITL/export audit | `/audit` |

### 4.3 버튼 정책

모든 버튼은 다음 흐름을 따른다.

```text
Button Click
  -> Load ToolActionCard
  -> Evaluate Case/ROE/Scope
  -> Evaluate Tool Risk
  -> Evaluate Execution Mode
  -> Check Required Approvals
  -> Execute, Block, or Record Manual Result
  -> Create Audit Record
  -> Create Evidence Candidate
```

금지:

- 버튼에서 직접 shell, MCP, external tool 호출
- 승인 없는 T3/T4/T5 실행
- production exploit, credential capture, phishing sender, persistence/evasion/destructive 자동화
- raw tool output을 보고서 본문에 직접 삽입

## 5. API 설계

초기 namespace는 `/api/redteam/v2`를 권장한다. 기존 `/api/redteam`과 병행 운영한다.

### 5.1 Case/ROE

| Method | Path | 목적 |
|---|---|---|
| `POST` | `/api/redteam/v2/cases` | Case 생성 |
| `GET` | `/api/redteam/v2/cases/{case_id}` | Case 조회 |
| `POST` | `/api/redteam/v2/roe` | ROEPolicy 생성/갱신 |
| `POST` | `/api/redteam/v2/roe/evaluate` | target/tool/action 정책 평가 |
| `POST` | `/api/redteam/v2/reviews/{review_id}/decision` | HITL 승인/반려/수정 |
| `GET` | `/api/redteam/v2/audit` | audit 조회 |

### 5.2 Evidence

| Method | Path | 목적 |
|---|---|---|
| `POST` | `/api/redteam/v2/evidence` | EvidenceCard 생성 |
| `GET` | `/api/redteam/v2/evidence/{evidence_id}` | EvidenceCard 조회 |
| `POST` | `/api/redteam/v2/evidence/{evidence_id}/approve` | Evidence 승인 |
| `POST` | `/api/redteam/v2/evidence/{evidence_id}/redact` | redaction 처리 |
| `POST` | `/api/redteam/v2/evidence/export-pack` | 승인된 evidence pack export |

### 5.3 ToolHub/ScriptFactory

| Method | Path | 목적 |
|---|---|---|
| `POST` | `/api/redteam/v2/tools/register` | ToolProfile 등록 |
| `GET` | `/api/redteam/v2/tools` | ToolHub 조회 |
| `POST` | `/api/redteam/v2/tool-actions` | ToolActionCard 생성 |
| `POST` | `/api/redteam/v2/tool-actions/{action_id}/dry-run` | dry run |
| `POST` | `/api/redteam/v2/tool-actions/{action_id}/request-approval` | 승인 요청 |
| `POST` | `/api/redteam/v2/tool-actions/{action_id}/record-manual-run` | 사람이 실행한 결과 기록 |
| `POST` | `/api/redteam/v2/tool-actions/{action_id}/import-output` | 결과 import |
| `POST` | `/api/redteam/v2/scripts/request` | helper script 요청 |
| `POST` | `/api/redteam/v2/scripts/{script_id}/static-scan` | 정적 정책 스캔 |
| `POST` | `/api/redteam/v2/scripts/{script_id}/sandbox-test` | sandbox dry-run |
| `POST` | `/api/redteam/v2/scripts/{script_id}/approve` | 스크립트 승인 |

### 5.4 MCP

| Method | Path | 목적 |
|---|---|---|
| `GET` | `/api/redteam/v2/mcp/servers` | MCP registry 조회 |
| `GET` | `/api/redteam/v2/mcp/tools` | MCP tool 목록 |
| `POST` | `/api/redteam/v2/mcp/evaluate` | 정책 평가 |
| `POST` | `/api/redteam/v2/mcp/invoke-dry-run` | 실행 없는 평가 |
| `POST` | `/api/redteam/v2/mcp/invoke-approved` | 승인된 호출만 수행 |
| `GET` | `/api/redteam/v2/mcp/audit` | MCP audit |

### 5.5 Analysis/Report

| Method | Path | 목적 |
|---|---|---|
| `POST` | `/api/redteam/v2/rag/query` | evidence-grounded query |
| `POST` | `/api/redteam/v2/campaigns` | Campaign 생성 |
| `POST` | `/api/redteam/v2/timelines` | Detection timeline 생성 |
| `POST` | `/api/redteam/v2/findings` | Finding v2 draft |
| `POST` | `/api/redteam/v2/findings/{id}/review` | Finding 승인/반려 |
| `POST` | `/api/redteam/v2/reports/generate` | Report v2 Markdown 생성 |
| `POST` | `/api/redteam/v2/reports/validate` | unsupported claim/release gate |
| `POST` | `/api/redteam/v2/reports/export` | 최종 승인 후 export |
| `POST` | `/api/redteam/v2/remediation` | 개선 backlog 생성 |
| `POST` | `/api/redteam/v2/retests` | Purple retest plan |

## 6. 마일스톤

### M0. Evidence Session and Planning Packet

완료 기준:

- ChatShare package 생성
- Red Team Studio 전체 file manifest 생성
- `Detailed_PLAN.MD`, `FINAL_PLAN.md`, LLM wiki home 생성
- sanity test 생성 및 통과

### M1. Frontend Redteam2 Tab Clone and Isolation

작업:

- `reportStudioTabs()`에 `redteam2` 추가
- `reportStudioTabContent()`에 `redTeamAnalysis2Panel()` 추가
- 기존 `redTeamAnalysisPanel()` 구조를 복제하되 상태 키 분리
- `redteam2AnalysisDraft`, `redteam2AnalysisState`, `redteam2ScopeRuns` 추가
- 기존 `redteam` 탭 회귀 테스트

완료 기준:

- `npm run build` 통과
- Playwright screenshot에서 `레드팀 분석`과 `레드팀 분석2`가 동시에 보임
- `redteam` 탭 상태가 `redteam2` 조작으로 바뀌지 않음

### M2. Backend v2 Route Skeleton

작업:

- `/api/redteam/v2/health`
- `/api/redteam/v2/cases`
- `/api/redteam/v2/roe/evaluate`
- `/api/redteam/v2/tool-actions`
- `/api/redteam/v2/reports/validate`
- 기존 v1 router 유지

완료 기준:

- `pytest tests/test_redteam_api_router.py` 유지 통과
- 신규 `test_redteam_v2_api_router.py` 통과
- T5/tool execute는 deny-by-default

### M3. ToolHub and ToolActionCard

작업:

- ToolProfile schema
- ToolActionCard state machine
- ManualRunRecorder
- ToolRunRecord
- ToolResultNormalizer contract
- frontend card list and button policy

완료 기준:

- 버튼 직접 실행 경로 0건
- T3/T4는 approval_required
- T5는 blocked
- output import는 Evidence candidate로만 생성

### M4. ScriptFactory Guarded Helper Scripts

작업:

- ScriptManifest
- allowed script type guard
- static policy scanner
- sandbox dry-run contract
- unit test requirement

완료 기준:

- output_parser/evidence_packager/report_transformer는 network_access false
- credential/phishing/persistence/evasion/destructive/exploit script request는 blocked
- 승인 전 library 등록 불가

### M5. Evidence and Claim Matrix

작업:

- EvidenceCard approval lifecycle
- VisualEvidence observation/inference/limitation 분리
- ClaimEvidenceMatrix validator
- screenshot-only conclusion 차단

완료 기준:

- evidence 없는 Finding 승인 불가
- material claim evidence coverage 100%
- sensitive visual evidence는 review 없이는 report index에 표시 불가

### M6. Report v2 Builder

작업:

- 28개 Report v2 section renderer
- Campaign Walkthrough builder
- Tooling/MCP/LLM automation audit appendix
- ReportExportGuard

완료 기준:

- Markdown report 생성
- DOCX/PDF adapter는 stub contract 또는 실제 export 통과
- unsupported material claim 0건
- final export human approval 필수

### M7. E2E and Regression

작업:

- sample case intake -> ROE -> ToolAction -> Evidence -> Campaign -> Finding -> Report -> Retest
- frontend smoke
- backend API smoke
- security regression fixture

완료 기준:

- 전체 unit/schema/API/policy/workflow/report tests 통과
- sample E2E 통과
- CI 또는 local equivalent에서 regression 통과

## 7. 테스트 전략

### 7.1 문서/플랜 sanity

- `고도화/sanity/test_plan_contract.py`
- 필수 섹션 존재 확인
- ChatShare, LLM wiki, previous index, API, test strategy, edge cases 포함 여부 확인

### 7.2 프론트엔드

- `npm run build`
- `npm` 기반 최소 테스트 또는 Playwright smoke
- 검증 항목:
  - `레드팀 분석2` 탭 표시
  - 기존 `레드팀 분석` 탭 유지
  - 버튼 disabled/approval state 표시
  - 5177 모바일/데스크톱 screenshot에서 overlap 없음

### 7.3 백엔드

- `pytest tests/test_redteam_api_router.py`
- 신규 `pytest tests/test_redteam_v2_api_router.py`
- 검증 항목:
  - health/readiness
  - ROE evaluate
  - ToolActionCard create/evaluate
  - MCP direct invoke deny
  - ReportValidator unsupported claim deny
  - evidence 없는 finding deny

### 7.4 보안 회귀

필수 실패 fixture:

- `T5` action default deny
- direct MCP invocation deny
- shell/code exec without policy deny
- unsupported claim deny
- screenshot-only conclusion deny
- final severity without human approval deny
- report export without final approval deny

### 7.5 샘플 E2E

대상:

- loopback lab `http://127.0.0.1:30001/#/` 또는 fixture-only sample case

절차:

```text
Create Case
 -> Load ROE
 -> Scope Evaluate
 -> Create ToolActionCard
 -> Dry-run or ManualRunRecord
 -> Import Output
 -> Build EvidenceCard
 -> Link Campaign/Finding
 -> Validate ClaimEvidenceMatrix
 -> Generate Report v2
 -> Evaluate Release Gate
 -> Build Purple Retest Plan
```

## 8. 예외 케이스

| 케이스 | 기대 동작 |
|---|---|
| `5177` frontend down | plan/sanity는 진행, live screenshot은 blocked로 기록 |
| `8765` backend down | API smoke는 skipped/blocked, 서버 기동 후 재검증 |
| ChatShare extraction mojibake console | 저장된 UTF-8 파일 기준으로 재검증 |
| ChatShare hidden/login gated artifact | `visible_but_login_gated` 또는 `provider_hidden_placeholder`로 기록, recovered로 과장 금지 |
| Red Team Studio manifest에 venv/pyc 대량 포함 | LLM wiki에서는 존재 기록, 핵심 분석에서는 generated/dependency로 분류 |
| 기존 `redteam` 탭과 `redteam2` 탭 상태 충돌 | state namespace 분리 테스트 실패 처리 |
| 사용자가 private/reserved target 입력 | 자동 실행 차단, scope analysis만 기록 |
| loopback lab 입력 | 명시적 `allow_loopback_lab`일 때만 safe probe 허용 |
| T3/T4 action 승인 없음 | button disabled, approval_required 표시 |
| T5 action | blocked, 실행 경로 없음 |
| scanner version evidence의 operator 증명 누락 | `invalid`, artifact 저장 없음, API 명령 실행 없음 |
| 미등록 scanner tool evidence 등록 | `tool_profile_not_registered`, API 명령 실행 없음 |
| raw tool output prompt injection | output sanitizer 후 data envelope로만 LLM에 전달 |
| DB query without template | deny |
| material claim without approved evidence | report validation blocker |
| sensitive image without redaction review | report inclusion blocker |
| final severity/risk acceptance/report export 승인 없음 | HITL blocker |

## 9. 개발 원칙

1. 기존 작업물은 참고하되 그대로 확장하지 않는다.
2. 기존 `/api/redteam`과 `레드팀 분석` 탭은 회귀 안정성 기준으로 둔다.
3. 새 개편은 `redteam2`와 `/api/redteam/v2` namespace에서 시작한다.
4. 모든 스펙 업데이트는 `고도화/spec-updates`에 addendum으로 남긴다.
5. 모든 테스트와 주요 판단은 `고도화/llm-wiki`와 knowledge workflow에 근거를 남긴다.
6. GitHub push는 작업 단위 검증 후 scoped commit으로 진행한다.

## 10. 최종 완료 조건

1. `레드팀 분석2`가 Report Studio에 표시되고 기존 탭과 독립적으로 동작한다.
2. v2 backend API가 health, ROE, ToolAction, Evidence, Report validation을 제공한다.
3. 전체 folder manifest와 ChatShare package가 LLM wiki에서 호출 가능하다.
4. sample E2E가 report generation과 release gate까지 통과한다.
5. unsupported material claim 0건.
6. approved finding without evidence 0건.
7. unapproved high-risk tool execution 0건.
8. direct agent-to-MCP invocation 0건.
9. T5 action default deny 유지.
10. Nuclei/OpenVAS/Trivy/SCA/npm audit/OWASP ZAP version evidence capture가 operator-attested artifact로 남고 API 명령 실행 0건을 유지한다.
11. unit/schema/API/frontend/build/security/report regression 통과.

## 11. Slice 56 반영 사항

- `/api/redteam/v2/tool-install-readiness/{tool_id}/version-evidence`는 운영자가 별도 승인 환경에서 실행한 version command 결과를 증거로 기록한다.
- `/api/redteam/v2/tool-install-version-evidence`는 case/tool별 scanner install evidence registry를 반환한다.
- 이 기능은 scanner를 설치하거나 실행하지 않는다. `commands_executed_by_api=false`, `trusted_as_instruction=false`, `requires_human_validation=true`가 contract다.
- 실제 scanner binary/container runtime smoke 성공 증거는 별도 최종 게이트 항목으로 남긴다.

## 12. Slice 57 반영 사항

- `/api/redteam/v2/toolchains/execute-governed`는 여러 분석도구를 하나의 요청으로 순차 계획/실행/기록한다.
- 각 도구 단계는 기존 단일 실행과 동일하게 ToolActionCard, ExecutionPlan, execution token, wrapper pin, runner allowlist를 통과해야 한다.
- 실제 실행은 설치된 로컬 명령을 `shell=false` subprocess로 호출하며 stdout/stderr는 `runner-output` artifact로 회수한다.
- RedTeam2 화면에는 초급자용 한국어 `여러 분석도구 순차 실행` 영역을 추가하고, 분석도구 ID 목록과 명령 목록을 입력해 복합 실행 API를 호출한다.
- 복합 실행 결과는 `toolchain-runs`에 저장되고, 도구 출력은 계속 LLM 명령이 아니라 untrusted data로만 취급한다.
- 실제 설치 도구 또는 Docker/container가 없는 환경에서는 테스트가 mock runner로 계약을 검증하며, real runtime smoke 성공 증거는 별도 최종 게이트로 유지한다.

## 13. Slice 58 반영 사항

- `고도화/sanity/redteam_ax_installed_tool_live_smoke.py`는 현재 호스트에 설치된 `npm.cmd`를 발견한 뒤 `npm.cmd --version`을 실제 로컬 프로세스로 실행한다.
- live smoke는 ToolActionCard, ExecutionPlan, execution token, wrapper manifest hash, wrapper pin approval, child process allowlist, `shell=false` 실행을 모두 통과해야 성공한다.
- 실행 stdout은 `runner-output` artifact로 저장되고 sanitizer preview, agent normalization, Evidence Card 생성까지 같은 케이스에서 이어진다.
- smoke 결과 요약은 `archive/runs/redteam-ax-v2-installed-tool-live-smoke/latest_installed_tool_live_smoke.json`에 저장한다.
- `RunnerExecuted` 및 `ContainerLaunchPrepared` 상태는 저장 artifact 기반 sanitizer/normalizer/evidence 생성의 입력 상태로 허용한다.
- 이번 증거는 설치된 npm CLI의 governed runner readiness를 입증하지만 Nuclei/OpenVAS/Trivy/OWASP ZAP 및 Docker/container live smoke는 후속 게이트로 유지한다.

## 14. Slice 59 반영 사항

- OpenVAS/ZAP API credential은 RedTeam AX 내부에 secret 값으로 저장하지 않고 외부 vault reference만 승인한다.
- `/api/redteam/v2/tool-credential-policies`는 도구별 allowed read-only scope, prohibited scope, secret material policy, approval role을 반환한다.
- `/api/redteam/v2/tool-credential-authorizations/{tool_id}`는 external vault reference, endpoint reference, read-only scope, 목적, ROE scope ref를 actor-bound 승인으로 기록한다.
- API key, password, bearer token, cookie, client secret, private key, `secret_value`가 payload에 들어오면 artifact 저장 없이 invalid로 반환한다.
- OpenVAS/ZAP authorization은 `commands_executed_by_api=false`, `secret_material_stored=false`, `trusted_as_instruction=false`, `runner_unlocks=[]`를 유지한다.
- RedTeam2 화면에는 한국어 `OpenVAS/ZAP 읽기 전용 접속권한` 패널을 추가하고 secret 값 입력란 없이 vault reference만 입력하게 한다.
- 이 slice는 credential vault contract를 닫지만 실제 OpenVAS/ZAP live API 호출이나 active scan 실행 증거는 만들지 않는다.

## 15. Slice 60 반영 사항

- `고도화/sanity/redteam_ax_accepted_gate_manifest.py`는 RedTeam AX의 현재 accepted gate set을 코드로 열거하고 실제 실행한다.
- accepted gate set은 v2 API regression, sample E2E/report gate, completion audit sanity, plan contract sanity, Korean copy inventory, installed-tool live smoke, scanner CLI live smoke, Python compile, frontend JS syntax check, frontend production build로 구성한다.
- 각 gate 결과는 command argv, cwd, timeout, exit code, stdout/stderr excerpt, 시작/종료 시각, duration을 포함해 `archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`에 저장한다.
- manifest는 sample E2E가 unsupported claim, 승인 없는 high-risk execution, evidence-less Finding 0건을 검증하는 gate임을 명시한다.
- 이 slice는 전체 테스트/보안 게이트/보고서 검증/회귀 검증 증거 공백을 닫지만, scanner/container live runtime smoke는 별도 완료 조건으로 유지한다.

## 16. Slice 61 반영 사항

- `고도화/sanity/redteam_ax_scanner_cli_live_smoke.py`는 Nuclei와 Trivy를 공식 GitHub release 자산으로 repo-local portable 설치한다.
- Nuclei v3.10.0과 Trivy v0.72.0 archive는 각 release checksum 파일의 SHA-256 값과 비교해 검증한다.
- 설치 위치는 `tools/redteam-ax/bin`이며 smoke 프로세스의 PATH 앞에 붙여 `/api/redteam/v2/tool-wrapper-manifests`가 실제 portable binary를 해석하게 한다.
- 각 도구는 host version probe 후 wrapper pin request와 red_team_lead approval을 거쳐 `dry_run` execution plan, issued token, child-process allowlist, `shell=false` governed runner로 실행된다.
- runner output은 sanitizer preview, agent normalization, Evidence Card 생성까지 같은 case archive에 연결한다.
- 최신 smoke artifact는 `archive/runs/redteam-ax-v2-scanner-cli-live-smoke/latest_scanner_cli_live_smoke.json`이며 Nuclei/Trivy passed, OpenVAS/ZAP/Docker blocked 사유를 함께 기록한다.
- Docker container smoke는 `--require-real` 실행 시 Docker Desktop daemon unavailable blocker artifact를 남겼다.
- 이 slice는 Nuclei/Trivy 실제 CLI runtime readiness를 입증하지만 OpenVAS/ZAP service/CLI와 Docker/container runtime readiness는 아직 완료 조건으로 남긴다.

## 17. Slice 62 반영 사항

- `고도화/sanity/redteam_ax_openvas_zap_cli_live_smoke.py`는 OpenVAS/ZAP CLI wrapper를 main venv와 분리된 `tools/redteam-ax/venvs/openvas-zap-cli` 격리 venv에 설치한다.
- OpenVAS 경로는 `gvm-tools==26.0.6`의 `gvm-cli`, ZAP 경로는 `zapcli==0.10.0`과 `python-owasp-zap-v2.4==0.0.14`의 `zap-cli`를 사용한다.
- `tools/redteam-ax/bin/gvm-cli.cmd`와 `zap-cli.cmd` shim을 만들어 v2 wrapper manifest가 hash-pinned wrapper로 인식하게 한다.
- Windows `.cmd` shim은 `availability.path`와 대소문자 차이 때문에 기존 child-process allowlist에서 차단될 수 있어, backend runner allowlist가 `resolved_path`뿐 아니라 `path`도 보고 대소문자 무시 비교를 하도록 보강했다.
- OpenVAS는 `gvm-cli --version`, ZAP는 `zap-cli --help`를 low-risk metadata command로 실행한다.
- 두 CLI 모두 ToolActionCard, `dry_run` ExecutionPlan, issued token, wrapper pin, child-process allowlist, `shell=false` governed runner, sanitizer preview, agent normalization, Evidence Card 생성까지 통과했다.
- 최신 smoke artifact는 `archive/runs/redteam-ax-v2-openvas-zap-cli-live-smoke/latest_openvas_zap_cli_live_smoke.json`이다.
- 이 slice는 OpenVAS/ZAP CLI wrapper runtime readiness를 입증하지만, 실제 OpenVAS service report import와 ZAP daemon passive-alert import endpoint는 별도 완료 조건으로 남긴다.

## 18. Slice 63 반영 사항

- `/api/redteam/v2/scanner-service-imports/{tool_id}`는 OpenVAS/ZAP read-only service report import adapter다.
- 지원 도구는 `TOOL-OPENVAS-001`, `TOOL-ZAP-001`로 제한한다.
- import 요청은 승인된 `ToolCredentialAuthorization`의 `authorization_id`, external vault reference, endpoint reference, read-only token scope, target scope ref를 요구한다.
- RedTeam AX는 secret 값을 저장하거나 scanner service로 전달하지 않는다. payload 또는 endpoint URL에 credential/secret material이 포함되면 invalid로 차단한다.
- active scan, attack mode, spider, scan start/delete 등 mutating service operation flag는 모두 차단한다.
- service fetch는 HTTP GET read-only report retrieval만 수행하며 scanner command 실행으로 계산하지 않는다.
- 가져온 OpenVAS XML/ZAP JSON은 case workspace의 `service-report-imports` 아래 raw artifact로 저장하고 `trusted_as_instruction=false`, `requires_human_validation=true`를 유지한다.
- raw artifact는 기존 sanitizer, tool-specific parser, analysis agent normalization, Evidence Card 생성 경로를 통과한다.
- `고도화/sanity/redteam_ax_openvas_zap_service_import_smoke.py`는 로컬 임시 HTTP endpoint로 OpenVAS XML과 ZAP JSON을 제공해 adapter 계약을 검증한다.
- negative control은 secret material 제출이 `invalid`로 거부되는지 검증한다.
- accepted gate manifest에 `GATE-OPENVAS-ZAP-SERVICE-IMPORT-SMOKE`를 추가한다.
- 이 slice는 service import adapter와 endpoint report ingestion 경로를 입증하지만, 조직/실서비스 OpenVAS/ZAP endpoint 실측 증거는 별도 완료 조건으로 남긴다.

## 19. Slice 64 반영 사항

- RedTeam2 화면에 `OpenVAS/ZAP 서비스 결과 가져오기` 패널을 추가한다.
- 이 패널은 새 `/api/redteam/v2/scanner-service-imports/{tool_id}` read-only adapter를 직접 호출하는 UI 경로다.
- 입력값은 서비스 도구, 승인 기록 ID, 읽기 전용 endpoint URL, timeout으로 제한한다.
- API key, 비밀번호, bearer token, secret 값 입력란은 만들지 않으며 frontend 계약 테스트도 service import method segment에 secret material payload term이 없는지 확인한다.
- visible copy는 초급자에게 `능동 스캔은 실행하지 않습니다`, `secret 값은 입력하지 않고`, `읽기 전용 서비스 결과`를 명확히 설명한다.
- 결과 표는 가져오기 상태, 도구, 승인 ID, endpoint, active scan 실행 여부, secret 저장 여부, LLM 명령 신뢰 여부, Evidence 후보, parser 구조화 항목을 보여준다.
- `고도화/sanity/redteam_ax_frontend_service_import_contract.py`는 API 경로, payload 제한, 결과 표시 anchor를 검사한다.
- `고도화/sanity/test_redteam2_korean_copy_inventory.py`는 서비스 결과 가져오기 한국어 앵커를 추가로 검사한다.
- accepted gate manifest에는 `GATE-FRONTEND-SERVICE-IMPORT-CONTRACT`를 추가해 UI/API 연결 회귀를 고정한다.
- 이 slice는 로컬 서비스 import backend smoke와 frontend 호출 경로를 연결하지만, 조직/실서비스 OpenVAS/ZAP endpoint 실측과 Docker daemon 기반 container runtime smoke는 여전히 환경 의존 완료 조건으로 남긴다.

## 20. Slice 65 반영 사항

- `고도화/sanity/redteam_ax_external_scanner_service_readiness.py`는 조직/실서비스 OpenVAS/ZAP read-only endpoint 준비도를 machine-readable artifact로 남긴다.
- 기본 실행은 네트워크를 호출하지 않는다. endpoint/vault reference 설정 여부, URL 안전성, secret query 금지, credential-in-URL 금지, mutating path term 금지를 검사한다.
- `REDTEAM_AX_EXTERNAL_SCANNER_READINESS_ALLOW_NETWORK=1` 또는 `--allow-network`가 있을 때만 승인된 read-only GET probe를 수행한다.
- 준비에 필요한 환경 변수는 `REDTEAM_AX_OPENVAS_READONLY_REPORT_ENDPOINT`, `REDTEAM_AX_ZAP_READONLY_ALERT_ENDPOINT`, `REDTEAM_AX_OPENVAS_VAULT_REF`, `REDTEAM_AX_ZAP_VAULT_REF`이다.
- vault env는 secret 값이 아니라 외부 vault reference여야 하며, readiness artifact도 `secret_material_stored=false`, `active_scan_executed=false`, `trusted_as_instruction=false`를 유지한다.
- accepted gate manifest에는 `GATE-EXTERNAL-SCANNER-READINESS`를 추가한다. 이 gate는 현재 환경의 not_configured/blocker 상태를 보존하지만 full goal 완료 증거로 쓰지 않는다.
- Docker daemon은 재확인 결과 `Server:null` 및 `Docker Desktop is unable to start` 상태였고, `redteam_ax_container_runtime_smoke.py --allow-real --require-real`은 `blocked_container_runtime_not_ready` artifact를 갱신했다.
- 이 slice는 남은 완료 조건을 더 명확하게 검증 가능한 readiness lane으로 만든 것이며, 실제 조직 endpoint와 Docker daemon 준비 후 실측 smoke가 여전히 필요하다.

## 21. Slice 66 반영 사항

- `/api/redteam/v2/runtime-readiness`는 최신 container runtime smoke artifact와 external scanner readiness artifact를 read-only로 합쳐 반환한다.
- API는 readiness JSON을 읽기만 하며 Docker, OpenVAS, ZAP, scanner command를 실행하지 않는다.
- 응답 contract는 `commands_executed_by_api=false`, `active_scan_executed=false`, `trusted_as_instruction=false`, `safe_by_default=true`다.
- 응답에는 container runtime 상태, external scanner service 상태, blocker 목록, operator next steps가 포함된다.
- RedTeam2 화면은 `상태 새로고침` 시 runtime readiness API를 같이 호출하고 `실행 환경 준비도 / 남은 실측 조건` 패널에 표시한다.
- 패널은 Docker Desktop daemon, container smoke, OpenVAS endpoint, ZAP endpoint, network probe, 외부 vault reference의 현재 상태와 남은 조건을 보여준다.
- `고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py`는 runtime readiness API 호출, Korean visible copy, read-only safety flags를 검사한다.
- accepted gate manifest에는 `GATE-FRONTEND-RUNTIME-READINESS-CONTRACT`가 추가된다.
- 이 slice는 실행 버튼이 막히는 이유를 사용자에게 노출하는 visibility 개선이며, Docker daemon ready 상태와 조직 OpenVAS/ZAP endpoint 실측 성공을 완료로 주장하지 않는다.

## 22. Slice 67 반영 사항

- `고도화/sanity/redteam_ax_external_scanner_service_import_live_smoke.py`는 조직/실서비스 OpenVAS/ZAP read-only endpoint에서 실제 report import를 수행하기 위한 live harness다.
- 기본 실행은 네트워크를 호출하지 않고 `blocked_external_scanner_import_not_ready` 또는 `configured_network_import_not_requested` artifact를 남긴다.
- `--allow-network` 또는 `REDTEAM_AX_EXTERNAL_SCANNER_IMPORT_ALLOW_NETWORK=1`가 있을 때만 backend scanner-service-import adapter를 통해 endpoint를 읽는다.
- `--require-ready`는 OpenVAS와 ZAP 양쪽 import가 모두 `passed`가 아니면 non-zero로 종료해 운영 검증 단계에서 fail-fast 한다.
- harness는 endpoint URL에 credential, secret query, mutating path term이 있으면 import 전에 차단한다.
- 실제 import 경로는 v2 credential authorization API와 scanner service import API를 모두 통과하므로 external vault reference, read-only scope, ROE target ref, secret material negative control을 검증한다.
- `/api/redteam/v2/runtime-readiness`는 새 `external_scanner_service_import_live` artifact도 함께 반환한다.
- RedTeam2 runtime readiness panel은 `실서비스 가져오기` 상태를 표시해 조직 endpoint import가 아직 실행되지 않았는지, 실제 read-only import가 수행됐는지 구분한다.
- accepted gate manifest에는 `GATE-EXTERNAL-SCANNER-SERVICE-IMPORT-LIVE`가 추가된다.
- 이 slice는 조직 endpoint 실측을 수행할 수 있는 검증 경로를 닫지만, 현재 환경에 endpoint/vault env가 없으면 blocker artifact가 정직한 최신 상태다.

## 23. Slice 68 반영 사항

- `고도화/sanity/redteam_ax_wsl_runtime_readiness.py`는 Docker Desktop daemon이 막힌 환경에서 WSL 대체/보조 실행 환경의 준비도를 증거화하는 read-only readiness lane이다.
- 기본 실행은 WSL 목록만 확인하고, `--allow-start`가 있을 때만 선택된 배포판에서 `uname` 및 `node`, `npm`, `trivy`, `nuclei`, `docker`, `podman` 경로를 확인한다.
- 이 sanity는 능동 스캔, 외부 네트워크 호출, scanner 실행을 수행하지 않으며 `active_scan_executed=false`, `trusted_as_instruction=false`를 artifact에 남긴다.
- 현재 환경에서는 `Ubuntu-22.04` 배포판 시작이 실패해 `blocked_wsl_distribution_start_failed` artifact가 생성된다.
- `/api/redteam/v2/runtime-readiness`는 `wsl_runtime` artifact를 함께 반환하고, RedTeam2 runtime readiness panel은 `WSL 실행 환경`과 `WSL 배포판` 상태를 표시한다.
- accepted gate manifest에는 `GATE-WSL-RUNTIME-READINESS`가 추가된다.
- 이 slice는 WSL 실측 성공을 완료로 주장하지 않고, Docker daemon/WSL 배포판/조직 OpenVAS/ZAP endpoint blocker를 더 명확히 드러내는 visibility 및 evidence 개선이다.

## 24. Slice 69 반영 사항

- `고도화/sanity/redteam_ax_strict_live_readiness_promotion.py`는 최종 실측 승격 직전에 필요한 Docker real container smoke, WSL runtime ready, external scanner readiness, external scanner service import live gate를 하나로 묶는다.
- 기본 실행은 safe-by-default다. 실제 컨테이너 실행은 `--allow-container`, 외부 endpoint 호출은 `--allow-network`, non-zero 승격 강제는 `--require-promotion`이 있을 때만 수행한다.
- 현재 환경에서는 Docker daemon, WSL distro start, OpenVAS/ZAP endpoint/vault 설정이 모두 준비되지 않았으므로 `blocked_strict_live_readiness_promotion` artifact가 생성된다.
- `/api/redteam/v2/runtime-readiness`는 `strict_live_readiness_promotion` artifact를 함께 반환하고, RedTeam2 panel은 `실측 승격 게이트`와 `승격 gate 결과`를 표시한다.
- accepted gate manifest에는 `GATE-STRICT-LIVE-READINESS-PROMOTION`이 추가된다.
- 전체 goal 완료 증거는 이 promotion gate가 통제 환경에서 `--allow-container --allow-network --require-promotion`으로 통과한 artifact가 붙을 때까지 여전히 부족하다.

## 25. Slice 70 반영 사항

- `고도화/sanity/redteam_ax_live_readiness_remediation_runbook.py`는 strict promotion blocker를 운영자 조치 단계로 변환한다.
- 생성 산출물은 JSON과 Markdown 두 가지이며, 각 단계는 owner, blocker, 사람이 할 일, 검증 명령, 필요한 evidence, safety note를 포함한다.
- 현재 runbook은 Docker daemon, WSL distro mount/start, OpenVAS/ZAP endpoint, OpenVAS/ZAP vault reference, 최종 promotion gate를 순서대로 다룬다.
- `/api/redteam/v2/runtime-readiness`는 `live_readiness_remediation` artifact를 함께 반환하고, RedTeam2 panel은 `조치 runbook`과 `남은 조치 단계`를 표시한다.
- accepted gate manifest에는 `GATE-LIVE-READINESS-REMEDIATION-RUNBOOK`이 추가된다.
- 이 slice는 blocker 해소를 자동 수행하지 않는다. 사람이 ROE/HITL 범위에서 수행할 수 있도록 검증 명령과 evidence 요구사항을 명시하는 운영 runbook slice다.

## 26. Slice 71 반영 사항

- RedTeam2 runtime readiness panel은 이제 `운영자 조치 runbook 단계` 표를 표시한다.
- 표는 `live_readiness_remediation.steps`에서 step title, status, owner, blocker, verification command를 가져와 초급 운영자가 다음 행동과 필요한 증거를 한 화면에서 확인하게 한다.
- runbook artifact가 아직 로드되지 않은 경우에도 Docker Desktop daemon 준비, WSL 배포판 mount/start 복구, OpenVAS/ZAP read-only endpoint와 vault reference 설정, read-only report import, strict promotion 기본 순서를 fallback으로 보여준다.
- `platform_operator` role label을 `플랫폼 운영자`로 번역해 runbook owner가 영어 코드값으로만 보이지 않게 한다.
- `고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py`는 runbook 단계 표, 사람 수행 안내, 상태 조회 API가 명령을 실행하지 않는다는 문구를 검사한다.
- `고도화/sanity/test_redteam2_korean_copy_inventory.py`는 runbook 단계 visibility anchor를 추가로 검사한다.
- 이 slice는 UI visibility를 강화하지만 Docker/WSL/OpenVAS/ZAP readiness blocker를 해결했다고 주장하지 않는다.

## 27. Slice 72 반영 사항

- `고도화/sanity/redteam_ax_operator_evidence_collection_package.py`는 live readiness remediation runbook을 운영자 증거 제출 목록으로 변환한다.
- 산출물은 `latest_operator_evidence_collection_package.json`과 `.md`이며, 각 항목은 owner, blocker, action, verification command, required evidence, expected attachment status를 포함한다.
- 패키지는 명령을 실행하지 않고 secret 값을 수집하지 않으며, 첨부 artifact는 Evidence Card 후보로 등록한 뒤 사람이 승인하는 흐름을 전제로 한다.
- `/api/redteam/v2/runtime-readiness`는 `operator_evidence_collection` artifact를 read-only projection으로 반환하고, blocker 목록에 남은 collection item 수를 포함한다.
- RedTeam2 runtime readiness panel은 `증거 수집 패키지`, `수집할 증거 항목`, `운영자 증거 수집 패키지` 표를 표시한다.
- accepted gate manifest에는 `GATE-OPERATOR-EVIDENCE-COLLECTION-PACKAGE`가 추가된다.
- 이 slice는 남은 실측 blocker를 더 쉽게 수집/검토 가능한 evidence package로 만든 것이며, Docker/WSL/OpenVAS/ZAP readiness 성공을 완료로 주장하지 않는다.

## 28. Slice 73 반영 사항

- `고도화/sanity/redteam_ax_operator_evidence_submission_validator.py`는 operator evidence collection package의 제출 manifest를 검증한다.
- 검증 항목은 artifact path 존재, 제출 sha256과 실제 sha256 일치, artifact JSON status와 expected status 일치, `review_status=approved` 여부다.
- 기본 실행은 제출 manifest 없이 `awaiting_operator_evidence_submission` artifact를 생성하고 Docker, WSL, scanner, network 명령을 실행하지 않는다.
- 운영 검증에서는 `--submission-manifest <path> --require-approved`로 모든 OEC 항목이 승인된 증거와 일치하지 않으면 non-zero로 종료한다.
- `/api/redteam/v2/runtime-readiness`는 `operator_evidence_submission` artifact를 함께 반환하고 blocker 목록에 남은 제출 검증 item 수를 포함한다.
- RedTeam2 runtime readiness panel은 `증거 제출 검증`, `승인된 제출 증거`, `운영자 제출 증거 검증` 표를 표시한다.
- accepted gate manifest에는 `GATE-OPERATOR-EVIDENCE-SUBMISSION-VALIDATION`이 추가된다.
- 이 slice는 운영자가 가져온 증거를 검증 가능한 manifest로 닫는 경로이며, 실제 Docker/WSL/OpenVAS/ZAP 증거 제출 자체는 아직 남은 조건이다.

## 29. Slice 74 반영 사항

- `고도화/sanity/redteam_ax_operator_evidence_card_import_plan.py`는 operator evidence submission validation 결과를 Evidence Card 후보 payload로 변환한다.
- 승인되고 hash/status 검증이 끝난 submission item만 후보가 되며, 현재 기본 artifact는 승인된 제출 증거가 없어 `awaiting_approved_operator_evidence` 상태다.
- 이 script는 Evidence Card를 자동 생성하지 않는다. 후보 payload는 `POST /api/redteam/v2/evidence`에 전달하기 전 사람 검토를 요구한다.
- 후보 payload는 `source_path_or_url`, summary, `validation_status=verified`, `approval_status=pending_review`, source item/hash/status, Claim-Evidence Matrix hint를 포함한다.
- `/api/redteam/v2/runtime-readiness`는 `operator_evidence_card_import_plan` artifact를 함께 반환하고 blocker 목록에 남은 import item 수를 포함한다.
- RedTeam2 runtime readiness panel은 `Evidence Card 후보 계획`, `Evidence Card 후보 수`, `Evidence Card 후보 import 계획` 표를 표시한다.
- accepted gate manifest에는 `GATE-OPERATOR-EVIDENCE-CARD-IMPORT-PLAN`이 추가된다.
- 이 slice는 운영자 증거를 Evidence Card/Claim-Evidence Matrix 흐름으로 잇는 planning lane이며, 실제 Evidence Card 생성/승인은 후속 운영 단계로 남긴다.

## 30. Slice 75 반영 사항

- `고도화/sanity/redteam_ax_tool_result_analysis_brief.py`는 npm audit, Nuclei, Trivy, OpenVAS, OWASP ZAP 관련 최신 governed artifact를 읽어 복합 분석 브리프를 만든다.
- 브리프는 실행된 도구 결과 중 run/result/evidence ID가 있는 항목만 `evidence_pack`으로 묶고, 준비되지 않은 Docker/OpenVAS/ZAP 조건은 `blocked_items`로 따로 보관한다.
- `sca_report`는 Agentic RAG의 충분성 판단 패턴을 따라 현재 근거로 보고서 주장 후보를 만들 수 있는지 보수적으로 표시한다.
- `tool_agents`는 도구별 LLM analyst에게 허용된 보조 행동과 금지 행동을 명시한다. LLM은 도구 재실행, 능동 스캔, Finding 확정을 수행할 수 없다.
- `/api/redteam/v2/runtime-readiness`는 `tool_result_analysis_brief` artifact를 함께 반환하고, RedTeam2 panel은 도구 결과 브리프와 분석 가능한 Evidence 수를 표시한다.
- accepted gate manifest에는 `GATE-TOOL-RESULT-ANALYSIS-BRIEF`가 추가된다.
- 이 slice는 여러 도구 결과를 Evidence/Claim 후보로 해석하는 분석 lane이며, 실제 취약점 Finding 확정과 보고서 claim 승인은 후속 HITL 단계로 남긴다.

## 31. Slice 76 반영 사항

- `고도화/sanity/redteam_ax_tool_result_finding_claim_review.py`는 tool result analysis brief의 Evidence pack을 Finding 초안 payload와 Claim-Evidence Matrix 후보로 변환한다.
- Evidence Card가 승인되지 않은 후보는 `hold_until_evidence_approved` 및 `hold_unsupported_claim` 상태로 남기며 보고서 claim에 자동 삽입하지 않는다.
- 산출물은 `latest_tool_result_finding_claim_review.json`과 `.md`이며, 후보별 Finding ID, Claim ID, Evidence ID, 사람 검토 행동, 수행하지 않은 작업 목록을 포함한다.
- `/api/redteam/v2/runtime-readiness`는 `tool_result_finding_claim_review` artifact를 함께 반환하고 blocker 목록에 held candidate 수를 포함한다.
- RedTeam2 runtime readiness panel은 `Finding/Claim 검토 패키지`와 `보류된 Finding/Claim 후보`를 한국어로 표시한다.
- accepted gate manifest에는 `GATE-TOOL-RESULT-FINDING-CLAIM-REVIEW`가 추가된다.
- 이 slice는 Evidence/Claim/Finding 승격 전 검토 lane이며, 실제 Finding 생성·severity 승인·보고서 claim 사용은 후속 HITL 단계로 남긴다.

## 32. Slice 77 반영 사항

- `/api/redteam/v2/tool-result-finding-claim-review`는 최신 Finding/Claim 검토 패키지를 read-only로 반환한다.
- `/api/redteam/v2/tool-result-finding-claim-review/{candidate_id}/promote-finding`는 선택한 후보를 기존 Finding 생성 정책에 연결한다.
- Evidence Card가 승인되지 않았거나 backend Evidence store에서 검증되지 않은 후보는 `blocked`로 반환하며 `finding_created=false`, `report_claim_inserted=false`, `commands_executed_by_api=false`를 유지한다.
- 같은 Evidence ID가 backend Evidence store에서 승인되어 있으면 promotion API는 기존 `/api/redteam/v2/findings` 생성 함수를 호출해 `pending_review` Finding 초안을 만든다.
- 생성된 Finding은 여전히 severity 2인 승인이 필요하며, Claim-Evidence Matrix와 보고서 Claim 삽입은 별도 검증 전까지 금지된다.
- RedTeam2 runtime readiness panel은 `Finding 초안 생성 API`와 promote-finding 조건을 표시해 초급 운영자가 다음 버튼이 왜 막혔는지 알 수 있게 한다.
- 이 slice는 후보와 Finding API 사이의 안전한 연결이며, 실제 운영 후보 전체 승격과 최종 보고서 통과는 후속 HITL 작업으로 남긴다.

## 33. Slice 78 반영 사항

- `/api/redteam/v2/tool-result-finding-claim-review/matrix-draft`는 Finding/Claim review 후보를 Claim-Evidence Matrix 초안 row로 변환한다.
- row는 Evidence Card 승인, backend Finding 존재, Finding severity 2인 승인, supported claim 조건을 모두 만족할 때만 `ready_for_report_validation`이 된다.
- 보류 row는 `hold_until_evidence_and_finding_approved`로 남기고 `held_claims`에 blocker를 기록한다.
- `report_validation_payload_preview`에는 ready row의 claims/findings만 들어가므로 승인되지 않은 후보가 report gate 입력으로 섞이지 않는다.
- ready row가 존재하면 기존 `validate_report`를 호출해 report gate preview를 만들고, ready row가 없으면 `not_run_no_ready_rows`로 검증을 실행하지 않는다.
- API는 초안 artifact를 남기지만 Finding 생성, Claim 자동 삽입, 도구 실행, 능동 스캔을 하지 않는다.
- RedTeam2 runtime readiness panel은 `Claim-Evidence Matrix 초안 API`와 “승인된 Evidence와 2인 severity 승인된 Finding만 보고서 검증 payload에 포함” 조건을 한국어로 표시한다.
- 이 slice는 최종 보고서 직전의 안전한 staging lane이며, 실제 운영 후보 전체의 승인·검증·보고서 반영은 후속 HITL 작업으로 남긴다.
