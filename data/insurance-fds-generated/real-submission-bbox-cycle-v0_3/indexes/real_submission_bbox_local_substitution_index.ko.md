# 실손보험 실제 제출서류 기반 bbox 국소치환 v0.3

이 산출물은 보험회사 청구서 양식이 아니라 병원/약국 제출 증빙서류 PDF/공개 샘플을 원본으로 사용한다.
Case 1 원본 preview에서 PyMuPDF word bbox로 라벨을 찾고, 라벨 오른쪽 value bbox에 가명 값을 채운 뒤 같은 bbox만 AF 값으로 국소치환했다.

- manifest: `data\insurance-fds-generated\real-submission-bbox-cycle-v0_3\manifests\real_submission_bbox_local_substitution_manifest.json`
- contact sheet: `data\insurance-fds-generated\real-submission-bbox-cycle-v0_3\indexes\real_submission_bbox_local_substitution_contact_sheet.png`
- source_count: 4
- field_target_count: 12
- pair_count: 12
- validation_ok: True

## 실제 외부 제출서류 원본

| source_id | 문서유형 | 출처 | fields | preview | 원본 |
|---|---|---|---:|---|---|
| REAL-SUB-0001 | 약제비 계산서ㆍ영수증 | official_statutory_form | 4 | REAL-SUB-0001__page1.png | REAL-SUB-0001__법령정보센터_약제비_계산서ㆍ영수증_별지_서식.pdf |
| REAL-SUB-0002 | 진료비 계산서ㆍ영수증 | official_statutory_form | 4 | REAL-SUB-0002__page1.png | REAL-SUB-0002__법령정보센터_간이_외래_진료비_계산서ㆍ영수증_별지_서식.pdf |
| REAL-SUB-0003 | 진료비 세부산정내역서 | quasi_official_public_form | 3 | REAL-SUB-0003__page1.png | REAL-SUB-0003__라이나생명_공개_진료비_세부산정내역_서식_PDF.pdf |
| REAL-SUB-0005 | 약제비 계산서ㆍ영수증 | public_sample_form | 3 | REAL-SUB-0005__page1.png | REAL-SUB-0005__공개_약제비계산서_영수증_샘플_PDF.pdf |

## 동일좌표 국소치환 pair

| pair_id | 문서유형 | 필드 | bbox_px | NO -> AF | outside_diff | 이유 |
|---|---|---|---|---|---:|---|
| REAL-SUB-0001-FIELD-01 | 약제비 계산서ㆍ영수증 | 환자 성명 | [424, 361, 729, 394] | 가명김서연 -> 가명박민준 | 0 | 동일 bundle 내 환자명 불일치 |
| REAL-SUB-0001-FIELD-02 | 약제비 계산서ㆍ영수증 | 조제일 | [570, 361, 874, 394] | 2026-05-13 -> 2026-05-28 | 0 | 처방전 발행일보다 조제일이 비정상적으로 뒤로 이동 |
| REAL-SUB-0001-FIELD-03 | 약제비 계산서ㆍ영수증 | 약제비 | [775, 259, 1080, 319] | 22,400 -> 122,400 | 0 | 약제비 합계가 처방/조제 항목 합계와 충돌 |
| REAL-SUB-0002-FIELD-01 | 진료비 계산서ㆍ영수증 | 환자 성명 | [448, 196, 752, 228] | 가명김서연 -> 가명박민준 | 0 | 동일 bundle 내 환자명 불일치 |
| REAL-SUB-0002-FIELD-02 | 진료비 계산서ㆍ영수증 | 진료 | [856, 130, 1145, 191] | 2026-05-13 -> 2026-05-18 | 0 | 세부내역서/통원확인서 진료일자와 불일치 |
| REAL-SUB-0002-FIELD-03 | 진료비 계산서ㆍ영수증 | 진료비 총액 | [308, 575, 612, 607] | 187,500 -> 287,500 | 0 | 급여+비급여 합산액과 총진료비가 충돌 |
| REAL-SUB-0003-FIELD-01 | 진료비 세부산정내역서 | 환자 성명 | [124, 173, 555, 205] | 가명김서연 -> 가명박민준 | 0 | 동일 bundle 내 환자명 불일치 |
| REAL-SUB-0003-FIELD-02 | 진료비 세부산정내역서 | 진료일 | [561, 173, 1020, 205] | 2026-05-13 -> 2026-05-18 | 0 | 영수증 진료일자와 세부내역 진료일자 불일치 |
| REAL-SUB-0003-FIELD-03 | 진료비 세부산정내역서 | 비급여 | [124, 226, 555, 252] | 129,000 -> 329,000 | 0 | 비급여 항목이 총액/영수증과 충돌 |
| REAL-SUB-0005-FIELD-01 | 약제비 계산서ㆍ영수증 | 환자 성명 | [698, 495, 1179, 555] | 가명김서연 -> 가명박민준 | 0 | 동일 bundle 내 환자명 불일치 |
| REAL-SUB-0005-FIELD-02 | 약제비 계산서ㆍ영수증 | 조제일 | [698, 561, 1179, 575] | 2026-05-13 -> 2026-05-28 | 0 | 처방전 발행일보다 조제일이 비정상적으로 뒤로 이동 |
| REAL-SUB-0005-FIELD-03 | 약제비 계산서ㆍ영수증 | 약제비 | [698, 598, 1179, 611] | 22,400 -> 122,400 | 0 | 약제비 합계가 처방/조제 항목 합계와 충돌 |

## 실패 후보

| source_id | title | error |
|---|---|---|
| REAL-SUB-0004 | 남동구 보건소 공개 외래/입원 진료비 계산서ㆍ영수증 PDF | <urlopen error [WinError 10054] 현재 연결은 원격 호스트에 의해 강제로 끊겼습니다> |
