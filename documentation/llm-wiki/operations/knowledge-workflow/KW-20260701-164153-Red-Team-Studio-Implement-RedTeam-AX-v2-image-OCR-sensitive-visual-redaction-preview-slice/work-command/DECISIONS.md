---
type: work_command_record
task_id: KW-20260701-164153-Red-Team-Studio-Implement-RedTeam-AX-v2-image-OCR-sensitive-visual-redaction-preview-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 image OCR sensitive visual redaction preview slice
created: 2026-07-01T16:41:53+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| WC-D-001 | Add preview API before OCR engine | Add OCR dependency immediately | Policy/descriptor contract can be verified first without dependency risk. | Fast, testable RedTeam AX progress. |
| WC-D-002 | Treat OCR as data-only | Let OCR text feed LLM instructions | Screenshots can contain prompt-injection text. | Preserves `trusted_as_instruction=false`. |
| WC-D-003 | Keep pixel masking as follow-up | Generate image redaction now | Needs image processor and visual QA. | Plan tracks remaining artifact generation. |

## Entries

- Backend and UI now produce visual redaction preview metadata.
- `FINAL_PLAN.md` explicitly separates completed preview from remaining OCR extraction and pixel-level redaction.

