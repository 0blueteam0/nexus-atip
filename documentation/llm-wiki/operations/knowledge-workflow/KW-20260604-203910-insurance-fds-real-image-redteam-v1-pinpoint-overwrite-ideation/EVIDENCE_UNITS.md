# Evidence Units

## EU-001 dataset structure

- command: `find data/insurance-fds-generated/real-image-redteam-v1 -type f | wc -l`
- exit_code: 0
- observed: 159 files; visible NO/AF/masks/index/manifest structure.
- verified_at: 2026-06-04T20:43:23+09:00

## EU-002 problematic code

- source_path: `scripts/insurance_fds_real_image_redteam_generator.py`
- evidence: `tamper_box_for()` uses ratio zones; `overlay_tamper()` draws a large filled rectangle and text.
- impact: not field pinpoint overwrite.

## EU-003 visual evidence

- artifact_path: `data/insurance-fds-generated/real-image-redteam-v1/indexes/contact_sheet_real_image_redteam_sample.png`
- observation: AF samples show obvious large boxes/overlays, not subtle same-field replacement.

## EU-004 created artifacts

- artifact_path: `documentation/reports/INSURANCE_FDS_REAL_IMAGE_V1_PINPOINT_OVERWRITE_IDEATION.ko.md`
- artifact_path: `documentation/reports/insurance_fds_real_image_v1_pinpoint_model_matrix.json`
- validation: JSON parsed successfully; report line count 507.
