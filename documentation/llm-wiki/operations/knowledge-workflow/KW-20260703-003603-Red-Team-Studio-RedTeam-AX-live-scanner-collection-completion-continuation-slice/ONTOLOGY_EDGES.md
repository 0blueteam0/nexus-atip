---
type: ontology_edges
status: complete
project: Red Team Studio
created: 2026-07-03T00:36:03+09:00
---

# Ontology Edges

- `ToolchainImportedOutput` -> `creates` -> `ToolRunRecord(status=OutputImported)`
- `ToolRunRecord(status=OutputImported)` -> `feeds` -> `ToolchainResultCollection`
- `ToolchainResultCollection` -> `creates` -> `EvidenceCard(candidate)`
- `EvidenceCard(approved)` -> `promotes_to` -> `FindingDraft`
- `FindingDraft(approved_severity)` -> `feeds` -> `ClaimEvidenceMatrixRow(ready)`
- `ClaimEvidenceMatrixRow(ready)` -> `feeds` -> `KoreanRedTeamReportV2Draft`
- `ReportExport(Exported)` -> `verified_by` -> `ToolchainCollectionCompletionGate`
