---
type: scope
task_id: KW-20260702-104911-Red-Team-Studio-Implement-RedTeam-AX-v2-Nuclei-parser-launch-JSON-hardening-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 Nuclei parser launch JSON hardening slice
created: 2026-07-02T10:49:11+09:00
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

Autofill timestamp: 2026-07-02T10:50:46+09:00
Project: Red-Team-Studio
Task: Implement RedTeam AX v2 Nuclei parser launch JSON hardening slice
Agent: codex
Status: pass
Summary: Implemented RedTeam AX v2 slice 35 Nuclei parser hardening. The Nuclei JSONL normalizer now skips JSON objects that have no Nuclei template identifier and no info block, preventing redteam_ax_v2_container_launch_plan artifacts from becoming weak scanner_finding_candidate items. The container stdout parser smoke now asserts exactly one scanner_finding_candidate for Nuclei, ZAP, and OpenVAS while preserving container_launch_evidence. FINAL_PLAN records slice 35 completion and keeps real Docker/Podman runtime smoke and live browser smoke pending.
Next action: Generate cross-LLM handoff, selectively stage slice 35 files, commit, and push origin main.
Artifacts:
- projects/ai-agentic-soc/runtime/redteam_v2_models.py
- projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py
- projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md
Commands:
- .venv/Scripts/python.exe -m unittest discover -s tests -p test_redteam_v2_api_router.py => exit_code 0, Ran 42 tests OK
- .venv/Scripts/python.exe -m unittest discover -s tests -p test_redteam_v2_sample_e2e.py => exit_code 0, Ran 1 test OK
- node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js => exit_code 0
- .venv/Scripts/python.exe Red Team Studio/고도화/sanity/test_plan_contract.py => exit_code 0, plan contract sanity passed
Risks:
- This slice hardens dry-run parser quality; real Docker/Podman runtime stdout/stderr smoke remains pending.

Completion definition: the session can close when the recorded artifacts, command evidence, decisions, risks, and handoff are sufficient for a future agent to resume without chat memory.
