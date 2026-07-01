---
type: decision_log
task_id: KW-20260701-153103-Red-Team-Studio-Implement-RedTeam-AX-v2-case-RBAC-policy-CRUD-and-UI-slice
project: Red Team Studio
task: Implement RedTeam AX v2 case RBAC policy CRUD and UI slice
created: 2026-07-01T15:31:03+09:00
updated: 2026-07-01T16:21:00+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-01T15:45:00+09:00 | DEC-CASE-RBAC-ARTIFACT-CRUD: store case policy at `case-rbac/case-rbac-policy.json` | Only hard-code local registry; add DB table now | Existing platform persists ToolAction/Evidence/Report artifacts under archive; artifact CRUD fits current architecture and is testable without new DB migration | `runtime/redteam_v2_models.py`, router tests OK |
| 2026-07-01T15:58:00+09:00 | DEC-ACTOR-CONTEXT-POLICY-SOURCE: actor context must report `case_policy_artifact` when stored policy is active | Keep metadata as local registry | Audit and approval evidence must reflect the actual policy source used to authorize the actor | live approval smoke returned `actor_source=case_policy_artifact` |
| 2026-07-01T16:05:00+09:00 | Keep UI minimal: Load RBAC, Apply Defaults, Add Assignment | Add full delete/edit table UI in same slice | This slice validates policy management path without over-expanding frontend state; backend DELETE is already covered for later UI extension | Playwright smoke OK; API DELETE test OK |
