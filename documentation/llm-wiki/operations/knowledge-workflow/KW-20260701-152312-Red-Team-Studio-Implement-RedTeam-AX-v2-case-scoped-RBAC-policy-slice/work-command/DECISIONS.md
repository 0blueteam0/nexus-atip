---
type: work_command_record
task_id: KW-20260701-152312-Red-Team-Studio-Implement-RedTeam-AX-v2-case-scoped-RBAC-policy-slice
project: Red Team Studio
task: Implement RedTeam AX v2 case-scoped RBAC policy slice
created: 2026-07-01T15:23:12+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

# Work-command decisions

- Use wildcard local assignment patterns for existing test and UI generated case IDs.
- Block approval when `case_id` is present but actor has no assignment for that case.
- Keep central user/group sync out of this slice and document it as remaining work.
- Preserve existing sample E2E by adding `RTA-*` to the local policy registry.
