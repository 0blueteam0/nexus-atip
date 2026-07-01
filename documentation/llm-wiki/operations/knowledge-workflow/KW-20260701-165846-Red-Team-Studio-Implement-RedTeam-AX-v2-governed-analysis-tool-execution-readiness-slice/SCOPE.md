---
type: scope
task_id: KW-20260701-165846-Red-Team-Studio-Implement-RedTeam-AX-v2-governed-analysis-tool-execution-readiness-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 governed analysis tool execution readiness slice
created: 2026-07-01T16:58:46+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue RedTeam AX v2 implementation toward governed analysis tool execution by adding ToolExecutionPlan and sandbox/network policy controls before any runner execution.

## Included

- Add `dry_run` to analysis ToolProfile execution modes.
- Add `/tool-actions/{action_id}/execution-plan`.
- Generate ToolExecutionPlan records with runner, network policy, filesystem policy, process policy, secret policy, execution token state, and approval requirements.
- Add Report Studio `레드팀 분석2` execution plan panel and queue button.
- Add API regression for sandbox network deny and high-risk approval gate.
- Update `FINAL_PLAN.md`.

## Excluded

- Actual ephemeral container execution.
- Actual external scanner execution.
- Live browser smoke against running 5177/8765.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| backend | ToolExecutionPlan model and endpoint | `runtime/redteam_v2_models.py`, `runtime/redteam_v2_api_router.py` |
| frontend | execution plan UX panel | `reports.js` |
| tests | sandbox/approval regression | `tests/test_redteam_v2_api_router.py` |
| plan | slice 24 checklist | `FINAL_PLAN.md` |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| ToolExecutionPlan API | `/api/redteam/v2/tool-actions/{action_id}/execution-plan` | pre-run policy and runner planning |
| execution plan archive | `archive/runs/redteam-ax-v2/<case>/tool-execution-plans/*.json` | auditable policy artifact |
| UI panel | `레드팀 분석2` Tool Execution Plan / Sandbox Policy | analyst workflow visibility |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
