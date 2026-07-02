---
type: ontology_edges
task_id: KW-20260702-235549-Red-Team-Studio-RedTeam-AX-collection-Matrix-and-report-draft-bridge-continuation-slice
project: Red Team Studio
task: RedTeam AX collection Matrix and report draft bridge continuation slice
created: 2026-07-02T23:55:49+09:00
---

# Ontology Edges

```json
[
  {"from":"ApprovedCollectionFinding","relation":"becomes","to":"ClaimEvidenceMatrixReadyRow"},
  {"from":"ClaimEvidenceMatrixReadyRow","relation":"feeds","to":"ReportValidationPayload"},
  {"from":"ReportValidationPayload","relation":"gates","to":"KoreanReportV2Draft"},
  {"from":"KoreanReportV2Draft","relation":"requires_next","to":"FinalExportApproval"}
]
```
