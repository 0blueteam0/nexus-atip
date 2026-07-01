---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-01T15:23:12+09:00
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

- evidence_id: `EV-S13-CASE-RBAC-CODE`
  - source_path: `J:\PortableApps\genai\projects\ai-agentic-soc\runtime\redteam_v2_models.py`
  - artifact_path: `J:\PortableApps\genai\projects\ai-agentic-soc\runtime\redteam_v2_api_router.py`
  - claim: Actor context now includes case-scoped roles and permissions derived from local case assignment policy.
  - verified_at: 2026-07-01T15:35:00+09:00

- evidence_id: `EV-S13-TEST-UNIT-E2E`
  - command: `python -m unittest tests.test_redteam_v2_api_router tests.test_redteam_v2_sample_e2e`
  - exit_code: 0
  - artifact_path: `J:\PortableApps\genai\projects\ai-agentic-soc\tests\test_redteam_v2_api_router.py`
  - claim: Case RBAC policy listing and unassigned case approval denial are covered.
  - verified_at: 2026-07-01T15:35:00+09:00

- evidence_id: `EV-S13-LIVE-API`
  - command: `live requests smoke against http://127.0.0.1:8765/api/redteam/v2`
  - exit_code: 0
  - artifact_path: `J:\PortableApps\genai\projects\ai-agentic-soc\archive\runs\redteam-ax-v2\CASE-LIVE-RBAC-001`
  - claim: Unassigned cases reject approvals while assigned cases allow required case-scoped roles.
  - verified_at: 2026-07-01T15:35:00+09:00

- evidence_id: `EV-S13-UI-SMOKE`
  - command: `npx.cmd --yes --package playwright node -`
  - exit_code: 0
  - artifact_path: `J:\PortableApps\genai\projects\ai-agentic-soc\Red Team Studio\고도화\live-smoke\redteam2-case-rbac-export-flow.png`
  - claim: Report Studio `레드팀 분석2` still reaches exported state under case-scoped RBAC policy.
  - verified_at: 2026-07-01T15:35:00+09:00
