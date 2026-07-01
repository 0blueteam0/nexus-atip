---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-01T16:58:46+09:00
---

# Evidence Units

| id | source_path | command | exit_code | artifact_path | verified_at | finding |
|---|---|---|---:|---|---|---|
| EV-001 | `SPEC/26_TOOL_EXECUTION_SANDBOX_AND_APPROVAL_SPEC.md` | `rg -n "Nuclei\|OpenVAS\|Trivy\|npm audit\|OWASP ZAP\|ToolHub\|analysis tool\|runner\|install\|readiness\|execute" ...` | 0 | `FINAL_PLAN.md` | 2026-07-01T16:59+09:00 | Sandbox/network allowlist remained open. |
| EV-002 | `runtime/redteam_v2_models.py` | scoped reads around ToolProfile and `governed_tool_execution` | 0 | `runtime/redteam_v2_models.py` | 2026-07-01T17:00+09:00 | Existing execution was run-record oriented; ToolExecutionPlan was missing. |
| EV-003 | `reports.js` | `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 0 | `reports.js` | 2026-07-01T17:03+09:00 | Frontend syntax passed. |
| EV-004 | `tests/test_redteam_v2_api_router.py` | `.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"` | 0 | `tool-execution-plans/*.json` | 2026-07-01T17:03+09:00 | 34 API tests passed, including sandbox deny and high-risk approval gate. |
| EV-005 | `tests/test_redteam_v2_sample_e2e.py` | `.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"` | 0 | sample E2E result | 2026-07-01T17:03+09:00 | Sample E2E remained green. |
| EV-006 | frontend app | `npm.cmd run build` | 0 | `dist/` | 2026-07-01T17:03+09:00 | Vite build passed with existing chunk warning. |
| EV-007 | `FINAL_PLAN.md` | `..\\.venv\\Scripts\\python.exe 고도화\\sanity\\test_plan_contract.py` | 0 | `FINAL_PLAN.md` | 2026-07-01T17:03+09:00 | Plan contract sanity passed. |

## Limits

This slice creates governed execution plans and tokens; it does not execute an ephemeral container or scanner.

