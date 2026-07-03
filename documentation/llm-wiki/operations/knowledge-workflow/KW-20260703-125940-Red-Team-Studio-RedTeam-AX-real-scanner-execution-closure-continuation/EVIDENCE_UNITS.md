---
type: evidence_units
status: complete
---

# Evidence Units

| id | type | command_or_source | exit_code | artifact_path | verified_at | claim_supported |
|---|---|---:|---:|---|---|---|
| EU-001 | source | `Red Team Studio/SPEC/27_AGENT_TOOL_ORCHESTRATION_WORKFLOW_SPEC.md` | n/a | local file | 2026-07-03T13:00:00+09:00 | Tool results must flow through normalizer and Evidence |
| EU-002 | source | `Red Team Studio/SPEC/28_TOOL_RESULT_EVIDENCE_AND_REPORTING_SPEC.md` | n/a | local file | 2026-07-03T13:00:00+09:00 | Raw tool output must not become report claims directly |
| EU-003 | code | `runtime/redteam_v2_models.py` | n/a | local file | 2026-07-03T13:08:00+09:00 | Required six-tool coverage fields implemented |
| EU-004 | test | `py_compile runtime/redteam_v2_models.py tests/test_redteam_v2_api_router.py` | 0 | terminal output | 2026-07-03T13:05:00+09:00 | Syntax valid |
| EU-005 | test | targeted pytest for two collection tests | 0 | terminal output | 2026-07-03T13:07:00+09:00 | Partial and six-tool collection coverage behavior verified |
| EU-006 | sanity | `test_completion_audit_matrix.py` | 0 | terminal output | 2026-07-03T13:10:00+09:00 | Completion audit matrix still valid |
| EU-007 | gate | `/api/redteam/v2/goal-completion-review` via TestClient | 0 | terminal output | 2026-07-03T13:11:00+09:00 | Full goal remains blocked, not complete |
