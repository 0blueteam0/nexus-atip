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

## 34. Slice 79 반영 사항

- `/api/redteam/v2/tool-result-finding-claim-review/matrix-draft/report-draft`는 Matrix draft를 기반으로 Korean Red Team Report v2 draft 생성을 시도한다.
- API는 내부에서 Matrix draft를 먼저 만들고, ready row가 없거나 held row가 있으면 Report v2 draft 생성을 차단한다.
- Matrix draft의 `validation_preview.gate_status`가 `pass`인 경우에만 기존 `generate_report`를 호출한다.
- 생성된 report는 기존 Report v2 renderer와 gate를 사용하므로 문서 통제, Campaign Walkthrough, Evidence Card Index, Claim-Evidence Matrix, Findings, 재시험 계획 구조를 그대로 따른다.
- API는 export 승인을 수행하지 않으며, `commands_executed_by_api=false`, `active_scan_executed=false`, `requires_human_validation=true`를 유지한다.
- RedTeam2 runtime readiness panel은 `Matrix 기반 Report v2 draft API`와 `held row 0건과 report gate pass일 때만 한국어 Report v2 draft 생성` 조건을 표시한다.
- 이 slice는 approved Matrix row에서 report draft까지 잇는 controlled lane이며, 실제 운영 후보 전체 ready와 final export approval은 후속 작업으로 남긴다.

## 35. Slice 80 반영 사항

- `/api/redteam/v2/toolchains/{toolchain_id}/collect-results`는 기존 governed toolchain run을 읽어 복합 실행 결과를 한 번에 회수한다.
- API는 새 도구 명령을 실행하지 않고 저장된 stdout/stderr artifact만 읽는다. 각 artifact는 Sanitizer를 먼저 통과하고 raw output은 LLM 명령이 아니라 untrusted data로만 취급한다.
- Sanitizer가 quarantine하지 않은 step은 기존 도구별 analysis agent normalizer를 호출해 normalized result를 만들고, 유효한 normalized result에 대해서만 Evidence Card 후보를 생성한다.
- 생성된 Evidence Card는 `candidate` 상태이며 승인 전에는 Finding이나 보고서 Claim으로 확정하지 않는다.
- RedTeam2 UI는 `여러 분석도구 실행` 뒤 `결과 회수·Evidence 후보` 버튼을 제공하고, 회수 단계별 Sanitizer/normalizer/Evidence 후보 상태를 한국어 표로 표시한다.
- API regression test는 npm audit + Trivy mock runner 결과를 회수해 2개 normalized result와 2개 Evidence 후보가 생성되는 경로를 검증한다.
- 이 slice는 여러 도구를 복합적으로 사용한 뒤 결과를 회수·증거화하는 operational lane을 강화하지만, 실제 운영 Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 전체 결과 승인과 Matrix/report 반영은 후속 HITL 작업으로 남긴다.

## 36. Slice 81 반영 사항

- `/api/redteam/v2/toolchain-result-collections/{collection_id}/approve-evidence`는 collection artifact가 만든 Evidence 후보를 batch로 승인한다.
- API는 기존 `approve_evidence_card` 정책을 재사용하므로 actor header, reviewer, reviewer role identity binding을 동일하게 검증한다.
- collection에 포함되지 않은 Evidence ID는 `evidence_candidate_not_in_collection`으로 차단한다.
- 승인 batch artifact는 `toolchain-evidence-approvals`에 저장되고, collection artifact에는 `evidence_approval_status`, `approved_evidence_ids`를 기록한다.
- API는 Evidence 후보 승인만 수행한다. Finding 생성, severity 승인, Claim-Evidence Matrix ready 전환, 보고서 Claim 삽입은 후속 HITL 단계로 유지한다.
- RedTeam2 UI는 `Evidence 후보 승인` 버튼과 승인 결과 표를 제공해 초급 사용자가 결과 회수 이후 무엇이 승인됐는지 확인할 수 있게 한다.
- regression test는 복합 npm audit + Trivy collection 후 Evidence 후보 2개를 red_team_lead identity로 승인하고, 명령 실행/능동 스캔/Finding 생성/보고서 삽입이 발생하지 않음을 검증한다.
- 이 slice는 collection 이후 Evidence approval lane을 닫지만, 실제 운영 후보 전체의 Finding 승격, severity 2인 승인, Matrix/report/export 완료는 후속 작업이다.

## 37. Slice 82 반영 사항

- `/api/redteam/v2/toolchain-result-collections/{collection_id}/promote-findings`는 collection Evidence 후보 중 backend Evidence store에서 승인된 항목만 `pending_review` Finding 초안으로 만든다.
- 승인되지 않은 Evidence는 `blocked` promotion row로 남고 Finding을 생성하지 않는다.
- 생성되는 Finding payload는 Evidence summary, normalized structured item, tool ID, severity 후보, owner/SLA/retest 기본값을 포함하지만 최종 severity는 비워 둔다.
- API는 도구 실행, 능동 스캔, raw output instruction 신뢰, 보고서 Claim 삽입을 수행하지 않으며 `requires_severity_approval=true`를 반환한다.
- RedTeam2 UI는 `Finding 초안 생성` 버튼과 Evidence별 Finding 생성 상태 표를 제공하고, severity 2인 승인 전 Matrix와 보고서 Claim에 넣지 않는다는 설명을 표시한다.
- regression test는 collection Evidence 승인 전 promotion이 차단되고, batch 승인 후에만 Finding 초안 2개가 생성되는 경로를 검증한다.
- 이 slice는 collection Evidence approval에서 Finding draft까지 잇는 운영 lane이며, 실제 운영 collection 전체의 2인 severity 승인, Matrix ready, Report v2 gate pass/export는 후속 HITL 단계로 남긴다.

## 38. Slice 83 반영 사항

- `/api/redteam/v2/toolchain-result-collections/{collection_id}/approve-finding-severity`는 collection에서 생성된 Finding 초안만 대상으로 red_team_lead와 business_owner의 severity 2인 승인을 수행한다.
- API는 `promoted_finding_ids`를 기준으로 collection 외 Finding ID를 차단하고, lead approver와 business owner approver가 동일하면 `distinct_finding_severity_approvers_required`로 차단한다.
- 내부적으로 기존 `approve_finding_severity`를 두 번 호출하므로 actor binding, Evidence approval, severity 일치, pending condition 정책을 재사용한다.
- batch 결과는 `toolchain-finding-severity-approvals` artifact에 저장되고 collection artifact에는 `finding_severity_approval_status`와 `approved_finding_ids`를 기록한다.
- API는 도구 실행, 능동 스캔, Finding 생성, 보고서 Claim 삽입을 수행하지 않고 `requires_matrix_validation=true`를 반환한다.
- RedTeam2 UI는 `Finding 심각도 2인 승인` 버튼과 Finding별 lead/business owner 승인 상태 표를 제공한다.
- regression test는 복합 npm audit + Trivy collection에서 Evidence 승인, Finding 초안 생성, Finding severity 2인 승인까지 이어지는 경로를 검증한다.
- 이 slice는 collection Finding을 Matrix ready 직전 상태로 이동시키지만, 실제 운영 collection 전체의 Matrix draft ready, Report v2 draft, final export approval은 후속 단계로 남긴다.

## 39. Slice 84 반영 사항

- `/api/redteam/v2/toolchain-result-collections/{collection_id}/matrix-draft`는 collection의 approved/promoted Finding ID와 backend Evidence/Finding store를 읽어 collection 전용 Claim-Evidence Matrix draft를 만든다.
- 각 row는 승인된 Evidence와 2인 severity 승인된 Finding만 `ready_for_report_validation` 상태가 되며, 차단 row는 `held_claims`에 blocker를 남긴다.
- `/api/redteam/v2/toolchain-result-collections/{collection_id}/matrix-draft/report-draft`는 Matrix ready, held row 0건, report validation gate pass 조건에서만 Korean Red Team Report v2 draft를 생성한다.
- 두 API 모두 도구 실행, 능동 스캔, Finding 생성, report Claim 자동 삽입, final export approval을 수행하지 않는다.
- RedTeam2 UI는 `Matrix 초안 생성`과 `Report v2 draft 생성` 버튼, Matrix row 표, Report gate/export 승인 필요 표를 제공한다.
- regression test는 복합 npm audit + Trivy collection에서 Evidence 승인, Finding 생성, severity 2인 승인, Matrix ready, Report v2 draft generated까지 이어지는 controlled lane을 검증한다.
- 이 slice는 collection approved Findings를 Report v2 draft까지 연결하지만, 실제 운영 collection 전체의 최종 export approval과 export 검증은 후속 단계로 남긴다.

## 40. Slice 85 반영 사항

- collection Report v2 draft가 생성되면 RedTeam2 UI는 생성된 `report_id`를 `redteam2ReportExportState.report`에 연결해 기존 `내보내기 승인`과 `보고서 내보내기` 버튼이 같은 report를 대상으로 동작하게 한다.
- UI는 `복합 Collection 최종 export 게이트`와 `/api/redteam/v2/reports/{report_id}/approve-export -> /api/redteam/v2/reports/{report_id}/export` 흐름을 한국어로 표시한다.
- regression test는 복합 npm audit + Trivy collection을 Evidence 승인, Finding 생성, severity 2인 승인, Matrix ready, Report v2 draft generated, Executive Sponsor export approval, export artifact 생성까지 검증한다.
- export approval은 기존 report gate snapshot을 재검사하며 `gate_status=pass`, unsupported claim 0건, evidence 없는 Finding 0건, export errors 0건을 요구한다.
- 이 slice는 테스트된 collection path의 final export approval/export verification lane을 닫지만, 실제 운영 Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 전체 출력에 대한 live collection/export 완료는 후속 운영 증거가 필요하다.

## 41. Slice 86 반영 사항

- `/api/redteam/v2/toolchain-result-collections/{collection_id}/completion-gate`는 collection, Report v2 draft, export approval, export artifact를 읽어 E2E 완료 상태를 판정한다.
- 게이트는 Evidence 후보 전체 승인, 승인 Evidence 전체 Finding 승격, promoted Finding 전체 2인 severity 승인, `matrix_draft_ready`, report export gate pass, `Exported` artifact, approval/export/report ID 일치를 확인한다.
- API는 기존 artifact만 읽고, 도구 실행, 능동 스캔, Evidence 승인, Finding 생성, report 생성, export 수행을 하지 않는다.
- RedTeam2 UI는 `E2E 완료 게이트 점검` 버튼과 Evidence/Finding/Matrix/Report/Export 결과 표를 제공한다.
- regression test는 복합 npm audit + Trivy collection의 기존 lane 끝에서 completion gate가 `collection_e2e_complete`, blocker 0건, 명령 실행 없음으로 통과하는지 검증한다.
- 이 slice는 테스트된 collection의 완료 검증 증거를 만들지만, 실제 운영 scanner 전체 collection이 같은 게이트를 통과했다는 실측 증거는 후속 작업으로 남긴다.

## 42. Slice 87 반영 사항

- `/api/redteam/v2/toolchains/execute-governed`는 이제 step별 `operator_output`, `imported_output`, `imported_json`, `raw_artifacts`를 받아 저장된 untrusted artifact로 기록할 수 있다.
- imported-output 경로는 `offline_parse` 중심으로 동작하며 scanner 명령, 능동 스캔, shell expansion을 실행하지 않는다. 결과 run은 `OutputImported`, toolchain은 `imported_count`로 표시된다.
- Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP 6개 도구의 대표 운영자/서비스 결과가 하나의 toolchain collection으로 들어가고, Evidence 후보 6개, Evidence 승인, Finding 초안 6개, 2인 severity 승인, Matrix ready 6개 row, Report v2 draft, 최종 export, completion gate `complete=true`까지 통과하는 regression test를 추가했다.
- RedTeam2 UI는 `운영자 결과 첨부 - 명령 실행 없음`과 `승인된 로컬 runner 실행` 모드를 분리한다. 첨부 모드는 `---REDTEAM-AX-TOOL---` 구분선으로 도구별 결과를 입력하고, 사용자가 실행과 첨부를 혼동하지 않도록 한국어 안내를 표시한다.
- 이 slice는 6개 지정 도구 전체가 같은 collection/report/export/completion lane을 통과할 수 있음을 증명하지만, 실제 조직 OpenVAS/ZAP endpoint, Docker runtime, 운영 scanner artifact 제출·승인 완료를 대신 증명하지는 않는다.

## 43. Slice 88 반영 사항

- `/api/redteam/v2/toolchains/import-artifact-manifest`는 운영자가 제출한 multi-tool scanner artifact manifest를 읽는다.
- manifest artifact는 `tool_id`, `source_path`, `sha256`, `content_type`, optional `action_id/run_id`를 포함한다. API는 등록된 ToolProfile, ToolActionCard, `offline_parse` ExecutionPlan, workspace 파일 존재, SHA-256 일치를 검증한다.
- 각 파일은 기존 tool-run file importer를 통해 case raw artifact로 복사되고, run은 `OutputImported`로 남는다. toolchain manifest record에는 `commands_executed_by_api=false`, `active_scan_executed=false`, `shell_expansion_allowed=false`, `trusted_as_instruction=false`, `requires_human_validation=true`를 기록한다.
- 잘못된 hash 또는 준비되지 않은 step은 해당 step만 `blocked`로 남기고, 유효한 다른 step은 import할 수 있다. 2개 미만/6개 초과 artifact, 미등록 tool profile, requested_by 누락은 명시 오류로 처리한다.
- RedTeam2 UI는 `운영 산출물 manifest 가져오기` textarea와 버튼을 제공한다. 초급 운영자에게 `source_path`와 `sha256` 확인, 명령·능동 스캔 미실행, 검증된 파일만 toolchain collection으로 연결한다는 문구를 표시한다.
- regression test는 Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP 6개 fixture 파일을 source_path/SHA-256 manifest로 가져오고, bad SHA-256 negative case와 이후 `/collect-results` Evidence 후보 6개 생성을 검증한다.
- 이 slice는 실제 파일 기반 운영 산출물 제출 경로를 닫지만, 실제 조직 scanner 산출물의 사람 승인, Evidence 승인, Finding 승격, Matrix/Report/export/completion gate 완료는 후속 운영 실측 증거가 필요하다.

## 44. Slice 89 반영 사항

- `/api/redteam/v2/toolchains/build-artifact-manifest`는 운영자가 지정한 workspace 폴더에서 scanner 결과 파일을 찾고 SHA-256을 계산해 import payload를 만든다.
- builder는 Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP의 일반 파일명 패턴을 사용해 도구별 후보를 하나씩 선택하고, 같은 도구의 대체 후보와 unmatched 파일을 기록한다.
- API는 workspace 내부 디렉터리만 읽고 Docker, WSL, scanner, network, shell, active scan을 실행하지 않는다. 반환 record에는 `commands_executed_by_api=false`, `active_scan_executed=false`, `trusted_as_instruction=false`가 남는다.
- RedTeam2 UI는 `운영 산출물 폴더 경로` 입력, `폴더에서 manifest 만들기` 버튼, builder가 만든 JSON을 `운영 산출물 manifest 가져오기` textarea에 자동 반영하는 흐름을 제공한다.
- regression test는 6개 scanner 파일과 unmatched JSON 파일이 있는 폴더에서 manifest를 만들고, 생성된 import payload를 기존 `/toolchains/import-artifact-manifest`에 제출해 6개 파일이 `OutputImported`로 들어가는지 검증한다.
- 이 slice는 운영자의 SHA-256 manifest 작성 부담을 줄이지만, 실제 운영 scanner 산출물의 제출·승인·보고서 완료 자체를 대신하지 않는다.

## 45. Slice 90 반영 사항

- `/api/redteam/v2/toolchain-result-collections/{collection_id}/close-e2e`는 기존 collection 산출물을 대상으로 Evidence 승인, Finding 승격, 2인 severity 승인, Matrix draft, Report v2 draft, Executive Sponsor export approval, export, completion gate를 순서대로 수행한다.
- API는 `reviewed_by`, `lead_approver`, `business_owner_approver`, `export_approver`가 모두 명시되지 않으면 `blocked`로 남기며, lead와 business owner가 같으면 distinct approver 오류를 반환한다.
- closure helper는 scanner 명령, Docker/WSL/network 실행, active scan, raw output instruction 신뢰를 수행하지 않는다. 모든 도구 결과는 기존 collection Evidence 후보에서만 출발한다.
- RedTeam2 UI는 `복합 Collection 전체 닫기 승인자` 입력과 `전체 닫기: 승인·보고서·Export` 버튼을 추가해 초급 사용자가 단계별 버튼을 몰라도 closure 진행 상태를 표로 확인할 수 있게 한다.
- regression test는 manifest import로 만든 Nuclei/ZAP 운영 산출물 collection을 새 close-e2e API 하나로 닫고, `collection_e2e_complete`, blocker 0건, Report gate pass, Exported artifact, 명령 실행 없음 상태를 검증한다.
- 이 slice는 테스트된 운영 산출물 collection closure lane을 단순화하지만, 실제 조직 scanner 산출물을 제출해 close-e2e까지 완료한 운영 실측 증거는 아직 필요하다.

## 46. Slice 91 반영 사항

- `/api/redteam/v2/toolchains/close-operating-artifact-manifest-e2e`는 기존 운영 scanner 산출물 폴더를 대상으로 manifest 생성, SHA-256 검증 import, 결과 회수, Evidence 후보 생성, 명시 승인자 close-e2e, Report v2 export, completion gate를 한 번에 수행한다.
- API는 workspace의 기존 파일만 읽으며 scanner, Docker, WSL, network scan, shell expansion을 실행하지 않는다. 결과 record에는 `commands_executed_by_api=false`, `active_scan_executed=false`, `shell_expansion_allowed=false`, `trusted_as_instruction=false`를 남긴다.
- RedTeam2 UI는 `운영 산출물 전체 닫기 API`, `전체 닫기용 운영 scanner 산출물 폴더`, `운영 산출물 전체 닫기` 버튼을 제공한다.
- regression test는 Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 6개 기존 파일 fixture로 `operating_collection_e2e_complete`, artifact 6개, Evidence 후보 6개, completion blocker 0건을 검증한다.
- 이 slice는 실제 운영자가 제출할 폴더 기반 one-click closure lane을 제공하지만, 실제 조직 산출물 폴더와 실제 승인자 identity로 실행한 운영 실측 증거는 아직 필요하다.

## 47. Slice 92 반영 사항

- `/api/redteam/v2/toolchains/operating-closure-submission-package`는 운영 closure 실행 전 `source_dir`, 승인자 4명, runtime blocker, close-operating payload를 구조화한다.
- API는 manifest builder validation을 재사용해 운영 scanner 산출물 후보와 SHA-256 payload를 확인하고, `approver_checks`, `submission_items`, `runtime_blockers`, `close_api_payload`를 반환한다.
- API는 scanner, Docker, WSL, network scan, shell expansion을 실행하지 않고 `commands_executed_by_api=false`, `active_scan_executed=false`, `shell_expansion_allowed=false`, `trusted_as_instruction=false`를 유지한다.
- RedTeam2 UI는 `운영 closure 제출 패키지 확인` 버튼과 `운영 closure 제출 항목`, `운영 closure 승인자` 표를 추가했다.
- regression test는 승인자 누락 시 blocked, 6개 scanner fixture 폴더와 승인자 4명 입력 시 `ready_for_operating_close`와 close-operating payload 생성을 검증한다.
- 이 slice는 실제 운영 closure 전 실수를 줄이는 준비 패키지를 제공하지만, 실제 조직 산출물 폴더와 실제 승인자로 close-operating API를 실행한 운영 실측 증거는 아직 필요하다.

## 48. Slice 93 반영 사항

- `/api/redteam/v2/toolchains/operating-closure-human-review`는 운영 closure 제출 패키지와 final close 실행 사이의 HITL 검토 record를 남긴다.
- API는 제출 패키지를 `package_id`로 로드하거나 payload로 받아 checklist 6개, 승인자 서명 4개, runtime blocker 처리 방침, `final_close_authorized=true`를 모두 요구한다.
- 준비가 끝나면 `ready_for_human_close_execution`과 `approved_close_api_payload`를 반환하지만, close API 실행은 별도 단계로 남긴다.
- API는 scanner, Docker, WSL, network scan, shell expansion을 실행하지 않고 `commands_executed_by_api=false`, `active_scan_executed=false`, `shell_expansion_allowed=false`, `trusted_as_instruction=false`, `requires_separate_close_execution=true`를 유지한다.
- RedTeam2 UI는 `운영 closure 사람 검토 기록` 버튼과 `운영 closure 사람 검토`, `운영 closure 서명` 표를 추가했다.
- regression test는 checklist/signoff/final authorization 누락 시 `review_required`, 모든 검토 항목 충족 시 `ready_for_human_close_execution`과 승인된 close payload 보존을 검증한다.
- 이 slice는 실제 close 전 사람 검토 증적을 강화하지만, 실제 조직 scanner 산출물 폴더와 실제 승인자로 final close를 수행한 운영 실측 증거는 아직 필요하다.

## 49. Slice 94 반영 사항

- `/api/redteam/v2/toolchains/execute-reviewed-operating-close`는 ready human review record의 `approved_close_api_payload`만 사용해 운영 close를 실행하는 guarded API다.
- API는 `review_id`가 없거나 human review가 `ready_for_human_close_execution`이 아니면 `blocked`로 남긴다.
- `override_close_api_payload`가 전달되면 warning으로 기록하고 무시해, 사람이 검토하지 않은 payload로 final close를 우회하지 못하게 한다.
- 내부적으로 기존 `/api/redteam/v2/toolchains/close-operating-artifact-manifest-e2e` lane을 호출하지만 scanner, Docker, WSL, network scan, shell expansion을 실행하지 않고 기존 운영 산출물 파일만 사용한다.
- RedTeam2 UI는 `검토 완료 운영 closure 실행` 버튼과 E2E 상태 row를 추가했다.
- regression test는 review 누락/incomplete review 차단, complete review 기반 `reviewed_operating_close_complete`, override payload 무시, 안전 플래그 유지를 검증한다.
- 이 slice는 reviewed close 실행 경로를 통제하지만, 실제 조직 산출물 폴더와 실제 승인자로 실행한 운영 실측 증거는 아직 필요하다.

## 50. Slice 95 반영 사항

- `/api/redteam/v2/toolchains/certify-reviewed-operating-close-evidence`는 reviewed close 실행 결과를 completion audit 후보로 인증하는 API다.
- API는 reviewed close complete, completion gate complete, report gate pass 및 blocker 0건, 명령 실행/active scan 없음 safe flags를 검사한다.
- 또한 `real_operator_source_dir`, `real_approver_identities`, `no_controlled_fixture_data`, `evidence_retention_confirmed`, `roe_hitl_review_confirmed` attestation을 모두 요구한다.
- attestation이 없으면 `certification_required`, 모두 있으면 `ready_for_completion_audit_review`를 반환하지만 `does_not_mark_goal_complete=true`, `requires_final_completion_audit=true`로 전체 goal 완료 판단과 분리한다.
- controlled/test-like source가 감지되면 warning을 남겨 실제 조직 산출물 증거와 구분한다.
- RedTeam2 UI는 `운영 closure 증거 인증` 버튼과 `운영 closure 증거 검사`, `운영 closure 실측 attestation` 표를 추가했다.
- regression test는 attestation 누락 차단, 전체 attestation 충족 시 completion audit 후보 생성, controlled source warning, 안전 플래그 유지를 검증한다.
- 이 slice는 최종 완료 감사 후보 패키지를 만들지만, 실제 조직 산출물과 실제 승인자의 사실성 검토는 여전히 별도 completion audit에서 필요하다.

## 51. Slice 96 반영 사항

- `/api/redteam/v2/toolchains/review-operating-completion-audit-candidate`는 인증된 reviewed close 증거를 독립 completion audit checklist로 다시 검토하는 API다.
- API는 certification ready, certification error 0건, controlled/test 산출물 아님, report gate pass, completion gate complete, 명령 실행 없음 safe flags를 확인한다.
- controlled/test-like source warning 또는 `CASE-V2-*`, fixture, operator-scanner-outputs 경로가 감지되면 `no_controlled_or_test_source_required` blocker로 남기고 `goal_complete_candidate=false`를 유지한다.
- API는 `audited_by`를 필수로 요구하며 `does_not_mark_goal_complete=true`, `requires_external_completion_decision=true`로 전체 스레드 완료 판단과 분리한다.
- RedTeam2 UI는 `운영 completion audit 검토` 버튼과 `운영 completion audit checklist`, `운영 completion audit blocker` 표를 추가했다.
- regression test는 otherwise-ready controlled fixture certification이 독립 감사에서 차단되고, blocker/warning/safe flags/artifact 보존이 유지되는지 검증한다.
- 이 slice는 최종 완료 오판 방지 게이트를 강화하지만, 실제 조직 scanner 산출물 폴더와 실제 승인자로 certification 및 completion audit review를 통과한 운영 실측 증거는 아직 필요하다.

## 52. Slice 97 반영 사항

- `/api/redteam/v2/toolchains/real-operating-evidence-readiness`는 운영 closure 제출 패키지 전에 실제 운영 증거 여부를 사전 점검하는 API다.
- API는 기존 파일만 읽어 manifest builder를 실행하고, scanner artifact 2개 이상, 승인자 4명, 승인자 identity 중복 없음, 테스트성 경로 아님을 확인한다.
- `CASE-V2`, `fixture`, `operator-scanner-outputs`, test-like 폴더명은 `real_operating_source_required`와 `no_controlled_or_test_source_required` blocker로 차단한다.
- API는 scanner 명령, active scan, Docker/WSL/network 실행, shell expansion, raw output instruction 신뢰를 수행하지 않는다.
- RedTeam2 UI는 `실제 운영 증거 사전 점검` 버튼과 `실제 운영 증거 사전 점검`, `실제 운영 증거 blocker` 표를 추가했다.
- regression test는 fixture성 source_dir이 artifact 2개를 포함해도 실제 운영 증거 사전 점검에서 차단되는지와 safe flags를 검증한다.
- 이 slice는 운영 실측 증거 제출 전 오입력을 줄이지만, 실제 조직 scanner 산출물 폴더와 실제 승인자 4명으로 readiness부터 completion audit review까지 통과한 증거는 아직 필요하다.

## 53. Slice 98 반영 사항

- `/api/redteam/v2/toolchains/operator-evidence-submission-manifest-draft`는 operator evidence collection package의 `collection_items`와 운영자가 붙여넣은 `attachments` JSON을 결합해 validator-compatible `submission_manifest` 초안을 만든다.
- 입력은 `operator_identity`, `roe_reference`, `attachments[].item_id`, `attachments[].artifact_path`, `attachments[].review_status`이며, `collection_package`가 없으면 최신 operator evidence collection package artifact를 읽는다.
- API는 workspace 내부 local artifact만 허용하고 SHA-256을 계산하며, JSON artifact의 `status`가 각 item의 `expected_attachment.required_status`와 일치하는지 확인한다.
- 출력은 `submission_manifest`, `submission_manifest_artifact_path`, `attachment_rows`, `missing_items`, `unknown_items`, `validator_command_hint`를 포함한다.
- 안전 속성은 `commands_executed_by_api=false`, `active_scan_executed=false`, `shell_expansion_allowed=false`, `trusted_as_instruction=false`, `does_not_mark_goal_complete=true`로 고정한다.
- RedTeam2는 운영 증거 제출자, ROE 승인 참조, 운영 증거 제출 첨부 JSON 입력과 `운영 증거 제출 manifest 초안` 버튼, `운영 증거 제출 manifest 항목`, `운영 증거 제출 manifest 누락` 표를 제공한다.
- regression test는 두 개의 기존 JSON artifact가 sha256/status ready 초안으로 들어가고, 제출자/ROE/artifact_path 누락은 blocker로 남는지 검증한다.
- 이 slice는 제출 manifest 초안을 만들 뿐이며, 사람이 artifact를 검토해 `review_status=approved`로 바꾸고 `redteam_ax_operator_evidence_submission_validator.py --submission-manifest <path> --require-approved`를 통과하기 전에는 완료 증거로 사용하지 않는다.

## 54. Slice 99 반영 사항

- `/api/redteam/v2/toolchains/operator-evidence-card-import`는 operator Evidence Card import plan의 `evidence_card_candidates`를 실제 Evidence Card artifact로 등록한다.
- API는 최신 import plan을 기본으로 읽거나 payload의 `import_plan`을 사용하며, `candidate_ids`가 있으면 선택 후보만 처리한다.
- 기본 모드는 Evidence Card를 `pending_review`로 생성하고, `review_created_evidence=true`와 `human_review_confirmed=true`, reviewer identity, actor header가 모두 맞을 때만 기존 Evidence 승인 API를 호출한다.
- 승인 path는 기존 `approve_evidence_card`의 actor context binding을 재사용해 reviewer와 authenticated actor가 일치하지 않으면 승인 실패로 남긴다.
- 출력은 `import_rows`, `created_evidence_ids`, `approval_ids`, 생성/승인/invalid count, safe flags, 다음 human action을 포함한다.
- RedTeam2는 `운영 Evidence Card 후보 import` 버튼, `Evidence Card 후보 ID 선택`, 검토자/역할, 사람 검토 완료 체크박스, `운영 Evidence Card import` 결과 표를 제공한다.
- regression test는 후보 2개를 pending Evidence Card로 생성하는 경로와, `lead@example.com` actor context로 사람 검토 승인까지 완료하는 경로, human review confirmation 누락 blocker를 검증한다.
- 이 slice는 승인된 operator submission evidence를 Evidence Card lane으로 연결하지만, 실제 운영 artifact 전체의 Finding 승격, 2인 severity 승인, Matrix/report/export/completion gate는 후속 단계로 남긴다.

## 55. Slice 100 반영 사항

- `/api/redteam/v2/toolchains/execute-governed` 응답에 복합 도구 실행 진행 상태 계약을 추가했다.
- 각 step은 `step_number`, `display_name_ko`, `status_ko`, `progress_percent`, `operator_message_ko`를 포함해 초보 사용자가 실행/차단/첨부 상태를 한국어로 읽을 수 있게 한다.
- 전체 응답은 `completed_step_count`, `progress_percent`, `current_stage_ko`, `operator_summary_ko`, `next_action_ko`, `progress_events`를 포함한다.
- runner 실행 경로는 기존 `shell=false`, ToolActionCard, ExecutionPlan, execution token, wrapper pin gate를 유지하며, 이번 slice는 실행 권한을 넓히지 않고 상태 설명만 강화한다.
- RedTeam2 UI는 복합 실행 표에 `진행률`, `다음 행동` row를 추가하고, 별도 `도구 진행` 표로 execution plan, runner start, runner finish 또는 artifact import 이벤트를 표시한다.
- regression test는 두 개 설치 도구 mock 실행이 `progress_percent=100`, `completed_step_count=2`, 한국어 `next_action_ko`, `operator_summary_ko`, `progress_events`, step `status_ko`를 반환하는지 검증한다.
- 이 slice는 사용자가 프론트 버튼 실행 후 진행/결과 상태를 더 명확히 볼 수 있게 하지만, 실제 조직 승인 환경에서 Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 전체를 실행하고 Evidence/Finding/Report/export gate를 닫는 작업은 아직 남아 있다.

## 56. Slice 101 반영 사항

- `/api/redteam/v2/toolchains/{toolchain_id}/collect-results` 응답에 `analysis_agent_summaries`와 `analysis_agent_summary_count`를 추가했다.
- 각 collection step은 `analysis_agent_summary`를 포함해 도구 ID, run/result ID, LLM 분석 에이전트, normalizer, parser, sanitizer 상태, structured item 수, Evidence 후보 ID를 함께 표시한다.
- 모든 summary는 `trusted_as_instruction=false`, `requires_human_validation=true`, `requires_evidence_approval_before_finding=true`를 고정해 원시 도구 출력을 LLM 명령이나 보고서 주장으로 취급하지 않도록 한다.
- 한국어 `summary_ko`, `next_action_ko`, `evidence_use_limit_ko`를 제공해 초급 운영자가 “정규화된 항목은 Evidence 후보일 뿐이며 승인 전 Finding/Report Claim이 아니다”를 바로 확인할 수 있게 했다.
- RedTeam2 UI는 `LLM 분석 에이전트 요약` 표를 추가해 결과 회수 뒤 도구별 normalizer 판단과 증거 사용 제한을 표시한다.
- regression test는 npm audit/Trivy mock 복합 실행 후 collection 결과가 두 개의 agent summary를 만들고, NPM/Trivy 에이전트 ID, Evidence 후보 문구, untrusted data 제한, 사람 검토 조건을 보존하는지 검증한다.
- 이 slice는 결과 회수의 설명 가능성을 높이지만, 실제 운영 도구 산출물 전체의 Evidence 승인, Finding 승격, severity 2인 승인, Matrix/report/export/completion gate는 계속 별도 완료 조건으로 남아 있다.

## 57. Slice 102 반영 사항

- SCA normalizer가 CycloneDX SBOM의 `components`를 `sca_component_inventory_evidence`로 정규화하도록 확장했다.
- 컴포넌트 Evidence는 `component_ref`, `package_name`, `version`, `package_url`, `licenses`, `supplier`, `claim_scope=component_presence_only_until_vulnerability_evidence_approved`를 포함한다.
- CycloneDX `vulnerabilities[].affects`는 `affected_component_refs`와 `affected_components`로 연결되어, 취약점 후보가 어떤 컴포넌트 인벤토리 Evidence에 기대는지 추적할 수 있다.
- 취약점 후보에는 `requires_component_match_review=true`를 남겨 사람이 affects/component match를 확인하기 전에는 보고서 Claim으로 확정하지 않게 했다.
- RedTeam2 UI의 SCA 안내 문구를 CycloneDX SBOM, 컴포넌트 인벤토리 Evidence, 취약점 후보 Evidence, affects 검토 제한 기준으로 갱신했다.
- regression test는 SCA CycloneDX SBOM과 npm audit 결과를 복합 operator-import로 첨부하고, collect-results가 SCA agent summary, `sca_json` parser, 컴포넌트 Evidence 1건, 취약점 후보 1건, affects 연결을 생성하는지 검증한다.
- 이 slice는 목표의 SCA 사용성을 강화하지만, 실제 운영 SBOM과 실제 승인자 기반 Evidence/Finding/Report/export/completion gate 완료는 여전히 남아 있다.

## 58. Slice 103 반영 사항

- `/api/redteam/v2/toolchains/build-artifact-manifest` 응답에 `tool_coverage`, `present_tool_ids`, `missing_tool_ids`, `tool_coverage_complete`를 추가했다.
- manifest builder는 Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP 기본 6개 도구별 후보 파일 탐지 상태와 선택된 파일 SHA-256을 보존한다.
- `/api/redteam/v2/toolchains/real-operating-evidence-readiness`는 기본적으로 6개 필수 분석도구 산출물이 모두 있어야 `ready_for_operating_closure_submission=true`가 된다.
- 누락 도구가 있으면 `all_required_tool_artifacts_required` blocker와 `missing_required_tool_ids`를 반환하고, checklist의 `필수 6개 분석도구 산출물` 항목을 blocked로 표시한다.
- RedTeam2 UI는 `필수 분석도구 산출물` 표로 6개 도구별 산출물 있음/누락, 파일 경로, SHA-256 또는 후보 수를 보여준다.
- regression test는 2개 fixture만 있는 source가 6개 필수 도구 누락으로 차단되는지, 6개 운영 산출물 이름이 모두 있는 source가 `tool_coverage_complete=true`로 readiness를 통과하는지 검증한다.
- 이 slice는 실제 운영 closure 진입 전 “2개 파일만으로 ready”가 되는 오판을 줄이지만, 실제 조직 산출물과 실제 승인자로 downstream gate를 닫는 일은 여전히 남아 있다.

## 59. Slice 104 반영 사항

- `/api/redteam/v2/toolchains/close-operating-artifact-manifest-e2e`도 readiness와 동일한 기본 6개 도구 coverage 조건을 직접 강제한다.
- 운영 전체 닫기 API는 Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP 산출물 중 하나라도 누락되면 import/collection/close-e2e를 진행하지 않고 `all_required_tool_artifacts_required`로 차단한다.
- 응답에는 `required_tool_ids`, `present_tool_ids`, `missing_required_tool_ids`, `tool_coverage_complete`, `tool_coverage`를 포함해 사전 점검과 실제 닫기 경로가 같은 coverage 계약을 공유한다.
- source_dir manifest builder 경로와 raw artifacts manifest 경로 모두 `tool_id` coverage를 검사하며, API는 여전히 scanner/Docker/WSL/network 명령을 실행하지 않는다.
- regression test는 ZAP 산출물이 빠진 운영 폴더가 전체 닫기에서 차단되고, 6개 산출물이 모두 있는 폴더만 `tool_coverage_complete=true`로 Report v2 export/completion gate까지 닫히는지 검증한다.
- 이 slice는 readiness를 우회해 전체 닫기 API에 직접 들어오는 경우를 줄이지만, 실제 조직 산출물과 실제 승인자 identity로 reviewed close/certification/completion audit을 통과한 운영 실측 증거는 아직 필요하다.

## 60. Slice 105 반영 사항

- `/api/redteam/v2/runtime-readiness` 응답에 `next_action_plan`, `blocked_action_count`, `tool_execution_blocked_by`, `tool_execution_ready`를 추가했다.
- `next_action_plan`은 실행 환경 준비, OpenVAS/ZAP 읽기 전용 연결, 운영 증거 제출, 도구 결과 분석, 최종 실측 승격을 순서화한다.
- 각 단계는 `title_ko`, `operator_action_ko`, `primary_api_or_command`, `blocks_tool_execution`을 포함해 초급 사용자가 어떤 조건 때문에 실제 도구 실행이 막히는지 바로 확인할 수 있게 한다.
- RedTeam2 UI는 `도구 실행 가능 여부`, `남은 실행 준비 단계`, `다음 실행 준비 단계` 표를 추가하고, 도구 실행 전 해결 필요 여부와 확인 API/명령을 한국어로 표시한다.
- regression test는 runtime-readiness 응답의 구조화된 action plan과 safe no-execution flags를 검증한다.
- frontend runtime readiness contract와 Korean copy inventory에 새 anchor를 추가했다.
- 이 slice는 실행 전 안내와 차단 사유를 명확히 하지만, Docker/WSL/OpenVAS/ZAP 실측 준비나 실제 6개 도구 실행 완료를 대신 증명하지 않는다.

## 61. Slice 106 반영 사항

- `next_action_plan` 각 단계에 `frontend_action_key`와 `redteam2_button_ko`를 추가해 backend readiness 판단과 RedTeam2 화면 조작 흐름을 연결했다.
- 실행 환경 준비는 `런타임 상태 새로고침`, OpenVAS/ZAP 읽기 전용 연결은 `OpenVAS/ZAP 서비스 결과 가져오기`, 운영 증거 제출은 `운영 증거 제출 manifest 초안`, 도구 결과 분석은 `결과 회수·Evidence 후보`, 최종 실측 승격은 `운영 completion audit 검토`로 매핑한다.
- RedTeam2 `다음 실행 준비 단계` 표는 `화면 버튼` 열을 추가해 사용자가 어느 버튼으로 다음 조치를 이어가야 하는지 바로 볼 수 있게 했다.
- regression test는 runtime-readiness action plan의 `frontend_action_key`와 `redteam2_button_ko` 존재 및 핵심 action key를 검증한다.
- frontend runtime readiness contract와 Korean copy inventory는 `화면 버튼`, `frontend_action_key`, `redteam2_button_ko` anchor를 검사한다.
- 이 slice는 실제 실행 workflow 안내를 강화하지만, 실제 도구 실행/운영 산출물 승인을 대신하지 않는다.

## 62. Slice 107 반영 사항

- `/api/redteam/v2/toolchains/execute-governed`에 `require_runtime_preflight` 입력을 추가했다.
- runner 명령이 포함된 복합 실행에서 `require_runtime_preflight=true`이고 `/api/redteam/v2/runtime-readiness`의 `tool_execution_ready=false`이면 도구별 ExecutionPlan/runner 실행 전에 멈춘다.
- 차단 응답은 `status=blocked_by_runtime_preflight`, `runtime_preflight_status=blocked`, `tool_execution_blocked_by`, `runtime_next_action_plan`, `commands_executed_by_api=false`를 포함한다.
- 각 step과 progress event는 `실행 전 준비 차단`으로 표시되어 초급 운영자가 실제 scanner 명령이 실행되지 않았음을 확인할 수 있다.
- RedTeam2 실제 runner 실행 payload는 `require_runtime_preflight`를 보내며, 복합 실행 상태 표에 `실행 전 readiness` row를 추가해 readiness 차단 사유와 다음 화면 버튼 안내를 보여준다.
- regression test는 mocked runtime blocker 상황에서 `subprocess.run`이 호출되지 않고 모든 step이 preflight 차단으로 남는지 검증한다.
- 이 slice는 승인 없는 고위험 실행을 더 이른 단계에서 막지만, Docker/WSL/OpenVAS/ZAP readiness가 실제 ready가 되었거나 6개 도구 운영 결과가 완료되었다는 증거는 아니다.

## 63. 갱신 목표 반영 - 개발 부산물 제외

- 사용자가 추가한 목표 조건에 따라, 개발 과정에서 만들어진 fixture, smoke artifact, test-like path, archive run 부산물은 실제 업무 절차와 맞지 않으면 완료 증거에서 제외한다.
- runtime preflight blocker artifact는 안전 통제와 차단 가시성의 증거일 뿐, 실제 운영 scanner 실행·분석·보고서 완료 증거가 아니다.
- 완료 증거로 인정되는 산출물은 승인된 케이스, ROE/HITL, 실제 운영 도구 결과 또는 승인된 operator import, Evidence Card 승인, Finding severity 승인, Claim-Evidence Matrix, Report v2 export gate를 모두 통과해야 한다.
- `redteam_ax_development_byproduct_exclusion_review.py`는 completion audit evidence_refs를 전수 분류해 archive/runs, fixture, smoke, sanity, sample, test-like, CASE-V2 산출물을 `contract_regression_or_safety_control_evidence_only`로 제한한다.
- review 산출물은 모든 개발 부산물 row에 `completion_evidence_allowed=false`, `report_claim_evidence_allowed=false`를 남기며, `test_development_byproduct_exclusion_review.py`가 0건 조건을 검증한다.
- 이 slice는 완료 증거 오염 방지 계약을 증명하지만, 실제 6개 도구 운영 closure와 Report v2 export 완료 증거를 대신하지 않는다.

## 64. 갱신 목표 반영 - 운영 closure 제출 패키지의 실제 완료 증거 엄격 모드

- 목적: 운영자가 RedTeam2에서 운영 closure 제출 패키지를 만들 때 개발 fixture와 실제 운영 산출물이 섞여 전체 goal 완료 증거로 승격되는 것을 차단한다.
- API 설계: `/api/redteam/v2/toolchains/operating-closure-submission-package` payload에 `require_real_completion_evidence`를 받는다. 이 값이 true이면 `source_dir` 또는 `case_id`에 `CASE-V2`, `fixture`, `smoke`, `sample`, `test`, `operator-scanner-outputs` marker가 있는 경우 `real_completion_evidence_source_required` error와 `development_byproduct_source_detected` warning으로 `status=blocked`를 반환한다.
- 데이터 계약: 응답은 `source_completion_review`, `completion_evidence_allowed`, `report_claim_evidence_allowed`, `require_real_completion_evidence`를 포함한다. `development_byproduct_exclusion` 제출 항목은 strict blocker일 때 `status=blocked`, 비엄격 warning일 때 `status=warning`, 실제 운영 후보일 때 `status=ready`가 된다.
- 화면 명세: RedTeam2 운영 closure 제출 패키지 패널은 `개발 부산물 제외` row를 보여주고, fixture/test/operator-scanner-outputs 경로는 `완료/보고서 Claim 증거로 사용하지 않습니다`라고 표시한다. 화면 버튼은 기본적으로 `require_real_completion_evidence=true`를 전송한다.
- 테스트 전략: API 회귀는 strict mode에서 CASE-V2/operator-scanner-outputs source가 차단되고 command execution safe flag가 false로 유지되는지 검증한다. frontend sanity는 payload key와 Korean copy anchor를 검증한다.
- 예외 케이스: 개발 부산물은 계약 회귀, 안전 통제, 차단 가시성 증거로만 사용할 수 있다. 실제 완료 증거가 필요하면 승인된 운영 케이스 source에서 다시 수집하거나, approved operator import와 Evidence/Finding/Matrix/Report/export gate를 모두 통과해야 한다.

## 65. 갱신 목표 반영 - 전체 목표 완료 검토

- 목적: 단일 운영 completion audit 후보가 통과하더라도 전체 thread goal 완료 조건을 바로 만족한 것으로 오인하지 않도록, 최종 종료 조건을 별도 API/UI로 재검토한다.
- API 설계: `/api/redteam/v2/goal-completion-review`는 completion audit matrix, accepted gate manifest, zero-count gate, development byproduct exclusion review를 읽는다. scanner, Docker, WSL, 네트워크, 도구 실행은 하지 않는다.
- 차단 조건: reviewer 누락, completion audit matrix 누락, `audit_items[].status != proved`, `remaining_gaps` 존재, `goal_status != complete`, accepted gate 실패, unsupported claim/unapproved high-risk/evidence-less Finding 0건 assertion 누락, byproduct completion/report-claim eligible count 0건 실패를 blocker로 반환한다.
- 데이터 계약: 응답은 `goal_completion_ready`, `status`, `checklist`, `blockers`, `unresolved_items`, `remaining_gaps`, accepted gate count, zero-count gate, byproduct review status, safe flags, `does_not_mark_goal_complete=true`를 포함한다.
- 화면 명세: RedTeam2는 `전체 목표 완료 검토` 버튼을 제공하고, `전체 목표 완료 checklist`와 `전체 목표 완료 blocker` 표에서 남은 partial/gap과 종료 조건 미충족 이유를 한국어로 보여준다.
- 테스트 전략: 현재 active_incomplete matrix에서 API가 `goal_completion_blocked`를 반환하고, RTA-COMP-015/remaining gaps를 해소하기 전에는 thread goal 완료로 볼 수 없음을 회귀로 검증한다.

## 66. 갱신 목표 반영 - Docker container runtime 실측 smoke

- 목적: Docker daemon blocker가 해소된 환경에서 ephemeral container runner가 실제 컨테이너를 실행하되, 컨테이너 이미지의 ENTRYPOINT를 신뢰하지 않고 RedTeam AX가 승인한 argv만 실행하도록 한다.
- 구현: `build_ephemeral_container_command`는 Docker argv에 `--entrypoint=`를 추가하고 launch metadata에 `entrypoint_policy=cleared_to_execute_only_approved_runner_argv`를 기록한다.
- 이유: `aquasec/trivy` 이미지는 ENTRYPOINT가 `trivy`라서 기존 방식은 승인된 `["trivy", "--version"]`이 컨테이너 내부에서 `trivy trivy --version`으로 해석될 수 있었다. ENTRYPOINT를 비우면 child-process allowlist가 승인한 명령만 실제 실행된다.
- 실측 증거: `.venv` Python으로 `redteam_ax_container_runtime_smoke.py --allow-real --require-real --timeout 90`을 실행했고 `latest_container_runtime_smoke.json`에 Docker Desktop engine, local pinned `aquasec/trivy` digest, ToolActionCard, ExecutionPlan, execution token, network none, read-only rootfs, dropped capabilities, no-new-privileges, runner exit 0, `status=passed`가 남았다.
- 테스트 전략: API regression은 dry-run launch plan에 `--entrypoint=`, pinned image digest, approved runner argv, isolation controls가 존재하는지 검증한다. 실제 smoke artifact는 accepted gate 및 completion audit의 runtime evidence로 보존한다.
- 예외 케이스: 이 증거는 Docker/container runtime 부분만 해소한다. 이후 WSL alternate distro readiness도 통과했지만, 조직 OpenVAS/ZAP read-only endpoint/vault와 실제 6개 도구 운영 Evidence/Finding/Matrix/Report/export closure가 남아 있으면 RTA-COMP-015와 전체 goal은 완료가 아니다.

## 67. 갱신 목표 반영 - WSL alternate distro readiness

- 목적: 기본 WSL 배포판이 손상되어도 사용 가능한 대체 배포판이 있는 경우 runtime readiness를 실제 상태에 맞게 좁히고, 손상 증거와 fallback 선택을 모두 보존한다.
- 구현: `redteam_ax_wsl_runtime_readiness.py`는 requested/default/running/stopped 순서로 probe 후보를 만들고, `docker-desktop` internal distro는 마지막 fallback으로 배치한다. 각 probe의 stdout/stderr, exit_code, available tool paths, blocker classification을 `wsl_tool_probe_results`에 보존한다.
- 실패 분류: 기본 `Ubuntu-22.04`의 `Wsl/Service/CreateInstance/MountDisk/HCS/0x80070570`은 `wsl_ext4_vhdx_corrupt_or_unreadable`, `wsl_mount_disk_failed`로 분류한다. path missing 계열은 `wsl_ext4_vhdx_path_not_found`로 분류한다.
- 실측 증거: 현재 환경에서는 `Ubuntu-22.04`가 VHDX mount failure로 실패하고, `Ubuntu-22.04-AISOC-Rebuild`가 시작되어 npm/docker path를 반환한다. `latest_wsl_runtime_readiness.json`은 `status=ready`, `selected_distro=Ubuntu-22.04-AISOC-Rebuild`, `failed_probe_count_before_selection=1`을 기록한다.
- 테스트 전략: `tests/test_redteam_ax_wsl_runtime_readiness.py`는 run_command를 mock해 default distro mount failure 후 alternate distro selection과 blocker preservation을 검증한다. accepted gate manifest에는 `GATE-WSL-RUNTIME-FALLBACK-UNIT`을 추가한다.
- 예외 케이스: WSL readiness는 runtime blocker 해소 증거일 뿐이다. 실제 조직 OpenVAS/ZAP endpoint/vault와 실제 6개 도구 운영 Evidence/Finding/Matrix/Report/export closure가 남아 있으면 RTA-COMP-015와 전체 goal은 완료가 아니다.

## 68. 갱신 목표 반영 - OpenVAS/ZAP endpoint authorization diagnostics

- 목적: 조직 OpenVAS/ZAP endpoint/vault를 실제로 설정하기 전에 위험한 endpoint reference가 credential authorization을 통과하지 못하게 한다.
- 구현: `/api/redteam/v2/tool-credential-authorizations/{tool_id}` 응답에 `endpoint_ref_diagnostics`와 `operator_setup_guidance_ko`를 추가한다.
- 검증 항목: `endpoint_ref`는 http/https scheme, host 존재, credential-in-URL 금지, secret query key 금지, mutating path term 금지를 검사한다.
- 사용자 안내: 한국어 guidance는 secret 값 직접 제출 금지, external vault reference 사용, read-only report/passive alert endpoint 조건을 설명한다.
- 테스트 전략: 기존 OpenVAS/ZAP credential vault regression에 정상 OpenVAS endpoint diagnostics와 위험 ZAP ascan endpoint 차단을 추가한다.
- 예외 케이스: 이 diagnostics는 조직 endpoint가 실제 reachable하다는 증거가 아니다. 실제 service import는 `redteam_ax_external_scanner_service_import_live_smoke.py --allow-network --require-ready`와 strict promotion에서 별도로 증명해야 한다.

## 69. 갱신 목표 반영 - 필수 6개 분석도구 collection coverage

- 목적: 일부 도구 결과만 회수된 collection이 전체 RedTeam AX 도구 운영 완료로 오인되는 것을 막는다.
- 구현: `/api/redteam/v2/toolchains/{toolchain_id}/collect-results`가 `required_analysis_tool_coverage`를 반환한다. 이 객체는 Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP 각각의 run/result/evidence/agent coverage와 `completion_gate_ready`를 포함한다.
- 데이터 계약: 상위 응답에는 `required_tool_count`, `present_required_tool_count`, `missing_required_tool_ids`, `required_tool_coverage_complete`, `analysis_agent_coverage_complete`, `evidence_candidate_coverage_complete`, `completion_gate_ready`, `operator_summary_ko`, `next_action_ko`가 포함된다.
- 화면/기능 명세: RedTeam2는 collection 결과를 보여줄 때 `status=collected`만 보지 말고 `completion_gate_ready`와 `missing_required_tool_ids`를 함께 표시해야 한다. 초급 사용자는 “몇 개 도구 중 몇 개 결과가 수집되었는지”와 “누락 도구가 무엇인지”를 한국어로 확인해야 한다.
- 테스트 전략: 2개 도구 runner collection은 정상 수집으로 남지만 completion gate 미준비와 누락 4개 도구를 검증한다. 6개 도구 imported-output collection은 coverage complete와 completion gate ready를 검증한다.
- 예외 케이스: 이 gate는 collection boundary의 구조 검증이다. 실제 운영 증거 여부, 개발 부산물 제외, Evidence 승인, Finding severity 2인 승인, Matrix/Report/export/completion gate는 후속 단계에서 별도 검증해야 한다.

## 70. 갱신 목표 반영 - RedTeam2 필수 6개 도구 coverage 화면 가시성

- 목적: backend coverage gate가 사용자에게 보이지 않아 `status=collected`만 보고 전체 완료로 오인하는 것을 막는다.
- 화면/기능 명세: RedTeam2 복합 실행 항목 표에는 `필수 6개 도구 coverage`, `누락 필수 도구` row를 추가한다. collection table 아래에는 `필수 6개 분석도구` 표를 추가하고 각 row에 coverage 상태, LLM 분석 에이전트, Evidence ID 또는 다음 행동을 표시한다.
- 한국어 사용자 기준: 상태 문구는 `완료 게이트 준비`, `완료 게이트 미준비`, `분석·Evidence 후보 완료`, `결과 누락`처럼 비전문가도 해석 가능한 표현을 사용한다.
- API 설계 연결: 화면은 `required_analysis_tool_coverage.rows`, `completion_gate_ready`, `missing_required_tool_ids`, `present_required_tool_count`, `required_tool_count`를 읽는다.
- 테스트 전략: `redteam_ax_frontend_runtime_readiness_contract.py`와 `test_redteam2_korean_copy_inventory.py`가 coverage 문구와 필드 anchor를 검사한다. 백엔드 targeted pytest는 coverage 데이터 자체를 계속 검증한다.
- 예외 케이스: 이 UI는 운영자 가시성이다. 실제 operating closure, Evidence 승인, Finding severity 승인, Matrix/Report/export/completion gate 완료 증거는 별도로 필요하다.

## 71. 갱신 목표 반영 - 실제 운영 증거 누락 도구 remediation 안내

- 목적: 실제 운영 증거 사전 점검이 `TOOL-OPENVAS-001` 같은 내부 ID만 보여주면 초급 운영자가 어떤 파일을 준비해야 하는지 알기 어렵다.
- API 설계: `/api/redteam/v2/toolchains/real-operating-evidence-readiness`는 `missing_tool_remediation[]`를 반환한다. 각 row는 `tool_id`, `display_name`, `expected_filename_patterns`, `operator_action_ko`, `accepted_formats_ko`, `does_not_execute_tool`를 포함한다.
- 화면/기능 명세: RedTeam2 실제 운영 증거 사전 점검 영역은 `누락 도구`, `예상 파일명 패턴`, `다음 행동`, `안전` 표를 렌더링한다.
- 안전 원칙: remediation은 파일 준비 안내일 뿐이며 scanner 명령, Docker/WSL, 네트워크 스캔을 실행하지 않는다. `does_not_execute_tool=true`를 화면에 `명령 실행 없음`으로 표시한다.
- 테스트 전략: API 회귀는 fixture source에서 OpenVAS/ZAP 누락 시 `*openvas*.xml`, `*zap*.json` 패턴과 한국어 `결과 파일` 안내를 검증한다. frontend sanity는 새 한국어 label과 field anchor를 검증한다.
- 예외 케이스: 파일명 패턴은 manifest builder 후보 탐지 규칙이다. 실제 운영 완료 증거는 해당 파일을 제출한 뒤 import, collection, Evidence approval, Finding severity, Matrix/Report/export/completion gate를 통과해야 한다.

## 72. 갱신 목표 반영 - 분석도구 실행 버튼 readiness 계약

- 목적: RedTeam2에서 분석도구 버튼을 누르기 전에 어떤 도구가 바로 실행 가능한지, 어떤 도구가 승인·설치·첨부 준비가 필요한지 한국어로 분리한다.
- API 설계: `/api/redteam/v2/toolchains/launch-readiness`는 Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP별 button row를 반환한다. 각 row는 `tool_id`, `display_name`, `risk_class`, `command_status`, `install_status`, `trusted_for_runner`, `requires_human_approval`, `can_click`, `can_execute_now`, `launch_mode`, `button_label_ko`, `blocked_reasons`, `primary_api`, `operator_message_ko`, `next_action_ko`를 포함한다.
- 화면/기능 명세: RedTeam2 runtime readiness 영역은 `분석도구`, `버튼`, `실행 상태`, `차단 사유`, `사용자 안내`, `연결 API` 표를 렌더링한다. 버튼 label은 실행 가능 도구는 `승인된 실행 시작`, 고위험 승인 필요 도구는 `승인 요청`, operator import 도구는 `결과 첨부`, 설치/신뢰 보강 필요 도구는 `설치 확인`으로 표시한다.
- 안전 원칙: launch-readiness API는 side-effect-free 사전 판정이다. scanner 명령, Docker/WSL, network, active scan을 실행하지 않고 `commands_executed_by_api=false`, `active_scan_executed=false`, `trusted_as_instruction=false`를 반환한다.
- 테스트 전략: API regression은 Trivy ready, OpenVAS approval-required, SCA import-only, Nuclei command-missing row를 검증한다. frontend sanity는 launch-readiness endpoint, state loader, 표 header, fallback copy를 검사한다.
- 예외 케이스: 이 계약은 버튼 상태와 다음 API 연결을 보여줄 뿐이다. 실제 완료는 ROE/HITL, runtime preflight, tool execution 또는 approved operator import, Evidence approval, Finding severity, Matrix/report/export/completion gate가 모두 통과해야 한다.

## 73. 갱신 목표 반영 - 운영 closure 준비 요약

- 목적: 초급 운영자가 실제 운영 산출물 폴더, 필수 6개 도구 coverage, 승인자 4명, 제출 패키지 상태를 각각 다른 버튼으로 해석하지 않아도 되도록 사람 검토 직전 상태를 한 번에 요약한다.
- API 설계: `/api/redteam/v2/toolchains/operating-closure-readiness-summary`는 기존 `real-operating-evidence-readiness`와 `operating-closure-submission-package` 결과를 묶어 `ready_for_operating_closure_human_review`, `workflow_steps`, `blockers`, `missing_required_tool_ids`, `missing_tool_remediation`, `next_api`를 반환한다.
- 화면/기능 명세: RedTeam2는 `운영 closure 준비 요약` 버튼과 `운영 closure 준비 요약`, `운영 closure 다음 단계`, `운영 closure 준비 blocker` 표를 제공한다. 준비 완료 시 다음 API는 `/api/redteam/v2/toolchains/operating-closure-human-review`로 표시한다.
- 안전 원칙: summary API는 기존 파일과 승인자 입력만 점검한다. scanner 명령, Docker, WSL, network, active scan을 실행하지 않고 `commands_executed_by_api=false`, `active_scan_executed=false`, `shell_expansion_allowed=false`, `does_not_mark_goal_complete=true`를 반환한다.
- 테스트 전략: API regression은 6개 도구 산출물이 있는 실제 후보 source가 `ready_for_operating_closure_human_review`가 되고, `CASE-V2`/`operator-scanner-outputs` source가 차단되는지 검증한다. frontend runtime sanity는 새 API, 버튼, 표 header, safety copy를 검증한다.
- 예외 케이스: summary가 ready여도 실제 Evidence 승인, Finding 승격, 2인 severity 승인, Matrix, Report v2 export, completion audit review가 모두 완료되기 전까지 전체 goal은 완료가 아니다.

## 74. 갱신 목표 반영 - 저장된 toolchain 실행 상태 조회

- 목적: 운영자가 여러 분석도구 실행 또는 승인된 결과 첨부 후 화면을 새로 열어도 저장된 governed toolchain 실행 상태와 결과 회수 가능 여부를 다시 확인하게 한다.
- API 설계: `/api/redteam/v2/toolchains/{toolchain_id}/run-status`는 `case_id`와 `toolchain_id`로 `toolchain-runs` artifact를 읽고 `run_status`, `progress_percent`, `step_rows`, `run_ids`, `raw_artifact_refs`, `can_collect_results`, `collectable_step_count`, `primary_next_api`를 반환한다. 실행 기록이 없으면 `toolchain_run_not_found`, `toolchain_run_required`, `primary_next_api=/api/redteam/v2/toolchains/execute-governed`를 반환한다.
- 화면/기능 명세: RedTeam2는 `저장 실행 상태 다시 불러오기` 버튼을 제공하고, `저장 실행 상태` 표에서 현재 상태, 회수 가능 단계, 명령 실행 여부를 보여준다. `저장 실행 단계` 표는 도구별 상태, Run ID, 결과 회수 가능 여부를 표시한다.
- 안전 원칙: 이 API는 저장된 JSON artifact만 읽는다. scanner 명령, Docker, WSL, network, active scan, shell expansion을 실행하지 않고 `commands_executed_by_api=false`, `active_scan_executed=false`, `trusted_as_instruction=false`, `does_not_mark_goal_complete=true`를 반환한다.
- 테스트 전략: API regression은 imported-output으로 만든 toolchain run을 다시 조회해 `can_collect_results=true`, `collectable_step_count=2`, collect-results next API를 검증하고, 존재하지 않는 run은 `toolchain_run_not_found`로 검증한다. frontend runtime sanity는 버튼, 표 header, endpoint, read-only copy, `does_not_mark_goal_complete` anchor를 검사한다.
- 예외 케이스: 상태 조회가 회수 가능하다고 표시해도 실제 결과 회수, Evidence 승인, Finding 승격, 2인 severity 승인, Matrix/Report/export/completion gate는 별도 단계다. 이 조회 자체는 전체 goal 완료 증거가 아니다.

## 75. 갱신 목표 반영 - runtime partial 상태의 안전 로컬 smoke 실행

- 목적: 조직 OpenVAS/ZAP endpoint나 운영 closure가 아직 준비되지 않았다는 전역 blocker 때문에 npm, Trivy, Nuclei 같은 설치 확인용 version-only 로컬 smoke까지 모두 막히는 문제를 줄이고, 프론트엔드 버튼으로 실제 설치 도구를 제한적으로 확인할 수 있게 한다.
- API 설계: `/api/redteam/v2/toolchains/execute-governed`는 `allow_safe_local_smoke_when_runtime_partial=true`일 때 runtime readiness가 `tool_execution_ready=false`여도 `safe_local_smoke_runner_allowed` 검사를 통과한 step만 실행한다. 응답에는 `runtime_preflight_status=partial_safe_local_smoke`, `safe_local_smoke_partial_runtime_preflight`, `allow_safe_local_smoke_when_runtime_partial`를 포함한다.
- 안전 조건: 허용 범위는 `local_subprocess_shim`의 단일 version-only argv(`--version`, `-version`, `-v`, `version`)뿐이다. 임의 scan command, 다중 인자 scan command, import-only tool runner, non-local backend, prohibited option은 `부분 실행 차단`으로 남기고 실행하지 않는다.
- 화면/기능 명세: RedTeam2 복합 실행은 runner 모드에서 `allow_safe_local_smoke_when_runtime_partial=true`를 보내며, `복합 실행 항목` 표에 `안전 smoke 부분 실행` row를 표시한다. 설명 문구는 전체 운영 readiness가 막혀도 version-only 로컬 smoke만 제한적으로 허용하고 임의 스캔 명령은 차단한다고 명시한다.
- 테스트 전략: API regression은 runtime readiness가 external scanner blocker로 blocked인 상태에서 `npm.cmd --version`은 실행되고 `trivy fs --format json .`는 `safe_local_smoke_allows_version_only`로 차단되는지 검증한다. frontend runtime sanity는 payload flag와 한국어 표시 문구를 검사한다.
- 예외 케이스: 이 기능은 설치 확인 smoke만 실제 실행하는 경계다. 실제 취약점 스캔, OpenVAS/ZAP endpoint import, 6개 운영 산출물 coverage, Evidence 승인, Finding severity, Report v2 export, completion gate 완료는 여전히 별도로 필요하다.

## 76. 갱신 목표 반영 - RedTeam2 안전 설치 확인 smoke 버튼

- 목적: 초급 사용자가 runner 명령을 직접 작성하지 않아도 프론트엔드 버튼으로 실제 설치 도구의 version-only smoke를 시작하고, 결과 회수 단계로 이어지게 한다.
- 화면/기능 명세: `안전 설치 확인 smoke` 버튼은 현재 선택된 복합 도구 ID 중 Nuclei, Trivy, npm audit만 골라 `nuclei --version`, `trivy --version`, `npm.cmd --version` 명령을 자동 구성한다. 선택 도구가 부족하면 npm audit과 Trivy를 기본값으로 사용한다.
- API 연결: 버튼은 `/api/redteam/v2/toolchains/execute-governed`에 `toolchain_id={reportId}-TOOLCHAIN-SAFE-LOCAL-SMOKE`, `require_runtime_preflight=true`, `allow_safe_local_smoke_when_runtime_partial=true`, `runner_backend=local_subprocess_shim` payload를 보낸다.
- 상태 갱신: 응답 후 `redteam2ToolchainState.result`와 `redteam2ToolchainRunStatusState.result`를 함께 갱신해 저장 실행 상태 표와 결과 회수 버튼이 같은 toolchain을 바라보게 한다.
- 안전 원칙: 버튼 설명에는 `safe_local_smoke_button`, version-only 자동 구성, 임의 스캔 명령, active scan, Docker/WSL/network 실행 금지를 명시한다. OpenVAS/ZAP, SCA, active scan command는 이 버튼이 자동 실행하지 않는다.
- 테스트 전략: `node --check`, frontend runtime readiness contract, Korean copy inventory가 새 버튼과 안전 문구를 검증한다. API의 실제 허용/차단 로직은 RTA-COMP-062 regression으로 유지한다.
- 예외 케이스: 이 버튼으로 나온 stdout/stderr도 untrusted runner artifact이며, Evidence 후보 생성과 승인 전에는 Finding 또는 Report Claim 근거가 아니다.

## 77. 갱신 목표 반영 - OpenVAS/ZAP service import 결과 회수 연결

- 목적: OpenVAS/ZAP 읽기 전용 서비스 결과 가져오기가 단독 Evidence 후보 생성에 머무르면 초급 사용자가 다음 `결과 회수·Evidence 후보` workflow로 이어가기 어렵다.
- API 설계: `/api/redteam/v2/scanner-service-imports/{tool_id}`는 선택 입력 `toolchain_id`를 받는다. 값이 있으면 service import로 만든 ToolRunRecord를 `redteam_ax_v2_toolchain_service_import_projection` 형태의 `toolchain-runs` artifact에 step으로 저장한다.
- 상태 조회 연결: projection은 `/api/redteam/v2/toolchains/{toolchain_id}/run-status`와 `/api/redteam/v2/toolchains/{toolchain_id}/collect-results`를 `toolchain_projection.run_status_api`, `toolchain_projection.collect_api`로 반환한다.
- 화면/기능 명세: RedTeam2 `읽기 전용 서비스 결과 가져오기` 버튼은 `toolchain_id={reportId}-TOOLCHAIN-SERVICE-IMPORT`를 payload에 포함하고, 성공 시 `redteam2ToolchainRunStatusState`를 `loaded-from-service-import`로 갱신한다.
- 안전 원칙: service import projection은 이미 승인된 read-only report/passive alert만 연결한다. scanner command, active scan, shell expansion, secret material 저장은 계속 금지하며 raw output은 untrusted data다.
- 테스트 전략: API regression은 ZAP raw report를 service import로 넣은 뒤 run-status가 collect 가능 1단계를 반환하고, collect-results가 Evidence 후보 1건과 required coverage 미완료 warning을 반환하는지 검증한다. frontend service import contract는 `toolchain_id`, `loaded-from-service-import`, 결과 회수 안내 문구를 검사한다.
- 예외 케이스: 이 연결은 단일 OpenVAS/ZAP 결과를 collection pipeline으로 넘기는 경로다. 실제 완료에는 조직 endpoint/vault 실측, Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 6개 coverage, Evidence 승인, Finding severity 승인, Matrix/Report/export/completion gate가 필요하다.

## 78. 갱신 목표 반영 - 필수 6개 도구 운영 작업 순서 안내

- 목적: launch-readiness, service import, artifact import, governed runner가 각각 따로 보이면 초급 운영자가 “다음에 무엇을 누를지” 판단하기 어렵다. 6개 필수 도구별 작업 순서를 하나의 한국어 work order로 묶는다.
- API 설계: `/api/redteam/v2/toolchains/six-tool-work-order`는 `case_id`, `report_id`, `toolchain_id`, `requested_by`, 선택 `source_dir`를 받아 `work_order_rows[]`를 반환한다. 각 row는 `tool_id`, `display_name`, `action_status`, `recommended_button_ko`, `required_input_ko`, `operator_action_ko`, `blocked_reasons`, `primary_api`, safe flag를 포함한다.
- 라우팅 규칙: OpenVAS/ZAP는 `/api/redteam/v2/scanner-service-imports/{tool_id}`의 read-only service import로 안내한다. SCA/import-only는 `/api/redteam/v2/toolchains/import-artifact-manifest`로 안내한다. runner 준비 도구는 `/api/redteam/v2/toolchains/execute-governed`, 설치 누락은 `/api/redteam/v2/tool-install-readiness`, wrapper pin 누락은 `/api/redteam/v2/tool-wrapper-pins/{tool_id}/request`로 안내한다.
- 화면/기능 명세: RedTeam2 runtime readiness 영역에 `6개 도구 작업 순서 만들기` 버튼과 `작업 순서`, `다음 버튼`, `상태`, `필요 입력`, `차단 사유`, `연결 API` 표를 추가한다.
- 안전 원칙: work order API는 scanner 명령, Docker/WSL, network, active scan, shell expansion을 실행하지 않는다. 응답은 `commands_executed_by_api=false`, `active_scan_executed=false`, `trusted_as_instruction=false`, `does_not_mark_goal_complete=true`를 유지한다.
- 테스트 전략: API regression은 OpenVAS/ZAP가 service import, SCA가 결과 첨부, Trivy/npm audit이 governed runner로 안내되는지와 safe flag를 검증한다. frontend launch readiness sanity는 endpoint, 버튼, state, 표 header를 검사한다.
- 예외 케이스: 이 API는 초급 운영자용 순서표이며 완료 증거가 아니다. 실제 goal 완료에는 실제 운영 산출물, 승인된 Evidence, Finding severity 2인 승인, Matrix/Report/export/completion gate가 필요하다.

## 79. 갱신 목표 반영 - 분석가용 실행 안내와 분석 환경 설정 분리

- 목적: `실행 환경 준비도 / 남은 실측 조건`처럼 많은 내부 readiness 항목을 분석가에게 그대로 나열하면 사용자가 무엇을 눌러야 하는지 이해하기 어렵다. 실행 안내와 환경 설정을 분리한다.
- 화면/기능 명세: RedTeam2에는 `분석가용 다음 실행 안내` 패널을 먼저 배치한다. 이 패널은 `6개 도구 작업 순서 만들기`, `6개 도구 제출 양식 만들기`, `운영 증거 제출 manifest 초안`, `결과 회수·Evidence 후보`, `운영 closure 준비 요약` 5단계만 보여준다.
- 환경 설정 분리: Docker, WSL, OpenVAS/ZAP endpoint, 외부 vault reference, strict promotion, runbook, runtime blocker는 `분석 환경 설정(관리자용)` 패널에 둔다. 분석가가 당장 몰라도 되는 조건과 관리자가 조치할 조건을 분리한다.
- 한국어 UX 원칙: 전문 용어 앞에는 사용자가 누를 버튼과 목적을 먼저 보여준다. API 이름과 gate 이름은 표의 보조 근거로만 유지한다.
- 테스트 전략: frontend runtime readiness contract와 Korean copy inventory는 `분석가용 다음 실행 안내`, `분석 환경 설정(관리자용)`, `분석가는 아래 순서대로 버튼을 누르면 됩니다` anchor를 검사한다.
- 예외 케이스: 환경 설정 정보를 숨기지는 않는다. 승인·runtime·endpoint 조건은 여전히 필요하지만 분석가용 workflow와 관리자용 readiness detail을 분리해 혼재를 줄인다.

## 80. 갱신 목표 반영 - 필수 6개 도구 운영 제출 양식 생성

- 목적: 작업 순서표만으로는 운영자가 `operatorEvidenceSubmissionAttachmentsJson`에 어떤 JSON을 넣어야 하는지 어렵다. 6개 도구 산출물 제출 양식을 자동 생성한다.
- API 설계: `/api/redteam/v2/toolchains/six-tool-submission-template`는 `case_id`, `report_id`, `toolchain_id`, `requested_by`, `operator_identity`, `roe_reference`, 선택 `source_dir`를 받아 `collection_package`, `attachment_template`, `attachment_template_json`, `next_payload_hint`를 반환한다.
- 데이터 계약: `collection_package.collection_items[]`는 기존 `/api/redteam/v2/toolchains/operator-evidence-submission-manifest-draft`가 읽는 `item_id`, `expected_attachment`, `tool_id`, `title_ko`, `review_required` 구조를 사용한다. `attachment_template[]`는 사용자가 실제 `artifact_path`만 바꿔 넣을 수 있는 JSON 초안이다.
- 화면/기능 명세: RedTeam2 `6개 도구 제출 양식 만들기` 버튼은 API를 호출하고 반환된 `attachment_template_json`을 운영 증거 제출 첨부 JSON 입력란에 자동으로 채운다. 분석가용 안내 패널과 운영 증거 제출 영역 양쪽에 버튼을 둔다.
- 안전 원칙: 이 API는 scanner 명령, Docker/WSL, network, active scan, shell expansion을 실행하지 않는다. 실제 파일 hash와 status 검증은 후속 submission manifest draft API에서 수행한다.
- 테스트 전략: API regression은 제출 템플릿이 6개 item을 만들고, 같은 `collection_package`로 submission manifest draft를 호출하면 artifact_path 누락이 안전하게 차단되는지 검증한다.
- 예외 케이스: 제출 양식 생성은 운영자의 파일 경로 입력을 돕는 UX 계층이다. 실제 운영 증거는 파일 존재, SHA-256, expected status, 사람 승인, Evidence Card import, Claim-Evidence Matrix gate를 통과해야 한다.

## 81. 갱신 목표 반영 - 안전 설치 확인 smoke의 필수 도구 확대

- 목적: 프론트엔드 버튼으로 실제 설치된 분석도구를 확인한다는 목표에 맞춰, 기존 Nuclei/Trivy/npm 중심 smoke를 Nuclei/OpenVAS/Trivy/npm audit/OWASP ZAP까지 확장하되 active scan은 계속 차단한다.
- 화면/기능 명세: `안전 설치 확인 smoke` 버튼은 선택된 복합 도구 중 version-only 실행이 가능한 도구를 자동 선택한다. 기본값은 Nuclei, OpenVAS, Trivy, npm audit, OWASP ZAP 5개이며 SCA는 import-only 안내로 분리한다.
- 실행 모드: Nuclei/OpenVAS/OWASP ZAP은 `dry_run`에서 각각 `nuclei --version`, `gvm-cli --version`, `zap-cli --version`만 허용한다. Trivy/npm audit은 `sandbox_execute`에서 `trivy --version`, `npm.cmd --version`만 허용한다.
- 안전 원칙: `allow_safe_local_smoke_when_runtime_partial=true`가 있어도 임의 scan command, active scan, Docker/WSL/network 실행은 허용하지 않는다. stdout/stderr는 untrusted runner artifact이며 Evidence 승인 전 Claim 근거가 아니다.
- 테스트 전략: API regression은 runtime partial 상태에서 Nuclei/OpenVAS/ZAP `dry_run` version-only가 실행되고 `active_scan_executed=false`를 유지하는지 검증한다. frontend launch readiness sanity는 새 catalog와 한국어 안내 문구를 검사한다.
- 예외 케이스: SCA는 실행형 도구가 아니라 SBOM/lockfile/SCA export를 제출하는 import-only 경로로 남긴다. smoke 성공은 실제 운영 scanner 산출물 coverage, OpenVAS/ZAP endpoint import, Evidence/Finding/Report/export/completion gate 완료를 대신하지 않는다.

## 82. 갱신 목표 반영 - runtime readiness 역할별 요약 계약

- 목적: readiness API가 Docker/WSL/endpoint/promotion blocker를 모두 한 응답에 나열하면 초급 분석가가 다음 행동을 찾기 어렵다. 같은 원천 데이터를 분석가용 요약과 환경 담당자용 세부 요약으로 나눈다.
- API 설계: `/api/redteam/v2/runtime-readiness`는 기존 `next_action_plan`을 유지하면서 `analyst_readiness_summary`, `operator_environment_summary`, `role_separated_next_steps`를 추가한다.
- 화면/기능 명세: RedTeam2 `분석가용 다음 실행 안내`는 `analyst_readiness_summary.status`, `message_ko`, `primary_next_button_ko`, `secondary_next_button_ko`, `plain_language_blockers_ko`를 먼저 표시한다. Docker/WSL/OpenVAS/ZAP endpoint/vault/strict promotion은 `operatorEnvironmentRows`로 관리자용 패널에 표시한다.
- 안전 원칙: 분석가용 요약은 `can_run_active_scan=false`를 명시한다. 결과 첨부와 Evidence 후보 검토는 허용하지만 고위험 실행은 사람이 승인·수행·검토한 뒤 결과만 회수한다.
- 테스트 전략: API regression은 세 요약 필드와 audience/status/safe flag를 검증한다. frontend launch readiness sanity는 `analystReadinessSummary`, `operatorEnvironmentSummary`, `관리자 환경 단계`, `분석가 기본 화면에서 숨김` 계약을 검사한다.
- 예외 케이스: 역할별 요약은 UX 계약이다. 기존 `next_action_plan`, raw blockers, runtime artifact는 감사와 환경 담당자 검토를 위해 유지한다.

## 83. 갱신 목표 반영 - 도구 실행 결과 진행 요약

- 목적: 도구 버튼을 눌렀거나 결과를 첨부한 뒤 사용자가 “지금 결과가 어디까지 갔고 다음에 무엇을 눌러야 하는지”를 한눈에 보게 한다.
- API 설계: `/api/redteam/v2/toolchains/{toolchain_id}/run-status`와 `/api/redteam/v2/toolchains/{toolchain_id}/collect-results`는 공통 `analyst_progress_summary`를 반환한다. 이 요약은 `primary_next_button_ko`, `next_action_ko`, `stage_rows`, `collectable_count`, `collected_count`, `evidence_candidate_count`, `missing_required_tool_ids`, `does_not_mark_goal_complete`를 포함한다.
- 화면/기능 명세: RedTeam2 복합 실행 영역은 `분석가 진행 요약` 표와 `진행 단계` 표를 `복합 실행 항목` 바로 아래 표시한다. 단계는 도구 실행/결과 첨부, 결과 회수/Evidence 후보 생성, Evidence 후보 사람 승인, Finding·Matrix·Report 단계다.
- 안전 원칙: 진행 요약은 projection이다. run-status는 저장 기록만 읽고 명령을 실행하지 않는다. collect-results는 저장 artifact를 sanitizer/normalizer/Evidence 후보로 바꾸지만 승인 전 Finding/Report Claim으로 확정하지 않는다.
- 테스트 전략: API regression은 run-status의 다음 버튼이 `결과 회수·Evidence 후보`, collect-results의 다음 버튼이 `Evidence 후보 승인`인지 검증한다. frontend launch readiness sanity는 관련 state와 한국어 표명을 검사한다.
- 예외 케이스: 요약은 실제 approval gate를 대신 통과시키지 않는다. Evidence 승인, Finding severity 2인 승인, Matrix/report/export/completion gate는 여전히 별도 API와 사람 승인으로 남는다.

## 84. 갱신 목표 반영 - OpenVAS/ZAP 서비스 가져오기 진행 요약

- 목적: OpenVAS/ZAP read-only service import를 실행한 직후 사용자가 “가져오기는 됐고 이제 결과 회수 버튼을 누르면 된다”는 사실을 같은 분석가 진행 요약 계약으로 보게 한다.
- API 설계: `/api/redteam/v2/scanner-service-imports/{tool_id}`는 `toolchain_id`가 제공되어 projection을 저장할 때 `analyst_progress_summary`를 import 응답과 `toolchain_projection` 양쪽에 반환한다. 이 요약은 `collectable_count=1`, `primary_next_button_ko=결과 회수·Evidence 후보`, `stage_rows.result_collection.status=ready`를 포함한다.
- 화면/기능 명세: RedTeam2 `OpenVAS/ZAP 서비스 결과 가져오기` 패널은 기존 `서비스 결과` 표 뒤에 `서비스 가져오기 진행` 표와 `서비스 다음 단계` 표를 표시한다. 분석가가 endpoint/vault 세부 설정을 이해하지 못해도 다음 버튼을 알 수 있게 한다.
- 안전 원칙: 이 경로는 이미 승인된 read-only report/passive alert 결과만 가져오며 active scan, spider, delete/write/admin scope, secret 값 저장, shell expansion, scanner command execution을 계속 금지한다.
- 테스트 전략: API regression은 service import projection의 진행 요약을 검증하고 frontend launch readiness sanity는 새 state/table 문자열을 검사한다.
- 예외 케이스: service import는 Evidence 후보 또는 진행 projection일 뿐이다. Evidence 후보 사람 승인, Finding promotion, severity 2인 승인, Matrix, Report v2 export, completion gate는 여전히 후속 단계다.

## 85. 갱신 목표 반영 - 운영 closure 진행 요약

- 목적: 실제 운영 증거 사전 점검부터 completion audit까지 버튼이 많아지면서 초급 분석가가 “지금 어느 단계이고 다음에 무엇을 눌러야 하는지” 판단하기 어렵다. 운영 closure 전용 진행 요약을 모든 closure API 응답에 공통으로 둔다.
- API 설계: `operating_closure_progress_summary`는 `primary_next_button_ko`, `next_action_ko`, `next_api`, `stage_rows[]`, `ready_stage_count`, `blocked_stage_count`, `missing_required_tool_ids`, `blockers`, `does_not_mark_goal_complete`를 포함한다. 대상 API는 real-operating-evidence-readiness, operating-closure-submission-package, operating-closure-readiness-summary, operating-closure-human-review, execute-reviewed-operating-close, certify-reviewed-operating-close-evidence, review-operating-completion-audit-candidate다.
- 단계 라우팅: evidence readiness가 막히면 `실제 운영 증거 사전 점검`, package가 준비되면 `운영 closure 사람 검토`, human review가 준비되면 `검토 완료 운영 closure 실행`, reviewed close가 끝나면 `운영 closure 증거 인증`, certification이 준비되면 `운영 completion audit 검토`를 다음 버튼으로 반환한다.
- 화면/기능 명세: RedTeam2 복합 도구 영역은 최신 closure 결과의 진행 요약을 선택해 `운영 closure 진행 요약`과 `운영 closure 단계` 표를 표시한다.
- 안전 원칙: 요약 API는 scanner 명령, Docker/WSL, network, active scan, shell expansion을 실행하지 않는다. `goal_complete_candidate`가 표시되어도 전체 `/goal` 완료 처리는 별도 completion review와 사람 판단 이후다.
- 테스트 전략: API regression은 ready/blocked/human review/reviewed close/certification/audit 단계의 다음 버튼과 safe flag를 검증한다. frontend launch readiness sanity는 state 변수와 한국어 표명을 검사한다.
- 예외 케이스: 이 요약은 UX와 상태 projection이다. 실제 조직 산출물, 실제 승인자, Evidence 승인, Finding severity 2인 승인, Matrix/Report/export/completion gate는 별도 산출물로 증명해야 한다.

## 86. 갱신 목표 반영 - RedTeam2 분석 화면 원시 경로/API 노출 최소화

- 목적: RedTeam2가 Evidence 추적성을 유지하면서도 분석자 화면에 로컬 절대 경로, 내부 API 엔드포인트, 영어 실행환경 토큰을 과도하게 노출하지 않도록 표시 계층을 정리한다.
- 화면/기능 명세: 분석가용 카드와 표는 `분석 저장소에 보관됨`, `파일 확인됨`, `연결 준비됨`, `관리자가 승인한 운영 산출물 폴더`처럼 상태 중심 한국어로 표시한다. 원시 경로는 관리자/감사 기록에서 확인한다는 안내로 대체한다.
- 데이터 계약: backend payload의 `source_dir`, `source_path`, `artifact_path`, `storage_path`, API endpoint 키는 유지한다. 변경 대상은 RedTeam2의 표시 문구와 placeholder이며 저장·검증·감사 경로는 API와 Evidence artifact에 남긴다.
- 예외 케이스: 사용자가 운영 산출물 폴더를 직접 입력해야 하는 관리자 입력란은 남기되, 기본값과 placeholder에서 실제 로컬 경로 예시를 제거한다. 첨부 JSON은 버튼으로 자동 생성하거나 관리자가 검증한 JSON을 붙여넣도록 안내한다.
- 테스트 전략: `node --check reports.js`, `redteam_ax_frontend_launch_readiness_contract.py`, `test_redteam2_korean_copy_inventory.py`가 문법, 금지 노출 문자열, 한국어 copy anchor를 검증한다.

## 87. 갱신 목표 반영 - 실행 나열형 복합 도구 영역을 결과 수집·검토 워크플로우로 전환

- 목적: `여러 분석도구 순차 실행·결과 첨부`는 사용자에게 실행 목록을 보여주는 단계처럼 보이며, RedTeam2 분석 화면의 목적과 맞지 않는다. 분석가 화면은 실행 자체보다 결과 수집, 확인 후보, 심각도 분포, Evidence 후보 검토를 먼저 보여줘야 한다.
- API 설계: `/api/redteam/v2/toolchains/{toolchain_id}/collect-results`는 `analyst_finding_review_summary`를 반환한다. 이 요약은 `headline_ko`, `plain_language_summary_ko`, `tool_result_candidate_count`, `high_or_critical_candidate_count`, `rows[]`, `missing_tool_rows[]`, `raw_paths_hidden_from_analyst=true`, `traceability_note_ko`를 포함한다.
- 화면/기능 명세: RedTeam2 섹션 제목은 `분석 결과 수집·검토 워크플로우`로 표시한다. 최상단 표는 `분석 결과 수집·검토`, `분석 결과 쉬운 요약`, `도구별 분석 요약`을 먼저 보여주고, 실행/진행 세부 기록은 `상세 실행 기록(관리자/감사용)`, `상세 진행 기록(관리자/감사용)`으로 낮춘다.
- 한국어 UX 원칙: 분석가용 본문은 `확인 후보`, `심각도 분포`, `Evidence 상태`, `검토 우선순위`, `다음 행동`을 중심으로 표현한다. raw Run ID, execution plan id, local path, internal API path는 보관 근거 또는 관리자 감사 기록으로만 안내한다.
- 안전 원칙: 이 전환은 UI 의미와 결과 요약 개선이다. 고위험 scanner 실행, active scan, Docker/WSL/network 실행은 여전히 ROE/HITL/runtime preflight가 없으면 차단한다.
- 테스트 전략: `redteam_ax_toolchain_collection_analyst_summary_contract.py`, `redteam_ax_frontend_runtime_readiness_contract.py`, `test_redteam2_korean_copy_inventory.py`가 새 용어와 회귀 금지 문구를 검증한다.
- 예외 케이스: 승인된 runner 실행 버튼 자체는 남긴다. 다만 기본 분석가 화면에서는 실행 여부 나열이 아니라 결과가 Evidence 후보로 정리되는 상태를 먼저 보여준다.

## 88. 갱신 목표 반영 - RedTeam2 기본 분석가 화면 관리자 세부정보 접힘

- 목적: RedTeam2가 분석가용 화면과 관리자/감사용 세부정보를 분리했더라도 기본 DOM에 runtime, endpoint, wrapper, closure, local path, isolation 세부 항목이 모두 보이면 초급 분석가에게 여전히 과도하다. 기본 화면은 결과 첨부, Evidence 후보, Finding/Claim 검토 중심이어야 한다.
- 화면/기능 명세: `관리자 설정` 패널과 `관리자 설정 보기/숨기기` 토글을 추가한다. 접힘 상태에서는 숨긴 항목의 범주와 담당자만 표시하고, 실제 세부 패널은 펼친 경우에만 렌더링한다.
- 기본 접힘 범위: `분석 환경 설정(관리자용)`, `도구 래퍼 신뢰 고정 / 버전 확인`, `OpenVAS/ZAP 읽기 전용 접속권한`, `OpenVAS/ZAP 서비스 결과 가져오기`, tool execution plan의 command/runner/isolation/token 세부정보, operating closure/completion audit 상세 표, 저장 실행 상세 표, 운영 산출물 경로성 입력을 기본 DOM에서 숨긴다.
- 추적성 원칙: 세부정보를 삭제하지 않는다. 관리자 토글을 펼치면 운영자, 레드팀 리드, 통제팀이 기존 승인·감사·closure 세부 행을 확인할 수 있다. Evidence Card와 Claim-Evidence Matrix 원본 추적은 계속 backend artifact와 감사 기록에 남긴다.
- 테스트 전략: `node --check reports.js`, frontend runtime readiness contract, Korean copy inventory, Playwright 브라우저 DOM 검증을 실행한다. 브라우저 검증은 기본 RedTeam2 DOM에서 관리자/경로/closure/격리/원시 키 금지어가 0건인지와 `분석가용 다음 실행 안내`, `관리자 설정 보기`, `분석 결과 수집·검토 워크플로우`가 존재하는지 확인한다.
- 예외 케이스: 관리자가 토글을 펼친 상태에서는 경로성, wrapper, endpoint, closure, audit 세부정보가 다시 보일 수 있다. 이는 감사와 운영 조치를 위한 의도된 동작이며, 기본 분석가 화면의 노출 최소화 계약과 구분한다.
