---
type: evidence_unit
status: complete
project: Red Team Studio
created: 2026-07-02T23:31:57+09:00
---

# Evidence Units

| id | type | command/source | exit_code | artifact_path | verified_at | claim_supported |
|---|---|---:|---:|---|---|---|
| EV-001 | source | `runtime/redteam_v2_models.py` | n/a | `projects/ai-agentic-soc/runtime/redteam_v2_models.py` | 2026-07-02T23:45:00+09:00 | Adds collection approved Evidence to Finding draft policy |
| EV-002 | source | `runtime/redteam_v2_api_router.py` | n/a | `projects/ai-agentic-soc/runtime/redteam_v2_api_router.py` | 2026-07-02T23:45:00+09:00 | Exposes `/promote-findings` endpoint |
| EV-003 | test | `pytest tests/test_redteam_v2_api_router.py -q` | 0 | `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | 2026-07-02T23:45:00+09:00 | Full API regression passed |
| EV-004 | frontend | `node --check reports.js` | 0 | `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 2026-07-02T23:45:00+09:00 | Frontend syntax passed |
| EV-005 | sanity | `redteam_ax_frontend_runtime_readiness_contract.py` | 0 | `projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py` | 2026-07-02T23:45:00+09:00 | Runtime readiness UI contract passed |
| EV-006 | sanity | `test_redteam2_korean_copy_inventory.py` | 0 | `projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam2_korean_copy_inventory.json` | 2026-07-02T23:45:00+09:00 | Korean copy inventory passed |
| EV-007 | gate | `redteam_ax_accepted_gate_manifest.py` | 0 | `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | 2026-07-02T23:46:00+09:00 | Accepted gate 24/24 passed |
