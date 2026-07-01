---
type: work_command_record
task_id: KW-20260701-165158-Red-Team-Studio-Implement-RedTeam-AX-v2-pixel-level-visual-redaction-artifact-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 pixel-level visual redaction artifact slice
created: 2026-07-01T16:51:58+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| WC-D-001 | Use Pillow | OpenCV or new dependency | Already available and enough for PNG masks. | Lower dependency risk. |
| WC-D-002 | Estimated OCR bands without bbox | Wait for OCR engine | Moves artifact traceability forward now. | Requires human review. |
| WC-D-003 | Store manifest and sha256sums | Store images only | SPEC expects evidence traceability. | Better audit trail. |

## Entries

- Visual redaction bundle now contains original/redacted images and manifest.
- OCR bbox integration remains open.

