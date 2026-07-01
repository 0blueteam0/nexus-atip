# Decisions

| id | decision | command | exit_code | artifact_path |
|---|---|---|---:|---|
| D1 | Restart 8765 because live server was stale | `Invoke-RestMethod /api/redteam/v2/health` | 0 after restart | `WORKLOG.md` |
| D2 | Use browser smoke rather than source-only verification | `node -e playwright smoke` | 0 | `고도화/live-smoke/*.png` |
| D3 | Add fixture sample E2E before persistence | `.venv/Scripts/python.exe tests/test_redteam_v2_sample_e2e.py` | 0 | `tests/test_redteam_v2_sample_e2e.py` |
