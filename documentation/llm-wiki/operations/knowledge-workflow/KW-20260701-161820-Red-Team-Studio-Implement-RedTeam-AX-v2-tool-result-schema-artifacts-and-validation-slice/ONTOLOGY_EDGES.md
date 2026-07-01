---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-01T16:18:20+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology Edges

- `ToolResultNormalized` -> `validatedBy` -> `ToolResultNormalized.schema.json`
- `ToolArtifactImport` -> `validatedBy` -> `ToolArtifactImport.schema.json`
- `SchemaRegistry` -> `exposes` -> `ToolSchemasEndpoint`
- `ToolOutput` -> `mustSatisfy` -> `trusted_as_instruction_false`
- `ToolOutput` -> `mustRequire` -> `human_validation`
- `SchemaValidation` -> `supports` -> `ClaimEvidenceMatrix`
