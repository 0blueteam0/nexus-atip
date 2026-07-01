---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-01T12:54:21+09:00
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
| EV-S4-001 | v2 API exposes persistent ToolAction approval queue endpoints | command | `.venv/Scripts/python.exe tests/test_redteam_v2_api_router.py` | 0 | `tests/test_redteam_v2_api_router.py` | 2026-07-01T13:00:00+09:00 |
| EV-S4-002 | sample case includes approval request/decision before manual run and still reaches zero-blocker report gate | command | `.venv/Scripts/python.exe tests/test_redteam_v2_sample_e2e.py` | 0 | `tests/test_redteam_v2_sample_e2e.py` | 2026-07-01T13:00:00+09:00 |
| EV-S4-003 | existing v1 redteam API regression remains green | command | `.venv/Scripts/python.exe tests/test_redteam_api_router.py` | 0 | `tests/test_redteam_api_router.py` | 2026-07-01T13:00:00+09:00 |
| EV-S4-004 | frontend compiles with RedTeam AX v2 queue UI changes | command | `npm.cmd run build` | 0 | `soc-frontend-vite-react/soc-frontend/idiomatic-react/dist` | 2026-07-01T13:00:00+09:00 |
| EV-S4-005 | live backend can persist ApprovalRequested state and reload it with artifact path | command | `Invoke-RestMethod ... /tool-actions/plan`, `/request-approval`, `GET /tool-actions?case_id=CASE-LIVE-APPROVAL-002` | 0 | `archive/runs/redteam-ax-v2/CASE-LIVE-APPROVAL-002/tool-actions/TAC-B0DAFF56EB51.json` | 2026-07-01T13:00:00+09:00 |
| EV-S4-006 | live frontend renders `레드팀 분석2`, ToolActionCard Queue, and Request Approval button | command | `node -e "const { chromium } = require('playwright'); ..."` | 0 | `Red Team Studio/고도화/live-smoke/redteam2-approval-queue-ui-smoke.png` | 2026-07-01T13:00:00+09:00 |

