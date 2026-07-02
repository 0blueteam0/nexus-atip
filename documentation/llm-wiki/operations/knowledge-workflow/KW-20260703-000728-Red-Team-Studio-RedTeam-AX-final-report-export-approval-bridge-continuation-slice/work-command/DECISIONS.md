---
type: work_command_record
project: Red Team Studio
task: RedTeam AX final report export approval bridge continuation slice
---

# DECISIONS

| id | decision | reason | impact |
|---|---|---|---|
| D-001 | Reuse report export approval/export APIs. | Existing APIs enforce the required gate snapshot and approver role. | Lower policy drift. |
| D-002 | Store generated collection report in final export state. | UI was disconnected from backend report artifact. | Existing approval/export buttons now apply. |
| D-003 | Keep live scanner completion as residual gap. | Current evidence is tested collection path only. | Goal remains active. |
