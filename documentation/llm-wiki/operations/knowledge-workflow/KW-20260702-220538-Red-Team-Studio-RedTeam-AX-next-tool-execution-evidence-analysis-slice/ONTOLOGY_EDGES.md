---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-02T22:05:38+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology Edges

- RedTeam AX -> has_artifact -> ToolResultAnalysisBrief
- ToolResultAnalysisBrief -> reads -> GovernedToolRunArtifacts
- ToolResultAnalysisBrief -> produces -> EvidencePack
- ToolResultAnalysisBrief -> produces -> SCAReport
- ToolResultAnalysisBrief -> proposes -> ClaimEvidenceMatrixCandidates
- ToolResultAnalysisBrief -> constrains -> LLMToolAnalystAgents
- RawToolOutput -> treated_as -> UntrustedData
- RuntimeReadinessAPI -> projects -> ToolResultAnalysisBrief
- RedTeam2Panel -> displays -> ToolResultAnalysisBrief
