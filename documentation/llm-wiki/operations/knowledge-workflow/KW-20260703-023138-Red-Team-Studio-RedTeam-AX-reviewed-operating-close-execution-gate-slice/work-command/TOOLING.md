---
type: work_command_record
task_id: KW-20260703-023138-Red-Team-Studio-RedTeam-AX-reviewed-operating-close-execution-gate-slice
project: Red-Team-Studio
task: RedTeam AX reviewed operating close execution gate slice
created: 2026-07-03T02:31:38+09:00
source_package: K:/wiki/work command
---

# TOOLING

| tool | role |
|---|---|
| FastAPI router | Exposes reviewed close endpoint. |
| React report store | Calls reviewed close endpoint and displays state. |
| pytest | Verifies backend gate behavior. |
| sanity scripts | Validate UI copy and audit contracts. |