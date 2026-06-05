# Quality Gate

Status: PASS

- pytest: 6 passed
- run_demo.py: exit_code 0
- v4 quality gate: pass true
- all_generated_pages_overflow_free: true
- critical_fields_not_truncated: true
- benign_conditions_not_fraud: true
- tamper_masks_align_changed_field_bboxes: true
- manifest_rows_have_leakage_groups: true

Known limitation: demo has one leakage group, so validation/test splits are empty but leakage-safe. Next increment should create multiple groups and reject empty validation/test splits.
