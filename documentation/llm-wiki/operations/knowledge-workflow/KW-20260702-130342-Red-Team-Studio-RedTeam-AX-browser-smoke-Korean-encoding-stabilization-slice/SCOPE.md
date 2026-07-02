---
type: scope
task_id: KW-20260702-130342-Red-Team-Studio-RedTeam-AX-browser-smoke-Korean-encoding-stabilization-slice
project: Red-Team-Studio
task: RedTeam AX browser smoke Korean encoding stabilization slice
created: 2026-07-02T13:03:42+09:00
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

Autofill timestamp: 2026-07-02T13:06:45+09:00
Project: Red-Team-Studio
Task: RedTeam AX browser smoke Korean encoding stabilization slice
Agent: codex
Status: completed
Summary: RedTeam AX live browser smoke Korean encoding slice fixed Node probe stdout decoding by setting subprocess encoding=utf-8. Added stdout_decoded_as_utf8 regression gate so smoke fails if Korean Report Studio / RedTeam2 text is not preserved in Python-decoded stdout. Regenerated smoke artifact and verified bodyPrefix contains Korean text by unicode_escape/codepoint checks.
Next action: Next slice should build a requirement-by-requirement completion audit matrix for the full RedTeam AX objective and select remaining functional gaps.
Artifacts:
- projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py
- projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md
- projects/ai-agentic-soc/archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json
Commands:
- python -m py_compile redteam_ax_live_browser_parser_smoke.py :: exit_code=0
- python test_plan_contract.py :: exit_code=0
- npm.cmd run build :: exit_code=0
- python tests/test_redteam_v2_api_router.py :: exit_code=0
- python tests/test_redteam_v2_sample_e2e.py :: exit_code=0
- python redteam_ax_live_browser_parser_smoke.py --allow-browser --require-live --timeout 90 :: exit_code=0
- python artifact unicode_escape Korean bodyPrefix check :: exit_code=0
Risks:
- PowerShell terminal output can still display Korean mojibake depending on console encoding, but the JSON artifact bytes and Python UTF-8 readback are correct.

Completion definition: the session can close when the recorded artifacts, command evidence, decisions, risks, and handoff are sufficient for a future agent to resume without chat memory.
