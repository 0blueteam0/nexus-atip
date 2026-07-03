---
type: insights
task_id: KW-20260703-135344-Red-Team-Studio-RedTeam-AX-governed-tool-execution-progress-and-result-continuation
project: Red-Team-Studio
task: RedTeam AX governed tool execution progress and result continuation
created: 2026-07-03T13:53:44+09:00
updated: 2026-07-03T14:18:00+09:00
---

# Insights

- Saved run status reload is a useful bridge between governed execution/import and result collection because it lets the UI recover state after reload without starting scanners again.
- The API must keep `does_not_mark_goal_complete=true`; otherwise a stored run with `can_collect_results=true` could be mistaken for completed Evidence/Finding/Report closure.
- Frontend tables should show both top-level collectability and per-step run IDs so the operator knows whether to press collect-results next.
