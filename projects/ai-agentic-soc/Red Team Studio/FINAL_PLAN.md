# FINAL_PLAN - RedTeam AX 목표 수행 실행 계획

상태: implementation slice 1 complete, full goal active  
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

- `soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` - slice 1 반영
- 필요 시 `src/data.js`, `src/views/ReportsView.jsx`

Backend:

- `runtime/redteam_v2_api_router.py` - slice 1 반영
- `runtime/redteam_v2_models.py` - slice 1 반영
- `runtime/redteam_v2_policy.py`
- `runtime/redteam_v2_tool_actions.py`
- `runtime/redteam_v2_report_validator.py`
- `runtime/malware_upload_api.py` router include 지점 - slice 1 반영

Tests:

- `tests/test_redteam_v2_api_router.py` - slice 1 반영
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

- Playwright screenshot으로 5177 live UI에서 `레드팀 분석`과 `레드팀 분석2` 동시 표시 확인
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

### M3. ToolActionCard 중심 실행 통제

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

### M4. Evidence/Claim/Report v2

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

### M5. Sample E2E and regression

작업:

- loopback lab 또는 fixture 기반 sample case
- frontend/backend 동시 smoke
- sample report generation
- security regression

완료 기준:

- sample E2E 통과
- frontend build 통과
- backend pytest 통과
- report validation 0 blocker

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
& .venv/Scripts/python.exe tests/test_redteam_api_router.py
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
- [ ] live 5177/8765 smoke
- [ ] sample case E2E
- [ ] release/security/report gate full regression
