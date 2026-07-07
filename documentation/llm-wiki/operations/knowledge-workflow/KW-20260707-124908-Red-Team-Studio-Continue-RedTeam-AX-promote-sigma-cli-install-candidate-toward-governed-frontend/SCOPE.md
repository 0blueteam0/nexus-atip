---
type: scope
task_id: KW-20260707-124908-Red-Team-Studio-Continue-RedTeam-AX-promote-sigma-cli-install-candidate-toward-governed-frontend
project: Red Team Studio
task: Continue RedTeam AX promote sigma-cli install candidate toward governed frontend execution
created: 2026-07-07T12:49:08+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the active RedTeam AX goal by promoting one low-risk discovered tool, Sigma CLI, from install candidate toward actual installed governed frontend execution and result collection.

## Included

- Install sigma-cli in the project virtual environment.
- Verify Sigma CLI version and local rule check.
- Add optional ToolProfile, execution preset, normalizer, and analysis agent.
- Keep required six-tool coverage unchanged.
- Update plan documents and knowledge workflow evidence.

## Excluded

- Sigma plugin installation.
- SIEM backend conversion or deployment.
- Remote rule download.
- Marking the full RedTeam AX goal complete.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| install_verify | Install and verify sigma-cli | .venv sigma version/check command output |
| tool_profile | Optional Sigma ToolProfile | redteam_v2_models.py |
| runner_preset | Frontend execution preset path | execution-presets API |
| normalizer | Sigma CLI output parser | redteam_v2_models.py |
| docs | Plan updates | Detailed_PLAN.MD, FINAL_PLAN.md |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| backend model | projects/ai-agentic-soc/runtime/redteam_v2_models.py | ToolProfile/preset/normalizer |
| backend tests | projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py | regression coverage |
| sample rule | projects/ai-agentic-soc/Red Team Studio/고도화/samples/sigma_rules/redteam_ax_local_process_creation_check.yml | local validation input |
| detailed plan | projects/ai-agentic-soc/Red Team Studio/Detailed_PLAN.MD | specification update |
| final plan | projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md | execution checklist |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
