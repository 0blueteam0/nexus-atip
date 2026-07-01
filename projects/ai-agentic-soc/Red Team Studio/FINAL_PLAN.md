# FINAL_PLAN - RedTeam AX 목표 수행 실행 계획

상태: implementation slice 4 approval queue/UI reload complete, full goal active  
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

- `soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` - slice 4 approval queue/UI reload 반영
- 필요 시 `src/data.js`, `src/views/ReportsView.jsx`

Backend:

- `runtime/redteam_v2_api_router.py` - slice 4 approval queue endpoints 반영
- `runtime/redteam_v2_models.py` - slice 4 approval queue persistence/UI reload API 반영
- `runtime/redteam_v2_policy.py`
- `runtime/redteam_v2_tool_actions.py`
- `runtime/redteam_v2_report_validator.py`
- `runtime/malware_upload_api.py` router include 지점 - slice 1 반영

Tests:

- `tests/test_redteam_v2_api_router.py` - slice 4 approval queue/reload 반영
- `tests/test_redteam_v2_sample_e2e.py` - slice 4 approval queue/reload 반영
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

상태: approval queue persistence/UI reload API 완료, full workflow 진행 중

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

남은 작업:

- ToolProfile registry
- normalizer/import-output API
- 승인자 권한 모델 및 2인 승인 강제 정책

### M4. Evidence/Claim/Report v2

상태: minimal report artifact 완료, full renderer 진행 중

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

남은 작업:

- human approval 후 export route
- Volkis식 상세 campaign timeline 확장
- 악성코드 보고서식 문서 통제 metadata 확장

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
- persistent case workspace와 실제 report artifact 저장 연동
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
- report validation blocker 존재: export 불가.
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
- [ ] final approved export route
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
- [ ] approved export API
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
- [ ] 권한/역할 기반 승인자 검증
- [ ] T5/controlled production 2인 승인 hard gate
- [ ] approved export API
- [ ] normalizer/import-output API
