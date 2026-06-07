# Tasks

- root-cause: completed; reproduced dependency/download/text-layer/local-diff failures.
- real-source-collection: completed; 4 external/public submission PDFs promoted, 1 remote source failed with WinError 10054.
- ocr-kie-bbox: completed; 12 field targets extracted by PyMuPDF word bbox and image table/text-band fallback.
- local-substitution: completed; 12 NO/AF same-bbox pairs generated.
- verify-deliver: completed after tests, manifest, contact sheet, and workflow evidence.


## Evidence Fields

- command: PYTHONPATH=. uv run --with pytest --with pymupdf --with pillow python -m pytest tests/test_insurance_fds_real_submission_cycle.py -q
- exit_code: 0
- artifact_path: J:/PortableApps/genai/tests/test_insurance_fds_real_submission_cycle.py
- verified_at: 2026-06-08T06:36:10+09:00

- command: PYTHONPATH=. uv run --with pymupdf --with pillow python scripts/insurance_fds_real_submission_cycle.py --output-root data/insurance-fds-generated/real-submission-bbox-cycle-v0_3
- exit_code: 0
- artifact_path: J:/PortableApps/genai/data/insurance-fds-generated/real-submission-bbox-cycle-v0_3/manifests/real_submission_bbox_local_substitution_manifest.json
- verified_at: 2026-06-08T06:36:10+09:00
