# FINAL_PLAN - RedTeam AX 목표 수행 실행 계획

상태: implementation slice 36 real container runtime smoke harness complete, Docker daemon blocker evidenced, full goal active
작성일: 2026-07-01
정본 상세 설계: `Detailed_PLAN.MD`

## 1. 실행 목표

Report Studio에 `레드팀 분석2`를 추가하고, Red Team Studio 전체 자료와 ChatShare 레드팀 수행과정 지식을 LLM wiki로 호출 가능하게 만든 뒤, RedTeam AX v2의 프론트/백엔드/API/테스트/보고서 게이트 개편을 단계적으로 수행한다.

## 2. 입력 근거

| 근거 | 위치 | 반영 방식 |
|---|---|---|
| RedTeam AX plan | `redteam_ax_plan.md` | 제품 목표, phase, final gate |
| ChatShare 레드팀 수행과정 | `고도화/chatshare-output/chatgpt` | guardrail/tooling/report workflow |
| Red Team Studio 전체 manifest | `고도화/llm-wiki/RED_TEAM_STUDIO_FILE_MANIFEST.json` | 호출 가능한 파일 색인 |
| 기존 작업 인덱스 | `archive/runs/redteam-work-folder-inventory-20260701/WORK_FOLDER_INDEX.md` | 기존 frontend/backend/산출물 지도 |
| 기존 frontend | `soc-frontend-vite-react/.../reports.js` | `레드팀 분석2` 복제 기준 |
| 기존 backend | `runtime/redteam_api_router.py` | v2 API 분리 기준 |

## 3. 변경 파일 계획

### 3.1 이번 계획 산출물

- `Detailed_PLAN.MD`
- `FINAL_PLAN.md`
- `고도화/llm-wiki/LLM_WIKI_HOME.md`
- `고도화/llm-wiki/RED_TEAM_STUDIO_FILE_MANIFEST.json`
- `고도화/llm-wiki/RED_TEAM_STUDIO_EXTENSION_SUMMARY.json`
- `고도화/llm-wiki/RED_TEAM_STUDIO_TOP_DIR_SUMMARY.json`
- `고도화/sanity/test_plan_contract.py`

### 3.2 다음 구현 산출물

Frontend:

- `soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` - slice 31 RedTeam2 container launch result UX 반영
- 필요 시 `src/data.js`, `src/views/ReportsView.jsx`

Backend:

- `runtime/redteam_v2_api_router.py` - slice 30 runner isolation readiness endpoint 반영
- `runtime/redteam_v2_models.py` - slice 33 container stdout scanner result normalization E2E 반영
- `runtime/redteam_v2_policy.py`
- `runtime/redteam_v2_tool_actions.py`
- `runtime/redteam_v2_report_validator.py`
- `runtime/malware_upload_api.py` router include 지점 - slice 1 반영

Tests:

- `tests/test_redteam_v2_api_router.py` - slice 21 multipart upload -> parser 검증 반영
- `tests/test_redteam_v2_sample_e2e.py` - approved Evidence/Finding/report E2E 유지
- `tests/test_redteam_v2_tool_actions.py`
- `tests/test_redteam_v2_report_gate.py`
- frontend sanity/build/playwright tests

## 4. 마일스톤별 실행 계획

### M0. 계획/위키/검증 패킷

상태: 완료, commit/push 대기

작업:

- ChatShare package 생성 및 검증
- Red Team Studio 전체 manifest 생성
- LLM wiki home 작성
- Detailed/Final plan 작성
- plan sanity test 작성
- knowledge workflow evidence close
- scoped git commit/push

완료 기준:

- sanity test 통과
- evidence gate close
- commit/push 완료

### M1. `레드팀 분석2` UI 추가

상태: slice 1 완료

작업:

1. `reportStudioTabs()`에 `['redteam2', '레드팀 분석2', 'AX v2 workflow, tool actions, evidence gates']` 추가.
2. `reportStudioTabContent()`에 `if (active === 'redteam2') return this.redTeamAnalysis2Panel();` 추가.
3. 기존 `redTeamAnalysisPanel()`을 기준으로 `redTeamAnalysis2Panel()` 생성.
4. 상태 키를 다음처럼 분리.
   - `redteam2AnalysisDraft`
   - `redteam2AnalysisState`
   - `redteam2ScopeRuns`
   - `redteam2SelectedCase`
   - `redteam2ToolActionQueue`
5. 기존 `redteam` 탭 함수는 회귀 기준으로 유지.

완료 기준:

- `npm.cmd run build` 통과
- 두 탭이 동시에 표시되도록 tab registry 반영
- `redteam2`가 `redteam2AnalysisDraft`, `redteam2AnalysisState`, `redteam2ToolActionQueue`를 사용하고 기존 `redteamAnalysisState`를 직접 변경하지 않음

남은 작업:

- Playwright screenshot으로 5177 live UI에서 `레드팀 분석`과 `레드팀 분석2` 동시 표시 확인 - slice 2 완료
- `redteam2ScopeRuns`, `redteam2SelectedCase`는 sample E2E 확장 시 실제 workflow state에 연결

### M2. v2 API skeleton

상태: slice 1 완료

작업:

1. `/api/redteam/v2/health`
2. `/api/redteam/v2/roe/evaluate`
3. `/api/redteam/v2/tool-actions/plan`
4. `/api/redteam/v2/evidence`
5. `/api/redteam/v2/reports/validate`
6. `/api/redteam/v2/reports/generate`
7. `/api/redteam/v2/tool-actions/{action_id}/manual-run-record`

완료 기준:

- `.venv/Scripts/python.exe tests/test_redteam_api_router.py` 기존 테스트 통과
- 신규 v2 API 테스트 통과
- T5는 control team override 없으면 deny
- T3/T4/T5는 HITL/manual-run 흐름으로 제한

남은 작업:

- ToolProfile registry, ScriptFactory, MCP v2 endpoints, audit 조회 API 분리
- direct MCP deny는 기존 `/api/redteam/mcp/evaluate` 회귀 테스트와 v2 MCP 확장 테스트로 추가 고정
- ToolActionCard, ManualRunRecord, EvidenceCard, ReportValidationResult, Report v2 draft는 slice 3부터 `archive/runs/redteam-ax-v2/{case_id}` 아래 JSON/Markdown artifact로 보존

### M3. ToolActionCard 중심 실행 통제

상태: tool result normalizer/evidence candidate 완료, full workflow 진행 중

작업:

- ToolProfile
- ToolActionCard state machine
- ScriptManifest
- ManualRunRecorder
- ToolRunRecord
- ToolResultNormalizer

완료 기준:

- 모든 UI 버튼은 ToolActionCard 없이는 실행 불가
- T3/T4는 approval gate
- T5는 blocked
- 결과 import는 Evidence candidate로만 저장

현재 완료:

- ToolActionCard plan JSON artifact 저장
- ManualRunRecord JSON artifact 저장
- EvidenceCard JSON artifact 저장
- case audit JSONL append
- ToolActionCard case별 목록 조회 API
- ToolActionCard 단건 재조회 API
- approval request JSON artifact 저장
- approval decision JSON artifact 저장
- 승인 요청/결정 후 ToolActionCard status persistence
- `레드팀 분석2` 상태 새로고침 시 backend persistence queue reload
- Queue 카드의 `Request Approval` 버튼을 `/request-approval` API에 연결
- `approver_role` 기반 승인자 역할 검증
- T4는 `control_team` 승인 없이는 승인 불가
- T5/controlled production은 `control_team` + `second_approver` 2인 승인 hard gate 적용
- 고위험 ToolAction은 `Approved` 전 manual-run 기록 invalid 처리
- ActionCard 없는 manual-run 기록 invalid 처리
- Queue 카드에 approval mode와 required approver roles 표시
- `/api/redteam/v2/tool-runs/{run_id}/import-output` 추가
- `/api/redteam/v2/tool-runs/{run_id}/normalize` 추가
- `/api/redteam/v2/tool-runs/{run_id}/create-evidence` 추가
- ToolRunRecord JSON artifact 저장
- NormalizedResult JSON artifact 저장
- Evidence candidate JSON artifact 저장
- ToolAction status `OutputImported` -> `Normalized` -> `EvidenceCreated` 전이 저장
- raw output은 prohibited report claims와 limitations를 포함한 normalized result로만 Evidence 후보화
- ToolAction approval은 `X-RedTeam-Actor`, `X-RedTeam-Actor-Role`과 본문 approver/role이 일치해야 통과

남은 작업:

- ToolProfile registry
- 실제 SSO/RBAC provider와 actor context 발급 연동

### M4. Evidence/Claim/Report v2

상태: Evidence approval lifecycle/report gate 완료, full renderer 진행 중

작업:

- EvidenceCard approval lifecycle
- VisualEvidence index
- ClaimEvidenceMatrix validator
- Report v2 Markdown renderer
- Release Gate

완료 기준:

- Evidence 없는 Finding 승인 불가
- unsupported material claim 0건
- report export human approval 필수

현재 완료:

- Report validation JSON artifact 저장
- Korean Report v2 Markdown artifact 생성
- Markdown에 문서 통제, Campaign Walkthrough, Evidence Card Index, Claim-Evidence Matrix, Findings, Report Gate, 재시험 계획 포함
- EvidenceCard 기본 상태를 `pending_review`로 생성
- `POST /api/redteam/v2/evidence/{evidence_id}/approve` 추가
- report validator가 missing/unapproved/unverified Evidence를 blocking item으로 차단
- Report Gate Markdown에 missing/unapproved/unverified Evidence count 표시
- `POST /api/redteam/v2/reports/{report_id}/approve-export` 추가
- `POST /api/redteam/v2/reports/{report_id}/export` 추가
- Executive Sponsor 승인 없이는 report export blocked 처리
- report gate blocker, unsupported claim, unapproved high-risk, evidence 없는 finding이 있으면 export approval invalid 처리
- Export manifest JSON artifact 저장
- `레드팀 분석2` UI에 Report v2 Final Gate / Export control 추가
- UI에서 Generate Report v2 -> Approve Export -> Export Report 순서로 API 호출
- Report export approval은 `X-RedTeam-Actor`, `X-RedTeam-Actor-Role`과 본문 Executive Sponsor가 일치해야 통과
- Approval/export artifact에 `actor_context`와 `identity_binding=bound` 저장

남은 작업:

- Volkis식 상세 campaign timeline 확장
- 악성코드 보고서식 문서 통제 metadata 확장
- 실제 SSO/RBAC provider와 actor context 발급 연동

### M5. Sample E2E and regression

상태: fixture/API sample E2E 완료, full release E2E 진행 중

작업:

- loopback lab 또는 fixture 기반 sample case
- frontend/backend 동시 smoke
- sample report generation
- security regression

완료 기준:

- fixture 기반 sample E2E 통과
- frontend build 통과
- backend unittest 통과
- report validation 0 blocker

남은 작업:

- 실제 5177/8765 UI 조작으로 ToolActionCard 계획 버튼을 눌러 API 결과가 queue에 쌓이는지 확인 - slice 2 완료
- persistent case workspace와 실제 report artifact/export manifest 저장 연동 - slice 7 완료
- full security regression과 starter pack 전체 회귀

## 5. 테스트 명령

계획/문서 sanity:

```powershell
python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_plan_contract.py"
```

Frontend 구현 단계:

```powershell
cd J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react
npm.cmd run build
```

Backend 구현 단계:

```powershell
cd J:/PortableApps/genai/projects/ai-agentic-soc
& .venv/Scripts/python.exe tests/test_redteam_v2_api_router.py
& .venv/Scripts/python.exe tests/test_redteam_v2_sample_e2e.py
& .venv/Scripts/python.exe tests/test_redteam_api_router.py
& .venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"
& .venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"
& .venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_api_router.py"
```

Live smoke:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8765/api/redteam/v2/health"
# Playwright: 5177 -> 보고서 스튜디오 -> 레드팀 분석2 렌더링 및 v2 API 200 응답 확인
```

Starter pack 회귀:

```powershell
cd "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/v1.2/redteam_ax_starter_pack_v1_2_mcp/redteam-ax-starter"
.venv-hermes/Scripts/python.exe -m pytest
```

## 6. 예외 처리 기준

- 서버 미기동: live smoke는 blocked로 기록하고 source-level sanity를 먼저 수행한다.
- ChatShare artifact 미복구: missing artifact 문서에 기록하고 plan claim에서 제외한다.
- 사용자 대상이 private/reserved IP: 자동 실행 차단, scope note만 생성한다.
- 승인 없는 high-risk action: UI button disabled, backend deny.
- report validation blocker 존재: export approval/export 불가.
- Github push 실패: 작업 완료로 말하지 않고 remote/branch 상태를 명시한다.

## 7. GitHub 처리 원칙

1. 다른 변경을 건드리지 않고 scoped add를 사용한다.
2. 계획 산출물과 sanity test만 첫 commit에 포함한다.
3. 구현 commit은 frontend/backend/test 단위로 분리한다.
4. 각 commit 후 현재 branch를 push한다.

## 8. M0 체크리스트

- [x] ChatShare package 생성
- [x] 전체 file manifest 생성
- [x] Detailed plan 작성
- [x] Final plan 작성
- [x] LLM wiki home 작성
- [x] plan sanity test 작성
- [x] sanity test 실행
- [ ] knowledge workflow close
- [ ] scoped commit
- [ ] GitHub push

## 9. Slice 1 구현 체크리스트

- [x] `레드팀 분석2` tab registry 추가
- [x] `redTeamAnalysis2Panel()` 추가
- [x] `redteam2AnalysisDraft`, `redteam2AnalysisState`, `redteam2ToolActionQueue` 상태 분리
- [x] `/api/redteam/v2` router 추가
- [x] ROE, ToolActionCard plan, ManualRunRecord, EvidenceCard, Report gate 모델 추가
- [x] 기존 FastAPI 앱에 v2 router include
- [x] 신규 v2 API unittest 6건 통과
- [x] 기존 redteam API unittest 2건 통과
- [x] frontend Vite build 통과
- [x] live 5177/8765 smoke
- [x] fixture sample case E2E
- [ ] release/security/report gate full regression

## 10. Slice 2 Live Smoke / Sample E2E 체크리스트

- [x] stale 8765 backend 프로세스 확인
- [x] 8765 backend를 현재 코드로 재시작
- [x] `/api/redteam/v2/health` live 200 확인
- [x] `/api/redteam/v2/roe/evaluate` T5 deny 확인
- [x] `/api/redteam/v2/tool-actions/plan` T3 HITL ToolActionCard 확인
- [x] 5177 Report Studio에서 `레드팀 분석2` 탭 표시 확인
- [x] 5177 `레드팀 분석2` 패널에서 v2 API/v1/RAG/readiness 요청 200 확인
- [x] 5177 `ToolActionCard 계획` 클릭 후 queue에 T3/ScopeValidated/HITL required/Request Approval 표시 확인
- [x] screenshot artifact 저장: `고도화/live-smoke/redteam2-report-studio-after-api.png`
- [x] screenshot artifact 저장: `고도화/live-smoke/redteam2-toolaction-queue-live-smoke.png`
- [x] sample case E2E unittest 추가 및 통과
- [x] backend ToolActionCard/ManualRun/Evidence/ReportValidation persistence
- [x] Korean Report v2 Markdown artifact 생성
- [x] ToolActionCard queue reload from backend persistence
- [x] final approved export route
- [ ] full release/security regression

## 11. Slice 3 Persistence / Report Artifact 체크리스트

- [x] `archive/runs/redteam-ax-v2/{case_id}` 저장 루트 추가
- [x] ToolActionCard JSON artifact 저장
- [x] ManualRunRecord JSON artifact 저장
- [x] EvidenceCard JSON artifact 저장
- [x] ReportValidationResult JSON artifact 저장
- [x] case audit JSONL append
- [x] Korean Red Team Report v2 Markdown artifact 저장
- [x] sample E2E가 artifact file 존재와 Markdown 핵심 섹션 검증
- [x] live `/api/redteam/v2/reports/generate` artifact 생성 확인
- [x] approved export API
- [x] full persistent UI reload

## 12. Slice 4 Approval Queue / UI Reload 체크리스트

- [x] `GET /api/redteam/v2/tool-actions?case_id=...` 추가
- [x] `GET /api/redteam/v2/tool-actions/{action_id}` 추가
- [x] `POST /api/redteam/v2/tool-actions/{action_id}/request-approval` 추가
- [x] `POST /api/redteam/v2/tool-actions/{action_id}/approve` 추가
- [x] approval request/decision artifact 저장
- [x] ToolActionCard status update artifact 저장
- [x] stored ToolAction artifact가 `artifact_path`를 포함하도록 보정
- [x] `레드팀 분석2` 상태 새로고침이 backend queue를 로드
- [x] `레드팀 분석2` Queue에서 `Request Approval` 버튼이 backend API를 호출
- [x] API unittest가 승인 요청, 승인 결정, 재조회, artifact 존재 검증
- [x] sample E2E가 approval request/decision 흐름 포함
- [x] live 8765 smoke로 `ApprovalRequested` 재조회와 artifact 존재 확인
- [x] live 5177 browser smoke로 Queue와 `Request Approval` 버튼 렌더링 확인
- [x] screenshot artifact 저장: `고도화/live-smoke/redteam2-approval-queue-ui-smoke.png`
- [x] 권한/역할 기반 승인자 검증
- [x] T5/controlled production 2인 승인 hard gate
- [x] approved export API
- [x] normalizer/import-output API

## 14. Slice 6 Tool Result Normalizer / Evidence Candidate 체크리스트

- [x] `POST /api/redteam/v2/tool-runs/{run_id}/import-output` 추가
- [x] `POST /api/redteam/v2/tool-runs/{run_id}/normalize` 추가
- [x] `POST /api/redteam/v2/tool-runs/{run_id}/create-evidence` 추가
- [x] manual run 없는 import/normalize는 invalid 처리
- [x] raw artifact를 ToolRunRecord로 저장
- [x] normalized result에 observations, limitations, structured items, prohibited report claims 저장
- [x] Evidence candidate는 `validation_status=candidate`로 생성
- [x] ToolAction status가 `OutputImported` -> `Normalized` -> `EvidenceCreated`로 갱신
- [x] API unittest가 import/normalize/evidence candidate 흐름과 missing tool-run normalize 차단 검증
- [x] sample E2E가 direct evidence 생성 대신 import-output/normalize/create-evidence 흐름 사용
- [x] live 8765 smoke로 artifact 존재와 `EvidenceCreated` 상태 확인
- [x] approved export API
- [ ] 실제 로그인/권한 provider와 approver identity binding
- [ ] starter pack 전체 회귀 및 full security regression

## 13. Slice 5 Role-Based Approval / T5 Hard Gate 체크리스트

- [x] approval policy helper 추가: T3=`red_team_lead`, T4=`control_team`, T5=`control_team + second_approver`
- [x] `approver_role` normalize/allow-list 검증
- [x] 승인 역할 불일치 시 `approver_role_not_authorized`로 invalid
- [x] T5 1차 승인 후 `PartiallyApproved` 유지
- [x] T5 동일 인물 2차 승인 시 `two_person_approval_requires_distinct_approvers`로 invalid
- [x] T5 두 명의 서로 다른 승인자 충족 후 `Approved`
- [x] 고위험 ToolAction은 `Approved` 전 manual-run invalid
- [x] ActionCard 없는 manual-run invalid
- [x] `레드팀 분석2` Queue에 required approver roles와 approval mode 표시
- [x] API unittest가 T4 unauthorized role, T5 partial/blocked/full approval, missing ActionCard manual-run 검증
- [x] sample E2E가 `approver_role=red_team_lead` 포함
- [x] live 8765 smoke로 T5 partial approval -> manual-run block -> second approval -> manual-run allow 확인
- [x] live 5177 smoke로 required approval role 표시 확인
- [x] screenshot artifact 저장: `고도화/live-smoke/redteam2-approval-roles-ui-smoke.png`
- [x] approval actor context header binding foundation
- [ ] 실제 SSO/RBAC provider와 actor context 발급 연동
- [x] approved export API
- [x] normalizer/import-output API - slice 6 완료

## 15. Slice 7 Approved Report Export 체크리스트

- [x] `executive_sponsor` approver role 추가
- [x] `POST /api/redteam/v2/reports/{report_id}/approve-export` 추가
- [x] `POST /api/redteam/v2/reports/{report_id}/export` 추가
- [x] final approval 전 export는 `report_export_approval_required`로 blocked
- [x] Executive Sponsor가 아닌 승인자는 `executive_sponsor_approval_required`로 invalid
- [x] report validation gate가 blocked이면 export approval invalid
- [x] export manifest JSON artifact 저장
- [x] API unittest가 unapproved export, wrong-role approval, approved export, blocked report gate 검증
- [x] sample E2E가 report generate 후 final approval/export 흐름 검증
- [x] live 8765 smoke로 approval 전 차단 -> 승인 -> export artifact 존재 확인
- [x] approval actor context header binding foundation
- [ ] 실제 SSO/RBAC provider와 actor context 발급 연동
- [ ] full release/security/starter-pack regression

## 16. Slice 8 Report Export UI Controls 체크리스트

- [x] `레드팀 분석2`에 Report v2 Final Gate / Export 섹션 추가
- [x] Case ID, Evidence ID, Claim ID, Finding ID, Executive Sponsor, Approver Role, Report Title 입력 분리
- [x] `Generate Report v2` 버튼을 `/api/redteam/v2/reports/generate`에 연결
- [x] `Approve Export` 버튼을 `/api/redteam/v2/reports/{report_id}/approve-export`에 연결
- [x] `Export Report` 버튼을 `/api/redteam/v2/reports/{report_id}/export`에 연결
- [x] Report gate, unsupported claim, unapproved high-risk, finding without evidence, final approval, export 상태를 테이블로 표시
- [x] frontend build 통과
- [x] Playwright 렌더링 smoke screenshot 저장: `고도화/live-smoke/redteam2-report-export-ui.png`
- [x] Playwright 클릭 flow smoke screenshot 저장: `고도화/live-smoke/redteam2-report-export-flow.png`
- [x] Browser smoke에서 `pass -> ExportApproved -> Exported` 확인
- [x] report export actor context header binding foundation
- [ ] 실제 SSO/RBAC provider와 actor context 발급 연동
- [ ] full release/security/starter-pack regression

## 17. Slice 9 Approval Actor Binding Foundation 체크리스트

- [x] FastAPI v2 router가 `X-RedTeam-Actor`, `X-RedTeam-Actor-Role` 헤더를 actor context로 주입
- [x] ToolAction approval에서 actor context 누락 시 `actor_context_required`, `actor_role_required`로 invalid
- [x] ToolAction approval에서 본문 approver와 actor header 불일치 시 `approver_must_match_authenticated_actor`로 invalid
- [x] Report export approval에서 actor context 누락/불일치 차단
- [x] Approval artifact에 `actor_context`와 `identity_binding` 저장
- [x] Export manifest에 approval의 `actor_context`와 `identity_binding` 전파
- [x] `레드팀 분석2` UI가 report export approval 호출 시 actor headers 전송
- [x] API unittest가 actor context missing/mismatch/bound 흐름 검증
- [x] sample E2E가 actor-bound ToolAction/report approval 사용
- [x] live 8765 smoke로 missing actor invalid -> bound approval -> bound export 확인
- [x] Playwright UI smoke screenshot 저장: `고도화/live-smoke/redteam2-actor-bound-export-flow.png`
- [ ] 실제 SSO/RBAC provider와 actor context 발급 연동
- [ ] full release/security/starter-pack regression

## 18. Slice 10 Evidence Approval Lifecycle / Report Gate 체크리스트

- [x] EvidenceCard 생성 기본 상태를 `approval_status=pending_review`, `validation_status=candidate`로 변경
- [x] `POST /api/redteam/v2/evidence/{evidence_id}/approve` 추가
- [x] Evidence approval도 `X-RedTeam-Actor`, `X-RedTeam-Actor-Role` 기반 actor binding 적용
- [x] Evidence approval artifact 저장
- [x] approved EvidenceCard에 `approval_status=approved`, `validation_status=approved`, reviewer metadata 저장
- [x] report validator가 실제 Evidence artifact를 로드해 missing/unapproved/unverified Evidence 차단
- [x] ReportValidationResult에 `missing_evidence_count`, `unapproved_evidence_count`, `unverified_evidence_count` 추가
- [x] Report export approval gate가 Evidence blocker count를 재확인
- [x] Report Markdown에 Evidence blocker count 표시
- [x] `레드팀 분석2` UI가 Generate Report v2 전에 Evidence 생성/승인을 수행
- [x] API unittest가 unapproved/missing/unverified Evidence gate 검증
- [x] sample E2E가 Evidence approval 후 report gate 0건 검증
- [x] live 8765 smoke로 pending Evidence blocked -> approved Evidence pass -> export 확인
- [x] Playwright UI smoke screenshot 저장: `고도화/live-smoke/redteam2-evidence-approved-export-flow.png`
- [x] approved Finding lifecycle - slice 11 완료
- [ ] 실제 SSO/RBAC provider와 actor context 발급 연동
- [ ] full release/security/starter-pack regression

## 19. Slice 11 Approved Finding Lifecycle / Final Severity Gate 체크리스트

- [x] `business_owner` approver role 추가
- [x] `POST /api/redteam/v2/findings` 추가
- [x] `POST /api/redteam/v2/findings/{finding_id}/approve-severity` 추가
- [x] FindingV2 생성 시 title, root_cause, business_impact, owner, sla, retest_criteria, Evidence 링크 검증
- [x] Evidence 없는 Finding은 `needs_evidence` 또는 report blocker로 유지
- [x] Finding 최종 심각도는 `red_team_lead + business_owner` 2인 승인 전까지 approved 불가
- [x] 동일 actor가 2인 승인을 충족하지 못하도록 distinct approver 조건 적용
- [x] report validator가 실제 Finding artifact를 로드해 missing/unapproved Finding 차단
- [x] report validator가 unapproved/mismatched final severity 차단
- [x] ReportValidationResult에 `missing_finding_count`, `unapproved_finding_count`, `unapproved_final_severity_count` 추가
- [x] Report export approval gate가 Finding blocker count를 재확인
- [x] Report Markdown에 Finding/final severity blocker count 표시
- [x] `레드팀 분석2` UI가 Generate Report v2 전에 Evidence 승인, Finding 생성, Red Team Lead + Business Owner 심각도 승인을 수행
- [x] API unittest가 unapproved Finding/final severity gate 검증
- [x] sample E2E가 approved Finding과 final severity 승인 후 report gate 0건 검증
- [x] live 8765 smoke로 unapproved Finding blocked -> 2인 승인 -> report/export pass 확인
- [x] Playwright UI smoke screenshot 저장: `고도화/live-smoke/redteam2-finding-approved-export-flow.png`
- [x] actor context provider/RBAC resolver foundation - slice 12 완료
- [ ] 외부 SSO/IdP provider와 actor context 발급 연동
- [ ] Finding owner/SLA/retest workflow의 별도 승인 UI
- [ ] full release/security/starter-pack regression

## 20. Slice 12 Actor Context Provider / RBAC Resolver 체크리스트

- [x] backend `resolve_actor_context` provider 추가
- [x] local dev session token 형식 `X-RedTeam-Session: dev:<actor_id>` 지원
- [x] actor directory와 role permission registry 추가
- [x] approval API가 actor provider의 `authenticated`, `roles`, `permissions`, `auth_provider` context를 artifact에 저장
- [x] 등록되지 않은 actor는 approval invalid
- [x] actor가 보유하지 않은 role 요청은 `actor_role_not_authorized_for_actor`로 invalid
- [x] `POST /api/redteam/v2/auth/actor-context` 추가
- [x] `/api/redteam/v2/health`에 actor context provider 상태 노출
- [x] `레드팀 분석2` UI에서 Evidence/Finding approval actor와 Executive Sponsor actor를 분리
- [x] API unittest가 registered actor, wrong role, unregistered actor, session-bound report export approval 검증
- [x] 기존 v2 sample E2E와 기존 redteam router regression 통과
- [x] live 8765 smoke로 session-bound actor context, wrong role reject, unregistered reject, session approval pass 확인
- [x] Playwright UI smoke screenshot 저장: `고도화/live-smoke/redteam2-actor-provider-export-flow.png`
- [ ] 외부 SSO/IdP 토큰 검증 어댑터
- [x] case별 RBAC policy foundation - slice 13 완료
- [ ] 중앙 사용자/그룹 동기화
- [ ] full release/security/starter-pack regression

## 21. Slice 13 Case-Scoped RBAC Policy 체크리스트

- [x] local case assignment registry 추가
- [x] `CASE-V2-*`, `CASE-LIVE-*`, `CASE-RTA-*`, `RTA-*` sample case policy 추가
- [x] actor context resolver가 `case_id` 기준 case role assignment를 계산
- [x] 전역 role이 있어도 case에 배정되지 않으면 approval invalid
- [x] approval artifact에 `case_roles`, `effective_roles`, `case_policy_source` 저장
- [x] `GET /api/redteam/v2/cases/{case_id}/rbac` 추가
- [x] API unittest가 case RBAC policy 조회와 unassigned case approval 차단 검증
- [x] v2 sample E2E와 기존 redteam router regression 통과
- [x] live 8765 smoke로 `CASE-NO-RBAC-*` 차단, `CASE-LIVE-*` 승인 확인
- [x] Playwright UI smoke screenshot 저장: `고도화/live-smoke/redteam2-case-rbac-export-flow.png`
- [x] case policy CRUD/API와 관리자 UI - slice 14 완료
- [ ] 중앙 사용자/그룹 동기화
- [ ] full release/security/starter-pack regression

## 22. Slice 14 Case RBAC Policy CRUD / Admin UI 체크리스트

- [x] `case-rbac/case-rbac-policy.json` artifact 기반 case별 RBAC override 저장
- [x] `PUT /api/redteam/v2/cases/{case_id}/rbac` 추가
- [x] `POST /api/redteam/v2/cases/{case_id}/rbac/assignments` 추가
- [x] `DELETE /api/redteam/v2/cases/{case_id}/rbac/assignments/{actor_id}` 추가
- [x] actor directory에 없는 actor는 policy invalid 처리
- [x] actor가 보유하지 않은 role assignment는 `roles_not_authorized_for_actor`로 invalid 처리
- [x] `required_roles` 누락 시 `required_roles_missing:*`로 invalid 처리
- [x] active case policy artifact가 local case registry보다 우선 적용
- [x] actor context의 `case_policy_source`가 `case_policy_artifact`로 기록
- [x] `레드팀 분석2` UI에 `Case RBAC Policy` 관리자 패널 추가
- [x] UI에서 `Load RBAC`, `Apply Defaults`, `Add Assignment` 버튼을 v2 API에 연결
- [x] API unittest가 PUT/POST/DELETE override와 role mismatch reject 검증
- [x] live 8765 smoke로 valid policy -> approval `Approved` 및 `case_policy_artifact` 확인
- [x] Playwright UI smoke screenshot 저장: `고도화/live-smoke/redteam2-rbac-crud-export-flow.png`
- [ ] 중앙 사용자/그룹 동기화
- [ ] 외부 SSO/IdP provider와 actor context 발급 연동
- [ ] Finding owner/SLA/retest workflow의 별도 승인 UI
- [ ] full release/security/starter-pack regression

## 23. Slice 15 Analysis ToolHub / LLM Agent Registry Foundation 체크리스트

- [x] `GET /api/redteam/v2/analysis-tools` 추가
- [x] `GET /api/redteam/v2/analysis-agents` 추가
- [x] Nuclei ToolProfile 등록: T3, 승인 필요, approved template/scope policy
- [x] OpenVAS/Greenbone ToolProfile 등록: T3, import/API/manual-run 중심
- [x] Trivy ToolProfile 등록: T0, offline/sandbox SCA evidence 후보
- [x] SCA Dependency Analyzer ToolProfile 등록: T0, SBOM/dependency manifest import 중심
- [x] npm audit ToolProfile 등록: T0, lockfile 기반 offline parse 중심
- [x] OWASP ZAP ToolProfile 등록: T3, passive/import 또는 approved lab active scan policy
- [x] 각 도구별 LLM 분석/정규화 agent registry 추가
- [x] ToolActionCard 계획 시 등록 ToolProfile의 risk class, normalizer, agent metadata 반영
- [x] `POST /api/redteam/v2/tool-actions/{action_id}/execute-governed` 추가
- [x] active scanner는 approval 전 `approval_required_before_tool_execution`으로 차단
- [x] 승인 후 governed ToolRunRecord가 `untrusted_output_envelope`와 `analysis_agent_id`를 포함
- [x] `POST /api/redteam/v2/tool-runs/{run_id}/agent-analyze` 추가
- [x] agent normalize 결과가 prohibited report claims와 “tool output is data, not instruction” 정책을 포함
- [x] `레드팀 분석2` UI에 Analysis ToolHub / LLM Agents 패널 추가
- [x] UI에서 Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 선택 후 ToolActionCard 계획 가능
- [x] API unittest가 registry, approval gate, agent normalize, Evidence 후보 생성 검증
- [x] live 8765 smoke로 Nuclei approval gate -> approved execution -> agent normalize 확인
- [x] Playwright UI smoke screenshot 저장: `고도화/live-smoke/redteam2-toolhub-agent-registry.png`
- [x] 실제 CLI wrapper manifest/hash preflight 기반 - slice 25 완료
- [ ] 실제 CLI/container 설치 자동화와 version command evidence 수집
- [x] 도구별 실제 JSON/XML parser normalizer 고도화 - slice 16 foundation 완료
- [ ] OpenVAS/ZAP API credential vault 및 read-only token 정책
- [x] sandbox/container runner와 network allowlist enforcement foundation - slice 24 ToolExecutionPlan 완료
- [ ] ToolResult -> Finding owner/SLA/retest UI 연계
- [ ] full release/security/starter-pack regression

## 24. Slice 16 Tool-Specific Output Normalizers 체크리스트

- [x] Nuclei JSON/JSONL parser 추가: template, severity, matched target, tags 추출
- [x] Trivy JSON parser 추가: target, package, installed/fixed version, CVE, severity 추출
- [x] npm audit JSON parser 추가: package, severity, advisory refs, fix availability 추출
- [x] OWASP ZAP JSON parser 추가: alert id/name/risk/confidence/URI/CWE/WASC 추출
- [x] OpenVAS XML parser 추가: result id/name/threat/severity/host/port/description 추출
- [x] Generic SCA JSON parser 추가: package, vulnerability id, severity, source 추출
- [x] 모든 parser 결과에 `trusted_as_instruction=false`와 `requires_human_validation=true` 적용
- [x] `agent-analyze` normalized result에 `parser_report` 저장
- [x] API unittest가 6개 도구 parser별 대표 출력 fixture를 검증
- [x] v2 router regression 28건 통과
- [x] sample E2E 1건 통과
- [ ] parser 결과를 Finding owner/SLA/retest UI에 직접 연결
- [x] 실제 파일 업로드/경로 기반 parser 입력 지원 - slice 17 local workspace file import/hash gate 완료
- [x] parser schema를 별도 JSON Schema artifact로 분리 - slice 18 `ToolResultNormalized`, `ToolArtifactImport` 완료
- [x] 실제 CLI wrapper manifest/hash preflight 기반 - slice 25 완료
- [ ] 실제 CLI/container 설치 자동화와 version command evidence 수집
- [x] sandbox/container runner와 network allowlist enforcement foundation - slice 24 ToolExecutionPlan 완료
- [ ] full release/security/starter-pack regression

## 25. Slice 17 File-Based Tool Result Ingestion 체크리스트

- [x] `/tool-runs/{run_id}/import-file` strict import endpoint 추가
- [x] local workspace file boundary check 적용: `artifact://` ref나 workspace 외부 경로는 strict file import에서 거부
- [x] SHA-256 필수 입력 및 실제 파일 해시 불일치 차단
- [x] imported artifact를 case archive `raw-artifacts/<run_id>/`에 복사하고 artifact metadata에 `sha256`, `storage_path`, `trusted_as_instruction=false`, `requires_human_validation=true` 저장
- [x] `agent-analyze`가 request `raw_output` 없이도 저장된 text/json/xml artifact를 읽어 tool-specific parser 입력으로 사용
- [x] API unittest가 hash 누락 거부와 Nuclei JSONL stored artifact parser 경로를 검증
- [x] multipart browser upload UX 연결 - slice 21 완료
- [x] parser schema를 별도 JSON Schema artifact로 분리 - slice 18 완료
- [x] artifact quarantine/redaction preview backend foundation - slice 19 완료
- [x] sandbox/container runner와 network allowlist enforcement foundation - slice 24 ToolExecutionPlan 완료

## 26. Slice 18 Tool Result Schema Artifacts 체크리스트

- [x] `고도화/schemas/json/ToolResultNormalized.schema.json` 추가
- [x] `고도화/schemas/json/ToolArtifactImport.schema.json` 추가
- [x] `/api/redteam/v2/tool-schemas` registry endpoint 추가
- [x] `/api/redteam/v2/tool-schemas/{schema_id}/validate` runtime validation endpoint 추가
- [x] `agent-analyze` 및 generic `normalize` 결과에 `schema_validation` 기록
- [x] strict file import 결과에 `schema_validation` 기록
- [x] structured item trust invariant 강제: `trusted_as_instruction=false`, `requires_human_validation=true`
- [x] API unittest가 valid/invalid normalized result schema validation을 검증
- [ ] schema artifact와 runtime registry 자동 동기화 검증
- [x] multipart browser upload UX에 schema validation 결과 표시 - slice 21 완료
- [x] quarantine/redaction preview backend foundation - slice 19 완료

## 27. Slice 19 Tool Output Sanitizer Quarantine/Redaction 체크리스트

- [x] `/tool-runs/{run_id}/sanitize-preview` endpoint 추가
- [x] tool output prompt injection pattern 탐지 및 `decision=quarantine` 판정
- [x] secret/API key/token/password/cookie redaction preview 적용
- [x] sanitizer 결과에 `trusted_as_instruction=false`, `trusted_as_data=true`, score, indicators, redactions, warnings 저장
- [x] `agent-analyze`가 raw/stored output을 parser 전에 sanitizer에 통과시키고 quarantine이면 normalized result를 invalid로 고정
- [x] sanitizer preview artifact를 `tool-sanitizer-previews`에 저장하고 ToolRunRecord에 preview ref 기록
- [x] API unittest가 GT-OUTPUT-001 prompt injection quarantine, GT-OUTPUT-002 secret redaction, agent-analyze quarantine block을 검증
- [x] frontend upload UX에 sanitizer preview 표시 - slice 20 raw output preview foundation 완료
- [x] image/OCR 기반 sensitive visual redaction preview - slice 22 API/UI/manual OCR preview 완료
- [ ] sanitizer pattern corpus 확장 및 false-positive regression

## 28. Slice 20 Frontend Sanitizer Preview UX 체크리스트

- [x] `레드팀 분석2`에 Raw tool output 입력 영역 추가
- [x] `Sanitizer Preview` 버튼 추가: ToolActionCard 기준 `offline_parse` ToolRunRecord 생성 후 `/sanitize-preview` 호출
- [x] guardrail fixture 버튼 추가: prompt injection + secret redaction 샘플 로드
- [x] sanitizer decision, prompt injection score, secret score, redaction count, human review 상태 표시
- [x] sanitized output preview 표시
- [x] UI 상태에 sanitizer run/preview artifact id 보관
- [x] 실제 multipart file upload와 SHA-256 import-file 연결 - slice 21 완료
- [x] image/OCR 기반 sensitive visual redaction preview - slice 22 API/UI/manual OCR preview 완료
- [ ] Playwright visual smoke 확대

## 29. Slice 21 Multipart Tool Output Upload UX/API 체크리스트

- [x] `/tool-runs/{run_id}/import-file/upload` multipart endpoint 추가
- [x] 업로드 파일을 case workspace `upload-inbox/<run_id>/`에 저장한 뒤 기존 strict `/import-file` 해시/경계 검증 재사용
- [x] SHA-256은 브라우저에서 계산하고 서버에서 재검증
- [x] `ToolArtifactImport` schema validation 결과를 UI에 표시
- [x] 업로드된 stored artifact로 `/sanitize-preview`와 `/agent-analyze` 실행
- [x] `레드팀 분석2` UI에 `Multipart Tool Output Upload` 패널 추가
- [x] API unittest가 multipart upload -> stored artifact -> Nuclei JSONL parser 경로 검증
- [ ] live 8765 backend 재시작 후 browser upload smoke
- [x] image/OCR 기반 sensitive visual redaction preview - slice 22 API/UI/manual OCR preview 완료

## 30. Slice 22 Image/OCR Visual Redaction Preview 체크리스트

- [x] `/visual-evidence/redaction-preview` endpoint 추가
- [x] OCR 텍스트를 기존 tool-output sanitizer와 visual-specific sensitive pattern corpus에 통과
- [x] email, internal URL/IP, session identifier, phone number, secret/API key/token 후보 redaction action 생성
- [x] visual descriptor에 `trusted_as_instruction=false`, `trusted_as_data=true`, `requires_human_review`, `masking_status`, limitations 기록
- [x] screenshot-only claim은 log/ticket/tool-output evidence 연결 전 차단 정책으로 표시
- [x] restricted visual evidence는 human approval 필요 경고로 표시
- [x] preview artifact를 `visual-redaction-previews` archive에 저장
- [x] `레드팀 분석2`에 이미지 파일 선택, SHA-256 계산, manual OCR 텍스트, claim guardrail note, sanitized OCR preview 표시
- [x] API unittest가 민감 OCR 텍스트 redaction과 screenshot-only claim block을 검증
- [ ] 실제 OCR 엔진(Tesseract/PaddleOCR 등) 연결 및 version/hash pin
- [x] pixel-level redacted image artifact 생성과 original/redacted artifact path 자동 연결 - slice 23 완료
- [ ] live 8765 backend 재시작 후 browser visual upload smoke

## 31. Slice 23 Pixel-Level Visual Redaction Artifact 체크리스트

- [x] `image_data_url`를 서버에서 base64 decode하고 SHA-256 불일치 시 invalid 처리
- [x] case archive `visual-bundles/<visual_evidence_id>/original.png` 저장
- [x] Pillow 기반 `redacted.png` 생성
- [x] 명시적 `redaction_regions`가 있으면 좌표 기반 마스킹, 없으면 manual OCR preview용 estimated OCR band 마스킹 적용
- [x] `screenshot_manifest.json`과 `sha256sums.txt` 생성
- [x] VisualEvidenceDescriptor에 `original_artifact_path`, `redacted_artifact_path`, `original_sha256`, `redacted_sha256`, `redaction_regions` 자동 연결
- [x] `레드팀 분석2` UI에 redacted artifact path/hash와 visual bundle 상태 표시
- [x] API unittest가 실제 PNG data URL -> original/redacted artifact 생성, hash divergence, manifest 생성을 검증
- [ ] 실제 OCR bbox 연동으로 estimated band를 precise region으로 대체
- [ ] live 5177/8765 browser visual upload smoke

## 32. Slice 24 Tool Execution Plan / Sandbox Policy 체크리스트

- [x] ToolProfile `allowed_execution_modes`에 SPEC의 `dry_run` 반영
- [x] `/tool-actions/{action_id}/execution-plan` endpoint 추가
- [x] ToolActionCard 없이는 execution plan 생성 거부
- [x] ToolExecutionPlan에 runner(`sandbox`, `manual_import`, `manual`, `local_cli`, `api`) 결정 기록
- [x] `dry_run`/`sandbox_execute` network policy 기본값 `deny` 적용
- [x] lab/staging/read-only 실행은 network allowlist 요구 구조로 기록
- [x] filesystem policy `workspace_only`, write path case archive 제한 기록
- [x] process policy `shell_expansion_allowed=false`, child process allowlist 기록
- [x] execution token 상태를 `issued`, `approval_required`, `blocked`로 분리
- [x] high-risk lab execution plan은 승인 전 `approval_required_before_runner_token`으로 표시
- [x] `레드팀 분석2` UI에 `Tool Execution Plan / Sandbox Policy` 패널과 queue button 추가
- [x] API unittest가 sandbox network deny와 high-risk approval gate를 검증
- [ ] 실제 ephemeral container 실행 backend 구현
- [x] 실제 CLI wrapper manifest/hash preflight와 execution plan 연결 - slice 25 완료
- [ ] 실제 CLI version command evidence 수집 및 pinned expected_sha256 운영 UI
- [ ] live 5177/8765 browser execution-plan smoke

## 33. Slice 25 CLI Wrapper Manifest / Hash Preflight 체크리스트

- [x] `/tool-wrapper-manifests` endpoint 추가
- [x] `/tool-wrapper-manifests/{tool_id}` endpoint 추가
- [x] ToolProfile별 command availability, resolved path, actual SHA-256, expected SHA-256, pinning status 계산
- [x] import-only 도구는 `pinning_status=import_only`, runner trusted로 분리
- [x] CLI/API wrapper 도구는 expected hash 미설정 시 `hash_unpinned` 또는 missing으로 표시하고 runner trust를 보류
- [x] version probe는 registry read API에서 실행하지 않고 `not_executed_safe_manifest_only`로 기록
- [x] `analysis-tools` 응답에 `wrapper_manifest`, `pinning_status`, hash pin 필요 runtime status 반영
- [x] `ToolExecutionPlan`에 `wrapper_manifest`, `wrapper_preflight`, `wrapper_sha256_pin_required_before_runner_execution` warning 연결
- [x] `레드팀 분석2` UI에 `Tool Wrapper Manifest / Version Pinning` 패널 추가
- [x] API unittest가 manifest registry, import-only trust, sandbox execution plan preflight를 검증
- [x] operator-attested version evidence 수집 UI - slice 26 완료
- [x] expected_sha256 pin 등록/승인 workflow - slice 26 완료
- [x] execution-plan runner token hard-block foundation - slice 27 완료
- [x] approved dry-run/sandbox runner subprocess backend foundation - slice 28 완료
- [x] tool install readiness/onboarding registry - slice 29 완료
- [x] container/ephemeral runner isolation readiness gate - slice 30 완료
- [x] gated ephemeral container launcher dry-run backend - slice 31 완료
- [ ] 실제 container/ephemeral runner isolation backend
- [ ] live 5177/8765 browser wrapper manifest smoke

## 34. Slice 26 Expected Wrapper Hash Pin Approval Workflow 체크리스트

- [x] `/tool-wrapper-pins/{tool_id}/request` endpoint 추가
- [x] `/tool-wrapper-pins/{tool_id}/approve` endpoint 추가
- [x] pin request artifact에 expected SHA-256, manifest snapshot, operator-attested version evidence 저장
- [x] registry read API는 계속 version command를 실행하지 않도록 유지
- [x] 승인은 `red_team_lead` actor binding/RBAC로 제한
- [x] 승인된 pin을 `tool-wrapper-pins` trust registry artifact로 저장
- [x] manifest가 approved pin을 읽어 `expected_sha256_source=approved_pin`으로 반영
- [x] import-only 도구의 wrapper pin 요청 거부
- [x] `레드팀 분석2` UI에서 Request Pin / Approve Pin 실행 및 version evidence 입력 가능
- [x] API unittest가 pin request, unauthorized approval reject, approved pin manifest 반영, import-only reject를 검증
- [x] approved pin revoke/rotate workflow - slice 27 완료
- [x] execution-plan runner token hard-block enforcement - slice 27 완료
- [ ] live 5177/8765 browser wrapper pin smoke

## 35. Slice 27 Wrapper Pin Revoke/Rotate and Runner Hard-Block 체크리스트

- [x] `/tool-wrapper-pins/{tool_id}/revoke` endpoint 추가
- [x] revoked pin은 manifest approved pin lookup에서 제외
- [x] pin request가 기존 approved pin을 감지하면 rotate warning 기록
- [x] 새 pin approval이 기존 trust registry pin을 교체하는 rotate path 검증
- [x] red_team_lead actor binding으로 pin revoke 제한
- [x] revoke artifact와 revoked pin artifact 저장
- [x] `ToolExecutionPlan`에서 sandbox/local_cli/api runner가 wrapper preflight 실패 시 execution token을 `blocked`로 고정
- [x] preflight blocked plan은 `status=preflight_blocked`, `policy_decision=deny_runner`로 표시
- [x] `레드팀 분석2` UI에 `Revoke Pin` 버튼과 revoke status row 추가
- [x] API unittest가 rotate, revoke, manifest approved_pin 제외, runner hard-block을 검증
- [x] approved dry-run/sandbox runner subprocess backend foundation - slice 28 완료
- [x] container/ephemeral runner isolation readiness gate - slice 30 완료
- [x] gated ephemeral container launcher dry-run backend - slice 31 완료
- [ ] 실제 container/ephemeral runner isolation backend
- [ ] live 5177/8765 browser wrapper revoke/hard-block smoke

## 36. Slice 28 Approved Runner Backend Preflight 체크리스트

- [x] `execute-governed`가 `runner_argv`/`runner_command` 수신 시 governed runner attempt 생성
- [x] runner 실행 전 `execution_plan_id` 존재와 artifact lookup 검증
- [x] execution token이 `issued`이고 token id가 일치해야 runner 실행 가능
- [x] `PlanReady`와 `policy_decision=allow_plan`이 아니면 subprocess 실행 차단
- [x] wrapper manifest가 여전히 pin 필요 상태이면 runner 실행 차단
- [x] dry_run/sandbox_execute 외 execution mode의 runner command 실행 차단
- [x] child process allowlist는 ToolProfile `command_name` 또는 resolved wrapper basename으로 제한
- [x] `shell=false`, timeout, max output bytes, stdout/stderr artifact sha256 저장
- [x] `레드팀 분석2` Tool Execution Plan 패널에서 governed runner argv 입력과 실행 버튼 제공
- [x] API unittest가 unissued token 차단과 approved npm sandbox dry-run output capture를 검증
- [x] container/ephemeral isolation readiness와 attestation blocker를 execution plan에 노출 - slice 30 완료
- [x] issued token 이후 gated ephemeral container launcher dry-run artifact 생성 - slice 31 완료
- [ ] 실제 container/ephemeral isolation, network namespace enforcement, cgroup/resource limit enforcement
- [ ] live 5177/8765 browser governed runner smoke

## 37. Slice 29 Tool Install Readiness and Onboarding 체크리스트

- [x] Nuclei/OpenVAS/Trivy/SCA/npm audit/OWASP ZAP install readiness catalog 추가
- [x] `/tool-install-readiness` endpoint 추가
- [x] `/tool-install-readiness/{tool_id}` endpoint 추가
- [x] readiness status를 `install_required`, `hash_pin_required`, `runner_ready`, `verification_failed`, `import_only_ready` 등으로 분리
- [x] operator install/verification commands는 API가 실행하지 않고 plan으로만 노출
- [x] post-install controls에 wrapper SHA-256 pin, lab scope, import/schema validation, active scan approval 조건 기록
- [x] Evidence pipeline에 normalizer id, analysis agent id, evidence type, `trusted_as_instruction=false` 표시
- [x] `analysis-tools` 응답에 `install_readiness` 포함
- [x] `레드팀 분석2` ToolHub 패널에 Install Readiness와 Selected Install 표 추가
- [x] API unittest가 required tools readiness, operator-run install plan, import-only SCA readiness를 검증
- [ ] 실제 installer/orchestrator는 operator approval 및 별도 package manager policy 이후 구현
- [ ] live 5177/8765 browser install readiness smoke

## 38. Slice 30 Container Runner Isolation Readiness Gate 체크리스트

- [x] `/runner-isolation-readiness` endpoint 추가
- [x] `runner_backend=ephemeral_container` 선택 시 container runtime, image digest, network policy, mount policy, cleanup attestation 필요 조건 산출
- [x] readiness API는 docker/container 명령을 실행하지 않고 `commands_executed_by_api=false`를 보장
- [x] `ToolExecutionPlan.environment_constraints.isolation_readiness`에 runner backend, required controls, blocking controls, evidence pipeline 포함
- [x] ephemeral container backend가 attestation 전이면 execution token을 `blocked`로 유지하고 `policy_decision.runner_isolation_blocked=true` 기록
- [x] 기존 dry-run/sandbox local subprocess shim은 회귀 보존하되 transitional backend로 명시
- [x] `레드팀 분석2` Case 입력에 Runner Backend 선택 추가
- [x] `레드팀 분석2` Tool Execution Plan 패널에 Isolation status/card/table 추가
- [x] API unittest가 isolation readiness endpoint와 container backend preflight block을 검증
- [x] issued token 이후 ephemeral container launcher command 구성 및 dry-run artifact 저장 - slice 31 완료
- [ ] 실제 ephemeral container launcher 실측 실행
- [ ] container network namespace/egress enforcement 실측 검증
- [ ] cgroup/resource limit, read-only rootfs, secret mount 차단 실측 검증
- [ ] live 5177/8765 browser runner backend smoke

## 39. Slice 31 Gated Ephemeral Container Launcher Dry-Run 체크리스트

- [x] `execute-governed` runner path에서 `ephemeral_container` backend 분기 추가
- [x] container backend는 host wrapper SHA-256 pin 대신 image digest attestation을 trust root로 사용
- [x] PlanReady와 issued execution token 없이는 container launcher가 동작하지 않음
- [x] Docker/Podman command는 `--rm`, `--network none`, `--read-only`, `--cap-drop ALL`, `no-new-privileges`, CPU/memory/pids limit, read-only workspace mount, case write mount로 구성
- [x] `REDTEAM_AX_CONTAINER_RUNNER_DRY_RUN=1` 또는 payload `container_dry_run=true`일 때 Docker를 호출하지 않고 launch plan artifact만 저장
- [x] container launch plan artifact는 `trusted_as_instruction=false` JSON evidence로 저장
- [x] `execute-governed` 응답에 `ContainerLaunchPrepared` 상태 추가
- [x] `레드팀 분석2` runner 결과 표에 backend와 container launch 정보를 표시
- [x] API unittest가 attested container PlanReady, issued token, dry-run launch plan artifact를 검증
- [x] container launch artifact agent-analyze 및 Evidence Card 생성 E2E - slice 32 완료
- [x] container stdout scanner result normalizer E2E - slice 33 완료
- [ ] 실제 Docker/Podman runtime 실행 smoke
- [ ] allowlist egress를 `--network none` 이상으로 통제할 전용 network policy 구현
- [ ] real runtime container stdout/stderr scanner result smoke
- [ ] live 5177/8765 browser container dry-run smoke

## 40. Slice 32 Container Launch Evidence Normalization E2E 체크리스트

- [x] runner artifact reader가 `source_path_or_ref` 로컬 파일도 hash 검증 후 읽도록 보강
- [x] `ContainerLaunchPrepared` 상태의 ToolRunRecord를 `agent-analyze` 대상 상태로 허용
- [x] `redteam_ax_v2_container_launch_plan` JSON parser 추가
- [x] container launch plan을 `container_launch_evidence` structured item으로 정규화
- [x] 정규화 항목에 image digest, runtime, network deny, read-only rootfs, dropped capabilities, no-new-privileges, mount/resource limits, dry-run 상태 포함
- [x] container launch evidence는 `trusted_as_instruction=false`, `requires_human_validation=true`를 강제
- [x] `/tool-runs/{run_id}/create-evidence`가 container launch normalized result를 Evidence Card Draft로 승격
- [x] API unittest가 ContainerLaunchPrepared -> agent-analyze -> Evidence Card E2E를 검증
- [x] dry-run container stdout Trivy scanner result를 tool-specific parser로 연결 - slice 33 완료
- [ ] 실제 container stdout/stderr scanner result를 runtime smoke로 검증
- [ ] live 5177/8765 browser evidence creation smoke

## 41. Slice 33 Container Stdout Scanner Result Normalization E2E 체크리스트

- [x] dry-run container launcher가 `container_mock_stdout`/`container_mock_stderr`를 runner stdout/stderr artifact로 저장
- [x] container launch plan과 scanner stdout이 같은 ToolRunRecord에 공존
- [x] parser가 `container_launch_plan+trivy_json`처럼 launch evidence와 scanner parser 결과를 결합
- [x] structured items에 `container_launch_evidence`와 `sca_vulnerability_candidate`를 동시에 포함
- [x] 모든 combined structured item은 `trusted_as_instruction=false`, `requires_human_validation=true`
- [x] Evidence Card candidate가 combined normalized result를 보존
- [x] API unittest가 ContainerLaunchPrepared -> stdout artifact -> agent-analyze -> Evidence Card E2E를 검증
- [x] Nuclei/ZAP/OpenVAS container stdout dry-run parser smoke - slice 34 완료
- [ ] 실제 Docker/Podman stdout/stderr artifact로 동일 E2E smoke
- [ ] Nuclei/ZAP/OpenVAS 실제 runtime container stdout/stderr parser smoke

## 42. Slice 34 Nuclei ZAP OpenVAS Container Stdout Parser Smoke 체크리스트

- [x] Nuclei container stdout fixture가 `container_launch_plan+nuclei_jsonl`로 정규화
- [x] ZAP container stdout fixture가 `container_launch_plan+zap_json`으로 정규화
- [x] OpenVAS container stdout fixture가 `container_launch_plan+openvas_xml`로 정규화
- [x] 각 normalized result가 `container_launch_evidence`와 `scanner_finding_candidate`를 동시에 포함
- [x] 각 scanner candidate는 `trusted_as_instruction=false`, `requires_human_validation=true`
- [x] 각 run에서 Evidence Card candidate 생성까지 검증
- [x] Nuclei parser가 container launch JSON을 scanner finding 후보로 오인하지 않도록 hardening - slice 35 완료
- [ ] 실제 Docker/Podman stdout/stderr artifact로 Nuclei/ZAP/OpenVAS smoke
- [ ] live 5177/8765 browser parser smoke

## 43. Slice 35 Nuclei Parser Launch JSON Hardening 체크리스트

- [x] Nuclei JSONL normalizer가 `template-id`/`template_id`/`template` 또는 `info`가 없는 JSON 객체를 finding 후보에서 제외
- [x] container launch plan JSON은 `container_launch_evidence`로만 남고 `scanner_finding_candidate`로 중복 승격되지 않음
- [x] Nuclei/ZAP/OpenVAS container stdout parser smoke에서 scanner candidate가 정확히 1개인지 회귀 검증
- [x] 실제 Docker runtime smoke harness 추가 및 현재 daemon blocker evidence 기록 - slice 36 완료
- [ ] Docker daemon ready 상태에서 `--allow-real` 실제 stdout/stderr smoke 통과
- [ ] live 5177/8765 browser parser smoke

## 44. Slice 36 Real Container Runtime Smoke Harness 체크리스트

- [x] `고도화/sanity/redteam_ax_container_runtime_smoke.py` 추가
- [x] 기본 실행은 Docker/Podman 컨테이너를 실행하지 않고 runtime daemon/image/readiness를 preflight로 기록
- [x] `--allow-real` 또는 `REDTEAM_AX_REAL_CONTAINER_SMOKE=1` 없이는 실제 컨테이너 실행 차단
- [x] local image digest가 없으면 pull 없이 `blocked_container_image_digest_not_available_locally`로 차단
- [x] 실제 실행 opt-in 시 FastAPI `ephemeral_container` runner path를 사용해 stdout/stderr raw artifact capture 검증
- [x] 현재 환경 증거: Docker CLI는 있으나 daemon은 `Server:null`, `Docker Desktop is unable to start`
- [x] smoke artifact: `archive/runs/redteam-ax-v2-runtime-smoke/latest_container_runtime_smoke.json`
- [x] live browser/parser smoke readiness harness 추가 및 5177 blocker evidence 기록 - slice 37 완료
- [ ] Docker Desktop/daemon ready 후 `--allow-real --require-real` 실측 통과
- [ ] Trivy/Nuclei/ZAP/OpenVAS 실제 scanner result stdout parser E2E
- [ ] 5177 frontend ready 후 `--allow-browser --require-live` browser parser smoke 통과

## 45. Slice 37 Live Browser Parser Smoke Readiness 체크리스트

- [x] `고도화/sanity/redteam_ax_live_browser_parser_smoke.py` 추가
- [x] 기본 실행은 브라우저 자동화 없이 `5177/8765` readiness evidence 기록
- [x] `--allow-browser` 또는 `REDTEAM_AX_LIVE_BROWSER_SMOKE=1` 없이는 Playwright browser automation 차단
- [x] 현재 환경 증거: `8765` v1/v2 health ready, `5177` not listening
- [x] smoke artifact: `archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json`
- [x] evidence field가 `commands_executed_by_api=false`, `trusted_as_instruction=false`, `requires_human_validation=true` 유지
- [x] `5177` frontend ready 후 `--allow-browser --require-live` 실측 통과 - slice 38 완료
- [x] Report Studio `레드팀 분석2` DOM/parser evidence smoke - slice 38 완료

## 46. Slice 38 Live Report Studio RedTeam2 Browser Smoke 체크리스트

- [x] Vite frontend를 `http://127.0.0.1:5177/`에서 live 기동해 readiness 확인
- [x] backend `http://127.0.0.1:8765/api/redteam/v2/health` ready 상태와 함께 browser smoke 수행
- [x] Playwright가 `보고서 스튜디오` 메뉴를 열고 `레드팀 분석2` 탭으로 이동
- [x] DOM에서 `레드팀 분석2`, `RedTeam AX v2`, `ToolActionCard`, `HITL`, `Evidence Card`/`Claim-Evidence Matrix` 확인
- [x] `고도화/sanity/redteam_ax_live_browser_parser_smoke.py --allow-browser --require-live` exit 0 통과
- [x] smoke artifact: `archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json`
- [x] ToolActionCard 계획 생성 버튼 클릭 후 API 생성 결과와 queue/HITL/ROE DOM 반영 검증 - slice 39 완료
- [x] Request Approval 클릭 후 approval queue 상태와 승인 전 runner 차단 DOM 검증 - slice 41 완료

## 47. Slice 39 Live ToolActionCard Planning Browser Smoke 체크리스트

- [x] `고도화/sanity/redteam_ax_live_browser_parser_smoke.py`에 `--allow-action` opt-in 추가
- [x] 기본 `--allow-browser` DOM smoke는 기존처럼 runner/action을 클릭하지 않음
- [x] `--allow-action`은 `보고서 스튜디오` -> `레드팀 분석2` -> `ToolActionCard 계획`까지만 클릭하고 governed runner는 클릭하지 않음
- [x] `/api/redteam/v2/tool-actions/plan` 200 응답과 `TAC-*` action id를 browser smoke artifact에 요약 저장
- [x] DOM에서 `Request Approval`, `ROE`, `HITL`, `ToolActionCard` 표시 확인
- [x] API 응답 본문 전체를 저장하지 않고 endpoint/status/kind/actionId 요약으로 잘림 없는 JSON evidence 유지
- [x] `archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json` status `passed`, blockers `[]`
- [x] 현재 live backend에서 RedTeam2 경로는 통과하지만 `/api/malax/latest`, `/api/malax/runs`는 SQLite `disk I/O error` 500을 기록함
- [x] MALAX sqlite disk I/O error의 UI polling 500 noise 격리 - slice 40 완료
- [ ] MALAX sqlite disk I/O error의 workspace/storage 원인 격리 및 복구

## 48. Slice 40 MALAX Bridge Degraded Response 체크리스트

- [x] `/api/malax/latest`가 MALAX core RecordStore 오류를 만나도 HTTP 500 대신 `degraded=true` payload 반환
- [x] `/api/malax/latest` degraded payload는 내부 경로를 노출하지 않고 `core_bridge_error_type`과 `reason=malax_core_unavailable`만 반환
- [x] `/api/malax/runs`가 MALAX core RecordStore 오류를 만나도 legacy run fallback 배열을 반환
- [x] `tests/test_malax_bridge_degraded.py`가 SQLite `OperationalError` 회귀를 검증
- [x] RedTeam v2 API 라우터 회귀 42개 통과
- [x] 실제 live backend에서 `/api/malax/latest`, `/api/malax/runs` polling 500 로그가 사라지는지 확인
- [x] polling이 있는 live Report Studio에서 browser smoke가 `networkidle`에 묶이지 않도록 `domcontentloaded` 기준으로 안정화
- [x] Request Approval 클릭 후 approval queue 상태와 승인 전 runner 차단 DOM 검증 - slice 41 완료
- [x] 승인 grant 후 `Run in Lab` 노출과 manual-run-only evidence upload requirement 검증 - slice 42 완료

## 49. Slice 41 Live Approval Queue Browser Smoke 체크리스트

- [x] `고도화/sanity/redteam_ax_live_browser_parser_smoke.py`에 `--allow-approval-request` opt-in 추가
- [x] `--allow-approval-request`는 `--allow-action` 없이는 차단되어 ToolActionCard 계획 없이 승인 요청하지 않음
- [x] Playwright가 `ToolActionCard 계획` 후 `Request Approval` 버튼만 클릭하고 approval grant는 수행하지 않음
- [x] `/api/redteam/v2/tool-actions/{action_id}/request-approval` 200 응답과 `ApprovalRequested` 상태를 evidence에 저장
- [x] approval queue DOM에서 `ApprovalRequested` 상태와 required approver role 표시 확인
- [x] 승인 전 `Execute Governed Runner` 버튼이 visible이지만 disabled임을 검증
- [x] `governedRunnerNotClicked=true`, `commands_executed_by_api=false`, `trusted_as_instruction=false`, `requires_human_validation=true` 유지
- [x] `archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json` status `passed`, blockers `[]`

## 50. Slice 42 Live Approval Grant Gate Smoke 체크리스트

- [x] `고도화/sanity/redteam_ax_live_browser_parser_smoke.py`에 `--allow-approval-grant` opt-in 추가
- [x] `--allow-approval-grant`는 `--allow-approval-request` 없이는 차단되어 승인 요청 없이 승인 grant를 수행하지 않음
- [x] RedTeam2 approval queue 카드에 `Approve HITL` 버튼 추가
- [x] Playwright가 `Approve HITL` 클릭 후 `/api/redteam/v2/tool-actions/{action_id}/approve` 200 응답과 `Approved` 상태 검증
- [x] 승인된 action의 `allowed_buttons`에 `Run in Lab` 포함 확인
- [x] 승인요청 직후 DOM 스냅샷으로 `ApprovalRequested`, required approver, 승인 전 runner disabled 상태를 보존 검증
- [x] runner 실행 없이 `/manual-run-record`에 빈 `uploaded_artifacts`를 제출해 `uploaded_artifacts_required` evidence gate 확인
- [x] `governedRunnerNotClicked=true`, `governedRunnerNotExecuted=true`, `commands_executed_by_api=false` 유지
- [x] `archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json` status `passed`, blockers `[]`
- [x] valid manual run artifact upload/import -> Evidence Card candidate -> Claim-Evidence Matrix link - slice 43 완료

## 51. Slice 43 Live Manual Artifact Evidence Matrix Smoke 체크리스트

- [x] Agentic RAG 정본 기준 `Agentic RAG SPEC`의 핵심 요구인 claim-citation/evidence 연결과 unsupported claim 차단을 smoke 범위에 반영
- [x] `고도화/sanity/redteam_ax_live_browser_parser_smoke.py`에 `--allow-evidence-matrix` opt-in 추가
- [x] `--allow-evidence-matrix`는 `--allow-approval-grant` 없이는 차단되어 승인 없는 수동 산출물 증거화를 수행하지 않음
- [x] 승인된 ToolActionCard에 대해 operator-provided `uploaded_artifacts`가 있는 valid ManualRunRecord 생성 검증
- [x] ToolRunRecord `import-output`으로 image/json artifact metadata를 raw artifact로 등록
- [x] ToolRunRecord `normalize`로 visual_capture Evidence Pack 후보를 생성하고 exploit success 단정 금지 limitation 유지
- [x] `/tool-runs/{run_id}/create-evidence`로 Evidence Card candidate 생성 검증
- [x] red_team_lead actor binding으로 Evidence Card approval 완료 검증
- [x] supported claim이 approved evidence ID를 참조하는 Korean Red Team Report v2 draft 생성 검증
- [x] report validation gate에서 `unsupported_claim_count=0`, `unapproved_high_risk_count=0`, `finding_without_evidence_count=0`, `unapproved_evidence_count=0`, `unverified_evidence_count=0`, `blocking_items=[]` 확인
- [x] 보고서 섹션에 `Claim-Evidence Matrix` 포함 확인
- [x] `governedRunnerNotClicked=true`, `governedRunnerNotExecuted=true`, `commands_executed_by_api=false` 유지
- [x] `archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json` status `passed`, blockers `[]`
- [x] Agentic RAG SPEC 기반 corpus routing / SCA sufficient context / citation verifier API smoke를 RedTeam AX evidence store와 연결 - slice 44 완료

## 52. Slice 44 Agentic RAG SCA Citation Verifier API 체크리스트

- [x] Agentic RAG 정본 경로를 `Agentic RAG SPEC`으로 확인하고 F-014 SCAReport/F-016 citation verifier 요구 반영
- [x] `/api/redteam/v2/cases/{case_id}/agentic-rag/query` API 추가
- [x] 승인된 EvidenceCard만 `redteam_ax_v2_evidence_store` citation 후보로 사용
- [x] corpus routing 결과에 `redteam_ax_v2_evidence_store`, `agentic_rag_spec`, `redteam_ax_spec` 포함
- [x] SCA/도구 관련 질의는 `toolchain_sca_policy` corpus로 확장
- [x] 모든 material claim이 approved/verified evidence ID에 연결되면 `decision=sufficient`
- [x] 승인 증거가 없거나 claim evidence가 미승인/미검증이면 `decision=retrieve_again`
- [x] citation verifier가 unsupported claim count와 missing facts를 반환
- [x] 결과는 `commands_executed_by_api=false`, `trusted_as_instruction=false`, `requires_human_validation=true` 유지
- [x] API 결과를 case artifact `agentic-rag-results`에 저장
- [x] v2 API 회귀 테스트에 sufficient/retrieve_again 양쪽 smoke 추가
- [x] Report Studio `레드팀 분석2`에 Agentic RAG/SCA 패널 연결 및 live browser smoke 추가 - slice 45 완료

## 53. Slice 45 RedTeam2 Agentic RAG SCA UI/Browser Smoke 체크리스트

- [x] `레드팀 분석2` 기본 draft에 Agentic RAG SCA query와 material claim draft 입력값 추가
- [x] `레드팀 분석2`에 `Agentic RAG SCA / Citation Verifier` 패널 추가
- [x] 패널에서 승인된 EvidenceCard를 준비한 뒤 `/api/redteam/v2/cases/{case_id}/agentic-rag/query` 호출
- [x] SCA decision, answerability, citation count, unsupported claim count, selected corpora를 UI 표로 표시
- [x] `commands_executed_by_api=false`, `trusted_as_instruction=false`, `requires_human_validation=true` safe-by-default 상태 표시
- [x] live browser smoke에 `--allow-agentic-rag` opt-in 추가
- [x] browser smoke가 Agentic RAG SCA 버튼, API 응답, citation verifier, no-runner invariant를 검증
- [x] Agentic RAG 결과를 Report v2 draft의 Claim-Evidence Matrix 후보로 자동 반영하고 unsupported claim 보류 UI 추가 - slice 46 완료

## 54. Slice 46 Agentic RAG Claim-Evidence Matrix Candidate 체크리스트

- [x] Agentic RAG SCA 결과가 `sufficient`이고 unsupported claim이 0이면 `ready_for_report_claim` 후보 생성
- [x] 후보 claim ID와 approved evidence IDs를 Report v2 draft 입력값에 자동 반영
- [x] Report v2 payload가 준비된 Agentic RAG 후보를 `agentic_rag_sca_citation_verifier` source로 사용
- [x] Agentic RAG 결과가 unsupported이면 `hold_unsupported_claim` 상태로 표시
- [x] `hold_unsupported_claim` 상태에서는 Report v2 draft 생성 전 차단
- [x] UI 표에 `Claim-Evidence Matrix Candidate`와 `Unsupported Claim Hold` 상태 표시
- [x] live browser smoke가 candidate visible, hold clear, no-runner invariant를 검증
- [x] Report v2 artifact에 Agentic RAG citation verifier metadata와 보류 claim 감사 로그를 영구 기록 - slice 47 완료

## 55. Slice 47 Agentic RAG Report v2 Metadata Persistence 체크리스트

- [x] 정본 경로를 `SPEC/05_AGENTIC_RAG_SPEC.md` 및 `Agentic RAG SPEC`로 확인하고 SCA score 0.82 미만 보류, unsupported material claim 0건 원칙을 반영
- [x] Report v2 validation에 `agentic_rag_context`, `agentic_rag_report_usable`, unsupported/held claim count 추가
- [x] Agentic RAG citation verifier가 실패하거나 `hold_unsupported_claim`이면 Report gate blocking item으로 차단
- [x] Report v2 Markdown artifact에 `Agentic RAG Citation Verifier` 섹션과 selected corpus/citation/matrix candidate 메타데이터 기록
- [x] 보류된 Agentic RAG claim은 `audit.jsonl`에 `agentic_rag_claim_hold` 이벤트로 영구 기록
- [x] Report Studio `레드팀 분석2` payload가 Agentic RAG result/sca/citation/matrix candidate를 Report v2 API에 전달
- [x] Agentic RAG/도구 허브/Report Gate 핵심 표시를 한국어 사용자 기준으로 보강
- [x] live browser smoke가 Agentic RAG 검증 후 Report v2 생성, Agentic RAG report section, held claim 0건을 확인하도록 확장
- [x] Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 도구 실행 가이드를 초급자 친화적으로 보강 - slice 48 완료

## 56. Slice 48 Korean Beginner Scanner Tool Guidance 체크리스트

- [x] `SPEC/24_OPEN_SOURCE_TOOL_INTEGRATION_CATALOG.md`의 도구 위험등급과 기본 정책을 UI 안내 기준으로 재확인
- [x] `SPEC/25_TOOL_ACTION_CARD_AND_WEBAPP_SPEC.md`의 “버튼 실행 전 위험도와 승인 조건 표시” 요구를 Report Studio `레드팀 분석2`에 반영
- [x] 분석도구 선택 영역의 핵심 라벨을 `위험 등급`, `승인 범위 ID`, `분석도구`, `실행 방식`, `실행 환경`으로 한국어화
- [x] 선택 도구 설치/검증 표를 한국어 사용자 기준으로 재작성
- [x] `분석도구 실행 안내` 패널 추가: 선택 도구 설명, 처음 할 일, 안전한 실행 모드, 금지/주의 옵션, Evidence 연결을 표시
- [x] Nuclei/OpenVAS/Trivy/SCA/npm audit/OWASP ZAP 각각에 초급자용 다음 절차와 안전 모드 설명 추가
- [x] browser smoke DOM 체크에 scanner guidance 확인 추가
- [x] wrapper/execution-plan/runner 영역 설명을 초급자 친화적으로 보강 - slice 49 완료

## 57. Slice 49 Korean Wrapper Execution Runner Guidance 체크리스트

- [x] `SPEC/26_TOOL_EXECUTION_SANDBOX_AND_APPROVAL_SPEC.md`의 Plan-only, sandbox, lab, manual/controlled execution 분리 원칙 재확인
- [x] `SPEC/31_TOOLING_SECURITY_POLICY_SPEC.md`의 승인 없는 high-risk 실행 차단, tool output은 evidence candidate라는 원칙을 UI 안내에 반영
- [x] `도구 래퍼 신뢰 고정 / 버전 확인` 패널로 제목과 설명을 한국어 사용자 기준으로 변경
- [x] 래퍼 해시, 버전 확인, 신뢰 고정 요청/승인/해제 버튼을 한국어로 정리
- [x] `도구 실행 계획 / 샌드박스 정책` 패널로 제목과 설명을 한국어 사용자 기준으로 변경
- [x] 실행 계획, 네트워크, 파일시스템, 래퍼, 격리, 실행 토큰 표를 한국어화
- [x] 통제 실행 명령과 승인된 실행 시작 버튼을 한국어화하고 기존 smoke와 호환되는 한영 정규식 유지
- [x] browser smoke DOM 체크에 runner/wrapper guidance 확인 추가
- [x] 다음 slice: sanitizer, visual evidence, file upload, RBAC/report metadata 영역의 잔여 영문 라벨을 한국어 사용자 수준으로 정리 - slice 50 완료

## 58. Slice 50 Korean Sanitizer / Evidence / RBAC Report UX 체크리스트

- [x] `도구 출력 Sanitizer 미리보기` 패널에 도구 결과는 LLM 명령이 아니라 분석 자료라는 초급자용 설명 추가
- [x] sanitizer 입력 라벨, 버튼, 카드, 표 머리글과 판정/프롬프트 인젝션/비밀값/사람 검토 행을 한국어화
- [x] `시각 증거 OCR 마스킹 미리보기` 패널에 스크린샷 단독 주장 제한과 비시각 Evidence 연결 안내 추가
- [x] 시각 증거 업로드 버튼, OCR/마스킹 카드, 스크린샷 단독 주장/제한 증거 검토 행을 한국어화
- [x] `도구 결과 파일 업로드` 패널에 Nuclei/OpenVAS/Trivy/SCA/npm audit/OWASP ZAP 결과 파일 업로드와 LLM 명령 불신 원칙 설명 추가
- [x] 파일 업로드 상태, 해시, 저장 산출물, 스키마 검증, 파서, 명령 불신 행을 한국어화
- [x] `케이스 RBAC 정책`, `평가 맥락`, Report v2 메타데이터 라벨을 한국어 사용자 기준으로 정리
- [x] ToolActionCard 대기열 버튼과 가드레일/Evidence 게이트 제목·표 머리글을 한국어화
- [x] browser smoke DOM 체크에 sanitizer, visual evidence, file upload, RBAC/report metadata guidance 확인 추가
- [x] 다음 slice: Agentic RAG, ToolActionCard 상태값, severity/role 선택지 등 남은 내부 상태값의 한국어 display mapping을 별도 helper로 정리 - slice 51 완료

## 59. Slice 51 Korean Display Mapping Helper 체크리스트

- [x] RedTeam2 패널 안에 API 원본 값과 화면 표시값을 분리하는 `koValue`, `koRole`, `koSeverity`, `koExecutionMode`, `koRunnerBackend`, `koRiskClass` helper 추가
- [x] ToolActionCard 대기열의 상태, 승인 방식, 필수 승인 역할, 위험 등급 표시를 한국어화
- [x] RBAC 정책 표와 역할 선택지를 `레드팀 리드`, `업무 소유자`, `최종 후원자` 등 한국어 display label로 변경
- [x] Report v2 심각도 선택지를 `정보`, `낮음`, `보통`, `높음`, `긴급`으로 변경하되 payload 값은 기존 코드값 유지
- [x] Agentic RAG SCA, 인용 검증, Claim-Evidence Matrix 후보, 명령 신뢰/사람 검토 행을 한국어 display mapping으로 변경
- [x] 실행 계획, 격리, runner, sanitizer, visual evidence, file upload 상태값에 한국어 display mapping 적용
- [x] browser smoke DOM 체크에 `koreanDisplayMapping` 확인 추가
- [ ] 다음 slice: smoke artifact/body encoding mojibake 원인 점검과 한국어 DOM 추출 안정화
