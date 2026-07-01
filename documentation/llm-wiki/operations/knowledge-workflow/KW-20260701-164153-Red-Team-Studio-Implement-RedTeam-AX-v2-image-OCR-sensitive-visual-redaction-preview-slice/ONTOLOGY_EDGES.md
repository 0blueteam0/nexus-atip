---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-01T16:41:53+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| RedTeam AX v2 | has_feature | Visual Evidence OCR Redaction Preview | EV-003 | Preview API and regression test added. |
| Visual Evidence OCR Redaction Preview | uses | Tool Output Sanitizer | EV-001 | OCR text is sanitized with existing prompt/secret controls. |
| Visual Evidence OCR Redaction Preview | produces | VisualEvidenceDescriptor | EV-003 | Descriptor records masking status and human review. |
| Screenshot-only Claim | blocked_by | Claim-Evidence Matrix Policy | EV-003 | Screenshot alone cannot support report finding. |
| Restricted Visual Evidence | requires | Human Review | EV-003 | Restricted classification warning and review flag emitted. |
| Report Studio RedTeam2 | exposes | Visual Evidence OCR Redaction Preview Panel | EV-002 | UI panel added to `reports.js`. |

