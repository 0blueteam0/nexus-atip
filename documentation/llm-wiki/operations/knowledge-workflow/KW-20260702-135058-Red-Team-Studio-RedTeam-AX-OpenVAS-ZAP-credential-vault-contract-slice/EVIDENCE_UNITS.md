---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-02T13:50:59+09:00
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

Claim: RedTeam AX OpenVAS/ZAP credential vault contract slice added read-only credential policy registry, external vault reference authorization API, Korean RedTeam2 UI panel, tests, audit matrix, plan, and LLM wiki updates.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-135058-Red-Team-Studio-RedTeam-AX-OpenVAS-ZAP-credential-vault-contract-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T13:58:12+09:00

Evidence artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py
- J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py
- J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2/CASE-V2-CREDENTIAL-VAULT-001
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json

Command evidence:
- pytest tests/test_redteam_v2_api_router.py -q => exit 0, 50 passed
- pytest tests/test_redteam_v2_sample_e2e.py -q => exit 0, 1 passed
- node --check reports.js => exit 0
- npm.cmd run build => exit 0
- test_completion_audit_matrix.py => exit 0
- test_plan_contract.py => exit 0
- test_redteam2_korean_copy_inventory.py => exit 0
- redteam_ax_live_browser_parser_smoke.py --allow-browser --require-live => exit 0, status passed
- py_compile redteam_v2_models.py redteam_v2_api_router.py => exit 0

Limits:
- Remaining completion gaps are Nuclei/OpenVAS/Trivy/ZAP plus Docker/container runtime live smoke artifacts and full accepted gate manifest; credential authorization does not execute scanners.
