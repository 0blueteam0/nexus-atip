# Evidence Units

- command: `python -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py`; exit_code: 0; verified_at: 2026-07-03T02:xx+09:00
- command: `node --check soc-frontend.../reports.js`; exit_code: 0; verified_at: 2026-07-03T02:xx+09:00
- command: `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -k certify_reviewed_operating_close_evidence -q`; exit_code: 0; result: 1 passed, 67 deselected
- command: `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q`; exit_code: 0; result: 68 passed, 1 warning
- command: `python 고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py`; exit_code: 0
- command: `python 고도화/sanity/test_redteam2_korean_copy_inventory.py`; exit_code: 0; result: 1431/1634 Korean-context literals, English-only ratio=0.1218
- command: `python 고도화/sanity/test_completion_audit_matrix.py`; exit_code: 0
- command: `python 고도화/sanity/test_plan_contract.py`; exit_code: 0
- command: `python 고도화/sanity/redteam_ax_accepted_gate_manifest.py`; exit_code: 0; result: 24/24 accepted gates passed
