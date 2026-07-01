---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-01T16:58:46+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| ToolActionCard | produces | ToolExecutionPlan | EV-004 | New endpoint creates archived plan. |
| ToolExecutionPlan | enforces | network default deny | EV-004 | sandbox/dry_run deny egress by default. |
| ToolExecutionPlan | enforces | workspace_only filesystem | EV-004 | write paths limited to case archive. |
| High-risk lab execution | requires | approval token | EV-004 | Nuclei lab plan remains approval_required. |
| Report Studio RedTeam2 | displays | sandbox policy | EV-003 | UI panel added. |

