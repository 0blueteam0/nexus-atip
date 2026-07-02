---
type: decision_log
task_id: KW-20260702-134327-Red-Team-Studio-RedTeam-AX-real-installed-tool-live-smoke-slice
project: Red-Team-Studio
task: RedTeam AX real installed tool live smoke slice
created: 2026-07-02T13:43:27+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |


## Autofill Decision Entries

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-02T13:48:28+09:00 | Use Knowledge Workflow autofill for this session | Manual end-only evidence writing | Preserve gate quality while reducing user-visible waiting | `knowledge_workflow.py autofill` |
| 2026-07-02T13:48:28+09:00 | RTA-COMP-015 moved from blocked to partial because installed npm CLI has live governed runner evidence while Nuclei/OpenVAS/Trivy/ZAP and Docker/container live smokes remain outside current evidence. | See worklog | Caller-provided decision | Autofill arguments |
