---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-01T13:14:12+09:00
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

## Codex Evidence Units

| id | claim | source_type | command | exit_code | artifact_path | verified_at |
|---|---|---|---|---:|---|---|
| EV-S6-001 | v2 API supports import-output, normalize, create-evidence candidate flow | command | `.venv/Scripts/python.exe tests/test_redteam_v2_api_router.py` | 0 | `tests/test_redteam_v2_api_router.py` | 2026-07-01T13:18:00+09:00 |
| EV-S6-002 | sample E2E uses tool-run normalization before report gate | command | `.venv/Scripts/python.exe tests/test_redteam_v2_sample_e2e.py` | 0 | `tests/test_redteam_v2_sample_e2e.py` | 2026-07-01T13:18:00+09:00 |
| EV-S6-003 | v1 regression remains green | command | `.venv/Scripts/python.exe tests/test_redteam_api_router.py` | 0 | `tests/test_redteam_api_router.py` | 2026-07-01T13:18:00+09:00 |
| EV-S6-004 | frontend build remains green | command | `npm.cmd run build` | 0 | `soc-frontend-vite-react/soc-frontend/idiomatic-react/dist` | 2026-07-01T13:18:00+09:00 |
| EV-S6-005 | live backend creates ToolRunRecord, NormalizedResult, Evidence candidate artifacts | command | `Invoke-RestMethod ... CASE-LIVE-TOOLRUN-NORMALIZE-001` | 0 | `archive/runs/redteam-ax-v2/CASE-LIVE-TOOLRUN-NORMALIZE-001` | 2026-07-01T13:18:00+09:00 |

