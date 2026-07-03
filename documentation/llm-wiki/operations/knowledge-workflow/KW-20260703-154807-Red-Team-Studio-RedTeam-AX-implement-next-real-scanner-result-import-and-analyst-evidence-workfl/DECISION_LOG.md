---
type: decision_log
task_id: KW-20260703-154807-Red-Team-Studio-RedTeam-AX-implement-next-real-scanner-result-import-and-analyst-evidence-workfl
project: Red Team Studio
task: RedTeam AX implement next real scanner result import and analyst evidence workflow slice
created: 2026-07-03T15:48:07+09:00
---

# Decision Log

| id | decision | rationale | status |
|---|---|---|---|
| D-001 | Extend service import responses with `analyst_progress_summary`. | OpenVAS/ZAP import is a first-class toolchain input and should use the same next-step contract as run-status. | accepted |
| D-002 | Render service progress in the service import panel. | Analysts need the next button immediately after read-only service import. | accepted |
| D-003 | Keep the projection non-completing. | Importing a report is not Evidence approval or final Report completion. | accepted |
