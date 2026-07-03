---
type: decision_log
task_id: KW-20260703-135344-Red-Team-Studio-RedTeam-AX-governed-tool-execution-progress-and-result-continuation
project: Red-Team-Studio
task: RedTeam AX governed tool execution progress and result continuation
created: 2026-07-03T13:53:44+09:00
updated: 2026-07-03T14:18:00+09:00
---

# Decision Log

| decision | rationale | consequence |
|---|---|---|
| Add a separate `run-status` endpoint instead of overloading `collect-results` | Status reload must be read-only and must not create Evidence candidates. | Clear boundary: reload first, collect later. |
| Return `primary_next_api` from run-status | The UI should guide the operator to execute-governed when missing or collect-results when recoverable. | RedTeam2 can display actionable Korean next steps. |
| Preserve no-execution safe flags | The task is status inspection, not scanner execution. | The active goal remains incomplete until real operating closure gates pass. |
| Add RTA-COMP-061 as proved while keeping remaining gaps | This slice proves a new UI/API contract only. | Completion audit count increases, but goal-completion-review remains blocked. |
