---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-01T16:28:31+09:00
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

# Evidence Units

| ID | Type | Evidence | Result |
|---|---|---|---|
| EV-S20-001 | source | `reports.js` | RedTeam2 sanitizer raw output state/action/panel added. |
| EV-S20-002 | source | `FINAL_PLAN.md` | Slice 20 status and remaining upload/OCR/visual smoke gaps recorded. |
| EV-S20-003 | command | `node --check reports.js`, exit_code=0 | Frontend syntax passed. |
| EV-S20-004 | command | `python -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`, exit_code=0 | 31 backend v2 API tests passed. |
| EV-S20-005 | command | `python -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"`, exit_code=0 | Sample E2E passed. |
| EV-S20-006 | command | `python "Red Team Studio/고도화/sanity/test_plan_contract.py"`, exit_code=0 | Plan sanity passed. |
| EV-S20-007 | live-smoke | `Invoke-RestMethod /api/redteam/v2/tool-runs/{run_id}/sanitize-preview`, exit_code=0 with HTTP 404 body | Existing 8765 backend was stale; source/test validation remains authoritative for this slice. |
