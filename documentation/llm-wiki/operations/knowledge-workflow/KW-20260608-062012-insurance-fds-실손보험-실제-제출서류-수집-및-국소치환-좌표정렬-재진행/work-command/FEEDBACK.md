# Feedback

User correction was accepted: previous cycle failed because it did not acquire actual submission documents and could not locate local substitution positions. This cycle addressed both by collecting external PDFs and deriving target bboxes from PDF words or rendered pixels.


## Evidence Fields

- command: PYTHONPATH=. uv run --with pytest --with pymupdf --with pillow python -m pytest tests/test_insurance_fds_real_submission_cycle.py -q
- exit_code: 0
- artifact_path: J:/PortableApps/genai/tests/test_insurance_fds_real_submission_cycle.py
- verified_at: 2026-06-08T06:36:10+09:00

- command: PYTHONPATH=. uv run --with pymupdf --with pillow python scripts/insurance_fds_real_submission_cycle.py --output-root data/insurance-fds-generated/real-submission-bbox-cycle-v0_3
- exit_code: 0
- artifact_path: J:/PortableApps/genai/data/insurance-fds-generated/real-submission-bbox-cycle-v0_3/manifests/real_submission_bbox_local_substitution_manifest.json
- verified_at: 2026-06-08T06:36:10+09:00
