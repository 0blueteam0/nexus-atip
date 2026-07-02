---
type: scope
task_id: KW-20260703-012119-Red-Team-Studio-RedTeam-AX-scanner-artifact-evidence-promotion-and-report-closure-slice
project: Red Team Studio
task: RedTeam AX scanner artifact evidence promotion and report closure slice
created: 2026-07-03T01:21:19+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Move RedTeam AX closer to the requested end state by reducing the gap between imported scanner artifacts and a completed Evidence/Finding/Matrix/Report/export workflow.

## Included

- Add a governed helper API that closes an existing toolchain result collection from Evidence approval through completion gate.
- Require explicit human approver fields for Evidence review, red team severity approval, business owner severity approval, and Executive Sponsor export approval.
- Keep scanner execution, active scan, Docker/WSL/network execution, and raw output instruction trust disabled.
- Add Korean beginner-facing UI controls and sanity anchors.
- Update Detailed_PLAN, FINAL_PLAN, LLM Wiki, completion audit, and accepted gate evidence.

## Excluded

- Real organization scanner target execution.
- Real OpenVAS/ZAP service endpoint configuration.
- Declaring the full active goal complete.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| Backend | Add close-e2e orchestration | `runtime/redteam_v2_models.py` |
| API | Expose close-e2e route | `runtime/redteam_v2_api_router.py` |
| Frontend | Add Korean approver inputs and one-click closure button | `reports.js` |
| Tests | Verify missing approver block and full closure | `tests/test_redteam_v2_api_router.py` |
| Docs | Record Slice 90 | `Detailed_PLAN.MD`, `FINAL_PLAN.md`, LLM Wiki, audit |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Router regression passes | `63 passed` pytest result |
| UI contract holds | runtime readiness and Korean copy sanity |
| Completion audit valid | completion audit sanity |
| Accepted gate valid | accepted gate manifest 24/24 |
