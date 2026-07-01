# Handoff

## Summary

v2 now persists case artifacts and writes Korean Red Team Report v2 Markdown when report gate passes.

| command | exit_code | artifact_path |
|---|---:|---|
| `.venv/Scripts/python.exe tests/test_redteam_v2_sample_e2e.py` | 0 | `tests/test_redteam_v2_sample_e2e.py` |
| `Invoke-RestMethod POST /api/redteam/v2/reports/generate` | 0 | `archive/runs/redteam-ax-v2/CASE-LIVE-REPORT-001/reports/RTRPT-573FF3632968.md` |

Next: add approved export API and frontend reload from persisted backend state.
