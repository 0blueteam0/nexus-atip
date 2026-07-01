---
type: scope
task_id: KW-20260701-172341-Red-Team-Studio-Implement-RedTeam-AX-v2-wrapper-trust-revoke-rotate-and-runner-enforcement-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 wrapper trust revoke rotate and runner enforcement slice
created: 2026-07-01T17:23:41+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue RedTeam AX v2 toward approved tool execution by implementing wrapper pin revoke/rotate workflow and execution-plan hard-blocking when wrapper trust preflight fails.

## Included

- Revoke endpoint for approved wrapper pins.
- Manifest exclusion for revoked pins.
- Rotation warning and replacement behavior when a new pin is approved over an existing pin.
- Execution-plan token hard-block for sandbox/local_cli/api runner paths when wrapper preflight fails.
- RedTeam2 UI revoke control and status display.
- API tests, sample E2E, frontend build, plan sanity, handoff, and git push.

## Excluded

- No real scanner process execution.
- No live browser smoke against running 5177/8765 services.
- No full container runner implementation.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| backend-revoke | Add revoke workflow and revoked pin exclusion | `runtime/redteam_v2_models.py` |
| backend-hardblock | Block execution token when wrapper preflight fails | `runtime/redteam_v2_models.py` |
| api | Add revoke endpoint | `runtime/redteam_v2_api_router.py` |
| frontend | Add Revoke Pin control/status | `reports.js` |
| tests | Update API tests for rotate/revoke/hard-block | `tests/test_redteam_v2_api_router.py` |
| plan | Update FINAL_PLAN slice 27 | `FINAL_PLAN.md` |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| Models | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py` | Revoke/rotate and hard-block logic |
| Router | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py` | Revoke endpoint |
| Frontend | `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | Revoke UX |
| Tests | `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | Regression coverage |
| Plan | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md` | Slice state |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

Slice is complete when revoke/rotate and execution-plan hard-block behavior are implemented, verified, documented, handed off, committed, and pushed.
