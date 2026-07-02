---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-02T16:56:07+09:00
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

Claim: Added RedTeam AX external OpenVAS/ZAP service import live harness, connected its artifact to /api/redteam/v2/runtime-readiness and RedTeam2 runtime readiness UI, updated accepted gate manifest to 16/16, and refreshed plan/wiki/audit evidence.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-165607-Red-Team-Studio-RedTeam-AX-external-runtime-readiness-next-implementation-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T17:02:41+09:00

Evidence artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_external_scanner_service_import_live_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-external-scanner-service-import-live/latest_external_scanner_service_import_live_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py
- J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js

Command evidence:
- .venv/Scripts/python.exe Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py -> exit_code 0, accepted_gate_count 16, passed_gate_count 16, failed_gate_count 0
- .venv/Scripts/python.exe Red Team Studio/고도화/sanity/redteam_ax_external_scanner_service_import_live_smoke.py -> exit_code 0, status blocked_external_scanner_import_not_ready, service_endpoint_fetch_executed false

Limits:
- Goal remains active: Docker daemon real container smoke and organization OpenVAS/ZAP endpoint/vault env live import are still not proved in this environment.
