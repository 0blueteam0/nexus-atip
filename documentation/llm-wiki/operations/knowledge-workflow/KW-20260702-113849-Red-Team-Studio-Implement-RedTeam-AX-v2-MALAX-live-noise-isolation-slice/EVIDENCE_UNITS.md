---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-02T11:38:49+09:00
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



## Autofill Evidence Unit

Claim: Slice 40 isolated MALAX live polling noise that affected Report Studio and RedTeam2 browser smoke. The MALAX bridge now catches core RecordStore failures for /api/malax/latest and /api/malax/runs, returns a degraded latest payload or legacy run fallback instead of HTTP 500, and the RedTeam AX live browser smoke now waits for domcontentloaded/body visibility instead of networkidle so ongoing MALAX polling does not block DOM verification.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-113849-Red-Team-Studio-Implement-RedTeam-AX-v2-MALAX-live-noise-isolation-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T11:43:20+09:00

Evidence artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/malware_upload_api.py
- J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_malax_bridge_degraded.py
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md

Command evidence:
- python tests/test_malax_bridge_degraded.py -> 2 tests OK
- python tests/test_redteam_v2_api_router.py -> 42 tests OK
- python -m py_compile runtime/malware_upload_api.py redteam_ax_live_browser_parser_smoke.py -> exit 0
- Invoke-RestMethod /api/malax/latest and /api/malax/runs?limit=8 against live 8765 -> both HTTP 200
- redteam_ax_live_browser_parser_smoke.py --allow-browser --allow-action --require-live -> status passed, blockers []
- python tests/test_redteam_v2_sample_e2e.py -> 1 test OK
- npm.cmd run build in frontend/report-studio-vite -> vite build OK
- python Red Team Studio/고도화/sanity/test_plan_contract.py -> plan contract sanity passed

Limits:
- Underlying MALAX workspace/storage disk I/O root cause is not fixed; it is isolated from UI polling and remains tracked separately in FINAL_PLAN.
