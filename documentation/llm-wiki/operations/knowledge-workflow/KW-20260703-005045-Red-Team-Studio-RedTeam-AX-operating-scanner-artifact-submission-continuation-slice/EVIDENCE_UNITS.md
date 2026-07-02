---
type: evidence_units
task_id: KW-20260703-005045-Red-Team-Studio-RedTeam-AX-operating-scanner-artifact-submission-continuation-slice
project: Red Team Studio
task: RedTeam AX operating scanner artifact submission continuation slice
created: 2026-07-03T00:50:45+09:00
---

# Evidence Units

| id | source_path | evidence_type | verified_at | notes |
|---|---|---|---|---|
| EV-001 | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py` | source_code | 2026-07-03 | `import_toolchain_artifact_manifest()` validates ToolProfile, ToolActionCard, PlanReady, file path, SHA-256, and persists manifest import artifact. |
| EV-002 | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py` | source_code | 2026-07-03 | Exposes `POST /api/redteam/v2/toolchains/import-artifact-manifest`. |
| EV-003 | `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | regression_test | 2026-07-03 | Six scanner artifact fixture import, bad SHA-256 blocking, and collection Evidence candidate creation covered. |
| EV-004 | `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | frontend_contract | 2026-07-03 | RedTeam2 manifest textarea/button and Korean guidance added. |
| EV-005 | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | completion_audit | 2026-07-03 | Added `RTA-COMP-030` and proved count 29. |
| EV-006 | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | accepted_gate | 2026-07-03 | 24/24 accepted gates passed after changes. |
