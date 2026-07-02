---
type: ontology_edges
task_id: KW-20260702-233157-Red-Team-Studio-RedTeam-AX-approved-Evidence-promotion-gate-continuation-slice
project: Red Team Studio
task: RedTeam AX approved Evidence promotion gate continuation slice
created: 2026-07-02T23:31:57+09:00
---

# Ontology Edges

```json
[
  {"from":"ToolchainResultCollection","relation":"produces","to":"EvidenceCandidate"},
  {"from":"EvidenceCandidate","relation":"approved_by","to":"EvidenceApproval"},
  {"from":"ApprovedEvidence","relation":"promoted_to","to":"FindingDraft"},
  {"from":"FindingDraft","relation":"requires","to":"TwoPersonSeverityApproval"},
  {"from":"ApprovedFinding","relation":"eligible_for","to":"ClaimEvidenceMatrixDraft"}
]
```
