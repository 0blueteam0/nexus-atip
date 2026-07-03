---
type: decision_log
task_id: KW-20260703-141648-Red-Team-Studio-RedTeam-AX-frontend-safe-installed-tool-smoke-button-continuation
project: Red-Team-Studio
task: RedTeam AX frontend safe installed tool smoke button continuation
created: 2026-07-03T14:16:48+09:00
updated: 2026-07-03T14:45:00+09:00
---

# Decision Log

| decision | rationale | consequence |
|---|---|---|
| Add a dedicated safe smoke button | The previous path required manual command entry. | Beginner operators can start a governed version smoke with one button. |
| Reuse `execute-governed` | It already records ToolAction/ToolRun artifacts and safe flags. | No parallel execution channel is introduced. |
| Update run-status projection after button execution | The operator should immediately see collectable run IDs. | The UI can move from smoke execution to collect-results. |
