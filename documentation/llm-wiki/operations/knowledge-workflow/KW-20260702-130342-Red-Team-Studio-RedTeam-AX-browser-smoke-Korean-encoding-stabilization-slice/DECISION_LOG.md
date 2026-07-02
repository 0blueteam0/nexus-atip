---
type: decision_log
task_id: KW-20260702-130342-Red-Team-Studio-RedTeam-AX-browser-smoke-Korean-encoding-stabilization-slice
project: Red-Team-Studio
task: RedTeam AX browser smoke Korean encoding stabilization slice
created: 2026-07-02T13:03:42+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |


## Autofill Decision Entries

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-02T13:06:45+09:00 | Use Knowledge Workflow autofill for this session | Manual end-only evidence writing | Preserve gate quality while reducing user-visible waiting | `knowledge_workflow.py autofill` |
| 2026-07-02T13:06:45+09:00 | Use explicit UTF-8 decoding at Python subprocess boundary rather than altering frontend text or Node DOM extraction. | See worklog | Caller-provided decision | Autofill arguments |
