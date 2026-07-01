---
type: decision_log
task_id: KW-20260701-165158-Red-Team-Studio-Implement-RedTeam-AX-v2-pixel-level-visual-redaction-artifact-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 pixel-level visual redaction artifact slice
created: 2026-07-01T16:51:58+09:00
---

# Decision Log

| id | decision | reason | impact |
|---|---|---|---|
| D-001 | Use Pillow for PNG decode/save/draw. | Pillow is already installed in `.venv` and avoids adding dependency or invoking scanner tools. | Enables actual original/redacted artifacts in this slice. |
| D-002 | Validate uploaded SHA-256 against decoded data URL bytes. | Browser upload computes SHA-256 before API call; server must verify it before storing evidence. | Hash mismatch becomes `invalid`. |
| D-003 | Use explicit regions when supplied and estimated OCR bands otherwise. | Manual OCR preview lacks bbox coordinates but still needs a report-gate artifact candidate. | Produces pixel-level masking while flagging human review limitations. |
| D-004 | Save `screenshot_manifest.json` and `sha256sums.txt` with image artifacts. | SPEC expects visual bundle traceability. | Easier Evidence Card/Claim-Evidence Matrix linkage. |
| D-005 | Keep OCR engine/bbox extraction as follow-up. | This slice moves from preview to artifact generation without overclaiming OCR extraction. | `FINAL_PLAN.md` keeps bbox integration and live smoke open. |

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
