---
type: ontology_edges
task_id: KW-20260703-010816-Red-Team-Studio-RedTeam-AX-scanner-artifact-manifest-builder-slice
project: Red Team Studio
task: RedTeam AX scanner artifact manifest builder slice
created: 2026-07-03T01:08:16+09:00
---

# Ontology Edges

- `ToolchainArtifactManifestBuilder` scans `WorkspaceDirectory`.
- `ToolchainArtifactManifestBuilder` selects `ScannerArtifactFile`.
- `ScannerArtifactFile` has `sha256`, `content_type`, and `source_path`.
- `ToolchainArtifactManifestBuilder` emits `ToolchainArtifactManifestImportPayload`.
- `ToolchainArtifactManifestImportPayload` feeds `ToolchainArtifactManifestImport`.
