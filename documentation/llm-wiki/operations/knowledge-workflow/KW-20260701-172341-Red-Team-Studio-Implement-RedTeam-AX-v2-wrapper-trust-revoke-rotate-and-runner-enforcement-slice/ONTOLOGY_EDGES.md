---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-01T17:23:42+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| ToolWrapperPinRevoke | revokes | ToolWrapperPin | EU-wrapper-revoke | red_team_lead actor binding |
| ToolWrapperPin | excluded_when | revoked | EU-wrapper-revoke | manifest lookup ignores revoked pins |
| ToolWrapperPinRequest | rotates | ToolWrapperPin | EU-wrapper-revoke | warning on existing pin |
| ToolExecutionPlan | blocks | ExecutionToken | EU-runner-hardblock | wrapper preflight failure |
| RedTeam2ReportStudio | triggers | ToolWrapperPinRevoke | EU-wrapper-revoke | Revoke Pin button |

