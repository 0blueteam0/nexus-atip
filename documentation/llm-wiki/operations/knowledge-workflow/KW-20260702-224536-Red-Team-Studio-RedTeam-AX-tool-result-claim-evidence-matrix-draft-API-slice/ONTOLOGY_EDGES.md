---
type: ontology_edges
status: complete
project: Red Team Studio
created: 2026-07-02T22:45:36+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| ToolResultFindingClaimReview | produces | ClaimEvidenceMatrixDraft | EU-REDTEAM-AX-MATRIX-DRAFT-20260702 | Draft rows are generated from review candidates. |
| ClaimEvidenceMatrixDraft | includes_only_when_ready | ApprovedEvidenceCard | EU-REDTEAM-AX-MATRIX-DRAFT-20260702 | Evidence approval is required before report preview inclusion. |
| ClaimEvidenceMatrixDraft | includes_only_when_ready | TwoPersonApprovedFinding | EU-REDTEAM-AX-MATRIX-DRAFT-20260702 | Finding severity approval by required roles is required. |
| ClaimEvidenceMatrixDraft | previews | ReportValidationPayload | EU-REDTEAM-AX-MATRIX-DRAFT-20260702 | Ready rows are passed to existing report validation. |
| HeldClaim | remains_outside | ReportValidationPayload | EU-REDTEAM-AX-MATRIX-DRAFT-20260702 | Held rows remain visible but excluded from preview payload. |
