---
type: evidence_units
task_id: KW-20260701-122318-Red-Team-Studio-Implement-RedTeam-AX-v2-Report-Studio-redteam2-UI-and-API-sanity-slice
project: Red Team Studio
---

# Evidence Units

| id | evidence_type | source_path | claim_supported | verification |
|---|---|---|---|---|
| EV-SPEC-25 | source_doc | `Red Team Studio/SPEC/25_TOOL_ACTION_CARD_AND_WEBAPP_SPEC.md` | ToolActionCard/manual-run UI is required | read with UTF-8 |
| EV-SPEC-30 | source_doc | `Red Team Studio/SPEC/30_TOOLING_API_SPEC.md` | ToolAction API/manual-run/evidence/report linking contracts | read with UTF-8 |
| EV-RAG-RTM | source_doc | `Red Team Studio/Agentic RAG SPEC/05_REQUIREMENTS_TRACEABILITY_MATRIX.md` | unsupported claim and citation/evidence gates | read with UTF-8 |
| EV-UI-REDTEAM2 | code | `soc-frontend-vite-react/.../reports.js` | `레드팀 분석2` tab and isolated v2 state added | `npm.cmd run build` exit 0 |
| EV-API-V2 | code | `runtime/redteam_v2_api_router.py`, `runtime/redteam_v2_models.py` | `/api/redteam/v2` safe contracts added | py_compile and unittest exit 0 |
| EV-APP-INCLUDE | code | `runtime/malware_upload_api.py` | v2 router included in FastAPI app | v2 TestClient tests exit 0 |
| EV-TEST-V2 | test | `tests/test_redteam_v2_api_router.py` | v2 health/ROE/HITL/evidence/report gates covered | 6 tests OK |
| EV-TEST-V1 | test | `tests/test_redteam_api_router.py` | existing redteam v1 API did not regress | 2 tests OK |
| EV-DOC-FINAL | doc | `Red Team Studio/FINAL_PLAN.md` | active plan reflects slice 1 status | plan sanity exit 0 |

