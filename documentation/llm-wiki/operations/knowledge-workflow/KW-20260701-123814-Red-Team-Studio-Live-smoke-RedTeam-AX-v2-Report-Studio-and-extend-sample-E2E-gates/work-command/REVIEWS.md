# Reviews

| review | result | command | exit_code | artifact_path |
|---|---|---|---:|---|
| v2 live API review | pass | `Invoke-RestMethod /api/redteam/v2/health` | 0 | `EVIDENCE_UNITS.md` |
| UI render review | pass | Playwright screenshot | 0 | `redteam2-report-studio-after-api.png` |
| UI action review | pass | Playwright button click | 0 | `redteam2-toolaction-queue-live-smoke.png` |
| sample E2E review | pass | `.venv/Scripts/python.exe tests/test_redteam_v2_sample_e2e.py` | 0 | `tests/test_redteam_v2_sample_e2e.py` |

Remaining review: persistence, final report artifact export, and full security regression.
