# Tooling

| tool | purpose | command | exit_code | artifact_path |
|---|---|---|---:|---|
| PowerShell networking | port/process checks | `Get-NetTCPConnection` | 0 | `WORKLOG.md` |
| FastAPI live API | backend smoke | `Invoke-RestMethod` | 0 | `EVIDENCE_UNITS.md` |
| Playwright | browser smoke and screenshots | `node -e playwright smoke` | 0 | `고도화/live-smoke/*.png` |
| unittest | API/sample regression | `.venv/Scripts/python.exe tests/*.py` | 0 | `tests/test_redteam_v2_sample_e2e.py` |
| Vite | frontend build | `npm.cmd run build` | 0 | build output |
