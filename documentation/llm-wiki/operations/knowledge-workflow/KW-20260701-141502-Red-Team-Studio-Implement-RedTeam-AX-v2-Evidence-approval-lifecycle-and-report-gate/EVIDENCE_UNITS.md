---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-01T14:15:02+09:00
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
- EU-002: `C:/Users/alos/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe -m unittest tests/test_redteam_v2_api_router.py tests/test_redteam_v2_sample_e2e.py`; exit_code=0; result=17 tests OK.
- EU-003: `C:/Users/alos/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe -m unittest tests/test_redteam_api_router.py`; exit_code=0; result=2 tests OK.
- EU-004: `npm.cmd run build`; exit_code=0; note=existing Vite chunk-size warning only.
- EU-005: plan contract sanity; exit_code=0.
- EU-006: live HTTP smoke: pending Evidence produced blocked report gate with `unapproved_evidence_count=1`.
- EU-007: live HTTP smoke: Evidence approval returned `status=approved`; subsequent report gate `pass` with `report_unapproved=0`; export `Exported`.
- EU-008: Playwright UI smoke returned `evidence=approved`, `gate=pass`, `approval=ExportApproved`, `export=Exported`.
- EU-009: screenshot artifact: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/live-smoke/redteam2-evidence-approved-export-flow.png`.
