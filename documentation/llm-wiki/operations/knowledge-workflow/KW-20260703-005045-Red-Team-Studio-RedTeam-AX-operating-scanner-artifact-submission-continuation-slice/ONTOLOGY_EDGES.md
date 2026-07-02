---
type: ontology_edges
task_id: KW-20260703-005045-Red-Team-Studio-RedTeam-AX-operating-scanner-artifact-submission-continuation-slice
project: Red Team Studio
task: RedTeam AX operating scanner artifact submission continuation slice
created: 2026-07-03T00:50:45+09:00
---

# Ontology Edges

- `ToolchainArtifactManifestImport` validates `ScannerArtifactFile`.
- `ScannerArtifactFile` has `source_path`, `sha256`, and `content_type`.
- `ToolchainArtifactManifestImport` creates `ToolRunRecord` with status `OutputImported`.
- `ToolRunRecord` feeds `ToolchainResultCollection`.
- `ToolchainResultCollection` produces `EvidenceCardCandidate`.
- `EvidenceCardCandidate` requires `HumanEvidenceApproval` before `FindingPromotion`.
