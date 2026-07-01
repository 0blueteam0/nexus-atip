---
type: work_command_record
task_id: KW-20260701-141502-Red-Team-Studio-Implement-RedTeam-AX-v2-Evidence-approval-lifecycle-and-report-gate
project: Red Team Studio
task: Implement RedTeam AX v2 Evidence approval lifecycle and report gate
created: 2026-07-01T14:15:02+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|

## Build vs Adopt

## Selected Tool

## Verification

## Tooling

- `rg` for discovery.
- `apply_patch` for edits.
- Hermes Python `unittest` for API tests.
- `npm.cmd run build` for frontend regression.
- `npx.cmd --package playwright` for UI smoke.
- `knowledge_workflow.py close` for evidence gate.
