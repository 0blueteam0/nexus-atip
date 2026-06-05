# BG2 Real-Web Source Collection Zero-Download Analysis

## 실행 결과

명령:

`python scripts/collect_real_insurance_claim_sources.py --output-dir outputs/real_web_claim_sources_bg2_20260605 --max-queries 40 --per-query 6 --download-images --source-mode focused --firecrawl-mode trusted_seed --verification-mode ocr_vision --sleep-min 0.8 --sleep-max 1.6`

결과:

- query_count: 40
- candidate_count: 203
- downloaded_count: 0
- important_event_count: 0
- verification_mode: ocr_vision
- pre_download_reject_count: 35
- rejected_after_ocr_vision_count: 14
- manifest: `outputs/real_web_claim_sources_bg2_20260605/real_web_source_candidates.manifest.jsonl`

## 원인 판정

이번 run의 `downloaded_count=0`은 단일 오류가 아니라 아래 세 가지가 겹친 결과다.

1. 페이지 후보가 대부분이고 image_url이 없는 후보가 많음
   - manifest rows: 203
   - image_url 존재: 99
   - page-only 후보: 104
   - `cataloged_page_candidate`: 80

2. image_url이 있어도 대부분 로고, 썸네일, 블로그 대표 이미지, 배너, 포털 UI 이미지임
   - `rejected_or_low_priority:low_keyword_relevance_or_negative_terms`: 60
   - `rejected_or_low_priority:non_document_or_placeholder_asset...`: 24
   - `rejected_or_low_priority:non_document_visual_noise`: 11

3. OCR/vision gate가 실제 문서 필드 신호 부족 후보를 정상적으로 막음
   - `rejected_after_ocr_vision:ocr_vision_gate_failed`: 14
   - 대표 원인: OCR has_korean=false 또는 field_hint_count=0
   - 즉 OCR이 한국어 의료/보험 청구 문서 필드를 충분히 못 찾음

## 발견된 collector 개선점

1. 비ASCII image URL 다운로드 오류
   - bg2에서 `download_error:UnicodeEncodeError` 1건 발생
   - 원인: 한글 경로가 포함된 URL을 urllib Request에 그대로 넘김
   - 조치: `quote_url_for_request()`를 추가하여 path/query/fragment를 percent-encode하도록 수정
   - 실제 검증: KB Think 한글 경로 image URL fetch 성공, 76969 bytes JPEG 수신

2. 이미지 검증 실패 evidence 부족
   - bg2에서 `downloaded_but_not_valid_image:PermissionError` 9건 발생했지만 evidence가 `{}`라 원인 추적이 어려웠음
   - 조치: image validation exception type/message를 `verification_evidence_json`에 남기도록 수정

## 정책 준수

- 이번 분석/패치에서는 AF 이미지를 생성하지 않았다.
- 마스크, 블럭, 합성전용 박스, 실제 제출불가 문구를 이미지 픽셀에 추가하지 않았다.
- 실제 웹 원본 후보는 계속 quarantine/manual review 대상으로 유지한다.
- OCR 원문값은 저장하지 않고 signal/evidence 수준으로만 사용한다.

## 다음 실행 전략

다음 run은 단순 이미지 검색 확대가 아니라 page-only 후보에서 문서 이미지/PDF를 더 깊게 추출해야 한다.

권장 방향:

1. `cataloged_page_candidate` 중 HIRA/NHIS/FSS/보험사/병원 안내 페이지를 대상으로 page asset deep extraction 강화
2. PDF 후보는 이미지처럼 버리지 말고 `cataloged_pdf_candidate_quarantine`로 별도 보존 후 PyMuPDF/페이지 이미지화/OCR을 적용
3. OCR gate는 유지하되, 수집 단계에서는 `rejected_images` contact sheet 또는 rejected diagnostic sheet를 만들어 사람이 어떤 종류가 막혔는지 확인 가능하게 할 것
4. 승격 조건은 여전히 엄격하게 유지
   - provenance URL 존재
   - 실제 문서형 레이아웃
   - OCR/KIE field signal
   - PII/license 수동 검수
   - 같은 좌표 내 익명/가명 값 치환 가능

## 검증

- `PYTHONPATH=src python -m pytest tests/test_real_web_source_collector.py -q` -> 9 passed
- URL quoting live probe -> `FETCH_OK 76969` bytes JPEG
