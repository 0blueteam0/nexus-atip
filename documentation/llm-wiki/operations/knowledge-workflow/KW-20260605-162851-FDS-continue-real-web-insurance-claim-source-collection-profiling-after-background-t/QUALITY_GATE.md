# Quality Gate

## Status

PASS after remediation.

## Checks

1. Unit/regression tests
   - Command: `PYTHONPATH=src pytest tests/test_real_web_source_collector.py tests/test_real_web_document_profiler.py tests/test_stg_local_tamper.py -q`
   - Exit code: 0
   - Output: `11 passed in 1.67s`

2. Legacy broad collection re-profile
   - Command: `python scripts/profile_real_web_document_candidates.py --collection-dir outputs/real_web_claim_sources_run_20260605 --min-score 4.2 --max-items 1000`
   - Exit code: 0
   - Result: `accepted_document_like_count=0`; stale accepted overlay directory absent.

3. Fresh collector smoke
   - Command: `python scripts/collect_real_insurance_claim_sources.py --output-dir outputs/real_web_claim_sources_ocr_vision_guard_smoke --max-queries 2 --per-query 2 --download-images --sleep-min 0 --sleep-max 0 --firecrawl-mode off --verification-mode ocr_vision`
   - Exit code: 0
   - Result: `candidate_count=14`, `downloaded_count=0`, `pre_download_reject_count=8`, `rejected_after_ocr_vision_count=1`.

4. Demo artifact check
   - Command: `python run_demo.py` then manifest/file existence check
   - Exit code: 0
   - Result: manifest contains no mask/overlay keys; `v3_04_tamper_mask.png` and `v3_05_tamper_overlay.png` do not exist.

## Residual Risk

The old broad collection directory remains on disk as an unverified/noise audit artifact. It must not be used for training. Future useful data should come from the OCR/vision-gated collector or from verified original web document images with manual PII/license review.
