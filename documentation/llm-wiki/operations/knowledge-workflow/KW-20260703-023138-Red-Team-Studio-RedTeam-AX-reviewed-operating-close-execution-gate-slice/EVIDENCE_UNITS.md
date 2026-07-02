---
type: evidence_units
status: recorded
project: Red-Team-Studio
task: RedTeam AX reviewed operating close execution gate slice
created: 2026-07-03T02:31:38+09:00
---

# Evidence Units

| id | evidence_type | command_or_path | exit_code | artifact_path | verified_at |
|---|---|---|---|---|---|
| EV-001 | compile | `.venv/Scripts/python.exe -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py tests/test_redteam_v2_api_router.py` | 0 | n/a | 2026-07-03 |
| EV-002 | syntax | `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 0 | n/a | 2026-07-03 |
| EV-003 | focused regression | `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -k "execute_reviewed_operating_close" -q` | 0 | test output: 1 passed | 2026-07-03 |
| EV-004 | full router regression | `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q` | 0 | test output: 67 passed, 1 warning | 2026-07-03 |
| EV-005 | frontend runtime readiness | `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py"` | 0 | n/a | 2026-07-03 |
| EV-006 | Korean copy inventory | `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/test_redteam2_korean_copy_inventory.py"` | 0 | `redteam2_korean_copy_inventory.json` | 2026-07-03 |
| EV-007 | completion audit sanity | `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/test_completion_audit_matrix.py"` | 0 | `redteam_ax_completion_audit_matrix.json` | 2026-07-03 |
| EV-008 | plan contract sanity | `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/test_plan_contract.py"` | 0 | `Detailed_PLAN.MD`, `FINAL_PLAN.md` | 2026-07-03 |
| EV-009 | accepted gate | `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py"` | 0 | `latest_accepted_gate_manifest.json`, status passed, 24/24 | 2026-07-03 |