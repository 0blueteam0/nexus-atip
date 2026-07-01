---
type: work_command_record
task_id: KW-20260701-165158-Red-Team-Studio-Implement-RedTeam-AX-v2-pixel-level-visual-redaction-artifact-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 pixel-level visual redaction artifact slice
created: 2026-07-01T16:51:58+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

Create and verify redacted PNG artifacts from uploaded image data without installing a new OCR stack.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| Pillow | Python image library | Already installed; simple PNG masking | No OCR bbox extraction | selected |
| OpenCV | Python image library | Advanced image operations | Heavier API for simple masks | not selected |
| Tesseract/PaddleOCR | OCR engine | Real bbox extraction | Needs version/hash pin and install workflow | deferred |

## Build vs Adopt

Adopt existing `.venv` Pillow and repository archive helpers. Build only thin bundle glue.

## Selected Tool

Pillow, repository `case_dir`, `sha256_file`, and existing preview endpoint.

## Verification

API regression generated original/redacted PNG artifacts and passed.

