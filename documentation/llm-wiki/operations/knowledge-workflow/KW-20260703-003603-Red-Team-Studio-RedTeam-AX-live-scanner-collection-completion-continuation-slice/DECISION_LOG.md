---
type: decision_log
status: complete
project: Red Team Studio
created: 2026-07-03T00:36:03+09:00
---

# Decision Log

## Decision 1

Add imported-output support inside `/api/redteam/v2/toolchains/execute-governed` instead of adding a separate endpoint.

Reason: collection already consumes toolchain runs, so `OutputImported` keeps all downstream Evidence, Finding, Matrix, Report, export, and completion gate controls identical.

## Decision 2

Keep the active goal open.

Reason: representative six-tool imported-output E2E is proved, but real organization endpoints, Docker/container runtime, and actual operating scanner artifacts are still not complete.
