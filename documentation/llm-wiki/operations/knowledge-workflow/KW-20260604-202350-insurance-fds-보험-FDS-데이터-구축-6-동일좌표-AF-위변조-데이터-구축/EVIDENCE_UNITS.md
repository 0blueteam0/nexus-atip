# EVIDENCE_UNITS

| evidence | command/artifact | result |
|---|---|---|
| RED test | `pytest tests/test_insurance_fds_exact_coordinate_pipeline.py -q` before implementation | FileNotFoundError for missing module |
| focused test | `pytest tests/test_insurance_fds_exact_coordinate_pipeline.py -q` | `2 passed in 4.56s` |
| dataset generation | `python scripts/insurance_fds_exact_coordinate_pipeline.py --template-cases 8` | NO 32, AF 32, pairs 32 |
| coordinate validation | generated `validation/exact_coordinate_validation.json` | checked_pairs 32, bbox_mismatch_count 0, missing_pair_count 0, pixel_diff_outside_bbox_count 0 |
| full insurance FDS test suite | `pytest tests/test_insurance_fds_exact_coordinate_pipeline.py ... tests/test_insurance_fds_synthetic_generator.py -q` | `25 passed in 41.66s` |
| visual evidence | `data/insurance-fds-generated/field-pseudonymized-v3.2-exact-coordinate-overwrite/indexes/exact_coordinate_pair_contact_sheet.png` | NO/AF same layout, value changed in same cell; no shifted box observed |
| report | `documentation/reports/INSURANCE_FDS_EXACT_COORDINATE_V3_2_REPORT.ko.md` | written |
