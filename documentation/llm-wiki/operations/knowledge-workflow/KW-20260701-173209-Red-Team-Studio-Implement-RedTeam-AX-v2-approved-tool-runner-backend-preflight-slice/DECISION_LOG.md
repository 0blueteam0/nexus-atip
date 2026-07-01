---
type: decision_log
task_id: KW-20260701-173209-Red-Team-Studio-Implement-RedTeam-AX-v2-approved-tool-runner-backend-preflight-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 approved tool runner backend preflight slice
created: 2026-07-01T17:32:09+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
| 2026-07-01T17:40:00+09:00 | Activate subprocess runner only when `runner_argv` or `runner_command` is supplied. | Replace execute-governed semantics entirely. | Existing manual/import flows must remain compatible. | API regression exit_code 0 |
| 2026-07-01T17:40:00+09:00 | Require `execution_plan_id` and matching issued token before launch. | Trust caller-provided action id alone. | Execution Token is the spec-defined boundary before Runner Executes. | New API test blocks unissued token |
| 2026-07-01T17:40:00+09:00 | Limit subprocess execution to `dry_run` and `sandbox_execute`. | Permit lab/staging immediately. | Lab/staging/production needs stronger isolation. | `governed_runner_attempt` mode check |
| 2026-07-01T17:40:00+09:00 | Enforce command allowlist from ToolProfile command/resolved wrapper basename. | Accept arbitrary argv. | Prevent arbitrary command execution through API payloads. | New backend helper and tests |
| 2026-07-01T17:40:00+09:00 | Capture stdout/stderr as untrusted artifacts with SHA-256. | Inline output only in run record. | Tool output must be evidence input, not direct finding proof. | Runner output artifact code |
