# DECISIONS

## Imported Output Path

Use the existing `/api/redteam/v2/toolchains/execute-governed` API for operator/service results by accepting `operator_output`, `imported_output`, `imported_json`, and `raw_artifacts` per step.

Reason: downstream collection already trusts toolchain run records as the unit of work. Creating `OutputImported` run records keeps evidence approval, finding promotion, Matrix, report, export, and completion gate behavior identical.

## Goal State

Do not mark the active goal complete.

Reason: representative six-tool E2E regression is not the same as real organization scanner outputs and environment readiness.
