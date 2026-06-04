# HANDOFF

Next worker should read:

- `documentation/reports/INSURANCE_FDS_EXACT_COORDINATE_V3_2_REPORT.ko.md`
- `scripts/insurance_fds_exact_coordinate_pipeline.py`
- `tests/test_insurance_fds_exact_coordinate_pipeline.py`
- `data/insurance-fds-generated/field-pseudonymized-v3.2-exact-coordinate-overwrite/validation/exact_coordinate_validation.json`
- `data/insurance-fds-generated/field-pseudonymized-v3.2-exact-coordinate-overwrite/manifests/pair_manifest.json`

Next recommended work:
1. Add OCR/KIE extraction for real public/quarantine candidate images.
2. Apply the same v3.2 exact-coordinate overwrite policy to OCR-extracted real-image field bboxes after pseudonymization.
3. If scanner/mobile transforms are reintroduced, share the same transform between NO/AF and record transformed bbox.
