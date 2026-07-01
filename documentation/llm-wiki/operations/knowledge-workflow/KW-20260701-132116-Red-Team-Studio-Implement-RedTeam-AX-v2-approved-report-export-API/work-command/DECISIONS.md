---
type: work_command_record
task_id: KW-20260701-132116-Red-Team-Studio-Implement-RedTeam-AX-v2-approved-report-export-API
project: Red Team Studio
task: Implement RedTeam AX v2 approved report export API
created: 2026-07-01T13:21:16+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

## Slice 7 Decisions

- Required role for final report export is `executive_sponsor`.
- Approval and export are separate actions.
- Export manifest is a case artifact under `archive/runs/redteam-ax-v2/{case_id}/exports`.
- Blocked reports can produce draft report JSON but cannot receive valid export approval.
