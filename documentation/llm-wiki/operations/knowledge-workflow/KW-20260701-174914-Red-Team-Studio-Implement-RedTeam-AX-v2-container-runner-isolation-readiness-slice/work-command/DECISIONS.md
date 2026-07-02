---
type: work_command_record
task_id: KW-20260701-174914-Red-Team-Studio-Implement-RedTeam-AX-v2-container-runner-isolation-readiness-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 container runner isolation readiness slice
created: 2026-07-01T17:49:14+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

# Decisions

- Use `runner_backend` as the UI/API selector so the existing execution mode remains stable.
- Default to `local_subprocess_shim` to preserve current dry-run regression behavior.
- Treat `ephemeral_container` as a stricter backend that blocks token issuance until attestation is present.
- Do not run Docker or scanner commands from readiness APIs.
- Store the isolation contract inside `environment_constraints` because it is part of the executable boundary.
- Keep `policy_decision.decision=deny_runner` for wrapper and isolation preflight blocks so UI behavior remains consistent.
