---
type: work_command_record
task_id: KW-20260701-125421-Red-Team-Studio-Implement-RedTeam-AX-v2-persistent-approval-queue-and-UI-reload
project: Red Team Studio
task: Implement RedTeam AX v2 persistent approval queue and UI reload
created: 2026-07-01T12:54:21+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

## Slice 4 Decisions

1. Use the existing case artifact workspace for approval queue persistence.
   Evidence: `archive/runs/redteam-ax-v2/{case_id}/approvals`.

2. Keep approval state transitions separate from tool execution.
   Evidence: `/request-approval` and `/approve` only update JSON state and audit events.

3. Make UI reload pull from backend rather than local state.
   Evidence: `loadRedTeam2AnalysisStatus()` fetches `/api/redteam/v2/tool-actions?case_id=...`.

4. Treat missing `artifact_path` in reloaded JSON as a quality defect.
   Evidence: fixed `write_json_artifact` and added tests asserting path existence.

