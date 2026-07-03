---
type: ontology_edges
task_id: KW-20260703-141648-Red-Team-Studio-RedTeam-AX-frontend-safe-installed-tool-smoke-button-continuation
project: Red-Team-Studio
task: RedTeam AX frontend safe installed tool smoke button continuation
created: 2026-07-03T14:16:48+09:00
updated: 2026-07-03T14:45:00+09:00
---

# Ontology Edges

| subject | relation | object |
|---|---|---|
| RedTeam2 | exposes | `안전 설치 확인 smoke` |
| `안전 설치 확인 smoke` | calls | `/api/redteam/v2/toolchains/execute-governed` |
| `safe_local_smoke_button` | builds | version-only runner argv |
| `safe_local_smoke_button` | forbids | active scan and network execution |
| RTA-COMP-063 | proves | beginner-facing safe smoke button contract |
