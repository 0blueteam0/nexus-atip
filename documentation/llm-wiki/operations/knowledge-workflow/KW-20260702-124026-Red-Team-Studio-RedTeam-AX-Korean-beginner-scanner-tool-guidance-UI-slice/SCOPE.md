---
type: scope
task_id: KW-20260702-124026-Red-Team-Studio-RedTeam-AX-Korean-beginner-scanner-tool-guidance-UI-slice
project: Red-Team-Studio
task: RedTeam AX Korean beginner scanner tool guidance UI slice
created: 2026-07-02T12:40:26+09:00
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

Autofill timestamp: 2026-07-02T12:43:05+09:00
Project: Red-Team-Studio
Task: RedTeam AX Korean beginner scanner tool guidance UI slice
Agent: codex
Status: completed
Summary: RedTeam AX Report Studio RedTeam2 now shows Korean beginner scanner tool guidance for Nuclei, OpenVAS, Trivy, SCA, npm audit, and OWASP ZAP, including approval, safe mode, prohibited options, and Evidence linking guidance.
Next action: Korean-localize remaining wrapper/execution-plan/runner labels and add beginner-friendly runbook wording.
Artifacts:
- soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js
- Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py
- Red Team Studio/FINAL_PLAN.md
- archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json
Commands:
- node --check reports.js exit 0
- py_compile redteam_ax_live_browser_parser_smoke.py exit 0
- test_plan_contract.py exit 0
- npm.cmd run build exit 0
- tests/test_redteam_v2_api_router.py exit 0, 46 tests
- tests/test_redteam_v2_sample_e2e.py exit 0
- redteam_ax_live_browser_parser_smoke.py --allow-browser --require-live exit 0
Risks:
- Remaining UI areas still contain English labels in wrapper, execution plan, runner, sanitizer, and upload sections; next slice should continue Korean localization.

Completion definition: the session can close when the recorded artifacts, command evidence, decisions, risks, and handoff are sufficient for a future agent to resume without chat memory.
