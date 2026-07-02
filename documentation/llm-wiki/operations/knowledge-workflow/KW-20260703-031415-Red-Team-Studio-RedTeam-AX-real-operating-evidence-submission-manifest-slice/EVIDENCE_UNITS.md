---
type: evidence_unit
status: complete
id: EU-REDTEAM-AX-OESM-20260703
project: Red Team Studio
created: 2026-07-03T03:14:15+09:00
---

# Evidence Unit

## Claim

RedTeam AX now has a governed operator evidence submission manifest draft API and RedTeam2 UI controls that hash existing local artifacts and preserve HITL approval boundaries.

## Source

- source_type: local code and regression test
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py`
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- command: `& "J:/PortableApps/genai/projects/ai-agentic-soc/.venv/Scripts/python.exe" -m pytest "tests/test_redteam_v2_api_router.py" -q`
- exit_code: 0
- collected_at: 2026-07-03T03:14:15+09:00

## Evidence

- API regression passed: 70 tests.
- Focused test verifies ready manifest draft and blocker path.
- Frontend runtime readiness contract passed.
- Korean copy inventory passed.
- Accepted gate manifest passed 24/24.

## Confidence

High for implemented API/UI/test contract. Medium for real operating readiness because real organization artifacts and approver identities were not supplied in this slice.

## Limits

This does not prove actual approved operator evidence submission. It only proves manifest draft construction from existing local artifacts.

## Related Decisions

- Do not mark `/goal` complete from manifest draft output.
- Keep human review and validator `--require-approved` as the next gate.
