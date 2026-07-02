---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-02T16:15:26+09:00
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

Claim: Implemented RedTeam AX OpenVAS/ZAP read-only service report import adapter after Docker daemon remained unavailable. Added /api/redteam/v2/scanner-service-imports/{tool_id}, local endpoint smoke, audit/wiki/plan updates, and accepted gate coverage.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-161526-Red-Team-Studio-RedTeam-AX-Docker-container-runtime-live-smoke-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T16:24:13+09:00

Evidence artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-openvas-zap-service-import-smoke/latest_openvas_zap_service_import_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_openvas_zap_service_import_smoke.py

Command evidence:
- python knowledge_workflow.py start exit_code=0
- docker version --format {{json .}} exit_code=1 Docker Server null unable to start
- python redteam_ax_openvas_zap_service_import_smoke.py exit_code=0 status passed
- python redteam_ax_accepted_gate_manifest.py exit_code=0 accepted_gate_count 12 passed_gate_count 12

Limits:
- Docker Desktop daemon remains unavailable in current host state.
- Local service import smoke does not prove organization OpenVAS/ZAP endpoint availability.
