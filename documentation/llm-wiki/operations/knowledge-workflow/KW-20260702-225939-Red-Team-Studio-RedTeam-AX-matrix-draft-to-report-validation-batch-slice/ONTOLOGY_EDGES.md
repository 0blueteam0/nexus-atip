---
type: ontology_edges
status: complete
project: Red Team Studio
created: 2026-07-02T22:59:39+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| ClaimEvidenceMatrixDraft | gates | ReportV2Draft | EU-REDTEAM-AX-MATRIX-REPORT-DRAFT-20260702 | Held rows block draft generation. |
| ReportV2DraftAPI | reuses | GenerateReport | EU-REDTEAM-AX-MATRIX-REPORT-DRAFT-20260702 | Existing renderer/gate remains canonical. |
| HeldRow | blocks | ReportV2Draft | EU-REDTEAM-AX-MATRIX-REPORT-DRAFT-20260702 | No partial report by default. |
| ReadyRow | contributes_to | ClaimEvidenceMatrix | EU-REDTEAM-AX-MATRIX-REPORT-DRAFT-20260702 | Ready claims/findings enter payload preview. |
