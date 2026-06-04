# TASKS

## Completed

1. Resume insurance FDS #6 from previous session context.
   - Evidence: session_search result showed the last user correction: AF/tampered values must be inserted at the exact same coordinates as NO/original values.
2. Inspect existing v3.1 generator and tests.
   - Evidence: `scripts/insurance_fds_field_pseudonymized_pipeline.py` and `tests/test_insurance_fds_field_pseudonymized_pipeline.py` inspected.
   - Finding: v3.1 compared AF tamper bbox to AF field bbox, but did not strongly pair AF with a NO source image or pixel-level diff containment.
3. Write RED tests for exact-coordinate pair behavior.
   - Evidence: `tests/test_insurance_fds_exact_coordinate_pipeline.py` created.
   - RED result: missing module FileNotFoundError.
4. Implement v3.2 exact-coordinate generator.
   - Evidence: `scripts/insurance_fds_exact_coordinate_pipeline.py`.
5. Generate v3.2 dataset.
   - Evidence: `python scripts/insurance_fds_exact_coordinate_pipeline.py --template-cases 8` returned NO 32 / AF 32 / pairs 32.
6. Validate generated artifacts.
   - Evidence: `validation/exact_coordinate_validation.json` shows checked_pairs 32, mismatch 0, missing 0, outside bbox diff 0.
7. Write final report and update reusable skill.
   - Evidence: `documentation/reports/INSURANCE_FDS_EXACT_COORDINATE_V3_2_REPORT.ko.md` and patched skill.

## Pending

- Extend exact-coordinate rewrite to OCR/KIE-extracted real-image field bboxes after pseudonymization.
- Add shared transform-matrix handling if scanner/mobile geometric augmentation is reintroduced.
