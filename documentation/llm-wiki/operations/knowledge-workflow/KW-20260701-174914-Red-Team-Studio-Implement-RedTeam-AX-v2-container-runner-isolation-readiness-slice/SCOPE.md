---
type: scope
task_id: KW-20260701-174914-Red-Team-Studio-Implement-RedTeam-AX-v2-container-runner-isolation-readiness-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 container runner isolation readiness slice
created: 2026-07-01T17:49:14+09:00
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
- Task: Implement RedTeam AX v2 container runner isolation readiness slice
- Slice: 30

## In Scope

- Add a safe readiness contract for an ephemeral container runner before real container execution exists.
- Expose runner isolation readiness through the v2 API.
- Attach isolation readiness to ToolExecutionPlan environment constraints.
- Block execution token issuance when `runner_backend=ephemeral_container` is requested without required attestation.
- Keep the existing local dry-run subprocess shim behavior for current regression coverage.
- Surface runner backend and isolation controls in the RedTeam2 UI.
- Update FINAL_PLAN with slice 30 progress.

## Out of Scope

- Actually launching Docker/container workloads.
- Running package managers, scanners, or container commands from status/readiness APIs.
- Live browser smoke on 5177/8765.
- Full cgroup/network namespace enforcement implementation.
