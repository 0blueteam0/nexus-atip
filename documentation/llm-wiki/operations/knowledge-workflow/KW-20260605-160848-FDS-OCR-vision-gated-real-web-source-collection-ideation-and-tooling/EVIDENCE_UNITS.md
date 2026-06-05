# Evidence Units

- command: python import check for OCR/vision modules, exit_code=0.
- command: winget install external OCR binaries, exit_code=5, blocker=Access is denied.
- command: pytest tests/test_real_web_source_collector.py -q, exit_code=0, result=6 passed.
- command: PYTHONPATH=src pytest tests/test_real_web_source_collector.py tests/test_stg_local_tamper.py -q, exit_code=0, result=8 passed.
- artifact: outputs/real_web_claim_sources_ocr_vision_smoke/collection_summary.json.
- artifact: documentation/analysis/fds-real-web-source-ocr-vision-collection-strategy.md.
