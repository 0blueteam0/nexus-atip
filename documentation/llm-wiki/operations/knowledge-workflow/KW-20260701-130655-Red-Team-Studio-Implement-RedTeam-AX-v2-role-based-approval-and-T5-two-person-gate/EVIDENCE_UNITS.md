---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-01T13:06:55+09:00
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
| EV-S5-001 | API enforces role-based T4/T5 approval and ActionCard-required manual-run | command | `.venv/Scripts/python.exe tests/test_redteam_v2_api_router.py` | 0 | `tests/test_redteam_v2_api_router.py` | 2026-07-01T13:11:00+09:00 |
| EV-S5-002 | sample E2E still reaches zero-blocker report gate with explicit approver role | command | `.venv/Scripts/python.exe tests/test_redteam_v2_sample_e2e.py` | 0 | `tests/test_redteam_v2_sample_e2e.py` | 2026-07-01T13:11:00+09:00 |
| EV-S5-003 | existing v1 redteam API regression remains green | command | `.venv/Scripts/python.exe tests/test_redteam_api_router.py` | 0 | `tests/test_redteam_api_router.py` | 2026-07-01T13:11:00+09:00 |
| EV-S5-004 | frontend compiles with approval role display | command | `npm.cmd run build` | 0 | `soc-frontend-vite-react/soc-frontend/idiomatic-react/dist` | 2026-07-01T13:11:00+09:00 |
| EV-S5-005 | live backend blocks T5 manual-run until two distinct approvers approve | command | `Invoke-RestMethod ... CASE-LIVE-T5-TWO-PERSON-001` | 0 | `archive/runs/redteam-ax-v2/CASE-LIVE-T5-TWO-PERSON-001/tool-actions/TAC-D462D7D66FA8.json` | 2026-07-01T13:11:00+09:00 |
| EV-S5-006 | live frontend renders required approval roles in `레드팀 분석2` Queue | command | `node -e "const { chromium } = require('playwright'); ..."` | 0 | `Red Team Studio/고도화/live-smoke/redteam2-approval-roles-ui-smoke.png` | 2026-07-01T13:11:00+09:00 |

