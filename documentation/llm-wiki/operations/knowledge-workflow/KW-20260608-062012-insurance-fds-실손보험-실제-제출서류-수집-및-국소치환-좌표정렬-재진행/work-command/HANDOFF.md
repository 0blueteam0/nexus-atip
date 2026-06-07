# Work-command Handoff

Continue from scripts/insurance_fds_real_submission_cycle.py and output root data/insurance-fds-generated/real-submission-bbox-cycle-v0_3. Manifest validation ok=true, source_count=4, field_target_count=12, pair_count=12, outside-target diff all zero.


## Evidence Fields

- command: PYTHONPATH=. uv run --with pytest --with pymupdf --with pillow python -m pytest tests/test_insurance_fds_real_submission_cycle.py -q
- exit_code: 0
- artifact_path: J:/PortableApps/genai/tests/test_insurance_fds_real_submission_cycle.py
- verified_at: 2026-06-08T06:36:10+09:00

- command: PYTHONPATH=. uv run --with pymupdf --with pillow python scripts/insurance_fds_real_submission_cycle.py --output-root data/insurance-fds-generated/real-submission-bbox-cycle-v0_3
- exit_code: 0
- artifact_path: J:/PortableApps/genai/data/insurance-fds-generated/real-submission-bbox-cycle-v0_3/manifests/real_submission_bbox_local_substitution_manifest.json
- verified_at: 2026-06-08T06:36:10+09:00
