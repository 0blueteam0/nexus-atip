---
type: ontology_edges
status: complete
---

# Ontology Edges

| subject | relation | object |
|---|---|---|
| ToolchainResultCollection | has_required_coverage | RequiredAnalysisToolCoverage |
| RequiredAnalysisToolCoverage | covers | Nuclei |
| RequiredAnalysisToolCoverage | covers | OpenVAS |
| RequiredAnalysisToolCoverage | covers | Trivy |
| RequiredAnalysisToolCoverage | covers | SCA |
| RequiredAnalysisToolCoverage | covers | npm audit |
| RequiredAnalysisToolCoverage | covers | OWASP ZAP |
| CompletionGate | requires | EvidenceCandidateCoverageComplete |
| CompletionGate | blocked_by | MissingRequiredToolIds |
