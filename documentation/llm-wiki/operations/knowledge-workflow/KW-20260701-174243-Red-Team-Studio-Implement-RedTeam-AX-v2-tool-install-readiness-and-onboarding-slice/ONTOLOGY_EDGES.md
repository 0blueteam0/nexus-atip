---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-01T17:42:43+09:00
---

# Ontology Edges

## Filled Record

- ToolProfile `has_install_readiness` ToolInstallReadiness
- ToolInstallReadiness `references` OfficialToolSource
- ToolInstallReadiness `requires` OperatorRunInstallPlan
- ToolInstallReadiness `requires` VerificationCommandEvidence
- ToolInstallReadiness `feeds` ToolWrapperManifest
- ToolWrapperManifest `requires` ApprovedWrapperPin
- ToolInstallReadiness `maps_to` ToolResultNormalizerAgent
- ToolResultNormalizerAgent `produces` EvidenceCandidate

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

