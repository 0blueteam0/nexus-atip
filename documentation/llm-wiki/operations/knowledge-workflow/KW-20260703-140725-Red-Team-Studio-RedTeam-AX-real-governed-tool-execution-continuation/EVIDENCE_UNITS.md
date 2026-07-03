---
type: evidence_units
task_id: KW-20260703-140725-Red-Team-Studio-RedTeam-AX-real-governed-tool-execution-continuation
project: Red-Team-Studio
task: RedTeam AX real governed tool execution continuation
created: 2026-07-03T14:07:25+09:00
updated: 2026-07-03T14:32:00+09:00
---

# Evidence Units

| id | command | exit_code | artifact_path | verified_at | result |
|---|---|---:|---|---|---|
| EU-001 | `python -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py tests/test_redteam_v2_api_router.py` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py` | 2026-07-03T14:32:00+09:00 | Python syntax passed. |
| EU-002 | `node --check reports.js` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 2026-07-03T14:32:00+09:00 | Frontend syntax passed. |
| EU-003 | `pytest ...test_v2_toolchain_runtime_preflight_allows_safe_local_smoke_only_when_partial ...test_v2_toolchain_runtime_preflight_blocks_runner_before_commands` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | 2026-07-03T14:32:00+09:00 | 2 passed, 1 warning. |
| EU-004 | `python -m json.tool redteam_ax_completion_audit_matrix.json` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | 2026-07-03T14:32:00+09:00 | Audit JSON syntax passed. |
| EU-005 | `redteam_ax_frontend_runtime_readiness_contract.py` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py` | 2026-07-03T14:32:00+09:00 | Runtime frontend contract passed. |
| EU-006 | `test_redteam2_korean_copy_inventory.py` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam2_korean_copy_inventory.json` | 2026-07-03T14:32:00+09:00 | Korean copy inventory passed. |
| EU-007 | `test_completion_audit_matrix.py` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | 2026-07-03T14:32:00+09:00 | Completion audit sanity passed. |
| EU-008 | `redteam_ax_frontend_launch_readiness_contract.py` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_launch_readiness_contract.py` | 2026-07-03T14:32:00+09:00 | Launch readiness contract passed. |
| EU-009 | `POST /api/redteam/v2/goal-completion-review` via TestClient | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | 2026-07-03T14:32:00+09:00 | `200 goal_completion_blocked 1 3 False`. |
