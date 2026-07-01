---
type: decision_log
task_id: KW-20260701-164153-Red-Team-Studio-Implement-RedTeam-AX-v2-image-OCR-sensitive-visual-redaction-preview-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 image OCR sensitive visual redaction preview slice
created: 2026-07-01T16:41:53+09:00
---

# Decision Log

| id | decision | reason | impact |
|---|---|---|---|
| D-001 | Implement JSON preview endpoint before OCR engine integration. | The requested platform needs guardrail workflow first; OCR engine/version pinning is larger and should not block policy preview. | Enables UI/API workflow and tests without introducing new native dependencies. |
| D-002 | Reuse existing tool-output sanitizer for OCR text. | OCR can contain prompt injection or secrets, and existing RedTeam AX invariant already treats tool output as data-only. | Keeps visual evidence aligned with `trusted_as_instruction=false`. |
| D-003 | Add visual-specific sensitive patterns in addition to secret patterns. | Screenshots frequently expose emails, internal IPs/URLs, session identifiers, and phone numbers that generic secret patterns miss. | Preview emits concrete `mask_text_region` actions for analyst review. |
| D-004 | Block screenshot-only claims at preview policy level. | SPEC requires evidence-backed findings and no screenshot-only unsupported claim. | UI and artifact warn that log/ticket/tool-output evidence is required before report claims. |
| D-005 | Leave pixel-level redacted image output as follow-up. | This slice records policy and masking intent; generating modified image artifacts requires image processing and visual QA. | `FINAL_PLAN.md` tracks remaining OCR engine and redacted artifact work. |

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
