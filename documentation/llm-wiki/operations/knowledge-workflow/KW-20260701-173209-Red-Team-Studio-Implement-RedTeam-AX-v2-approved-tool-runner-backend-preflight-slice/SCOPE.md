---
type: scope
task_id: KW-20260701-173209-Red-Team-Studio-Implement-RedTeam-AX-v2-approved-tool-runner-backend-preflight-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 approved tool runner backend preflight slice
created: 2026-07-01T17:32:09+09:00
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

## Filled Record

Objective: implement the next RedTeam AX v2 slice toward approved analysis tool execution by adding a governed runner backend foundation that can execute only approved dry-run/sandbox commands after Action Card, Execution Plan, wrapper SHA-256 trust, and issued execution token gates all pass.

Included: backend runner attempt creation in `redteam_v2_models.py`, execution plan/token/wrapper/allowlist checks, stdout/stderr artifact capture, API regression coverage, RedTeam2 UI runner controls, and `FINAL_PLAN.md` update.

Excluded: container runtime, network namespace, cgroup/resource isolation, real active scanner network execution, scanner binary installation, and live browser smoke on `127.0.0.1:5177` / `127.0.0.1:8765`.
