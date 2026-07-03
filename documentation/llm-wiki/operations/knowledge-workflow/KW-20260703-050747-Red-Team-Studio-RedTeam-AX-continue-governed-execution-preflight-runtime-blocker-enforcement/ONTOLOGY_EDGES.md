---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-03T05:07:47+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

## Ontology edge candidates

- `RedTeam2 runner execution` -> `requires` -> `runtime readiness preflight`
- `runtime readiness preflight` -> `blocks` -> `subprocess runner launch when tool_execution_ready=false`
- `runtime_next_action_plan` -> `maps_to` -> `RedTeam2 화면 버튼`
- `blocked_by_runtime_preflight` -> `evidences` -> `unapproved or unready high-risk execution did not run`
- `development byproduct` -> `excluded_from` -> `completion evidence when not aligned with real operating procedure`
- `real operating evidence` -> `requires` -> `ROE/HITL, Evidence Card approval, Finding approval, Claim-Evidence Matrix, Report v2 export gate`
