---
type: ontology_edges
project: Red Team Studio
task: RedTeam AX operator evidence submission validator slice
---

# Ontology Edges

| source | relation | target |
|---|---|---|
| operator evidence collection package | templates | operator submission manifest |
| operator submission manifest | references | sanity artifact |
| submission validator | verifies | artifact path, sha256, status, human approval |
| runtime readiness API | projects | operator evidence submission validation |
| accepted gate manifest | verifies | submission validator default artifact |
