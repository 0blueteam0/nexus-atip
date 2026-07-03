---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-03T15:57:58+09:00
---

# Evidence Unit

## Claim

Operating closure APIs and RedTeam2 UI now expose a shared beginner-facing progress summary for real scanner evidence closure.

## Source

- source_type: code_and_tests
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`; `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`; `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- command: `.\\.venv\\Scripts\\python.exe tests/test_redteam_v2_api_router.py RedTeamV2ApiRouterTests.test_v2_operating_closure_readiness_summary_routes_ready_source_to_human_review RedTeamV2ApiRouterTests.test_v2_operating_closure_readiness_summary_blocks_fixture_source RedTeamV2ApiRouterTests.test_v2_operating_closure_human_review_records_hitl_checklist_without_execution RedTeamV2ApiRouterTests.test_v2_execute_reviewed_operating_close_requires_ready_human_review RedTeamV2ApiRouterTests.test_v2_certify_reviewed_operating_close_evidence_requires_real_attestation RedTeamV2ApiRouterTests.test_v2_goal_completion_review_blocks_while_completion_audit_has_partial_gap`
- exit_code: 0
- collected_at: 2026-07-03T16:20:00+09:00

## Evidence

Targeted API regression passed 6 tests. Python compile, JS syntax check, frontend launch readiness contract, completion audit matrix sanity, Korean copy inventory, and JSON parse checks passed.

## Confidence

High for the projection contract and UI rendering anchors. Medium for end-to-end operating value until a real organization scanner-output folder and real approvers are used.

## Limits

This evidence does not prove actual organization OpenVAS/ZAP endpoint import, real six-tool operating outputs, Evidence approval, Finding severity approval, Report export, or final completion gate.

## Related Decisions

RTA-COMP-072 added to completion audit as proved while keeping remaining operating evidence gaps active.
