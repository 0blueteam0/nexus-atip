---
type: scope
task_id: KW-20260701-125421-Red-Team-Studio-Implement-RedTeam-AX-v2-persistent-approval-queue-and-UI-reload
project: Red Team Studio
task: Implement RedTeam AX v2 persistent approval queue and UI reload
created: 2026-07-01T12:54:21+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Describe the user's request as an operational task.

## Included

- 

## Excluded

- Only explicitly excluded items belong here. Default is include.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
|  |  |  |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
|  |  |  |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.

## Codex Scope Addendum

User intent: RedTeam AX v2의 ToolActionCard가 파일 artifact로 저장된 뒤 웹앱에서 다시 호출 가능해야 하며, 고위험 실행은 Request Approval -> Approve/Reject 상태 전이를 거친 뒤에만 후속 수동 수행으로 이어져야 한다.

Included:

- `/api/redteam/v2/tool-actions` case별 목록 조회 API.
- `/api/redteam/v2/tool-actions/{action_id}` 단건 재조회 API.
- `/request-approval`, `/approve` 승인 큐 API와 JSON artifact 저장.
- `레드팀 분석2` 상태 새로고침 시 backend persistence queue 로드.
- `레드팀 분석2` Queue의 Request Approval 버튼과 backend API 연결.
- API, sample E2E, Vite build, live API/browser smoke 검증.

Excluded:

- 실제 도구 실행 자동화.
- 역할/권한 DB 기반 승인자 검증.
- T5/controlled production 2인 승인 hard gate.
- approved report export API.
- tool output import/normalizer API.

Work units:

| unit | description | expected_artifact |
|---|---|---|
| API | ToolAction list/get/request/approve endpoints | `runtime/redteam_v2_api_router.py` |
| Model | JSON artifact read/write and approval state persistence | `runtime/redteam_v2_models.py` |
| UI | Report Studio `레드팀 분석2` queue reload and request button | `reports.js` |
| Tests | API/sample E2E regression | `tests/test_redteam_v2_api_router.py`, `tests/test_redteam_v2_sample_e2e.py` |
| Live Evidence | approval queue smoke artifacts and screenshot | `archive/runs/redteam-ax-v2/CASE-LIVE-APPROVAL-002`, `고도화/live-smoke/redteam2-approval-queue-ui-smoke.png` |
