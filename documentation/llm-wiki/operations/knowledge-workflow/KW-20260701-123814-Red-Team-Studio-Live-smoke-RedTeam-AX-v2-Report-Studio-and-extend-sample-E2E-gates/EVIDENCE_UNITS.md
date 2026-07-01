---
type: evidence_units
task_id: KW-20260701-123814-Red-Team-Studio-Live-smoke-RedTeam-AX-v2-Report-Studio-and-extend-sample-E2E-gates
project: Red Team Studio
---

# Evidence Units

| id | evidence_type | source_path_or_command | claim_supported | exit_code |
|---|---|---|---|---:|
| EV-LIVE-PORTS | command | `Test-NetConnection 127.0.0.1 -Port 5177/8765` | local services listening | 0 |
| EV-LIVE-V2-HEALTH | command | `Invoke-RestMethod /api/redteam/v2/health` | v2 backend loaded after restart | 0 |
| EV-LIVE-ROE | command | `POST /api/redteam/v2/roe/evaluate` | T5 missing scope denied with HITL true | 0 |
| EV-LIVE-TAC | command | `POST /api/redteam/v2/tool-actions/plan` | T3 ToolActionCard is ScopeValidated and HITL required | 0 |
| EV-UI-PANEL | screenshot | `Red Team Studio/고도화/live-smoke/redteam2-report-studio-after-api.png` | 5177 renders `레드팀 분석2` and v2 API ready | 0 |
| EV-UI-QUEUE | screenshot | `Red Team Studio/고도화/live-smoke/redteam2-toolaction-queue-live-smoke.png` | UI click creates visible ToolActionCard queue | 0 |
| EV-SAMPLE-E2E | test | `tests/test_redteam_v2_sample_e2e.py` | sample case reaches report gate with zero blockers | 0 |
| EV-REGRESSION | test/build | v2 API, v1 redteam API, Vite build, plan sanity | focused regression passed | 0 |
