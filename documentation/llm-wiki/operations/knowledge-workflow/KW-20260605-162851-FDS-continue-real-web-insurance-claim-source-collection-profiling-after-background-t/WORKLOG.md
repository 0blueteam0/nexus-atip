# Worklog

- 2026-06-05T16:38:00.820839: Inspected completed collection and profile summaries. Existing broad run had 45 queries, 503 candidates, 287 downloaded, old profiler accepted 111 visually document-like candidates.
- Found false positives: hotels, tourism, food, stock, wallpaper, social/logo images accepted by shape-only profiler.
- Patched `scripts/profile_real_web_document_candidates.py` to reject legacy/unverified downloads by default unless collection_status is `downloaded_quarantine_ocr_vision_pass`; added context negative gate and stale accepted overlay cleanup.
- Added `tests/test_real_web_document_profiler.py`.
- Patched `run_demo.py` to stop generating tamper mask/overlay image files and to delete stale legacy demo mask/overlay files.
- Updated README output descriptions.
