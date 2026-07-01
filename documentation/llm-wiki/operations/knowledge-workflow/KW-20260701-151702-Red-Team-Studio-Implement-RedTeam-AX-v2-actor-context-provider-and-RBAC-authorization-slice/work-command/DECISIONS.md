---
type: work_command_record
task_id: KW-20260701-151702-Red-Team-Studio-Implement-RedTeam-AX-v2-actor-context-provider-and-RBAC-authorization-slice
project: Red Team Studio
task: Implement RedTeam AX v2 actor context provider and RBAC authorization slice
created: 2026-07-01T15:17:02+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

# Work-command decisions

- Keep the actor directory local and deterministic for this slice.
- Represent local sessions as `dev:<actor_id>` tokens to avoid pretending external SSO is complete.
- Store full actor context in approval artifacts for auditability.
- Leave central group sync and case-scoped RBAC for the next security slice.
