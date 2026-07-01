---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-01T16:11:57+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology Edges

- `ToolRunRecord` -> `hasRawArtifact` -> `ToolArtifactImport`
- `ToolArtifactImport` -> `requires` -> `SHA256`
- `ToolArtifactImport` -> `storedIn` -> `case archive raw-artifacts`
- `StoredArtifact` -> `feeds` -> `ToolResultNormalizer`
- `ToolResultNormalizer` -> `produces` -> `EvidenceCandidate`
- `ScannerOutput` -> `trustedAs` -> `data_only_never_instruction`
