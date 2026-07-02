---
type: evidence_unit
status: complete
id: EU-REDTEAM-AX-OEC-IMPORT-20260703
project: Red Team Studio
created: 2026-07-03T03:32:30+09:00
updated: 2026-07-03T04:24:00+09:00
---

# Evidence Unit

## Claim

RedTeam AX는 승인된 operator 제출 증거 후보를 실제 Evidence Card로 등록하고, 사람 검토 확인이 있는 경우에만 승인 상태로 전환하는 API/UI 경로를 갖는다.

## Source

- source_type: code, tests, generated gate artifact
- path_or_url: `projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- path_or_url: `projects/ai-agentic-soc/runtime/redteam_v2_api_router.py`
- path_or_url: `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- path_or_url: `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- path_or_url: `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`
- command: `& ".venv/Scripts/python.exe" -m pytest "tests/test_redteam_v2_api_router.py" -q`
- exit_code: 0
- collected_at: 2026-07-03T04:24:00+09:00

## Evidence

- `POST /api/redteam/v2/toolchains/operator-evidence-card-import` route was added.
- Default import creates Evidence Cards as `pending_review`.
- Approval path requires `human_review_confirmed`, reviewer, reviewer role, and actor context headers.
- Blocked approval attempts now return blocked rows and `created_evidence_count == 0`.
- Regression result: 71 passed, 1 warning.
- Accepted gate result: 24/24 passed.

## Confidence

High for API/UI/test coverage in the local codebase. Medium for operational completion because real organization-approved operator artifacts and final report export still need human execution.

## Limits

This slice does not run scanners, does not complete all findings, and does not mark the global RedTeam AX goal complete.

## Related Decisions

- `DECISION_LOG.md`: keep Evidence Card creation and approval separated by default.
