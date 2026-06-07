---
type: llm_system_handoff
id: 2026-06-07T12-12-02-975Z-codex-to-claude-system-insurance-fds-field-inventory
status: completed
from: codex
to: claude
created_at: 2026-06-07T12:12:02.975Z
title: "insurance-fds-field-inventory"
---

# codex -> claude System Handoff: insurance-fds-field-inventory

## Summary

Codex continued the two fixed insurance FDS workstreams and implemented `scripts/insurance_fds_real_image_field_inventory.py`.

The new script unblocks `tests/test_insurance_fds_real_image_field_inventory.py` and the broader `tests/test_insurance_fds_*.py` collection path. It creates a field inventory before AF/tamper generation so real-image NO derivatives can be reviewed for exact-coordinate pseudonym rewrite readiness.

## Who / When / What

- Actor: Codex / Hermes default profile
- Timestamp: 2026-06-07T12:12:02.975Z
- Changed system: insurance FDS real-image field inventory and test harness stabilization
- Workstreams:
  - A: Real-Web Grounded Exact-Coordinate Pseudonymized Dataset
  - B: Mass-Test Delay / Test Harness RCA and Stabilization

## Artifact Paths

- `J:/PortableApps/genai/scripts/insurance_fds_real_image_field_inventory.py`
- `J:/PortableApps/genai/tests/test_insurance_fds_real_image_field_inventory.py` (existing test now passes)
- `J:/PortableApps/genai/documentation/reports/INSURANCE_FDS_TWO_FIXED_WORKSTREAMS_SCOPE_20260605.ko.md`
- `J:/PortableApps/genai/documentation/llm-wiki/operations/knowledge-workflow/KW-20260607-210609-insurance-fds-continue-two-fixed-workstreams-real-web-grounded-exact-coordinate-pseudonymized-`

## Documents To Read

1. `documentation/reports/INSURANCE_FDS_TWO_FIXED_WORKSTREAMS_SCOPE_20260605.ko.md`
2. `scripts/insurance_fds_real_image_field_inventory.py`
3. `tests/test_insurance_fds_real_image_field_inventory.py`
4. This handoff file.

## Decisions

- Missing field inventory script was restored rather than deleting or xfail-ing the test.
- The implementation keeps values in `manual_review_required` by default because the local MVP uses dark-pixel text-region inventory rather than real OCR/KIE.
- `is_field_ready_for_tamper()` only returns true when `value_text` is non-empty and `value_status == "ocr_extracted"`.
- Training image shortcut artifacts remain disallowed: no visible mask/block/submission-invalid/synthetic-only label is rendered into NO/AF images.
- Review overlay PNGs are allowed as separate review artifacts, not as training images.

## Verification

- Command: `uvx --from pytest --with pillow pytest tests/test_insurance_fds_real_image_field_inventory.py -q --tb=short`
  - exit_code: 0
  - result: `2 passed in 0.19s`
- Command: `uvx --from pytest --with pillow --with openpyxl --with requests pytest tests/test_insurance_fds_*.py -q --durations=12`
  - exit_code: 0
  - result: `29 passed in 27.21s`
- Previous blocker removed:
  - `FileNotFoundError: scripts/insurance_fds_real_image_field_inventory.py` no longer occurs.

## Risks And Limits

- The current field detector is an OCR-free dark-pixel connected-component MVP. It is suitable for test harness stabilization and review queue generation, but not yet a final OCR/KIE field-understanding pipeline.
- `value_text` is currently a coordinate proxy (`pixel_text_region:x1,y1,x2,y2`) unless a future OCR adapter supplies confirmed values.
- Fields remain blocked for tamper generation until OCR/manual review confirms values.
- No real web candidate was promoted to training data in this task.

## Next Actions

1. Add OCR/KIE adapter support so confirmed fields can move from `manual_review_required` to `ocr_extracted` after privacy checks.
2. Add source registry/provenance validation for real-web source candidates before any NO/AF dataset promotion.
3. Separate slow insurance FDS tests with pytest markers or a documented command split if the default path remains too heavy.
4. Continue exact-coordinate pseudonym rewrite using confirmed field inventory, not raw real values.

## Git Context

- branch: main
- previous hash before this task: `2f84f23`
- expected new commit should include the field inventory script, this handoff, and the active knowledge workflow session.

## Receiver Resume Prompt

```text
Continue insurance FDS from the two fixed workstreams. Read the scope report and this handoff first. The collection blocker is fixed by scripts/insurance_fds_real_image_field_inventory.py and verified with 29 insurance FDS tests passing. Next, add OCR/KIE confirmation and provenance gates before any exact-coordinate AF generation.
```
