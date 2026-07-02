---
type: evidence_units
project: Red Team Studio
task: RedTeam AX operator evidence collection package slice
---

# Evidence Units

| id | kind | path_or_command | verified_at | result |
|---|---|---|---|---|
| EV-001 | artifact | `archive/runs/redteam-ax-v2-operator-evidence-collection/latest_operator_evidence_collection_package.json` | 2026-07-02T21:20:35+09:00 | status `ready_for_operator_evidence_collection`, 5 blocked items |
| EV-002 | artifact | `archive/runs/redteam-ax-v2-operator-evidence-collection/latest_operator_evidence_collection_package.md` | 2026-07-02T21:20:35+09:00 | operator-facing Markdown generated |
| EV-003 | test | `pytest ...test_runtime_readiness_status_is_read_only_artifact_projection -q` | 2026-07-02T21:16+09:00 | 1 passed |
| EV-004 | test | `redteam_ax_frontend_runtime_readiness_contract.py` | 2026-07-02T21:16+09:00 | passed |
| EV-005 | test | `test_redteam2_korean_copy_inventory.py` | 2026-07-02T21:16+09:00 | passed, English-only ratio 0.1422 |
| EV-006 | test | `test_completion_audit_matrix.py` and `test_plan_contract.py` | 2026-07-02T21:16+09:00 | passed |
| EV-007 | gate | `archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | 2026-07-02T21:20:41+09:00 | 20 accepted, 20 passed, 0 failed |
