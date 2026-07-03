---
type: scope
task_id: KW-20260703-140725-Red-Team-Studio-RedTeam-AX-real-governed-tool-execution-continuation
project: Red-Team-Studio
task: RedTeam AX real governed tool execution continuation
created: 2026-07-03T14:07:25+09:00
updated: 2026-07-03T14:32:00+09:00
---

# Scope

## Objective

Move RedTeam AX closer to real governed tool execution from the frontend by allowing only safe local version-check smoke commands when global runtime readiness is still partial.

## Included

- Backend helper `safe_local_smoke_runner_allowed`.
- `execute-governed` partial preflight path with `allow_safe_local_smoke_when_runtime_partial`.
- RedTeam2 payload flag and Korean row `안전 smoke 부분 실행`.
- Regression proving `npm.cmd --version` can execute while `trivy fs --format json .` is blocked.
- Plan, LLM wiki, and completion audit matrix updates.

## Excluded

- Real vulnerability scans.
- OpenVAS/ZAP endpoint configuration or live service import.
- Six-tool operating output collection.
- Evidence approval, Finding severity approval, Matrix, Report export, and completion gate closure.
- Marking the active goal complete.
