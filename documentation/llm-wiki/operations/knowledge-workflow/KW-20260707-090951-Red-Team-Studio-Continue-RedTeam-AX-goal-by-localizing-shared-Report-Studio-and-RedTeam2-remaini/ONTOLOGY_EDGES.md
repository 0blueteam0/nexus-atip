---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-07T09:09:51+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| Report Studio common header | uses_display_language | Korean-first analyst copy | RTA-COMP-079-EVIDENCE | `Report Studio` legacy header removed from default RedTeam2 DOM. |
| RedTeam2 default analyst view | hides_by_default | RBAC acronym labels | RTA-COMP-079-EVIDENCE | User-facing labels use `권한 정책` and `권한 불러오기`. |
| RedTeam2 default analyst view | preserves_traceability_in | backend payload and audit artifact | RTA-COMP-079-EVIDENCE | UI labels changed without renaming stored Evidence/API identifiers. |
| RTA-COMP-079 | proves | shared header and permission/report label localization | RTA-COMP-079-EVIDENCE | Browser DOM and sanity tests passed. |
