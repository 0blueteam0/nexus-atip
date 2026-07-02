---
type: scope
task_id: KW-20260702-103306-Red-Team-Studio-Implement-RedTeam-AX-v2-Nuclei-ZAP-OpenVAS-container-stdout-parser-smoke-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 Nuclei ZAP OpenVAS container stdout parser smoke slice
created: 2026-07-02T10:33:06+09:00
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

Autofill timestamp: 2026-07-02T10:43:57+09:00
Project: Red-Team-Studio
Task: Implement RedTeam AX v2 Nuclei ZAP OpenVAS container stdout parser smoke slice
Agent: codex
Status: pass
Summary: Implemented RedTeam AX v2 slice 34 parser smoke coverage for governed container stdout fixtures. API tests now create dry-run ephemeral-container tool runs for Nuclei, ZAP, and OpenVAS, feed untrusted container_mock_stdout artifacts, run agent-analyze, verify parser labels container_launch_plan+nuclei_jsonl, container_launch_plan+zap_json, and container_launch_plan+openvas_xml, assert both container_launch_evidence and scanner_finding_candidate structured items, and create Evidence Card candidates for each scanner. FINAL_PLAN records slice 34 completed dry-run parser smoke and leaves real Docker/Podman runtime stdout/stderr plus live browser smoke pending.
Next action: Generate cross-LLM handoff, stage only slice 34 files, commit, and push origin main.
Artifacts:
- projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py
- projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md
Commands:
- python -m unittest discover -s tests -p test_redteam_v2_api_router.py => exit_code 0, Ran 42 tests OK
- python -m unittest tests.test_redteam_v2_sample_e2e => exit_code 0, Ran 1 test OK
- node --check projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js => exit_code 0
- npm.cmd run build => exit_code 0, Vite build succeeded with existing large chunk warning
- python projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_plan_contract.py => exit_code 0, plan contract sanity passed
Risks:
- Real Docker/Podman runtime stdout/stderr smoke remains pending; dry-run fixtures prove parser wiring but not host runtime execution.
- Nuclei combined parser may still see container launch JSON as a weak candidate, so tests select the scanner_finding_candidate with the expected template_id.

Completion definition: the session can close when the recorded artifacts, command evidence, decisions, risks, and handoff are sufficient for a future agent to resume without chat memory.
