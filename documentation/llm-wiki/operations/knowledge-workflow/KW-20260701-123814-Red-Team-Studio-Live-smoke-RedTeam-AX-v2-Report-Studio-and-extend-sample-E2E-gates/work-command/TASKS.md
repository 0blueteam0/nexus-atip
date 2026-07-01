# Tasks

| id | status | task | command | exit_code | artifact_path |
|---|---|---|---|---:|---|
| T1 | done | Check live 5177/8765 ports | `Test-NetConnection` | 0 | `WORKLOG.md` |
| T2 | done | Restart stale 8765 backend | `Stop-Process`; `Start-Process -WindowStyle Hidden` | 0 | `WORKLOG.md` |
| T3 | done | Verify v2 live API | `Invoke-RestMethod /api/redteam/v2/*` | 0 | `EVIDENCE_UNITS.md` |
| T4 | done | Verify 5177 redteam2 render | Playwright smoke | 0 | `고도화/live-smoke/redteam2-report-studio-after-api.png` |
| T5 | done | Verify ToolActionCard queue click | Playwright smoke | 0 | `고도화/live-smoke/redteam2-toolaction-queue-live-smoke.png` |
| T6 | done | Add sample E2E test | `.venv/Scripts/python.exe tests/test_redteam_v2_sample_e2e.py` | 0 | `tests/test_redteam_v2_sample_e2e.py` |
| T7 | pending | Persist ToolActionCard queue | not run | -1 | next slice |
| T8 | pending | Generate durable Korean Report v2 artifact | not run | -1 | next slice |
