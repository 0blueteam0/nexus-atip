---
type: decision_log
task_id: KW-20260701-151702-Red-Team-Studio-Implement-RedTeam-AX-v2-actor-context-provider-and-RBAC-authorization-slice
project: Red Team Studio
task: Implement RedTeam AX v2 actor context provider and RBAC authorization slice
created: 2026-07-01T15:17:02+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
# Decisions

- decision_id: `D-S12-LOCAL-PROVIDER-FIRST`
  - decision: Add a deterministic local actor context provider before external SSO integration.
  - rationale: Current approval APIs needed a shared resolver and RBAC contract before plugging in real IdP token validation.
  - impact: Raw actor headers are normalized through actor directory, role registry, permissions, and authentication state.

- decision_id: `D-S12-SESSION-TOKEN-DEV-SCHEME`
  - decision: Support `X-RedTeam-Session: dev:<actor_id>` as a local development session token.
  - rationale: This allows tests and local UI/API smoke to prove session-bound context without requiring an external IdP in this slice.
  - impact: External SSO/IdP remains an explicit follow-up; local provider is not represented as production SSO.
