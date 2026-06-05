# Evidence Units

- command: background focused-post profiler
  exit_code: 0
  artifact_path: outputs/real_web_claim_sources_focused_news_ocr_run_20260605/ocr_profiles/ocr_profile_summary.json
  evidence: profile_count=129, nonempty_ocr_count=76, field_hint_count=6

- command: profile inspection
  exit_code: 0
  artifact_path: outputs/real_web_claim_sources_focused_news_ocr_run_20260605/document_profiles/real_web_document_profiles.jsonl
  evidence: DOC_PROFILES=129, automatic accepted_document_like_count=0

- command: PYTHONPATH=src python -m pytest tests/test_ocr_stg_bridge.py -q
  exit_code: 0
  evidence: 3 passed in 1.21s

- command: PYTHONPATH=src python -m pytest tests/test_ocr_stg_bridge.py tests/test_stg_local_tamper.py -q
  exit_code: 0
  evidence: 5 passed in 1.48s

- command: OCR-STG real run
  exit_code: 0
  artifact_path: outputs/real_web_claim_sources_focused_news_ocr_run_20260605/stg_bridge/ocr_stg_manifest.v1.jsonl
  evidence: row_count=7, skipped_no_fields=122, claimed_amount=122, treatment_date=110
