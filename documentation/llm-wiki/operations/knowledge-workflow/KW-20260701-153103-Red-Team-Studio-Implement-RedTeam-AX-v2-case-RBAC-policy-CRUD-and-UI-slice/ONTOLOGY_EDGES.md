---
type: ontology_edges
status: complete
project: Red Team Studio
created: 2026-07-01T15:31:03+09:00
updated: 2026-07-01T16:21:00+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| RedTeam AX v2 | has_component | Case RBAC Policy CRUD | EU-REDTEAM-AX-CASE-RBAC-CRUD-20260701 | case-scoped authorization management |
| Case RBAC Policy | persisted_as | `case-rbac/case-rbac-policy.json` | EU-REDTEAM-AX-CASE-RBAC-CRUD-20260701 | archive artifact, not DB table |
| Actor Context | includes | `case_policy_source` | EU-REDTEAM-AX-CASE-RBAC-CRUD-20260701 | approval evidence metadata |
| `레드팀 분석2` | exposes | Case RBAC Policy panel | EU-REDTEAM-AX-CASE-RBAC-CRUD-20260701 | Load/Apply/Add controls |
| Report Gate | depends_on | bound approval actor context | EU-REDTEAM-AX-CASE-RBAC-CRUD-20260701 | future report audit linkage |
