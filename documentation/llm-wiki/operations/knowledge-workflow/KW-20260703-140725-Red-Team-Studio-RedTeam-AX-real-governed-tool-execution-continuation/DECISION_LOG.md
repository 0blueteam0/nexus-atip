---
type: decision_log
task_id: KW-20260703-140725-Red-Team-Studio-RedTeam-AX-real-governed-tool-execution-continuation
project: Red-Team-Studio
task: RedTeam AX real governed tool execution continuation
created: 2026-07-03T14:07:25+09:00
updated: 2026-07-03T14:32:00+09:00
---

# Decision Log

| decision | rationale | consequence |
|---|---|---|
| Add opt-in partial runtime preflight | Existing full block protects scans, but prevents safe install smoke progress. | Frontend can execute version-only checks without claiming full readiness. |
| Restrict partial execution to local subprocess version argv only | The slice must not permit arbitrary scanner execution under partial readiness. | Multi-argument scan commands are blocked with explicit reason. |
| Preserve goal blocked status | Safe smoke proves installation checks only. | RTA-COMP-062 is proved, but RTA-COMP-015 and remaining gaps stay open. |
