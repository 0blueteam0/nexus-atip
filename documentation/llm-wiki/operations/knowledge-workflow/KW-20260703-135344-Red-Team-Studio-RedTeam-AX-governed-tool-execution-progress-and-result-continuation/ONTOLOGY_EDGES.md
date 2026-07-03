---
type: ontology_edges
task_id: KW-20260703-135344-Red-Team-Studio-RedTeam-AX-governed-tool-execution-progress-and-result-continuation
project: Red-Team-Studio
task: RedTeam AX governed tool execution progress and result continuation
created: 2026-07-03T13:53:44+09:00
updated: 2026-07-03T14:18:00+09:00
---

# Ontology Edges

| subject | relation | object |
|---|---|---|
| RedTeam2 | calls | `/api/redteam/v2/toolchains/{toolchain_id}/run-status` |
| `run-status` | reads | `toolchain-runs` |
| `run-status` | precedes | `/api/redteam/v2/toolchains/{toolchain_id}/collect-results` |
| `run-status` | does_not_execute | scanner commands |
| `run-status` | does_not_mark | goal complete |
| RTA-COMP-061 | proves | saved toolchain run status reload contract |
