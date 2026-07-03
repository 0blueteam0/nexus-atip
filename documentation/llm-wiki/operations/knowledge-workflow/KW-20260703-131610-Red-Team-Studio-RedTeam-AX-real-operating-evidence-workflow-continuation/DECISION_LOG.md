---
type: decision_log
project: Red Team Studio
task: RedTeam AX real operating evidence workflow continuation
created: 2026-07-03T13:16:10+09:00
---

# Decision Log

| id | decision | rationale | alternatives | status |
|---|---|---|---|---|
| D-001 | Add `missing_tool_remediation` to the existing readiness response instead of creating a new endpoint. | The data belongs to the same preflight/readiness view and uses the existing source directory context. | Separate remediation endpoint; frontend-only derived messages. | accepted |
| D-002 | Include `does_not_execute_tool=true` per row. | Prevents the UI and downstream agents from treating remediation guidance as scanner execution. | Top-level safety flag only. | accepted |
| D-003 | Keep final goal status blocked. | Real scanner evidence, HITL approval, report verification, E2E, and regression gates are still incomplete. | Mark partial completion as goal completion. | rejected |
