---
type: work_command_record
task_id: KW-20260701-164153-Red-Team-Studio-Implement-RedTeam-AX-v2-image-OCR-sensitive-visual-redaction-preview-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 image OCR sensitive visual redaction preview slice
created: 2026-07-01T16:41:53+09:00
source_package: K:/wiki/work command
---

# SOURCE_QUALITY

## Source Classification

| source | source_content_class | usable_for | reason | required_follow_up |
|---|---|---|---|---|
| `Red Team Studio/FINAL_PLAN.md` | project plan | slice status and remaining work | Maintained project plan for RedTeam AX implementation. | Keep updating each slice. |
| `Red Team Studio/SPEC/06_VISUAL_EVIDENCE_CAPTURE_SPEC.md` | internal spec | visual evidence requirements | Defines original/redacted artifact and visual evidence expectations. | Re-read before pixel masking implementation. |
| `Red Team Studio/SPEC/21_GUARDRAIL_AGENT_PROMPTS.md` | internal spec | guardrail behavior | States screenshots/OCR are untrusted and screenshot-only conclusions are blocked. | Keep prompt corpus aligned. |
| `runtime/redteam_v2_models.py` | implementation | backend behavior | Source of API preview and sanitizer behavior. | Add OCR engine/pixel masking later. |
| `tests/test_redteam_v2_api_router.py` | verification | API contract | Proves current endpoint contract. | Add OCR engine regression when implemented. |

## Promotion Rule

A source can support a checklist requirement only when it contains actual requirement, procedure, record, control, or evaluation content. Purchase pages, catalog pages, abstracts, and search result metadata are not enough.

## Downgrade Rule

If a source is purchase-only, abstract-only, or search-result-only, record it as discovery evidence only. Do not use it as direct compliance evidence.

