---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-02T12:57:23+09:00
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

Claim: RedTeam AX Report Studio RedTeam2 Korean display mapping slice added local display helpers for statuses, roles, severities, approval modes, execution modes, runner backends, and risk classes. Applied them to ToolActionCard queue, RBAC, report metadata, Agentic RAG SCA/citation rows, execution plan/isolation/runner, sanitizer, visual evidence, and file upload displays while keeping API payload values unchanged. Browser smoke now asserts koreanDisplayMapping.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-125723-Red-Team-Studio-RedTeam-AX-Korean-display-mapping-helper-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T13:01:52+09:00

Evidence artifacts:
- projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js
- projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py
- projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md
- projects/ai-agentic-soc/archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json

Command evidence:
- node --check reports.js :: exit_code=0
- python -m py_compile redteam_ax_live_browser_parser_smoke.py :: exit_code=0
- python test_plan_contract.py :: exit_code=0
- npm.cmd run build :: exit_code=0
- python tests/test_redteam_v2_api_router.py :: exit_code=0
- python tests/test_redteam_v2_sample_e2e.py :: exit_code=0
- python redteam_ax_live_browser_parser_smoke.py --allow-browser --require-live --timeout 90 :: exit_code=0

Limits:
- Smoke JSON bodyPrefix still shows mojibake for Korean text in the generated Node probe output; boolean DOM checks pass but artifact readability should be fixed next.
