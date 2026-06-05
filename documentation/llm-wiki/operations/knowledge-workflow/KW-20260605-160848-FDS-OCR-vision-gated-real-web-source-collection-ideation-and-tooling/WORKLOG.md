# Worklog

## command evidence

- command: `python -m pip install -U pymupdf pymupdf4llm transformers accelerate ultralytics layoutparser timm scikit-image --no-warn-script-location`
  - exit_code: 0
  - verified_at: 2026-06-05T16:10:00+09:00
  - artifact_path: Python environment
- command: `winget install ... Tesseract/Poppler/ImageMagick/Temurin JRE`
  - exit_code: 5
  - verified_at: 2026-06-05T16:12:00+09:00
  - failure: `0x80070005 : Access is denied`
- command: `python -m pip install -U marker-pdf --no-warn-script-location`
  - exit_code: 0
  - verified_at: 2026-06-05T16:18:00+09:00
  - artifact_path: marker/surya CLI in Hermes venv Scripts
- command: `python -m pip install -U openai==2.24.0 pyyaml==6.0.3 --no-warn-script-location`
  - exit_code: 0
  - verified_at: 2026-06-05T16:19:00+09:00
  - reason: restore Hermes Agent dependency after marker install conflict
- command: `pytest tests/test_real_web_source_collector.py -q`
  - exit_code: 0
  - verified_at: 2026-06-05T16:15:00+09:00
  - output: `6 passed in 0.10s`
- command: `PYTHONPATH=src pytest tests/test_real_web_source_collector.py tests/test_stg_local_tamper.py -q`
  - exit_code: 0
  - verified_at: 2026-06-05T16:20:00+09:00
  - output: `8 passed in 2.15s`
- command: `python scripts/collect_real_insurance_claim_sources.py --output-dir outputs/real_web_claim_sources_ocr_vision_smoke --max-queries 1 --per-query 2 --download-images --sleep-min 0 --sleep-max 0 --firecrawl-mode off --verification-mode ocr_vision`
  - exit_code: 0
  - verified_at: 2026-06-05T16:16:00+09:00
  - artifact_path: `outputs/real_web_claim_sources_ocr_vision_smoke/collection_summary.json`
