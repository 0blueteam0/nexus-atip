---
type: evidence_unit
status: updated
id: EU-REDTEAM2-INSTALL-EVIDENCE-COVERAGE-20260707
project: Red-Team-Studio
created: 2026-07-07T09:45:55+09:00
---

# Evidence Unit

## Claim

RedTeam AX now exposes six-tool installation/version evidence coverage through the v2 API and RedTeam2 frontend.

## Source

- source_type: local_source_and_tests
- path_or_url: `runtime/redteam_v2_models.py`, `reports.js`, `tests/test_redteam_v2_api_router.py`
- command: `node --check`; frontend runtime/launch sanity; `py_compile`; selected pytest
- exit_code: 0 for final verification commands
- collected_at: 2026-07-07T09:58:00+09:00

## Evidence

- API registry returns coverage rows, missing tools, completion flag, Korean operator summary.
- Frontend loads `/api/redteam/v2/tool-install-version-evidence` and renders `설치 증거`.
- Regression asserts six rows and SCA safe flags.

## Confidence

High for API/UI contract and selected regression scope.

## Limits

This does not prove active tool analysis or final Evidence/Finding/Matrix/Report/export completion.
