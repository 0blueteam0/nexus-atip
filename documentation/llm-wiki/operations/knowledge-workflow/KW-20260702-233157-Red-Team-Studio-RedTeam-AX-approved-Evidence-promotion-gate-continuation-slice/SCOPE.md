---
type: scope
task_id: KW-20260702-233157-Red-Team-Studio-RedTeam-AX-approved-Evidence-promotion-gate-continuation-slice
project: Red Team Studio
task: RedTeam AX approved Evidence promotion gate continuation slice
created: 2026-07-02T23:31:57+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the active RedTeam AX goal by moving governed toolchain collection Evidence from human-approved Evidence candidates into a safe Finding draft lane, without tool execution, active scanning, or report Claim insertion.

## Included

- Backend API for collection approved Evidence to pending-review Finding drafts.
- React Report Studio RedTeam2 Korean UI controls and status rows.
- Regression tests and frontend sanity anchors.
- FINAL_PLAN, Detailed_PLAN, LLM Wiki, completion audit updates.
- Accepted gate manifest regeneration.

## Excluded

- Final severity approval automation for all real operating Findings.
- Final Matrix ready/report/export completion for all real operating candidates.
- Any new scanner execution or active scan.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| API | Add `/toolchain-result-collections/{collection_id}/promote-findings` | runtime model/router and pytest |
| UI | Add Korean `Finding 초안 생성` flow | reports.js and sanity inventory |
| Docs | Record Slice 82 and completion audit | FINAL_PLAN/Detailed_PLAN/LLM Wiki/audit |
| Gate | Run regression and accepted gate | accepted gate manifest |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| backend | `projects/ai-agentic-soc/runtime/redteam_v2_models.py` | promotion policy |
| router | `projects/ai-agentic-soc/runtime/redteam_v2_api_router.py` | API exposure |
| tests | `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | regression proof |
| frontend | `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | Korean UI |
| gate | `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | accepted gate proof |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |
| API regression | `pytest tests/test_redteam_v2_api_router.py -q` |
| Frontend syntax | `node --check reports.js` |
| Korean/runtime sanity | frontend runtime readiness and Korean copy inventory scripts |

## Completion Definition

The slice is complete when source, UI, tests, docs, accepted gate, handoff, and this evidence session are updated and pushed. The overall thread goal remains active until real operating candidates clear severity, Matrix, report, export, and runtime gates.
