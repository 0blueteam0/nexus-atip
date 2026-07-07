# Evidence Units

| id | type | artifact_path | verified_at | result |
| --- | --- | --- | --- | --- |
| EU-001 | source | `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 2026-07-07 | Preserves `runner_steps` in `compositeRunnerStepsJson` and uses it for governed runner payloads. |
| EU-002 | test | `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | 2026-07-07 | Adds preset runner E2E regression through collect-results. |
| EU-003 | sanity | `projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py` | 2026-07-07 | Requires Korean UI/runtime contract terms for preset execution result preservation. |
| EU-004 | command | `node --check reports.js` | 2026-07-07 | exit 0. |
| EU-005 | command | focused pytest selection | 2026-07-07 | 3 passed, exit 0. |
| EU-006 | command | frontend runtime and launch sanity | 2026-07-07 | both exit 0. |
| EU-007 | docs | `Detailed_PLAN.MD`, `FINAL_PLAN.md` | 2026-07-07 | Records the new runner step preservation contract and remaining full-goal gaps. |
