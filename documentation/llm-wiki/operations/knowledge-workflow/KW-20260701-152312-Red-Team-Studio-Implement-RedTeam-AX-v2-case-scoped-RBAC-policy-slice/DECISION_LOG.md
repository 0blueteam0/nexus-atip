---
type: decision_log
task_id: KW-20260701-152312-Red-Team-Studio-Implement-RedTeam-AX-v2-case-scoped-RBAC-policy-slice
project: Red Team Studio
task: Implement RedTeam AX v2 case-scoped RBAC policy slice
created: 2026-07-01T15:23:12+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
# Decisions

- decision_id: `D-S13-LOCAL-CASE-ASSIGNMENT-REGISTRY`
  - decision: Implement local wildcard case assignment registry before central group sync.
  - rationale: The platform must enforce case-level operation boundaries now, while external directory/group sync remains a later integration.
  - impact: Actor global roles are narrowed to case-effective roles whenever a payload has `case_id`.

- decision_id: `D-S13-RTA-WILDCARD`
  - decision: Add `RTA-*` wildcard assignments for existing Report Studio generated case IDs.
  - rationale: The UI generates case IDs like `RTA-2026-0301-SCOPE-RUN-*`, not only `CASE-RTA-*`.
  - impact: Existing UI smoke remains valid while still enforcing explicit local case policy.
