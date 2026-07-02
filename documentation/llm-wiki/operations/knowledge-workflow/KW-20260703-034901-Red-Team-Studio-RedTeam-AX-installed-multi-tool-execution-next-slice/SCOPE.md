---
type: scope
task_id: KW-20260703-034901-Red-Team-Studio-RedTeam-AX-installed-multi-tool-execution-next-slice
project: Red Team Studio
task: RedTeam AX installed multi-tool execution next slice
created: 2026-07-03T03:49:01+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Describe the user's request as an operational task.

## Included

- Governed multi-tool execution progress API/UI/test/docs update.

## Excluded

- Only explicitly excluded items belong here. Default is include.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| multi-tool-progress | Add Korean progress contract for governed execution | API, UI, tests, docs |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| accepted gate manifest | `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | Regression gate evidence |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
