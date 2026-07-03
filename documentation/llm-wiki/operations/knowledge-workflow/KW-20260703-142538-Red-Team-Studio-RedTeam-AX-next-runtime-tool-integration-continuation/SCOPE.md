---
type: scope
task_id: KW-20260703-142538-Red-Team-Studio-RedTeam-AX-next-runtime-tool-integration-continuation
project: Red-Team-Studio
task: RedTeam AX next runtime tool integration continuation
created: 2026-07-03T14:25:38+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Describe the user's request as an operational task.

## Included

- OpenVAS/ZAP service import to toolchain collection bridge.

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

- Project: Red Team Studio / RedTeam AX
- Task: Connect OpenVAS/ZAP read-only scanner service import results to the governed toolchain run-status and collect-results workflow.
- In scope:
  - Backend optional `toolchain_id` support for `/api/redteam/v2/scanner-service-imports/{tool_id}`.
  - RedTeam2 frontend payload/state update for service import projection.
  - Regression and frontend sanity coverage.
  - FINAL_PLAN, Detailed_PLAN, LLM Wiki, completion audit updates.
- Out of scope:
  - Live organization OpenVAS/ZAP endpoint probing.
  - Active scan, scanner command execution, Docker/WSL/network execution.
  - Final Evidence approval, Finding approval, Report export, or goal completion.
