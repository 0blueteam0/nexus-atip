---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-01T13:29:49+09:00
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

- EU-001: `npm.cmd run build`; cwd=`soc-frontend-vite-react/soc-frontend/idiomatic-react`; exit_code=0; note=existing Vite chunk-size warning only.
- EU-002: `C:/Users/alos/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe -m unittest tests/test_redteam_v2_api_router.py tests/test_redteam_v2_sample_e2e.py tests/test_redteam_api_router.py`; exit_code=0; result=17 tests OK.
- EU-003: `python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_plan_contract.py"`; exit_code=0.
- EU-004: `python -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py`; exit_code=0.
- EU-005: Playwright render smoke confirmed text: `Report v2 Final Gate / Export`, `Generate Report v2`, `Approve Export`, `Export Report`.
- EU-006: Playwright flow smoke confirmed UI state sequence: `pass -> ExportApproved -> Exported`.
- EU-007 artifact: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/live-smoke/redteam2-report-export-ui.png`.
- EU-008 artifact: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/live-smoke/redteam2-report-export-flow.png`.
