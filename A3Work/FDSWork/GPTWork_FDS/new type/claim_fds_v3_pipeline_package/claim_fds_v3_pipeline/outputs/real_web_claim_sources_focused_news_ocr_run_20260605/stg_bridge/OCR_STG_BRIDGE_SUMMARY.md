# OCR-STG Bridge Summary

## 결론

- 이번 focused web run은 실제 웹 이미지 URL과 local raw image를 기준으로 OCR/STG 후보를 만들었다.
- OpenCV document profiler는 129건 중 자동 최종 승격 가능한 document-like accepted 후보를 만들지 않았다.
- RapidOCR profiler는 129건 중 76건에서 OCR text를 잡았고, field hint가 있는 후보는 6건이었다.
- OCR-STG bridge는 field bbox가 있는 7개 NO manifest row를 생성했지만, 모두 `quarantine_requires_manual_pii_review` 상태로 유지한다.
- 이 manifest는 최종 AF 생성용 확정 원본이 아니라, 웹 실제 원본 기반 후보를 수동 검수/가명처리 후 STG에 연결하기 위한 중간 산출물이다.

## 사용자 정책 반영

- 이미지 픽셀에는 마스크, 블럭, 합성전용 박스, 실제 제출불가 문구를 넣지 않는다.
- 필요한 처리는 익명화/가명처리와 같은 좌표 내 값 치환이다.
- 원본은 웹에서 가져온 실제 이미지 URL과 provenance를 유지한 후보만 사용한다.
- OCR 원문값은 기본 저장하지 않고 redacted text, field hint, bbox, confidence, source URL만 사용한다.

## 이번 산출물

- STG bridge manifest: `outputs/real_web_claim_sources_focused_news_ocr_run_20260605/stg_bridge/ocr_stg_manifest.v1.jsonl`
- row_count: 7
- skipped_no_fields: 122
- field counts:
  - claimed_amount: 122
  - treatment_date: 110
- 실제 manifest term scan 결과: 마스크/블럭/합성전용/제출불가/not-for-submission 관련 픽셀/manifest label 없음

## 구현 개선

`claim_fds_synth.ocr_stg_bridge.pair_label_value_tokens()`를 추가했다.

목적:
- `총진료비` 같은 label token 자체를 바꾸지 않는다.
- 같은 행 오른쪽의 value-like token bbox를 찾아 `total_medical_fee`, `treatment_date` 같은 위변조 의도 필드의 값 좌표로 승격한다.
- 값 좌표만 STG 후보로 남기며 raw value는 저장하지 않는다.

현재 focused run에서는 label-value pair source가 실제로 발생하지 않았고, 금액/날짜 후보는 OCR redacted token bbox 기반으로만 생성되었다. 이는 실제 OCR 결과에 label/value가 같은 행으로 충분히 잡힌 의료 양식 후보가 아직 부족하다는 뜻이다.

## 다음 판단

1. 자동 AF 생성으로 진행하지 말 것.
2. 먼저 실제 웹 원본 후보 중 의료 영수증/진료비 세부내역서 양식성이 높은 이미지를 추가 확보하거나 수동 검수로 승격한다.
3. 승격 조건은 다음을 모두 만족해야 한다.
   - provenance URL 존재
   - 문서형 레이아웃 확인
   - OCR field hint 존재
   - PII 원문 미저장 또는 가명처리 확인
   - 같은 좌표 내 값 치환 가능
4. 검수 후에만 `privacy_review_status`를 quarantine에서 pseudonymized/approved 상태로 바꾸고 STG 생성에 투입한다.
