---
type: work_command_record
task_id: KW-20260708-094551-Red-Team-Studio-Continue-RedTeam-AX-static-analysis-runner-promotion-with-Semgrep
project: Red Team Studio
task: Continue RedTeam AX static analysis runner promotion with Semgrep
created: 2026-07-08T09:45:51+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

# Decisions

- Semgrep is promoted as an optional T0 local static-code runner, not a high-risk active tool.
- Direct project `.venv` installation is rejected because it downgrades shared dependencies.
- Isolated tool venv is the operating model for Semgrep.
- Default button execution uses only local rule plus single approved sample file.
- Semgrep findings are Evidence candidates requiring human validation, not final findings.
