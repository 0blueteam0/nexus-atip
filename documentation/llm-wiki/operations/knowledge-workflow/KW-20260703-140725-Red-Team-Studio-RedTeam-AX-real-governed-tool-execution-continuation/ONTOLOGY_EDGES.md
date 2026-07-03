---
type: ontology_edges
task_id: KW-20260703-140725-Red-Team-Studio-RedTeam-AX-real-governed-tool-execution-continuation
project: Red-Team-Studio
task: RedTeam AX real governed tool execution continuation
created: 2026-07-03T14:07:25+09:00
updated: 2026-07-03T14:32:00+09:00
---

# Ontology Edges

| subject | relation | object |
|---|---|---|
| RedTeam2 | sends | `allow_safe_local_smoke_when_runtime_partial` |
| `execute-governed` | may_return | `partial_safe_local_smoke` |
| `safe_local_smoke_runner_allowed` | permits | version-only local subprocess smoke |
| `safe_local_smoke_runner_allowed` | blocks | arbitrary scan commands |
| RTA-COMP-062 | proves | safe partial local smoke execution contract |
