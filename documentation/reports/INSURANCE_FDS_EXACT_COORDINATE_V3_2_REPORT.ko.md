---
title: "보험 FDS 데이터 구축 #6 - 동일좌표 AF 위변조 v3.2 결과"
created_at: "2026-06-04"
project: "insurance-fds"
dataset_version: "insurance-fds-field-pseudonymized-v3.2-exact-coordinate-overwrite"
status: "validated"
verification_status: "tests_passed_and_coordinate_gate_passed"
---

# 보험 FDS 데이터 구축 #6 - 동일좌표 AF 위변조 v3.2 결과

## 1. 목적

이 작업은 사용자가 지적한 핵심 기준을 데이터 생성 규칙으로 고정하기 위한 것이다.

- NO 정본의 필드 좌표와 AF 위변조 필드 좌표는 반드시 같아야 한다.
- AF는 별도 박스, shifted box, 새로운 위치, 큰 오버레이로 만들면 안 된다.
- AF는 paired NO 정본 이미지 위에서 해당 필드 bbox만 같은 좌표에 다시 쓰는 방식이어야 한다.

## 2. 생성 버전

- 버전: `insurance-fds-field-pseudonymized-v3.2-exact-coordinate-overwrite`
- 루트 경로: `data/insurance-fds-generated/field-pseudonymized-v3.2-exact-coordinate-overwrite`
- 생성 방식: `copy_paired_no_image_then_overwrite_target_field_bbox_only`

## 3. 산출물 요약

| 항목 | 수량 |
|---|---:|
| NO 정본 이미지/JSON | 32 |
| AF 동일좌표 위변조 이미지/JSON | 32 |
| NO-AF pair | 32 |
| 좌표 검증 실패 | 0 |
| bbox 밖 pixel diff 실패 | 0 |

## 4. 핵심 파일

- 생성기: `scripts/insurance_fds_exact_coordinate_pipeline.py`
- 테스트: `tests/test_insurance_fds_exact_coordinate_pipeline.py`
- 데이터셋 메타: `data/insurance-fds-generated/field-pseudonymized-v3.2-exact-coordinate-overwrite/VERSION.json`
- pair manifest: `data/insurance-fds-generated/field-pseudonymized-v3.2-exact-coordinate-overwrite/manifests/pair_manifest.json`
- dataset manifest: `data/insurance-fds-generated/field-pseudonymized-v3.2-exact-coordinate-overwrite/manifests/dataset_manifest.json`
- 검증 결과: `data/insurance-fds-generated/field-pseudonymized-v3.2-exact-coordinate-overwrite/validation/exact_coordinate_validation.json`
- 시각 검수용 contact sheet: `data/insurance-fds-generated/field-pseudonymized-v3.2-exact-coordinate-overwrite/indexes/exact_coordinate_pair_contact_sheet.png`
- Excel index: `data/insurance-fds-generated/field-pseudonymized-v3.2-exact-coordinate-overwrite/indexes/field_level_index.xlsx`

## 5. pair 예시

첫 번째 pair는 `medical_receipt` 문서의 `total_medical_amount` 필드를 변조한다.

- NO: `NO_EXACT_COORD_0001`
- AF: `AF_EXACT_COORD_0001`
- bbox: `[805, 785, 1015, 827]`
- 원래 값: `75,200`
- 변조 값: `287,500`
- policy: `AF overwrites the exact same field bbox on the paired NO source image`

AF JSON에는 다음 근거가 들어간다.

- `paired_no_dataset_id`
- `paired_no_image_path`
- `paired_no_field_json_path`
- `tamper_evidence[].bbox`
- `tamper_evidence[].paired_no_bbox`
- `tamper_evidence[].coordinate_policy`
- `tamper_evidence[].overlay_or_shifted_box_used=false`

## 6. 검증 명령과 결과

```bash
pytest tests/test_insurance_fds_exact_coordinate_pipeline.py -q
# 2 passed in 4.56s
```

```bash
python scripts/insurance_fds_exact_coordinate_pipeline.py --template-cases 8
# counts: NO 32, AF 32, pairs 32
# validation: bbox_mismatch_count 0, missing_pair_count 0, pixel_diff_outside_bbox_count 0
```

```bash
pytest tests/test_insurance_fds_exact_coordinate_pipeline.py tests/test_insurance_fds_field_pseudonymized_pipeline.py tests/test_insurance_fds_public_image_collector.py tests/test_insurance_fds_real_image_redteam_generator.py tests/test_insurance_fds_camera_image_generator.py tests/test_insurance_fds_priority_pipeline.py tests/test_insurance_fds_synthetic_generator.py -q
# 25 passed in 41.66s
```

## 7. 시각 검수 결과

`exact_coordinate_pair_contact_sheet.png`를 통해 샘플 4개 pair를 확인했다.

- NO와 AF가 같은 layout을 유지한다.
- AF에서 바뀐 값은 해당 필드 칸 내부에 들어간다.
- 별도 shifted box나 큰 overlay rectangle은 보이지 않는다.

## 8. 남은 위험과 다음 단계

1. 현재 v3.2는 synthetic 표준양식 기반 동일좌표 gold label이다. 실제 공개 이미지 기반 OCR 좌표로 승격하려면 OCR/KIE 엔진을 붙여 실제 이미지 field bbox를 추출해야 한다.
2. scanner/mobile 화질 변환과 동일좌표 조건을 동시에 만족하려면 이미지 변환 matrix를 pair 단위로 공유하고 transformed bbox를 별도 기록해야 한다.
3. 다음 단계에서는 v3.2 방식을 실제 공개 후보 이미지에서 추출한 field bbox에 적용하되, 원본 PII를 그대로 쓰지 않고 가명값으로 같은 bbox에 재렌더링하는 파이프라인으로 확장하는 것이 좋다.
