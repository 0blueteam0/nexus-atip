---
type: work_command_record
task_id: KW-20260701-165158-Red-Team-Studio-Implement-RedTeam-AX-v2-pixel-level-visual-redaction-artifact-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 pixel-level visual redaction artifact slice
created: 2026-07-01T16:51:58+09:00
source_package: K:/wiki/work command
---

# SOURCE_QUALITY

## Source Classification

| source | source_content_class | usable_for | reason | required_follow_up |
|---|---|---|---|---|
| `SPEC/06_VISUAL_EVIDENCE_CAPTURE_SPEC.md` | internal requirement | visual bundle requirements | Lists original/redacted images, manifest, sha256sums, and redaction gate. | Use again for report export visual gate. |
| `SPEC/03_DOMAIN_MODEL_AND_SCHEMAS.md` | internal schema | VisualEvidenceDescriptor fields | Defines original/redacted paths and visual descriptor concepts. | Keep schema artifacts aligned later. |
| `runtime/redteam_v2_models.py` | implementation | actual backend behavior | Contains bundle generation code. | Add OCR bbox integration. |
| `tests/test_redteam_v2_api_router.py` | verification | regression evidence | Verifies artifact files and hashes. | Add browser/API integration smoke. |

## Promotion Rule

A source can support a checklist requirement only when it contains actual requirement, procedure, record, control, or evaluation content. Purchase pages, catalog pages, abstracts, and search result metadata are not enough.

## Downgrade Rule

If a source is purchase-only, abstract-only, or search-result-only, record it as discovery evidence only. Do not use it as direct compliance evidence.

