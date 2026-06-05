# Agent Roster

## Agent A - Data Pipeline / Real-Web Grounding

Role:

- Own source collection, page/PDF deep extraction, OCR/KIE field inventory, exact-coordinate pseudonym rewrite, privacy/source gates.

Inputs:

- bg2 zero-download analysis.
- real-web collector script.
- v3.2 exact-coordinate pipeline.
- v4 pseudonymization policy.

Outputs:

- Better source registry.
- Field inventory manifest.
- Pseudonymized same-coordinate NO/AF pair artifacts only after gates pass.

Hard constraints:

- No visible mask/block/synthetic-only/submission-invalid shortcuts in images.
- No raw real values in output manifests.
- No unreviewed real web candidate promotion.

## Agent B - Test RCA / Harness Stabilization

Role:

- Own missing field inventory script, stale test detection, slow marker split, fixture reduction, duration budget.

Inputs:

- `tests/test_insurance_fds_real_image_field_inventory.py`.
- `tests/test_insurance_fds_camera_image_generator.py`.
- `tests/test_insurance_fds_priority_pipeline.py`.
- pytest duration outputs.

Outputs:

- Full insurance FDS test glob collects successfully.
- Slow/integration tests separated from fast smoke tests.
- Duration baseline recorded.

Hard constraints:

- Do not weaken privacy/source gates to speed tests.
- Do not hide failures with broad xfail/skip.
- Do not delete coverage without replacement evidence.
