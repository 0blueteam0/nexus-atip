---
type: scope
task_id: KW-20260708-094551-Red-Team-Studio-Continue-RedTeam-AX-static-analysis-runner-promotion-with-Semgrep
project: Red Team Studio
task: Continue RedTeam AX static analysis runner promotion with Semgrep
created: 2026-07-08T09:45:51+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Describe the user's request as an operational task.

## Included

- Semgrep 1.168.0 isolated runner installation evidence.
- RedTeam AX runtime profile, preset, normalizer, and analyst agent integration.
- Local sample rule/input and Korean plan updates.
- Focused tests, frontend contracts, and governed smoke verification.

## Excluded

- Only explicitly excluded items belong here. Default is include.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| semgrep-runner | Promote Semgrep as a safe local static analysis runner | runtime profile and preset |
| semgrep-evidence | Capture install and scan evidence | manifest and knowledge workflow |
| semgrep-tests | Prove preset, execution, collection, and parser paths | unittest and smoke output |

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
# Scope

- Project: Red Team Studio / RedTeam AX
- Task: Promote Semgrep as an optional static code analysis runner after Bandit.
- Boundaries: local authorized sample files only, no registry rule download from API button, no high-risk execution, no goal completion claim.
- Primary artifacts: `runtime/redteam_v2_models.py`, `tests/test_redteam_v2_api_router.py`, `Red Team Studio/고도화/samples/semgrep_workspace`, `Red Team Studio/고도화/tool-manifests/semgrep_1.168.0_tool_venv_manifest.json`, `Detailed_PLAN.MD`, `FINAL_PLAN.md`.
