---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-02T12:45:04+09:00
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

Claim: RedTeam AX Report Studio RedTeam2 wrapper, execution-plan, sandbox, and governed runner sections were Korean-localized with beginner-friendly guidance aligned to SPEC/26 and SPEC/31.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-124504-Red-Team-Studio-RedTeam-AX-Korean-wrapper-execution-runner-UI-guidance-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T12:48:11+09:00

Evidence artifacts:
- soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js
- Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py
- Red Team Studio/FINAL_PLAN.md
- archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json

Command evidence:
- node --check reports.js exit 0
- py_compile redteam_ax_live_browser_parser_smoke.py exit 0
- test_plan_contract.py exit 0
- npm.cmd run build exit 0
- tests/test_redteam_v2_api_router.py exit 0, 46 tests
- tests/test_redteam_v2_sample_e2e.py exit 0
- redteam_ax_live_browser_parser_smoke.py --allow-browser --require-live exit 0

Limits:
- Sanitizer, visual evidence, file upload, RBAC/report metadata sections still have English labels and should be localized next.
