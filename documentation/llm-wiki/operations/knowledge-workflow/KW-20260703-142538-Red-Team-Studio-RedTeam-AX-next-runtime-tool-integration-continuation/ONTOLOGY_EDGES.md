---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-03T14:25:38+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology Edges

- RedTeam2 service import button -> calls -> `/api/redteam/v2/scanner-service-imports/{tool_id}`
- Scanner service import -> creates -> ToolRunRecord
- Scanner service import with `toolchain_id` -> creates -> `redteam_ax_v2_toolchain_service_import_projection`
- Toolchain service import projection -> enables -> `/api/redteam/v2/toolchains/{toolchain_id}/run-status`
- Toolchain service import projection -> enables -> `/api/redteam/v2/toolchains/{toolchain_id}/collect-results`
- Collect-results -> creates -> Evidence Card candidates
- Evidence candidates -> require -> human approval before Finding/Claim use
