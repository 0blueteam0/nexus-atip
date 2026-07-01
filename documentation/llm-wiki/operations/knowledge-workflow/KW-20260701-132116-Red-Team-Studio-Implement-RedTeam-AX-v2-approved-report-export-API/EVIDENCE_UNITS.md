---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-01T13:21:16+09:00
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

## Evidence Units - Slice 7

- EU-001 command: `python -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py`; exit_code=0.
- EU-002 command: `C:/Users/alos/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe -m unittest tests/test_redteam_v2_api_router.py tests/test_redteam_v2_sample_e2e.py tests/test_redteam_api_router.py`; exit_code=0; result=17 tests OK.
- EU-003 command: `npm.cmd run build`; cwd=`soc-frontend-vite-react/soc-frontend/idiomatic-react`; exit_code=0; note=existing Vite chunk-size warning only.
- EU-004 command: `python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_plan_contract.py"`; exit_code=0.
- EU-005 live smoke: `POST /api/redteam/v2/reports/{report_id}/export` without approval returned `status=blocked`, `errors=report_export_approval_required`.
- EU-006 live smoke: `POST /api/redteam/v2/reports/{report_id}/approve-export` with `approver_role=executive_sponsor` returned `status=ExportApproved`.
- EU-007 live smoke: approved export returned `status=Exported` and artifact exists at `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2/CASE-LIVE-REPORT-EXPORT-001/exports/RTEXP-A54730C3CF84.json`.
