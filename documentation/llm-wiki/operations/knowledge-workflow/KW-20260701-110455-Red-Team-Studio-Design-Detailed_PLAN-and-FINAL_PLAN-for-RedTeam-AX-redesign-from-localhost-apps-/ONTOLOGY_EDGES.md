---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-01T11:04:55+09:00
---

# Ontology Edges

```text
RedTeamStudio -> contains -> redteam_ax_plan.md
RedTeamStudio -> contains -> SPEC
RedTeamStudio -> contains -> v1.2 starter pack
ChatShareRedTeamProcess -> informs -> GuardrailRequirements
ChatShareRedTeamProcess -> informs -> ToolingRequirements
ExistingReportStudio -> has_tab -> redteam
Redteam2Tab -> clones_from -> redteam
Redteam2Tab -> isolates_state_from -> redteam
Redteam2Tab -> calls -> RedteamV2API
RedteamV2API -> enforces -> ROEPolicy
ToolActionCard -> gates -> ToolExecution
ToolOutput -> normalizes_to -> EvidenceCandidate
EvidenceCard -> supports -> ClaimEvidenceMatrix
ClaimEvidenceMatrix -> gates -> ReportV2Export
LLMWikiHome -> indexes -> RedTeamStudioFileManifest
```

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

