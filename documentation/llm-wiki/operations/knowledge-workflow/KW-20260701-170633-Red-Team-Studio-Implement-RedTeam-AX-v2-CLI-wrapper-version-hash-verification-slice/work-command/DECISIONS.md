---
type: work_command_record
task_id: KW-20260701-170633-Red-Team-Studio-Implement-RedTeam-AX-v2-CLI-wrapper-version-hash-verification-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 CLI wrapper version hash verification slice
created: 2026-07-01T17:06:33+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Decisions

- Add read-only wrapper manifest endpoints instead of overloading readiness.
- Do not execute scanner/version commands in registry reads.
- Treat import-only SCA as trusted without CLI wrapper hash pin.
- Treat CLI/API wrapper tools as untrusted for runner use until expected SHA-256 pins match.
- Add execution-plan warnings/preflight now; defer hard-blocking to actual runner integration.

## Reasons

These decisions keep the platform safe-by-default while giving operators visibility into wrapper trust state before high-risk automation is introduced.

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

