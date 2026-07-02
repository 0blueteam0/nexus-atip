---
type: ontology_edges
task_id: KW-20260702-234616-Red-Team-Studio-RedTeam-AX-collection-Finding-severity-approval-continuation-slice
project: Red Team Studio
task: RedTeam AX collection Finding severity approval continuation slice
created: 2026-07-02T23:46:16+09:00
---

# Ontology Edges

```json
[
  {"from":"FindingDraft","relation":"approved_by","to":"RedTeamLead"},
  {"from":"FindingDraft","relation":"approved_by","to":"BusinessOwner"},
  {"from":"ApprovedFinding","relation":"requires_next","to":"ClaimEvidenceMatrixDraft"},
  {"from":"ClaimEvidenceMatrixDraft","relation":"gates","to":"ReportV2Draft"}
]
```
