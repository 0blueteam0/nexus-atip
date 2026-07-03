---
type: work_command_record
task_id: KW-20260703-131610-Red-Team-Studio-RedTeam-AX-real-operating-evidence-workflow-continuation
project: Red Team Studio
task: RedTeam AX real operating evidence workflow continuation
created: 2026-07-03T13:16:10+09:00
source_package: K:/wiki/work command
---

# DECISIONS

| id | decision | reason | evidence | status |
|---|---|---|---|---|
| WC-D-001 | Extend existing readiness API with `missing_tool_remediation`. | Keeps operator guidance next to the blocker data and source directory. | `runtime/redteam_v2_models.py` | accepted |
| WC-D-002 | Render remediation in RedTeam2 as a table. | Missing tool guidance needs to be scan-friendly and copy-stable. | `reports.js`; Korean copy sanity | accepted |
| WC-D-003 | Keep scanner execution out of scope. | ROE/HITL and real target authorization are required for active tools. | `does_not_execute_tool=true`; `FINAL_PLAN.md` | accepted |
| WC-D-004 | Keep `/goal` active incomplete. | Real evidence and final gates are still missing. | `goal_completion_blocked` response | accepted |
