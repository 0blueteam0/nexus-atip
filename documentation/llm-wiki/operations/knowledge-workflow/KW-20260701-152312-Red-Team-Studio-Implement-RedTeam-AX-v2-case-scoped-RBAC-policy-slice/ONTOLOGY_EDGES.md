---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-01T15:23:12+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology edges

- `Case` -- `has_policy` --> `CaseRBACPolicy`
- `CaseRBACPolicy` -- `assigns` --> `Actor`
- `CaseRBACPolicy` -- `assigns_role` --> `ApproverRole`
- `ActorContext` -- `contains` --> `case_roles`
- `ActorContext` -- `contains` --> `effective_roles`
- `ApprovalDecision` -- `requires` --> `case_scoped_actor_context`
- `ReportStudioCase` -- `matches_policy_pattern` --> `RTA-*`
- `CentralGroupSync` -- `future_replaces` --> `local_case_assignment_registry`
