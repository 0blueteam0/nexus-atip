# Evidence Units

- command: bg2 background process
  exit_code: 0
  artifact_path: outputs/real_web_claim_sources_bg2_20260605/collection_summary.json
  evidence: candidate_count=203, downloaded_count=0, pre_download_reject_count=35, rejected_after_ocr_vision_count=14

- command: manifest status aggregation
  exit_code: 0
  evidence: cataloged_page_candidate=80, low_keyword_relevance_or_negative_terms=60, non_document_or_placeholder_asset=24, rejected_after_ocr_vision=14, downloaded_but_not_valid_image=9, download_error=5

- command: image/page distribution aggregation
  exit_code: 0
  evidence: image_url=99, page_only=104, pdf_url=0

- command: PYTHONPATH=src python -m pytest tests/test_real_web_source_collector.py -q
  exit_code: 0
  evidence: 9 passed in 0.30s

- command: live URL quoting/fetch probe
  exit_code: 0
  evidence: quoted Korean path URL; FETCH_OK 76969 bytes JPEG
