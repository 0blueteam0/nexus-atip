---
type: scope
task_id: KW-20260702-114508-Red-Team-Studio-Implement-RedTeam-AX-v2-live-approval-queue-browser-smoke-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 live approval queue browser smoke slice
created: 2026-07-02T11:45:08+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Describe the user's request as an operational task.

## Included

-

## Excluded

- Only explicitly excluded items belong here. Default is include.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
|  |  |  |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
|  |  |  |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.


## Autofill Scope

The session covers the work described in the summary below and keeps execution metadata inside this Knowledge Workflow session.

Autofill timestamp: 2026-07-02T11:49:20+09:00
Project: Red-Team-Studio
Task: Implement RedTeam AX v2 live approval queue browser smoke slice
Agent: codex
Status: ready_for_handoff
Summary: Slice 41 added an opt-in live browser approval queue smoke for RedTeam AX v2. The harness now supports --allow-approval-request, which requires --allow-action, clicks ToolActionCard planning, clicks Request Approval, records the /api/redteam/v2/tool-actions/{action_id}/request-approval response, verifies ApprovalRequested queue state, verifies required approver roles, and confirms Execute Governed Runner remains visible but disabled before approval. It does not grant approval or execute the governed runner.
Next action: Continue from the recorded handoff and latest evidence.
Artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md
Commands:
- python -m py_compile Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py -> exit 0
- redteam_ax_live_browser_parser_smoke.py --allow-browser --allow-action --allow-approval-request --require-live -> exit 0, status passed, blockers []
- python tests/test_redteam_v2_api_router.py -> 42 tests OK
- python tests/test_redteam_v2_sample_e2e.py -> 1 test OK
- npm.cmd run build in frontend/report-studio-vite -> vite build OK
- python Red Team Studio/고도화/sanity/test_plan_contract.py -> plan contract sanity passed
Risks:
- Next slice still needs approval grant smoke and manual-run-only evidence upload requirement verification; full goal remains incomplete.

Completion definition: the session can close when the recorded artifacts, command evidence, decisions, risks, and handoff are sufficient for a future agent to resume without chat memory.
