---
type: tool_decision
project: Red Team Studio
task: RedTeam AX operator evidence submission validator slice
---

# Tool Decision

| selected | reason |
|---|---|
| Python sanity script | Matches existing RedTeam AX artifact/gate pattern |
| Runtime readiness read-only projection | Keeps status API non-executing |
| Static frontend contract | Catches Korean UI copy and safety term regressions |
| Accepted gate manifest | Canonical regression evidence |

Rejected: Docker/WSL/scanner/network execution, because this slice validates submitted evidence rather than producing live evidence.
