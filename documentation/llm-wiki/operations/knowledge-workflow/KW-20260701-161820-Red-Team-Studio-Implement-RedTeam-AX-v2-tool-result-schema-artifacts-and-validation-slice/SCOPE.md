---
type: scope
task_id: KW-20260701-161820-Red-Team-Studio-Implement-RedTeam-AX-v2-tool-result-schema-artifacts-and-validation-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 tool result schema artifacts and validation slice
created: 2026-07-01T16:18:20+09:00
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
# Scope

- Project: Red-Team-Studio
- Slice: RedTeam AX v2 tool result schema artifacts and runtime validation
- Objective: Convert the previous parser/output contract into explicit JSON Schema artifacts and runtime validation endpoints so LLM/tool outputs can be checked before evidence/report use.
- In scope:
  - `runtime/redteam_v2_models.py`
  - `runtime/redteam_v2_api_router.py`
  - `tests/test_redteam_v2_api_router.py`
  - `Red Team Studio/고도화/schemas/json/ToolResultNormalized.schema.json`
  - `Red Team Studio/고도화/schemas/json/ToolArtifactImport.schema.json`
  - `Red Team Studio/FINAL_PLAN.md`
- Out of scope:
  - Full JSON Schema draft implementation
  - Browser multipart upload UI
  - Sandbox/container runner
  - Full release/security regression
