---
type: ontology_edges
status: complete
project: Red Team Studio
created: 2026-07-03T03:14:15+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| OperatorEvidenceCollectionPackage | feeds | OperatorEvidenceSubmissionManifestDraft | EU-REDTEAM-AX-OESM-20260703 | collection_items define expected attachments |
| OperatorEvidenceSubmissionManifestDraft | produces | SubmissionManifestArtifact | EU-REDTEAM-AX-OESM-20260703 | artifact path is validator-compatible |
| SubmissionManifestArtifact | requires_human_gate | OperatorEvidenceSubmissionValidator | EU-REDTEAM-AX-OESM-20260703 | `--require-approved` remains next gate |
| RedTeam2ReportStudio | exposes | OperatorEvidenceSubmissionManifestDraftAPI | EU-REDTEAM-AX-OESM-20260703 | Korean UI controls and blocker tables |
