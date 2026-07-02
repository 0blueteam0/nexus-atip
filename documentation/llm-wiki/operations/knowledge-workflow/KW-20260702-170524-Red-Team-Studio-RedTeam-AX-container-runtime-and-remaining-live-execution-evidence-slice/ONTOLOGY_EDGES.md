---
type: ontology_edges
status: updated
project: Red Team Studio
created: 2026-07-02T17:05:24+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| `WSL runtime readiness` | `records_blocker` | `blocked_wsl_distribution_start_failed` | EU-001 | Current local distro start failure |
| `/api/redteam/v2/runtime-readiness` | `projects_artifact` | `wsl_runtime` | EU-002 | API does not execute WSL commands |
| `RedTeam2 runtime readiness panel` | `displays` | `WSL 실행 환경` | EU-002 | Korean visible copy |
| `accepted gate manifest` | `includes` | `GATE-WSL-RUNTIME-READINESS` | EU-003 | 17/17 gates passed |
| `RTA-COMP-015` | `has_residual_gap` | `Docker/WSL/org endpoint live readiness` | EU-003 | Overall goal remains active |
