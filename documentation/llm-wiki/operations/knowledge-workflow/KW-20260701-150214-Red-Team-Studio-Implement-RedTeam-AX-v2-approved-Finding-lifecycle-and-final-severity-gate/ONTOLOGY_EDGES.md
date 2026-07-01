---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-01T15:02:14+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology edges

- `FindingV2` -- `requires` --> `EvidenceCard`
- `FindingV2` -- `has_approval_gate` --> `FinalSeverityApproval`
- `FinalSeverityApproval` -- `requires_role` --> `red_team_lead`
- `FinalSeverityApproval` -- `requires_role` --> `business_owner`
- `ReportValidationResult` -- `blocks_on` --> `missing_finding`
- `ReportValidationResult` -- `blocks_on` --> `unapproved_finding`
- `ReportValidationResult` -- `blocks_on` --> `unapproved_final_severity`
- `Korean Red Team Report v2` -- `uses_only` --> `approved FindingV2`
- `Korean Red Team Report v2` -- `uses_only` --> `approved EvidenceCard`
