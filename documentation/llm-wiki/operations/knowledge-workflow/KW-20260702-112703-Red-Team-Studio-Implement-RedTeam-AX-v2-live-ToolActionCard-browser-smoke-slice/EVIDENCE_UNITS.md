---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-02T11:27:03+09:00
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

Claim: Slice 39 added an opt-in live browser ToolActionCard planning smoke for RedTeam AX v2. The harness navigates Report Studio to RedTeam2, clicks ToolActionCard plan only when --allow-action is present, records summarized /api/redteam/v2 responses, verifies Request Approval/ROE/HITL DOM signals, and keeps governed runner execution untouched.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-112703-Red-Team-Studio-Implement-RedTeam-AX-v2-live-ToolActionCard-browser-smoke-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T11:37:05+09:00

Evidence artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md

Command evidence:
- python -m py_compile Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py -> exit 0
- redteam_ax_live_browser_parser_smoke.py --allow-browser --allow-action --require-live -> exit 0, status passed, blockers []
- python tests/test_redteam_v2_api_router.py -> 42 tests OK
- python tests/test_redteam_v2_sample_e2e.py -> 1 test OK
- npm.cmd run build in frontend/report-studio-vite -> vite build OK
- python Red Team Studio/고도화/sanity/test_plan_contract.py -> plan contract sanity passed

Limits:
- Live backend logs still show unrelated /api/malax/latest and /api/malax/runs sqlite3 disk I/O error 500 noise; RedTeam2 v2 path passed and MALAX noise is tracked for the next slice.
