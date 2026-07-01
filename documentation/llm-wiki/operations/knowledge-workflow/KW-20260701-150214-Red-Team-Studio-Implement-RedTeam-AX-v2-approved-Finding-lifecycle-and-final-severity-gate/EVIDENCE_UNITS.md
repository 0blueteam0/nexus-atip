---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-01T15:02:14+09:00
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

- evidence_id: `EV-S11-CODE-FINDING-LIFECYCLE`
  - source_path: `J:\PortableApps\genai\projects\ai-agentic-soc\runtime\redteam_v2_models.py`
  - artifact_path: `J:\PortableApps\genai\projects\ai-agentic-soc\runtime\redteam_v2_api_router.py`
  - claim: FindingV2 creation and final severity approval are API-backed and persisted as artifacts.
  - verified_at: 2026-07-01T15:00:00+09:00

- evidence_id: `EV-S11-TEST-UNIT-E2E`
  - command: `python -m unittest tests.test_redteam_v2_api_router tests.test_redteam_v2_sample_e2e`
  - exit_code: 0
  - artifact_path: `J:\PortableApps\genai\projects\ai-agentic-soc\tests\test_redteam_v2_api_router.py`
  - claim: Report gate blocks unapproved Finding/final severity and passes approved Finding E2E.
  - verified_at: 2026-07-01T15:00:00+09:00

- evidence_id: `EV-S11-LIVE-API`
  - command: `live requests smoke against http://127.0.0.1:8765/api/redteam/v2`
  - exit_code: 0
  - artifact_path: `J:\PortableApps\genai\projects\ai-agentic-soc\archive\runs\redteam-ax-v2\CASE-LIVE-FINDING-APPROVAL-001`
  - claim: Unapproved Finding blocks report; two-person severity approval allows report generation and export.
  - verified_at: 2026-07-01T15:00:00+09:00

- evidence_id: `EV-S11-UI-SMOKE`
  - command: `npx --yes --package playwright node -`
  - exit_code: 0
  - artifact_path: `J:\PortableApps\genai\projects\ai-agentic-soc\Red Team Studio\고도화\live-smoke\redteam2-finding-approved-export-flow.png`
  - claim: Report Studio `레드팀 분석2` UI exposes Finding Approval and Final Severity status and reaches Exported.
  - verified_at: 2026-07-01T15:00:00+09:00
