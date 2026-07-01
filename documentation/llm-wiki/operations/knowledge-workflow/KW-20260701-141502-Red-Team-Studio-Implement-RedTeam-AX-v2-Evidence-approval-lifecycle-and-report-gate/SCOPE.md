---
type: scope
task_id: KW-20260701-141502-Red-Team-Studio-Implement-RedTeam-AX-v2-Evidence-approval-lifecycle-and-report-gate
project: Red Team Studio
task: Implement RedTeam AX v2 Evidence approval lifecycle and report gate
created: 2026-07-01T14:15:02+09:00
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
## Scope

- Project: Red Team Studio / RedTeam AX v2.
- Task: implement Evidence approval lifecycle and enforce approved Evidence in report gate.
- In scope:
  - Evidence approval endpoint.
  - Evidence approval artifact persistence.
  - Report validator checks for missing/unapproved/unverified Evidence.
  - Report export approval gate reuse of Evidence blocker counts.
  - UI generate flow creates and approves Evidence before report generation.
  - API/sample/live/browser smoke verification.
- Out of scope:
  - Approved Finding lifecycle.
  - Full SSO/RBAC provider integration.
  - Full starter-pack/security release regression.
