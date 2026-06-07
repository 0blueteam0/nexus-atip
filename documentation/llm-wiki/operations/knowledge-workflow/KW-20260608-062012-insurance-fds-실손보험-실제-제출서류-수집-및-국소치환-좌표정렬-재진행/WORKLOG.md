# Worklog

1. Loaded insurance-fds, OCR/document, systematic-debugging skills.
2. Reproduced prior failure shape:
   - default Python lacked fitz/Pillow/pytest.
   - early web downloads were unstable with WinError 10054 for some sources.
   - initial same-bbox drawing leaked anti-aliased pixels outside bbox.
   - text-layer 없는 PDF는 PyMuPDF word bbox가 0개라 field_target_count가 0이었다.
3. Implemented `scripts/insurance_fds_real_submission_cycle.py`.
4. Added `tests/test_insurance_fds_real_submission_cycle.py`.
5. Fixed local rewrite to render into a bbox-sized patch and paste only inside target bbox.
6. Added cache fallback for previously downloaded external PDFs.
7. Added image-table/text-band fallback for scanned/image PDFs without text layer.
8. Generated real-submission bbox cycle under `data/insurance-fds-generated/real-submission-bbox-cycle-v0_3`.
9. Ran tests and visual contact-sheet inspection.


## Evidence Fields

- command: PYTHONPATH=. uv run --with pytest --with pymupdf --with pillow python -m pytest tests/test_insurance_fds_real_submission_cycle.py -q
- exit_code: 0
- artifact_path: J:/PortableApps/genai/tests/test_insurance_fds_real_submission_cycle.py
- verified_at: 2026-06-08T06:36:10+09:00

- command: PYTHONPATH=. uv run --with pymupdf --with pillow python scripts/insurance_fds_real_submission_cycle.py --output-root data/insurance-fds-generated/real-submission-bbox-cycle-v0_3
- exit_code: 0
- artifact_path: J:/PortableApps/genai/data/insurance-fds-generated/real-submission-bbox-cycle-v0_3/manifests/real_submission_bbox_local_substitution_manifest.json
- verified_at: 2026-06-08T06:36:10+09:00
