---
type: evidence_unit
status: complete
project: Red Team Studio
created: 2026-07-03T01:21:19+09:00
---

# Evidence Units

| evidence | command/artifact | exit_code | result |
|---|---|---:|---|
| Python compile | `.venv/Scripts/python.exe -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py tests/test_redteam_v2_api_router.py` | 0 | syntax passed |
| Frontend JS check | `node --check .../reports.js` | 0 | syntax passed |
| Focused pytest | `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -k "close_e2e" -q` | 0 | 1 passed |
| Full v2 router pytest | `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q` | 0 | 63 passed, 1 warning |
| Runtime readiness contract | `redteam_ax_frontend_runtime_readiness_contract.py` | 0 | passed |
| Korean copy inventory | `test_redteam2_korean_copy_inventory.py` | 0 | 1294/1490 Korean-context literals, English-only ratio 0.1289 |
| Completion audit sanity | `test_completion_audit_matrix.py` | 0 | passed |
| Plan contract | `test_plan_contract.py` | 0 | passed |
| Accepted gate manifest | `redteam_ax_accepted_gate_manifest.py` | 0 | passed, 24/24 gates |

## Artifacts

- `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`
- `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/accepted_gate_manifest_20260702T163259Z.json`
