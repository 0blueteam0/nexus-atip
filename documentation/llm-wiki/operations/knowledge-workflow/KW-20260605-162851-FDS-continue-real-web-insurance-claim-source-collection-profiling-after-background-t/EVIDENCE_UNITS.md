# Evidence Units

- command: `PYTHONPATH=src pytest tests/test_real_web_source_collector.py tests/test_real_web_document_profiler.py tests/test_stg_local_tamper.py -q`
  exit_code: 0
  result: `11 passed in 1.67s`
- command: `python scripts/profile_real_web_document_candidates.py --collection-dir outputs/real_web_claim_sources_run_20260605 --min-score 4.2 --max-items 1000`
  exit_code: 0
  result: accepted_document_like_count changed to 0 for the legacy broad run; context_reject_reason shows legacy_or_unverified_download_not_ocr_vision_passed.
- command: `python scripts/collect_real_insurance_claim_sources.py --output-dir outputs/real_web_claim_sources_ocr_vision_guard_smoke --max-queries 2 --per-query 2 --download-images --sleep-min 0 --sleep-max 0 --firecrawl-mode off --verification-mode ocr_vision`
  exit_code: 0
  result: 14 candidates, 0 downloaded, 8 pre-download rejects, 1 OCR/vision reject.
- command: `python run_demo.py` plus manifest check
  exit_code: 0
  result: manifest has no mask/overlay file keys; legacy v3_04_tamper_mask.png and v3_05_tamper_overlay.png absent.
