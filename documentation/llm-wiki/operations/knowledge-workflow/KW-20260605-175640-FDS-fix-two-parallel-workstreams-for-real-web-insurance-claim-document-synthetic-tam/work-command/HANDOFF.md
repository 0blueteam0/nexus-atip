# Work Command Handoff

Primary artifact:

- `J:/PortableApps/genai/documentation/reports/INSURANCE_FDS_TWO_FIXED_WORKSTREAMS_SCOPE_20260605.ko.md`

Next agent instructions:

1. Read the primary artifact first.
2. Keep two tracks separate:
   - Agent A: data pipeline / real-web grounding.
   - Agent B: test RCA / harness stabilization.
3. Do not render visible shortcut artifacts in document images.
4. Preserve provenance and privacy_state in manifests.
5. Start Agent B by restoring or implementing `scripts/insurance_fds_real_image_field_inventory.py` or by proving the test is stale and removing/replacing it with evidence.
6. Start Agent A by improving page/PDF deep extraction from trusted real web source candidates and connecting field inventory to exact-coordinate pseudonym rewrite.

Verification commands to resume:

```bash
python -m pytest tests/test_insurance_fds_*.py -q --durations=12
python -m pytest tests/test_insurance_fds_public_image_collector.py tests/test_insurance_fds_real_image_redteam_generator.py tests/test_insurance_fds_camera_image_generator.py tests/test_insurance_fds_priority_pipeline.py -q --durations=10
```

Known current state:

- Full glob currently fails during collection due missing `scripts/insurance_fds_real_image_field_inventory.py`.
- Older four-test bundle passes but takes 47.61s.
- Camera-image generator tests are the slowest observed group.
