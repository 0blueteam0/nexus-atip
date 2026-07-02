---
type: knowledge_workflow_record
project: Red Team Studio
task: RedTeam AX final report export approval bridge continuation slice
---

# EVIDENCE_UNITS

| id | evidence | command_or_path | result |
|---|---|---|---|
| EV-001 | Frontend syntax | `node --check reports.js` | exit 0 |
| EV-002 | Focused collection export path | `.venv/Scripts/python.exe -m pytest ... -k toolchain_collect_results -q` | 1 passed |
| EV-003 | Full API regression | `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q` | 59 passed |
| EV-004 | Runtime readiness copy contract | `redteam_ax_frontend_runtime_readiness_contract.py` | passed |
| EV-005 | Korean copy inventory | `test_redteam2_korean_copy_inventory.py` | passed, ratio 0.1286 |
| EV-006 | Accepted gates | `redteam_ax_accepted_gate_manifest.py` | 24/24 passed |
