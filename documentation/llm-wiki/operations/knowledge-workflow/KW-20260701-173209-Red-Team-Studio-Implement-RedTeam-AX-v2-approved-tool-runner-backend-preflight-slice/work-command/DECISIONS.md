---
type: work_command_record
task_id: KW-20260701-173209-Red-Team-Studio-Implement-RedTeam-AX-v2-approved-tool-runner-backend-preflight-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 approved tool runner backend preflight slice
created: 2026-07-01T17:32:09+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Filled Record

D1: subprocess launch is activated only when the API payload includes `runner_argv` or `runner_command`. This preserves existing manual/import semantics in `execute-governed`.

D2: runner launch requires `execution_plan_id`, matching issued execution token, `PlanReady`, and policy decision `allow_plan`. This keeps the spec-defined Execution Token boundary intact.

D3: runner launch is limited to `dry_run` and `sandbox_execute`. Lab, staging, and production modes still need separate container, network, and HITL runtime controls.

D4: the command allowlist comes from ToolProfile `command_name` and resolved wrapper basename. Arbitrary command names are rejected before subprocess launch.

D5: stdout and stderr are captured as untrusted artifacts with SHA-256. They are evidence inputs only and must still pass normalizer/evidence review before report use.

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

