---
type: evidence_unit
status: complete
id: EU-REDTEAM-AX-MULTITOOL-PROGRESS-20260703
project: Red Team Studio
created: 2026-07-03T03:49:01+09:00
updated: 2026-07-03T04:08:00+09:00
---

# Evidence Unit

## Claim

RedTeam AX governed multi-tool execution now exposes Korean progress, per-tool status, operator guidance, and next-action state to the API and RedTeam2 UI.

## Source

- source_type: code, tests, generated gate artifact
- path_or_url: `projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- path_or_url: `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- path_or_url: `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- path_or_url: `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`
- command: `pytest tests/test_redteam_v2_api_router.py -q`
- exit_code: 0
- collected_at: 2026-07-03T04:08:00+09:00

## Evidence

- API response includes `progress_percent`, `completed_step_count`, `current_stage_ko`, `operator_summary_ko`, `next_action_ko`, `progress_events`.
- Each step includes `status_ko`, `operator_message_ko`, and `progress_percent`.
- RedTeam2 UI renders `진행률`, `다음 행동`, and `도구 진행` rows/tables.
- Regression result: 71 passed, 1 warning.
- Accepted gate result: 24/24 passed.

## Confidence

High for local API/UI contract coverage. Not sufficient for full goal completion because real organization-approved tool execution and closure evidence are still absent.

## Limits

This slice improves execution observability. It does not prove every real tool has run or that Evidence/Finding/Report/export gates are closed.
