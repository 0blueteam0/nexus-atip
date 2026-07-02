---
type: knowledge_workflow_record
project: Red Team Studio
task: RedTeam AX collection end-to-end completion gate continuation slice
---

# EVIDENCE_UNITS

| id | evidence | command_or_path | result |
|---|---|---|---|
| EV-001 | Focused API regression | `.venv/Scripts/python.exe -m pytest ... -k toolchain_collect_results -q` | 1 passed |
| EV-002 | Full API regression | `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q` | 59 passed |
| EV-003 | Frontend syntax | `node --check reports.js` | exit 0 |
| EV-004 | Runtime readiness contract | `redteam_ax_frontend_runtime_readiness_contract.py` | passed |
| EV-005 | Korean copy inventory | `test_redteam2_korean_copy_inventory.py` | passed |
| EV-006 | Accepted gate manifest | `redteam_ax_accepted_gate_manifest.py` | 24/24 passed |
