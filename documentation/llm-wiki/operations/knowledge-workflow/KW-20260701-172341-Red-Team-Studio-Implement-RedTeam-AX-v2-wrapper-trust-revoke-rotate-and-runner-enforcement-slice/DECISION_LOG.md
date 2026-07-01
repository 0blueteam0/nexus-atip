---
type: decision_log
task_id: KW-20260701-172341-Red-Team-Studio-Implement-RedTeam-AX-v2-wrapper-trust-revoke-rotate-and-runner-enforcement-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 wrapper trust revoke rotate and runner enforcement slice
created: 2026-07-01T17:23:42+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-01T17:25:00+09:00 | Revoke approved pin by overwriting trust registry artifact with revoked state | Delete pin artifact | Revoked state keeps audit trail and avoids silent trust loss | `revoke_tool_wrapper_pin` |
| 2026-07-01T17:27:00+09:00 | Treat new approved pin as rotate path | Add separate rotate endpoint | Existing request/approve flow can replace pin while warning about rotation | rotate warning test |
| 2026-07-01T17:29:00+09:00 | Block execution token when wrapper preflight fails | Only warn | Goal requires only approved/guarded tools to run; token issuance is the pre-run control point | execution plan test |
| 2026-07-01T17:30:00+09:00 | Keep high-risk approval state visible before wrapper block dominates token status | Always report blocked | HITL approval remains the first visible gate for active lab execution | high-risk approval regression |
