---
type: decision_log
task_id: KW-20260702-131806-Red-Team-Studio-RedTeam-AX-MCP-direct-invocation-deny-smoke-slice
project: Red-Team-Studio
task: RedTeam AX MCP direct invocation deny smoke slice
created: 2026-07-02T13:18:06+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |


## Autofill Decision Entries

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-02T13:22:01+09:00 | Use Knowledge Workflow autofill for this session | Manual end-only evidence writing | Preserve gate quality while reducing user-visible waiting | `knowledge_workflow.py autofill` |
| 2026-07-02T13:22:01+09:00 | Expose /api/redteam/v2/mcp/direct-invoke only as a deny guard endpoint, not as an execution path, so direct agent-to-MCP calls are auditable but never executed. | See worklog | Caller-provided decision | Autofill arguments |
