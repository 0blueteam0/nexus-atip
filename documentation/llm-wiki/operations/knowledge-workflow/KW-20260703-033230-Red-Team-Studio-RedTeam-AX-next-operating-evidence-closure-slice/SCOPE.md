---
type: scope
task_id: KW-20260703-033230-Red-Team-Studio-RedTeam-AX-next-operating-evidence-closure-slice
project: Red Team Studio
task: RedTeam AX next operating evidence closure slice
created: 2026-07-03T03:32:30+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Describe the user's request as an operational task.

## Included

- Operator Evidence Card import API/UI/test/docs/audit update.

## Excluded

- Only explicitly excluded items belong here. Default is include.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| operator-evidence-card-import | Add governed Evidence Card import path | API, UI, tests, docs |

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
