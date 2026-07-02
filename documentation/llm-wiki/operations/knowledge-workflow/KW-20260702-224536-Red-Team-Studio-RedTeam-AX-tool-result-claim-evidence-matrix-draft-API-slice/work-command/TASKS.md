# Tasks

## Completed

- Added backend Matrix draft model function for tool result Finding/Claim candidates.
- Exposed `POST /api/redteam/v2/tool-result-finding-claim-review/matrix-draft`.
- Added regression tests for held rows and ready rows.
- Updated RedTeam2 Korean panel and frontend sanity contracts.
- Updated FINAL_PLAN, Detailed_PLAN, LLM Wiki, completion audit, and accepted gate artifact.

## Not Completed

- Real Docker/WSL/OpenVAS/ZAP readiness blockers are still open.
- Real operating candidates are not all Evidence-approved, Finding-promoted, severity-approved, or report-validated.

## Next Tasks

1. Approve real Evidence Cards for tool result candidates.
2. Promote all real candidates through the promotion API.
3. Complete red_team_lead and business_owner severity approvals.
4. Run Matrix draft for all candidates.
5. Generate Korean Red Team Report v2 only after report validation blockers are zero.
