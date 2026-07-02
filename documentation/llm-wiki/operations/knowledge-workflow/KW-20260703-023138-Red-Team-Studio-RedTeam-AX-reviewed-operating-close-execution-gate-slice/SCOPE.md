---
type: scope
task_id: KW-20260703-023138-Red-Team-Studio-RedTeam-AX-reviewed-operating-close-execution-gate-slice
project: Red-Team-Studio
task: RedTeam AX reviewed operating close execution gate slice
created: 2026-07-03T02:31:38+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Add a guarded reviewed close execution path that executes operating close only from a ready human review record and its approved close payload.

## Included

- Backend API: `/api/redteam/v2/toolchains/execute-reviewed-operating-close`
- Frontend RedTeam2 Korean button and status row
- Regression for missing review, incomplete review, ready review, and override payload refusal
- Completion audit, plans, LLM Wiki, sanity anchors

## Excluded

- Running scanners, Docker, WSL, or network scans
- Claiming real operating completion without real scanner outputs and real approvers

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Compile/syntax | `py_compile`, `node --check` exit_code 0 |
| Regression | focused pytest and full router pytest exit_code 0 |
| Sanity | Korean/runtime/audit/plan/accepted gates exit_code 0 |
| Gate | `QUALITY_GATE_RESULT.json` status OK |