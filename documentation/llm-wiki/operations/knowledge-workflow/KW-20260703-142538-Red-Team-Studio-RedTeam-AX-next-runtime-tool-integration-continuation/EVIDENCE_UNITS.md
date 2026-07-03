---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-03T14:25:38+09:00
---

# Evidence Unit

## Claim

## Source

- source_type:
- path_or_url:
- command:
- exit_code:
- collected_at:

## Evidence

## Confidence

## Limits

## Related Decisions

# Evidence Units

| id | evidence | result |
|---|---|---|
| EU-001 | `py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py` | exit 0 |
| EU-002 | `python -m unittest projects.ai-agentic-soc.tests.test_redteam_v2_api_router.RedTeamV2ApiRouterTests.test_v2_scanner_service_import_projects_to_toolchain_collection` | exit 0, 1 test OK |
| EU-003 | `python -m unittest projects.ai-agentic-soc.tests.test_redteam_v2_api_router` | exit 0, 82 tests OK |
| EU-004 | `node --check reports.js` | exit 0 |
| EU-005 | `redteam_ax_frontend_service_import_contract.py` | exit 0 |
| EU-006 | `redteam_ax_frontend_runtime_readiness_contract.py` | exit 0 |
| EU-007 | `test_redteam2_korean_copy_inventory.py` | exit 0 |
| EU-008 | `test_completion_audit_matrix.py` and `json.tool redteam_ax_completion_audit_matrix.json` | exit 0 |
| EU-009 | `/api/redteam/v2/goal-completion-review` via TestClient | status `goal_completion_blocked`, remaining gaps 3, blockers 6 |
