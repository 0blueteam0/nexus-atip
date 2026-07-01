---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-01T16:51:58+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| VisualEvidenceDescriptor | has_path | original_artifact_path | EV-004 | Populated from visual bundle. |
| VisualEvidenceDescriptor | has_path | redacted_artifact_path | EV-004 | Populated from generated redacted PNG. |
| Visual Redaction Bundle | contains | original.png | EV-004 | Stored in case archive. |
| Visual Redaction Bundle | contains | redacted.png | EV-004 | Pixel-level masked artifact. |
| Visual Redaction Bundle | contains | screenshot_manifest.json | EV-004 | Hash and region metadata. |
| Report Studio RedTeam2 | displays | redacted artifact path and hash | EV-003 | UI rows/cards added. |
| Estimated OCR Band | requires | human review | EV-001 | Precise OCR bbox remains follow-up. |

