---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-01T15:17:02+09:00
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

# Evidence units

- evidence_id: `EV-S12-ACTOR-PROVIDER-CODE`
  - source_path: `J:\PortableApps\genai\projects\ai-agentic-soc\runtime\redteam_v2_models.py`
  - artifact_path: `J:\PortableApps\genai\projects\ai-agentic-soc\runtime\redteam_v2_api_router.py`
  - claim: Approval APIs now receive actor context from a deterministic provider/RBAC resolver instead of trusting raw headers directly.
  - verified_at: 2026-07-01T15:25:00+09:00

- evidence_id: `EV-S12-TEST-UNIT-E2E`
  - command: `python -m unittest tests.test_redteam_v2_api_router tests.test_redteam_v2_sample_e2e`
  - exit_code: 0
  - artifact_path: `J:\PortableApps\genai\projects\ai-agentic-soc\tests\test_redteam_v2_api_router.py`
  - claim: Registered actor, wrong role, unregistered actor, and session-bound report export approval are covered.
  - verified_at: 2026-07-01T15:25:00+09:00

- evidence_id: `EV-S12-LIVE-API`
  - command: `live requests smoke against http://127.0.0.1:8765/api/redteam/v2`
  - exit_code: 0
  - artifact_path: `J:\PortableApps\genai\projects\ai-agentic-soc\archive\runs\redteam-ax-v2\CASE-LIVE-ACTOR-PROVIDER-001`
  - claim: Session-bound actor context authenticates approved actors and blocks wrong-role/unregistered approvals.
  - verified_at: 2026-07-01T15:25:00+09:00

- evidence_id: `EV-S12-UI-SMOKE`
  - command: `npx.cmd --yes --package playwright node -`
  - exit_code: 0
  - artifact_path: `J:\PortableApps\genai\projects\ai-agentic-soc\Red Team Studio\고도화\live-smoke\redteam2-actor-provider-export-flow.png`
  - claim: Report Studio `레드팀 분석2` still reaches exported state after actor-provider hardening.
  - verified_at: 2026-07-01T15:25:00+09:00
