---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-01T13:35:47+09:00
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

## Evidence Units

- EU-001: `python -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py`; exit_code=0.
- EU-002: `C:/Users/alos/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe -m unittest tests/test_redteam_v2_api_router.py tests/test_redteam_v2_sample_e2e.py tests/test_redteam_api_router.py`; exit_code=0; result=18 tests OK.
- EU-003: `npm.cmd run build`; exit_code=0; note=existing Vite chunk-size warning only.
- EU-004: `python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_plan_contract.py"`; exit_code=0.
- EU-005: live HTTP smoke missing actor context returned `status=invalid`, errors `actor_context_required,actor_role_required`.
- EU-006: live HTTP smoke with matching `X-RedTeam-Actor` and role returned `status=ExportApproved`, `identity_binding=bound`.
- EU-007: live HTTP export returned `status=Exported`, `identity_binding=bound`.
- EU-008: Playwright UI smoke confirmed `ExportApproved` and `Exported`.
- EU-009: screenshot artifact `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/live-smoke/redteam2-actor-bound-export-flow.png`.
