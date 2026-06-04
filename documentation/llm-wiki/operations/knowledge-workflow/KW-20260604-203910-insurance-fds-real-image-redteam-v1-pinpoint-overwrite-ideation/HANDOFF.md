# Handoff

Next implementer should start with tests for `real-image-redteam-v1-pinpoint-overwrite`:

1. Reject ratio-based tamper boxes for pinpoint pipeline.
2. Require every AF to reference paired NO.
3. Require same image size.
4. Require target field contract with bbox/polygon/mask.
5. Require outside-mask pixel diff validation.

Primary artifacts created:

- `documentation/reports/INSURANCE_FDS_REAL_IMAGE_V1_PINPOINT_OVERWRITE_IDEATION.ko.md`
- `documentation/reports/insurance_fds_real_image_v1_pinpoint_model_matrix.json`
