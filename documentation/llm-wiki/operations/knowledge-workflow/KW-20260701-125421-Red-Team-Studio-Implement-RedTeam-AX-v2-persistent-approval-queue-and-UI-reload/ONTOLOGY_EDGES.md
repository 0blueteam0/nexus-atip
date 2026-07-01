---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-01T12:54:21+09:00
---

# Ontology Edges

## Candidate Nodes

- `RedTeamAXV2`
- `ToolActionCard`
- `ApprovalRequest`
- `ApprovalDecision`
- `EvidenceCard`
- `ReportStudioRedteam2`
- `CaseWorkspace`

## Candidate Edges

| subject | predicate | object | evidence |
|---|---|---|---|
| `ReportStudioRedteam2` | `loads_queue_from` | `CaseWorkspace` | `GET /api/redteam/v2/tool-actions?case_id=...` |
| `ToolActionCard` | `has_state_transition` | `ApprovalRequested` | `/request-approval` |
| `ApprovalDecision` | `updates` | `ToolActionCard.status` | `/approve` |
| `ToolActionCard` | `stored_as` | `JSONArtifact` | `archive/runs/redteam-ax-v2/{case_id}/tool-actions` |
| `ApprovalRequest` | `stored_as` | `JSONArtifact` | `archive/runs/redteam-ax-v2/{case_id}/approvals` |

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

