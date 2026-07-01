---
type: worklog
status: complete_for_slice
project: Red Team Studio
task: Live smoke RedTeam AX v2 Report Studio and extend sample E2E gates
created: 2026-07-01T12:38:14+09:00
---

# Worklog

## Context

The prior slice added `레드팀 분석2` and `/api/redteam/v2`. This slice verified the implementation against the running local services and added a sample E2E test for the report gate.

## Execution Records

| command | exit_code | artifact_path | verified_at |
|---|---:|---|---|
| `Test-NetConnection 127.0.0.1 -Port 5177; Test-NetConnection 127.0.0.1 -Port 8765` | 0 | live ports | 2026-07-01T12:38+09:00 |
| `Invoke-RestMethod http://127.0.0.1:8765/api/redteam/v2/health` before restart | 1 | stale backend, 404 | 2026-07-01T12:39+09:00 |
| `Stop-Process` for PID 120756 and `Start-Process ... uvicorn runtime.malware_upload_api:app --port 8765` | 0 | restarted backend | 2026-07-01T12:39+09:00 |
| `Invoke-RestMethod http://127.0.0.1:8765/api/redteam/v2/health` after restart | 0 | v2 health live | 2026-07-01T12:39+09:00 |
| `Invoke-RestMethod POST /api/redteam/v2/roe/evaluate` with T5 missing scope | 0 | deny, HITL true | 2026-07-01T12:39+09:00 |
| `Invoke-RestMethod POST /api/redteam/v2/tool-actions/plan` with T3 scope | 0 | ScopeValidated, HITL true | 2026-07-01T12:39+09:00 |
| Playwright navigate 5177 -> Report Studio -> `레드팀 분석2` | 0 | `고도화/live-smoke/redteam2-report-studio-after-api.png` | 2026-07-01T12:40+09:00 |
| Playwright click `ToolActionCard 계획` | 0 | `고도화/live-smoke/redteam2-toolaction-queue-live-smoke.png` | 2026-07-01T12:41+09:00 |
| `.venv/Scripts/python.exe tests/test_redteam_v2_sample_e2e.py` | 0 | 1 sample E2E test OK | 2026-07-01T12:42+09:00 |
| `.venv/Scripts/python.exe tests/test_redteam_v2_api_router.py` | 0 | 6 v2 API tests OK | 2026-07-01T12:42+09:00 |
| `.venv/Scripts/python.exe tests/test_redteam_api_router.py` | 0 | 2 v1 regression tests OK | 2026-07-01T12:42+09:00 |
| `npm.cmd run build` | 0 | frontend build OK | 2026-07-01T12:42+09:00 |
| `python 고도화/sanity/test_plan_contract.py` | 0 | plan sanity OK | 2026-07-01T12:42+09:00 |

## Findings

- 5177 and 8765 were already listening, but 8765 was stale and returned 404 for v2 routes until restarted.
- After restart, v2 API and UI integration worked.
- Browser smoke verified ToolActionCard queue shows `ScopeValidated`, `T3`, HITL required, and `Request Approval`.

## Next

Implement persistence for ToolActionCard queue and generate an actual Korean Report v2 artifact from stored sample evidence.
