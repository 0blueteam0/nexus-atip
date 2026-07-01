---
type: scope
task_id: KW-20260701-171653-Red-Team-Studio-Implement-RedTeam-AX-v2-expected-wrapper-hash-pin-approval-workflow-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 expected wrapper hash pin approval workflow slice
created: 2026-07-01T17:16:53+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the RedTeam AX v2 implementation by adding the expected wrapper SHA-256 pin request and approval workflow required after the slice 25 wrapper manifest/hash preflight foundation.

## Included

- Backend API/model support for wrapper pin requests.
- Backend approval workflow for expected SHA-256 pins with actor/RBAC binding.
- Manifest integration so approved pins become `expected_sha256_source=approved_pin`.
- RedTeam2 UI controls for operator-attested version evidence, pin request, and red-team-lead approval.
- API regression, sample E2E, frontend build, and plan sanity verification.
- FINAL_PLAN update for slice 26.

## Excluded

- No scanner or version command execution by registry APIs.
- No real ephemeral/container runner hard-block enforcement.
- No approved pin revoke/rotate workflow.
- No live browser smoke against running 5177/8765 services.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| backend-pin | Add request/approve functions and approved pin lookup | `runtime/redteam_v2_models.py` |
| api-pin | Expose request/approve endpoints | `runtime/redteam_v2_api_router.py` |
| frontend-pin | Add RedTeam2 pin request/approval controls | `reports.js` |
| tests | Cover request, unauthorized approval, approval, import-only rejection | `tests/test_redteam_v2_api_router.py` |
| plan | Mark slice 26 and remaining gaps | `FINAL_PLAN.md` |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| Models | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py` | Pin workflow and manifest integration |
| Router | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py` | Pin endpoints |
| Frontend | `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | RedTeam2 pin controls |
| Tests | `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | Regression coverage |
| Plan | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md` | Slice state |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

This slice is complete when pin request/approval APIs, UI, tests, plan update, knowledge workflow close gate, handoff, commit, and push all succeed.
