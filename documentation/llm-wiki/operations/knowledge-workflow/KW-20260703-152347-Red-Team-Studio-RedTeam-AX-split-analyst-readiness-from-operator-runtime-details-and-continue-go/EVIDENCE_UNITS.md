---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-03T15:23:47+09:00
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

| id | type | command_or_path | exit_code | result |
|---|---|---|---:|---|
| EV-001 | source | `projects/ai-agentic-soc/runtime/redteam_v2_models.py` | 0 | Added role-separated runtime-readiness summaries. |
| EV-002 | source | `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 0 | RedTeam2 renders analyst/admin readiness rows. |
| EV-003 | test | `.venv/Scripts/python.exe -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py` | 0 | Python syntax passed. |
| EV-004 | test | `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 0 | Frontend JS syntax passed. |
| EV-005 | test | `.venv/Scripts/python.exe tests/test_redteam_v2_api_router.py RedTeamV2ApiRouterTests.test_runtime_readiness_status_is_read_only_artifact_projection` | 0 | Runtime-readiness API regression passed. |
| EV-006 | test | `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/redteam_ax_frontend_launch_readiness_contract.py` | 0 | Frontend launch/readiness contract passed. |
| EV-007 | test | `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py` | 0 | Runtime readiness frontend contract passed. |
| EV-008 | test | `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/test_redteam2_korean_copy_inventory.py` | 0 | Korean copy inventory passed: 1800/2026 Korean-context literals, English-only ratio 0.1096. |
| EV-009 | test | `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/test_completion_audit_matrix.py` | 0 | Completion audit matrix sanity passed. |
| EV-010 | test | `python -m json.tool Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | 0 | Completion audit matrix JSON valid. |
| EV-011 | test | `.venv/Scripts/python.exe tests/test_redteam_v2_api_router.py RedTeamV2ApiRouterTests.test_v2_goal_completion_review_blocks_while_completion_audit_has_partial_gap` | 0 | Goal completion review remains blocked while current gaps exist. |
