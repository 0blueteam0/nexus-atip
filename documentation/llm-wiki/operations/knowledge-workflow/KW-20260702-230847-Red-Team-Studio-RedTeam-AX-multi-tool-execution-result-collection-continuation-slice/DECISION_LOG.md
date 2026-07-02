# Decision Log

| decision | rationale | evidence |
|---|---|---|
| Add `collect-results` to toolchain runs instead of overloading `execute-governed` | Execution and evidence collection have different safety semantics; collection must not rerun scanners | API regression and `commands_executed_by_api=false` result contract |
| Create Evidence Card candidates only | Tool outputs can be false positives and must not become Findings/Claims before HITL review | Evidence approval, Finding promotion, Matrix draft, Report v2 gates remain separate |
