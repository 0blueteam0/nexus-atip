---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-02T22:05:38+09:00
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

| evidence_id | type | path_or_command | exit_code | result |
|---|---|---|---:|---|
| EU-001 | command | `redteam_ax_tool_result_analysis_brief.py` | 0 | `tool_result_analysis_ready`, executed 5, supported evidence 5, blocked 9 |
| EU-002 | artifact | `archive/runs/redteam-ax-v2-tool-result-analysis/latest_tool_result_analysis_brief.json` | 0 | Evidence pack, SCA report, claim candidates generated |
| EU-003 | command | `python -m py_compile runtime/redteam_v2_models.py ...` | 0 | Python syntax valid |
| EU-004 | command | `node --check reports.js` | 0 | Frontend syntax valid |
| EU-005 | command | `pytest test_runtime_readiness_status_is_read_only_artifact_projection` | 0 | API projection includes `tool_result_analysis_brief` |
| EU-006 | command | `redteam_ax_frontend_runtime_readiness_contract.py` | 0 | Runtime readiness Korean UI contract passed |
| EU-007 | command | `test_redteam2_korean_copy_inventory.py` | 0 | Korean copy inventory passed |
| EU-008 | command | `test_completion_audit_matrix.py` | 0 | Completion audit sanity passed |
| EU-009 | command | `redteam_ax_accepted_gate_manifest.py` | 0 | 23 accepted gates, 23 passed, 0 failed |
