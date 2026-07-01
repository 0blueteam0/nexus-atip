---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-01T17:23:41+09:00
---

# Evidence Unit

## Claim

RedTeam AX v2 now revokes/rotates approved wrapper pins and blocks runner token issuance when wrapper trust preflight fails.

## Source

- source_type: local_code_and_tests
- path_or_url: `runtime/redteam_v2_models.py`, `runtime/redteam_v2_api_router.py`, `tests/test_redteam_v2_api_router.py`, `reports.js`
- command: API regression, sample E2E, JS syntax, frontend build, plan sanity
- exit_code: 0
- collected_at: 2026-07-01T17:32:00+09:00

## Evidence

- Revoked pins are excluded from `load_approved_tool_wrapper_pin`.
- Revoke endpoint stores revocation and revoked pin artifacts.
- New pin requests warn when an existing approved pin will be rotated on approval.
- Execution plans for wrapper-backed runners return `preflight_blocked`, `deny_runner`, and blocked token when wrapper preflight fails.
- Tests cover rotate, revoke, manifest approved pin removal, and runner hard-block.

## Confidence

High for API/model/UI foundation under local regression tests.

## Limits

- No real scanner process runner is implemented.
- No live browser smoke was run.

## Related Decisions

- Enforce hard-block at execution-plan token stage before process runner implementation.

