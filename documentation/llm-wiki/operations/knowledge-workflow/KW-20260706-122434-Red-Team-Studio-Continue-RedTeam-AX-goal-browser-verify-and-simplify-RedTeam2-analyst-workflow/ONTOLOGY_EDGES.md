---
type: ontology_edges
status: ready_for_close
project: Red-Team-Studio
created: 2026-07-06T12:24:34+09:00
updated: 2026-07-06T12:47:03+09:00
---

# Ontology Edges

## Nodes

- `RedTeam2`
- `관리자 설정`
- `redteam2ShowAdminDetails`
- `Evidence Card`
- `Claim-Evidence Matrix`
- `RTA-COMP-075`
- `Playwright browser verification`

## Edges

- `RedTeam2` -> `has_default_view` -> `analyst-facing simplified workflow`
- `RedTeam2` -> `hides_by_default` -> `administrator runtime/path/closure details`
- `관리자 설정` -> `reveals` -> `administrator audit details`
- `RTA-COMP-075` -> `proved_by` -> `browser/redteam2-browser-verify-20260706.json`
- `Evidence Card` -> `preserves_traceability_for` -> `hidden administrator source details`
- `Claim-Evidence Matrix` -> `depends_on` -> `approved Evidence Card`
