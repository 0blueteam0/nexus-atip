---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-01T14:15:02+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

## Ontology Edges

- EvidenceCard -> has_state -> pending_review.
- EvidenceApproval -> changes -> EvidenceCard.approval_status approved.
- ClaimEvidenceMatrix -> requires -> approved EvidenceCard.
- ReportValidationResult -> blocks -> missing Evidence.
- ReportValidationResult -> blocks -> unapproved Evidence.
- ReportValidationResult -> blocks -> unverified Evidence.
