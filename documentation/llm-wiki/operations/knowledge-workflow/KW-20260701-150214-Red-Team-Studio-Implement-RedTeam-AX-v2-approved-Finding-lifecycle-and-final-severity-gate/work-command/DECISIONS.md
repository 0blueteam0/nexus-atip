---
type: work_command_record
task_id: KW-20260701-150214-Red-Team-Studio-Implement-RedTeam-AX-v2-approved-Finding-lifecycle-and-final-severity-gate
project: Red Team Studio
task: Implement RedTeam AX v2 approved Finding lifecycle and final severity gate
created: 2026-07-01T15:02:14+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

# Work-command decisions

- Use the existing JSON artifact pattern instead of introducing a database migration in this slice.
- Add `business_owner` to the shared approver role allow-list because final severity approval is a platform-level HITL decision.
- Treat partial severity approval as `pending`, not invalid, when one required role has approved correctly.
- Keep final report export approval separate from Finding severity approval.
