---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-01T17:42:43+09:00
---

# Evidence Unit

## Claim

## Source

- source_type:
- path_or_url:
- command:
- exit_code:
- collected_at:

## Evidence

## Confidence

## Limits

## Related Decisions

## Filled Record

| id | evidence | command_or_path | exit_code | collected_at |
|---|---|---|---|---|
| EV1 | API regression passed with 39 tests. | `python -m unittest discover -s tests -p "test_redteam_v2_api_router.py"` | 0 | 2026-07-01T17:45+09:00 |
| EV2 | Sample E2E passed with 1 test. | `python -m unittest tests.test_redteam_v2_sample_e2e` | 0 | 2026-07-01T17:45+09:00 |
| EV3 | Frontend production build passed. | `npm.cmd run build` | 0 | 2026-07-01T17:45+09:00 |
| EV4 | JavaScript syntax check passed. | `node --check reports.js` | 0 | 2026-07-01T17:44+09:00 |
| EV5 | Plan contract sanity passed. | `python Red Team Studio/고도화/sanity/test_plan_contract.py` | 0 | 2026-07-01T17:45+09:00 |
| EV6 | Tool install readiness backend exists. | `projects/ai-agentic-soc/runtime/redteam_v2_models.py` | n/a | 2026-07-01T17:45+09:00 |
| EV7 | Tool install readiness UI exists. | `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | n/a | 2026-07-01T17:45+09:00 |

