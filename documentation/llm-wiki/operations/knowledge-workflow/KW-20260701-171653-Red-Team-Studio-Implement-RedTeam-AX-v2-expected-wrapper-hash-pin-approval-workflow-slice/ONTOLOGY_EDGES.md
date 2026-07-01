---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-01T17:16:53+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| ToolWrapperPinRequest | proposes | expected_sha256 | EU-wrapper-pin | operator submitted hash |
| ToolWrapperPinApproval | approves | ToolWrapperPinRequest | EU-wrapper-pin | red_team_lead actor binding |
| ToolWrapperPin | feeds | ToolWrapperManifest | EU-wrapper-pin | approved_pin source |
| RedTeam2ReportStudio | submits | ToolWrapperPinRequest | EU-wrapper-pin | Request Pin button |
| RedTeam2ReportStudio | approves | ToolWrapperPin | EU-wrapper-pin | Approve Pin button |

