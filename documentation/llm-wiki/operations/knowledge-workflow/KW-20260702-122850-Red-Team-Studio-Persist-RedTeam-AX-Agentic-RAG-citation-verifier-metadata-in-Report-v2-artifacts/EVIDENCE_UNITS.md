---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-02T12:28:50+09:00
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

Claim: RedTeam AX Agentic RAG citation verifier metadata persisted into Report v2 validation, markdown report sections, UI payload, live smoke, and hold audit log.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-122850-Red-Team-Studio-Persist-RedTeam-AX-Agentic-RAG-citation-verifier-metadata-in-Report-v2-artifacts
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T12:37:55+09:00

Evidence artifacts:
- runtime/redteam_v2_models.py
- tests/test_redteam_v2_api_router.py
- soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js
- Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py
- Red Team Studio/FINAL_PLAN.md

Command evidence:
- py_compile exit 0
- tests/test_redteam_v2_api_router.py exit 0, 46 tests
- tests/test_redteam_v2_sample_e2e.py exit 0
- test_plan_contract.py exit 0
- npm.cmd run build exit 0
- redteam_ax_live_browser_parser_smoke.py --allow-browser --allow-agentic-rag --require-live exit 0

Limits:
- Full-screen Korean localization remains for next slice; current slice localizes touched Agentic RAG/report gate surfaces.
