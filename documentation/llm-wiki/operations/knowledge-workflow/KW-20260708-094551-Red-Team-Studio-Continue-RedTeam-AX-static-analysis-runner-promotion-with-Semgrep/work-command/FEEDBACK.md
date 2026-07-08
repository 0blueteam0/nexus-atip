---
type: work_command_record
task_id: KW-20260708-094551-Red-Team-Studio-Continue-RedTeam-AX-static-analysis-runner-promotion-with-Semgrep
project: Red Team Studio
task: Continue RedTeam AX static analysis runner promotion with Semgrep
created: 2026-07-08T09:45:51+09:00
source_package: K:/wiki/work command
---

# FEEDBACK

## Ledger

| id | feedback | type | reflected | location | follow_up |
|---|---|---|---|---|---|

## Entries

# Feedback

- The direct `.venv` install attempt revealed that Python security tools with strict pins should be treated as potentially disruptive.
- Future tool installs should default to isolated venvs or portable binary directories unless the dependency footprint is already known to be safe.
- Preset smoke should use at least two tools because the governed composite API intentionally rejects single-step composite execution.
- Console mojibake does not necessarily mean file corruption, but Korean path handling should be verified through actual path existence and execution.
