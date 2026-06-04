# HANDOFF

## What changed

- Added exact-coordinate NO/AF pair generator: `scripts/insurance_fds_exact_coordinate_pipeline.py`.
- Added tests: `tests/test_insurance_fds_exact_coordinate_pipeline.py`.
- Generated v3.2 dataset: `data/insurance-fds-generated/field-pseudonymized-v3.2-exact-coordinate-overwrite/`.
- Added report: `documentation/reports/INSURANCE_FDS_EXACT_COORDINATE_V3_2_REPORT.ko.md`.
- Patched FDS data engineering skill with exact-coordinate AF rule.

## Verification

- Focused tests: `2 passed in 4.56s`.
- Full insurance FDS tests: `25 passed in 41.66s`.
- Coordinate validation: checked_pairs 32, bbox_mismatch_count 0, missing_pair_count 0, pixel_diff_outside_bbox_count 0.

## Next reader

Read the report first, then pair manifest and validation JSON.
