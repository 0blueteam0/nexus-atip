# Evidence Units

| id | type | command_or_path | result |
|---|---|---|---|
| EV-001 | code | projects/ai-agentic-soc/runtime/redteam_v2_models.py | close_operating_toolchain_artifact_manifest_e2e now requires six named tool artifacts and returns coverage fields. |
| EV-002 | test | .venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py::RedTeamV2ApiRouterTests::test_v2_operating_artifact_manifest_close_e2e_builds_imports_and_closes_without_scanner_execution -q | 1 passed, 1 warning. |
| EV-003 | test | .venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q | 73 passed, 1 warning. |
| EV-004 | compile | .venv/Scripts/python.exe -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py | exit 0. |
| EV-005 | syntax | node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js | exit 0. |
| EV-006 | sanity | test_completion_audit_matrix.py, test_plan_contract.py, redteam_ax_frontend_runtime_readiness_contract.py, test_redteam2_korean_copy_inventory.py | all passed after path encoding correction. |
| EV-007 | gate | redteam_ax_accepted_gate_manifest.py | passed; 24 accepted gates, 24 passed, 0 failed. |
