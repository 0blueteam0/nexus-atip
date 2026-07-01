---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-01T13:21:16+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

## Ontology Edges - Slice 7

- RedTeam AX v2 Report -> requires -> ReportValidationResult pass.
- RedTeam AX v2 Report Export -> requires -> Executive Sponsor approval.
- ReportExportApproval -> references -> report_id.
- ReportExportManifest -> references -> approval_id.
- UnsupportedClaim -> blocks -> ReportExportApproval.
- UnapprovedHighRiskAction -> blocks -> ReportExportApproval.
- FindingWithoutEvidence -> blocks -> ReportExportApproval.
