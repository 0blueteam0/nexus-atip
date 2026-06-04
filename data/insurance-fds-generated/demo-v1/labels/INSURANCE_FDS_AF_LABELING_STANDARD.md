# 실손보험 FDS AF 합성 데이터 라벨링 기준표

이 문서는 합성 이상(AF) 데이터를 방어적으로 생성하고 검수하기 위한 기준표이다.
실제 개인정보, 실제 병원 로고, 실제 서명/직인, 실제 환자 의료 원문은 금지한다.

## Prefix 규칙

- NO: 정상 문서 또는 정상 합성 문서. 위변조 라벨은 없어야 하며 필드 정합성이 통과되어야 한다.
- FK: 실제 공개 판례/보도/수사자료/공개 위조 데이터셋에서 추상화한 위조·사기 사례. 원문 PII는 저장하지 않는다.
- AF: 방어적 탐지 목적으로 생성한 합성 이상/위변조 데이터. 생성 레시피와 seed를 반드시 기록한다.

## 라벨 taxonomy

| Label | Level | 기준 | 탐지 대상 |
|---|---|---|---|
| AF_AMOUNT_INFLATION | field, cross_document | 청구금액, 본인부담금, 비급여 금액 등 금액 필드가 관련 항목 합계 또는 타 문서와 맞지 않는 합성 이상. | numeric_consistency, cross_doc_amount_match, ocr_field_validation |
| AF_CROSSDOC_DATE_CONFLICT | cross_document | 진료일, 처방일, 청구일, 발급일의 순서가 업무 규칙과 충돌하는 합성 이상. | temporal_rule_engine, claim_sequence_anomaly |
| AF_PROVIDER_ID_MISMATCH | field, cross_document | 기관명, 요양기관기호 형식, 사업자번호 namespace가 문서 간 불일치하는 합성 이상. | provider_master_match, entity_resolution |
| AF_DUPLICATE_RECEIPT_REUSE | claim_behavior, cross_document | 동일 합성 영수증 번호/문서 fingerprint가 서로 다른 청구 컨텍스트에서 반복되는 이상. | duplicate_detection, graph_link_analysis |
| AF_ITEM_INSERTION | field, document | 세부산정내역서에 항목이 삽입되어 영수증 합계와 충돌하거나 정책상 비정상 패턴을 만드는 합성 이상. | line_item_kie, policy_rule_engine |
| AF_FONT_LAYOUT_ANOMALY | image_forensic | 특정 필드 영역의 폰트, 정렬, baseline, 자간, 행간이 주변 영역과 다른 합성 시각 이상. | layout_anomaly, font_consistency |
| AF_COMPRESSION_REGION_ANOMALY | image_forensic | 문서 일부 영역의 압축/노이즈/블러 특성이 주변 영역과 다른 합성 포렌식 이상. | ela_like_signal, noise_residual, region_consistency |
| AF_COPYMOVE_FIELD_REGION | image_forensic, field | 방어적 탐지 학습을 위해 필드 영역 재사용 흔적을 mask로 표시한 합성 copy-move 계열 이상. | copy_move_segmentation, tamper_mask_detection |

## QA Gate

- JSON schema parse
- prefix/file-name consistency
- pii_status validation
- tamper label evidence completeness
- NO sample business rules pass
- AF sample has at least one failing business or forensic rule
- split leakage check by claim_group_id
- generation_seed recorded

## 금지 데이터

- 실제 주민등록번호
- 실제 전화번호/주소/계좌번호
- 실제 병원 로고/직인/의사서명 원본
- 실제 환자 의료 원문
- 실제 위조 수행 절차를 단계별로 재현하는 설명