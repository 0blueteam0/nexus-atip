---
type: scope
task_id: KW-20260702-102144-Red-Team-Studio-Implement-RedTeam-AX-v2-container-launch-evidence-normalization-E2E-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 container launch evidence normalization E2E slice
created: 2026-07-02T10:21:44+09:00
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
- Task: Implement RedTeam AX v2 container launch evidence normalization E2E slice
- Slice: 32

## In Scope

- Read runner-generated local artifacts referenced by `source_path_or_ref`.
- Parse `redteam_ax_v2_container_launch_plan` JSON as execution-control evidence.
- Allow `ContainerLaunchPrepared` ToolRunRecord status to enter `agent-analyze`.
- Normalize container launch metadata into `container_launch_evidence` structured items.
- Create Evidence Card candidates from the normalized container launch result.
- Update FINAL_PLAN and regression tests.

## Out of Scope

- Real Docker/Podman runtime smoke.
- Container stdout/stderr scanner result parser E2E.
- Browser smoke.
