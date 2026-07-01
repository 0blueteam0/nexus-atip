---
type: scope
task_id: KW-20260701-131412-Red-Team-Studio-Implement-RedTeam-AX-v2-tool-result-import-normalize-and-evidence-candidate-APIs
project: Red Team Studio
task: Implement RedTeam AX v2 tool result import normalize and evidence candidate APIs
created: 2026-07-01T13:14:12+09:00
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

User intent: ToolAction/manual-run 이후 raw tool output이 보고서로 직접 들어가지 않고 import-output -> normalize -> Evidence candidate 순서로만 추적되어야 한다.

Included:

- `/api/redteam/v2/tool-runs/{run_id}/import-output`
- `/api/redteam/v2/tool-runs/{run_id}/normalize`
- `/api/redteam/v2/tool-runs/{run_id}/create-evidence`
- ToolRunRecord, NormalizedResult, Evidence candidate JSON artifact 저장.
- ToolAction status `OutputImported` -> `Normalized` -> `EvidenceCreated` 전이.
- API/sample/live 검증.

Excluded:

- approved report export API.
- 실제 auth provider identity binding.
- full starter pack regression.

Work units:

| unit | description | expected_artifact |
|---|---|---|
| API | tool-runs import/normalize/create-evidence routes | `runtime/redteam_v2_api_router.py` |
| Model | ToolRunRecord, NormalizedResult, Evidence candidate persistence | `runtime/redteam_v2_models.py` |
| Tests | API and sample E2E coverage | `tests/test_redteam_v2_api_router.py`, `tests/test_redteam_v2_sample_e2e.py` |
| Live Evidence | normalization live smoke artifacts | `archive/runs/redteam-ax-v2/CASE-LIVE-TOOLRUN-NORMALIZE-001` |
