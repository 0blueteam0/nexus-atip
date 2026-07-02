---
type: scope
task_id: KW-20260702-234616-Red-Team-Studio-RedTeam-AX-collection-Finding-severity-approval-continuation-slice
project: Red Team Studio
task: RedTeam AX collection Finding severity approval continuation slice
created: 2026-07-02T23:46:16+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the RedTeam AX goal by adding a governed two-person severity approval lane for Finding drafts promoted from toolchain collection Evidence.

## Included

- Backend batch severity approval API for collection-promoted Findings.
- Korean RedTeam2 UI controls and status rows.
- Regression tests and sanity anchors.
- FINAL_PLAN, Detailed_PLAN, LLM Wiki, completion audit updates.
- Accepted gate regeneration and GitHub push.

## Excluded

- Final report export approval.
- Real operating endpoint/runtime blocker resolution.
- Any new scanner execution or active scan.

## Verification Criteria

| criterion | evidence_required |
|---|---|
| API regression | `pytest tests/test_redteam_v2_api_router.py -q` |
| Frontend syntax | `node --check reports.js` |
| Korean/runtime sanity | runtime readiness and Korean copy inventory scripts |
| Accepted gate | `redteam_ax_accepted_gate_manifest.py` |
