---
type: evidence_units
task_id: KW-20260703-154807-Red-Team-Studio-RedTeam-AX-implement-next-real-scanner-result-import-and-analyst-evidence-workfl
project: Red Team Studio
task: RedTeam AX implement next real scanner result import and analyst evidence workflow slice
created: 2026-07-03T15:48:07+09:00
---

# Evidence Units

| id | evidence_type | command | exit_code | artifact_path | verified_at |
|---|---|---|---|---|---|
| EU-001 | compile | `.\\.venv\\Scripts\\python.exe -m py_compile runtime\\redteam_v2_models.py runtime\\redteam_v2_api_router.py` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py` | 2026-07-03T15:59:00+09:00 |
| EU-002 | frontend_syntax | `node --check "J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js"` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 2026-07-03T15:59:00+09:00 |
| EU-003 | frontend_contract | `.\\.venv\\Scripts\\python.exe "Red Team Studio/고도화/sanity/redteam_ax_frontend_launch_readiness_contract.py"` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_launch_readiness_contract.py` | 2026-07-03T15:59:00+09:00 |
| EU-004 | api_regression | `.\\.venv\\Scripts\\python.exe tests/test_redteam_v2_api_router.py RedTeamV2ApiRouterTests.test_v2_scanner_service_import_projects_to_toolchain_collection` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | 2026-07-03T15:59:00+09:00 |
| EU-005 | audit_json | `.\\.venv\\Scripts\\python.exe -m json.tool "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json"` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | 2026-07-03T16:00:00+09:00 |
| EU-006 | audit_sanity | `.\\.venv\\Scripts\\python.exe "Red Team Studio/고도화/sanity/test_completion_audit_matrix.py"` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | 2026-07-03T16:00:00+09:00 |
| EU-007 | korean_copy | `.\\.venv\\Scripts\\python.exe "Red Team Studio/고도화/sanity/test_redteam2_korean_copy_inventory.py"` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam2_korean_copy_inventory.json` | 2026-07-03T16:00:00+09:00 |
| EU-008 | completion_blocker | `.\\.venv\\Scripts\\python.exe tests/test_redteam_v2_api_router.py RedTeamV2ApiRouterTests.test_v2_goal_completion_review_blocks_while_completion_audit_has_partial_gap` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | 2026-07-03T16:00:00+09:00 |
