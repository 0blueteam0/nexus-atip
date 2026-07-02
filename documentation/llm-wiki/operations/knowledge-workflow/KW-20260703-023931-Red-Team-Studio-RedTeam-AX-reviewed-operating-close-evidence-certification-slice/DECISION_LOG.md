---
type: decision_log
status: recorded
project: Red-Team-Studio
task: RedTeam AX reviewed operating close evidence certification slice
created: 2026-07-03T02:39:31+09:00
---

# Decision Log

| id | decision | rationale |
|---|---|---|
| DEC-001 | Add certification API separate from reviewed close. | Keeps close execution and completion audit packaging distinct. |
| DEC-002 | Require five real-operator attestations. | Avoids treating controlled fixtures as final evidence. |
| DEC-003 | Keep goal completion outside API. | Completion needs requirement-by-requirement audit. |