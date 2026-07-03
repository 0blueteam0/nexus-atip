---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-03T14:38:24+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| RedTeamAXSixToolWorkOrder | routes_tool | OpenVASZAPReadOnlyServiceImport | RTA-COMP-065 | OpenVAS/ZAP rows use scanner-service-import endpoint |
| RedTeamAXSixToolWorkOrder | routes_tool | SCAArtifactManifestImport | RTA-COMP-065 | SCA/import-only rows use artifact manifest import |
| RedTeamAXSixToolWorkOrder | preserves_control | NoScannerCommandExecution | RTA-COMP-065 | commands_executed_by_api=false, active_scan_executed=false |
| RedTeam2ReportStudio | displays | SixToolWorkOrderTable | RTA-COMP-065 | Korean beginner-facing work order table |
