---
type: evidence_unit
status: complete
project: Red Team Studio
created: 2026-07-02T23:46:16+09:00
---

# Evidence Units

| id | type | command/source | exit_code | artifact_path | claim_supported |
|---|---|---:|---:|---|---|
| EV-001 | source | `redteam_v2_models.py` | n/a | `projects/ai-agentic-soc/runtime/redteam_v2_models.py` | Batch collection Finding severity approval added |
| EV-002 | source | `redteam_v2_api_router.py` | n/a | `projects/ai-agentic-soc/runtime/redteam_v2_api_router.py` | API route exposed |
| EV-003 | test | `pytest tests/test_redteam_v2_api_router.py -q` | 0 | `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | Full API regression passed |
| EV-004 | frontend | `node --check reports.js` | 0 | `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | Frontend syntax passed |
| EV-005 | gate | `redteam_ax_accepted_gate_manifest.py` | 0 | `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | Accepted gate 24/24 passed |
