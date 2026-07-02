---
type: evidence_units
project: Red Team Studio
task: RedTeam AX next completion blocker reduction slice
---

# Evidence Units

| id | type | path_or_command | exit_code | verified_at | result |
|---|---|---|---:|---|---|
| EV-001 | source | `reports.js` | n/a | 2026-07-02 | Added operator remediation step visibility |
| EV-002 | source | `redteam_ax_frontend_runtime_readiness_contract.py` | n/a | 2026-07-02 | Added runtime readiness runbook step anchors |
| EV-003 | source | `test_redteam2_korean_copy_inventory.py` | n/a | 2026-07-02 | Added Korean runbook step anchors |
| EV-004 | command | `node --check reports.js` | 0 | 2026-07-02 | Syntax valid |
| EV-005 | command | `redteam_ax_frontend_runtime_readiness_contract.py` | 0 | 2026-07-02 | Contract passed |
| EV-006 | command | `test_redteam2_korean_copy_inventory.py` | 0 | 2026-07-02 | Korean inventory passed |
| EV-007 | command | `test_plan_contract.py` | 0 | 2026-07-02 | Plan contract passed |
| EV-008 | command | `test_completion_audit_matrix.py` | 0 | 2026-07-02 | Completion audit sanity passed |
| EV-009 | command | `redteam_ax_accepted_gate_manifest.py` | 0 | 2026-07-02 | 19/19 accepted gates passed |
| EV-010 | artifact | `archive/runs/redteam-ax-v2-accepted-gates/accepted_gate_manifest_20260702T084737Z.json` | n/a | 2026-07-02 | Latest accepted gate artifact |

## Interpretation

The evidence proves the UI/runbook visibility slice and regression health. It does not prove live runtime readiness.
