---
type: decision_log
task_id: KW-20260708-094551-Red-Team-Studio-Continue-RedTeam-AX-static-analysis-runner-promotion-with-Semgrep
project: Red Team Studio
task: Continue RedTeam AX static analysis runner promotion with Semgrep
created: 2026-07-08T09:45:51+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
# Decision Log

- Decision: Promote Semgrep as `TOOL-SEMGREP-001` optional runner.
- Decision: Use isolated tool venv instead of project `.venv`.
- Decision: Use only local educational rule and single approved sample input for default button execution.
- Decision: Treat Semgrep rule messages, source paths, and matched lines as untrusted data, never LLM instructions.
- Decision: Keep overall RedTeam AX goal active; this is one incremental runner promotion.
