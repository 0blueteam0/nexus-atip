---
type: work_command_record
task_id: KW-20260701-132949-Red-Team-Studio-Implement-RedTeam-AX-v2-report-export-UI-controls
project: Red Team Studio
task: Implement RedTeam AX v2 report export UI controls
created: 2026-07-01T13:29:49+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

## Decisions

- UI controls are added to the v2 tab only.
- Report export state is stored in `redteam2ReportExportState`.
- Draft input state is stored in `redteam2ReportExportDraft`.
- Browser validation uses Windows `npx` because WSL wrapper is unavailable in this environment.
