---
type: work_command_record
task_id: KW-20260701-133547-Red-Team-Studio-Implement-RedTeam-AX-v2-approval-actor-identity-binding-foundation
project: Red Team Studio
task: Implement RedTeam AX v2 approval actor identity binding foundation
created: 2026-07-01T13:35:47+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

## Decisions

- Header names: `X-RedTeam-Actor`, `X-RedTeam-Actor-Role`.
- Binding rule: body approver and role must match actor context.
- Persistence rule: approval/export artifacts include actor context and identity binding status.
