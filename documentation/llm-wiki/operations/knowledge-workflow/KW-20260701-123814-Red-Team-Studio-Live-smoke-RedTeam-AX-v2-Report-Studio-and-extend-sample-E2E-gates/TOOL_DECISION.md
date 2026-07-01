---
type: tool_decision
task_id: KW-20260701-123814-Red-Team-Studio-Live-smoke-RedTeam-AX-v2-Report-Studio-and-extend-sample-E2E-gates
project: Red Team Studio
---

# Tool Decision

| need | chosen_tool | reason | command | exit_code | artifact_path |
|---|---|---|---|---:|---|
| Live API smoke | `Invoke-RestMethod` | Directly proves running 8765 routes and JSON contract | `Invoke-RestMethod /api/redteam/v2/health` | 0 | `WORKLOG.md` |
| Port/process inspection | `Get-NetTCPConnection`, `Get-Process` | Restart only stale 8765 backend process | `Get-NetTCPConnection -LocalPort 8765,5177` | 0 | `WORKLOG.md` |
| Backend restart | `Start-Process -WindowStyle Hidden` | Keeps service available for browser smoke | `Start-Process ... uvicorn runtime.malware_upload_api:app` | 0 | `WORKLOG.md` |
| Browser smoke | Playwright via local `node` | Proves rendered 5177 UI and button interaction | `node -e playwright smoke` | 0 | `고도화/live-smoke/*.png` |
| Backend tests | `.venv/Scripts/python.exe` | FastAPI dependencies live in project venv | `.venv/Scripts/python.exe tests/test_redteam_v2_sample_e2e.py` | 0 | `tests/test_redteam_v2_sample_e2e.py` |
| Frontend build | `npm.cmd run build` | Avoids PowerShell `npm.ps1` policy block | `npm.cmd run build` | 0 | `dist/` build output |

No offensive tools or high-risk actions were executed.
