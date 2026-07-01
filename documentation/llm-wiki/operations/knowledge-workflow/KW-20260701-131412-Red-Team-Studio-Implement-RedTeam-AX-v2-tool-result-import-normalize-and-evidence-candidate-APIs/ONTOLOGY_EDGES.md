---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-01T13:14:12+09:00
---

# Ontology Edges

## Candidate Edges

| subject | predicate | object | evidence |
|---|---|---|---|
| `ManualRunRecord` | `feeds` | `ToolRunRecord` | `/tool-runs/{run_id}/import-output` |
| `ToolRunRecord` | `normalized_into` | `NormalizedResult` | `/tool-runs/{run_id}/normalize` |
| `NormalizedResult` | `creates` | `EvidenceCandidate` | `/tool-runs/{run_id}/create-evidence` |
| `EvidenceCandidate` | `blocked_from` | `ApprovedReportClaim` | `validation_status=candidate` |
| `NormalizedResult` | `carries` | `prohibited_report_claims` | API tests |

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

