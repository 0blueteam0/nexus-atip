# Tooling

## Commands That Passed

```text
python -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py tests/test_redteam_v2_api_router.py ...
node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js
.venv/Scripts/python.exe -m pytest projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py -q
python Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py
python Red Team Studio/고도화/sanity/test_redteam2_korean_copy_inventory.py
python Red Team Studio/고도화/sanity/test_plan_contract.py
python Red Team Studio/고도화/sanity/test_completion_audit_matrix.py
python Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py
```

## Tooling Notes

Use `projects/ai-agentic-soc/.venv/Scripts/python.exe` for pytest. Global `pytest` and system `python -m pytest` are not available in this environment.
