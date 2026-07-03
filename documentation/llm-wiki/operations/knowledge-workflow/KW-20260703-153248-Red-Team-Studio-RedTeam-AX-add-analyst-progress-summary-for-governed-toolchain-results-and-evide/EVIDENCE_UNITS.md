---
type: evidence_units
task_id: KW-20260703-153248-Red-Team-Studio-RedTeam-AX-add-analyst-progress-summary-for-governed-toolchain-results-and-evide
project: Red Team Studio
task: RedTeam AX add analyst progress summary for governed toolchain results and evidence next steps
created: 2026-07-03T15:32:48+09:00
---

# Evidence Units

| id | evidence_type | command | exit_code | artifact_path | verified_at |
|---|---|---|---|---|---|
| EU-001 | static_compile | `.\\.venv\\Scripts\\python.exe -m py_compile runtime\\redteam_v2_models.py runtime\\redteam_v2_api_router.py` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py` | 2026-07-03T15:47:00+09:00 |
| EU-002 | frontend_syntax | `node --check "J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js"` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 2026-07-03T15:47:00+09:00 |
| EU-003 | frontend_contract | `.\\.venv\\Scripts\\python.exe "Red Team Studio/고도화/sanity/redteam_ax_frontend_launch_readiness_contract.py"` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_launch_readiness_contract.py` | 2026-07-03T15:47:00+09:00 |
| EU-004 | frontend_contract | `.\\.venv\\Scripts\\python.exe "Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py"` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py` | 2026-07-03T15:48:00+09:00 |
| EU-005 | audit_json | `.\\.venv\\Scripts\\python.exe -m json.tool "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json"` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | 2026-07-03T15:49:00+09:00 |
| EU-006 | audit_sanity | `.\\.venv\\Scripts\\python.exe "Red Team Studio/고도화/sanity/test_completion_audit_matrix.py"` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | 2026-07-03T15:49:00+09:00 |
| EU-007 | copy_inventory | `.\\.venv\\Scripts\\python.exe "Red Team Studio/고도화/sanity/test_redteam2_korean_copy_inventory.py"` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam2_korean_copy_inventory.json` | 2026-07-03T15:49:00+09:00 |
| EU-008 | api_regression | `.\\.venv\\Scripts\\python.exe tests/test_redteam_v2_api_router.py RedTeamV2ApiRouterTests.test_v2_toolchain_run_status_reload_reads_saved_run_without_execution RedTeamV2ApiRouterTests.test_v2_toolchain_collect_results_normalizes_all_runs_and_creates_evidence_candidates RedTeamV2ApiRouterTests.test_v2_goal_completion_review_blocks_while_completion_audit_has_partial_gap` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | 2026-07-03T15:51:00+09:00 |
