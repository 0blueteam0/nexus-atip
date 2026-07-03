---
type: evidence_units
task_id: KW-20260703-141648-Red-Team-Studio-RedTeam-AX-frontend-safe-installed-tool-smoke-button-continuation
project: Red-Team-Studio
task: RedTeam AX frontend safe installed tool smoke button continuation
created: 2026-07-03T14:16:48+09:00
updated: 2026-07-03T14:45:00+09:00
---

# Evidence Units

| id | command | exit_code | artifact_path | verified_at | result |
|---|---|---:|---|---|---|
| EU-001 | `node --check reports.js` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 2026-07-03T14:45:00+09:00 | Frontend syntax passed. |
| EU-002 | `redteam_ax_frontend_runtime_readiness_contract.py` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py` | 2026-07-03T14:45:00+09:00 | Runtime frontend contract passed. |
| EU-003 | `test_redteam2_korean_copy_inventory.py` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam2_korean_copy_inventory.json` | 2026-07-03T14:45:00+09:00 | Korean copy inventory passed. |
| EU-004 | `python -m json.tool redteam_ax_completion_audit_matrix.json` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | 2026-07-03T14:45:00+09:00 | Audit JSON syntax passed. |
| EU-005 | `test_completion_audit_matrix.py` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | 2026-07-03T14:45:00+09:00 | Completion audit sanity passed. |
| EU-006 | `py_compile redteam_ax_frontend_runtime_readiness_contract.py` | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py` | 2026-07-03T14:45:00+09:00 | Sanity script syntax passed. |
| EU-007 | `POST /api/redteam/v2/goal-completion-review` via TestClient | 0 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | 2026-07-03T14:45:00+09:00 | `200 goal_completion_blocked 1 3 False`. |
