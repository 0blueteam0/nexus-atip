# Quality Gate

| gate | command | exit_code | result |
|---|---|---:|---|
| Python compile | `python -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py tests/test_redteam_v2_api_router.py ...` | 0 | pass |
| Focused API regression | `pytest tests/test_redteam_v2_api_router.py -q -k "toolchain_collect_results or governed_toolchain_executes"` | 0 | pass |
| Full API regression | `pytest tests/test_redteam_v2_api_router.py -q` | 0 | pass |
| Frontend syntax | `node --check reports.js` | 0 | pass |
| Frontend runtime readiness contract | `redteam_ax_frontend_runtime_readiness_contract.py` | 0 | pass |
| Korean copy inventory | `test_redteam2_korean_copy_inventory.py` | 0 | pass |
| Completion audit sanity | `test_completion_audit_matrix.py` | 0 | pass |
| Accepted gate manifest | `redteam_ax_accepted_gate_manifest.py` | 0 | pass, 24/24 |
