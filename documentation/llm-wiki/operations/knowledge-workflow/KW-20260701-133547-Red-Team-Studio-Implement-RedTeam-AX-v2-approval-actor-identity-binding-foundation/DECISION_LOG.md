---
type: decision_log
task_id: KW-20260701-133547-Red-Team-Studio-Implement-RedTeam-AX-v2-approval-actor-identity-binding-foundation
project: Red Team Studio
task: Implement RedTeam AX v2 approval actor identity binding foundation
created: 2026-07-01T13:35:47+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
## Decision Log

- D-001: Use `X-RedTeam-Actor` and `X-RedTeam-Actor-Role` as the local actor context boundary.
- D-002: Approval APIs return application-level `invalid` instead of HTTP 401/403 to stay consistent with existing v2 gate result patterns.
- D-003: Store `identity_binding=bound|invalid` in approval artifacts for Evidence Card/Claim-Evidence traceability.
- D-004: Keep real SSO/RBAC provider integration as a remaining release gate.
