---
type: scope
task_id: KW-20260703-022012-Red-Team-Studio-RedTeam-AX-operating-closure-human-review-record-and-checklist-package-slice
project: Red-Team-Studio
task: RedTeam AX operating closure human review record and checklist package slice
created: 2026-07-03T02:20:12+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Advance RedTeam AX toward real operating closure by adding a non-executing HITL review record between the operating closure submission package and final close execution.

## Included

- Backend API: `/api/redteam/v2/toolchains/operating-closure-human-review`
- Frontend RedTeam2 Korean control and review/signature tables
- Regression coverage for incomplete review and complete review
- Completion audit, Detailed_PLAN, FINAL_PLAN, and LLM Wiki updates

## Excluded

- Running scanners, Docker, WSL, network scans, or close execution from the review endpoint
- Claiming final RedTeam AX goal completion before real operator artifacts and final close evidence exist

## Verification Criteria

| criterion | evidence_required |
|---|---|
| API compiles | `py_compile` exit_code 0 |
| Frontend syntax passes | `node --check` exit_code 0 |
| Focused regression passes | `pytest -k operating_closure_human_review` exit_code 0 |
| Full router suite passes | `pytest tests/test_redteam_v2_api_router.py -q` exit_code 0 |
| Korean/audit/plan gates pass | sanity command exit_code 0 |
| Accepted gate passes | accepted manifest status `passed`, 24/24 gates |
| Knowledge gate closes | `QUALITY_GATE_RESULT.json` status `OK` |