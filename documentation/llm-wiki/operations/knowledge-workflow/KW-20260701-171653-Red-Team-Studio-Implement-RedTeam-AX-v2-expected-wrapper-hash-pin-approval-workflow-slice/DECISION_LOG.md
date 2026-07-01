---
type: decision_log
task_id: KW-20260701-171653-Red-Team-Studio-Implement-RedTeam-AX-v2-expected-wrapper-hash-pin-approval-workflow-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 expected wrapper hash pin approval workflow slice
created: 2026-07-01T17:16:53+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-01T17:20:00+09:00 | Add pin request and approval as artifacts | Put expected hash directly in ToolProfile | Artifact workflow keeps evidence, actor, and approval traceability | `request_tool_wrapper_pin`, `approve_tool_wrapper_pin` |
| 2026-07-01T17:22:00+09:00 | Keep version evidence operator-attested | Execute `tool --version` automatically | Registry reads and pin requests must stay non-invasive | `registry_executed_version_command=false` |
| 2026-07-01T17:24:00+09:00 | Require `red_team_lead` approval | Add a new role | Existing RBAC already has red team lead and case assignment tests | API unauthorized approval test |
| 2026-07-01T17:26:00+09:00 | Reject import-only wrapper pin requests | Allow no-op pin artifacts | Import-only tools have no CLI wrapper to pin | import-only API test |
