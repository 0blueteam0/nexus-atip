---
type: knowledge_workflow_record
project: Red Team Studio
task: RedTeam AX collection end-to-end completion gate continuation slice
---

# ONTOLOGY_EDGES

- ToolchainResultCollection -> verified_by -> CompletionGate
- CompletionGate -> checks -> EvidenceApproval
- CompletionGate -> checks -> FindingPromotion
- CompletionGate -> checks -> FindingSeverityApproval
- CompletionGate -> checks -> ClaimEvidenceMatrix
- CompletionGate -> checks -> ReportExport
