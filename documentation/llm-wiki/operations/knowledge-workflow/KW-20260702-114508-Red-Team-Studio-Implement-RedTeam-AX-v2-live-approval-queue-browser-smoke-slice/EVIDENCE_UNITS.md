---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-02T11:45:08+09:00
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

Claim: Slice 41 added an opt-in live browser approval queue smoke for RedTeam AX v2. The harness now supports --allow-approval-request, which requires --allow-action, clicks ToolActionCard planning, clicks Request Approval, records the /api/redteam/v2/tool-actions/{action_id}/request-approval response, verifies ApprovalRequested queue state, verifies required approver roles, and confirms Execute Governed Runner remains visible but disabled before approval. It does not grant approval or execute the governed runner.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-114508-Red-Team-Studio-Implement-RedTeam-AX-v2-live-approval-queue-browser-smoke-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T11:49:20+09:00

Evidence artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md

Command evidence:
- python -m py_compile Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py -> exit 0
- redteam_ax_live_browser_parser_smoke.py --allow-browser --allow-action --allow-approval-request --require-live -> exit 0, status passed, blockers []
- python tests/test_redteam_v2_api_router.py -> 42 tests OK
- python tests/test_redteam_v2_sample_e2e.py -> 1 test OK
- npm.cmd run build in frontend/report-studio-vite -> vite build OK
- python Red Team Studio/고도화/sanity/test_plan_contract.py -> plan contract sanity passed

Limits:
- Next slice still needs approval grant smoke and manual-run-only evidence upload requirement verification; full goal remains incomplete.
