# Handoff

## 변경 파일

- `scripts/insurance_fds_camera_image_generator.py`
- `tests/test_insurance_fds_camera_image_generator.py`
- `data/insurance-fds-generated/camera-v1/**`
- `documentation/analysis/insurance-fds-camera-image-data-differentiation.ko.md`
- `requirements.txt`에 `Pillow==12.2.0` 추가

## 검증

- `pytest tests/test_insurance_fds_synthetic_generator.py tests/test_insurance_fds_camera_image_generator.py -q` -> 8 passed.
- `python scripts/insurance_fds_camera_image_generator.py --source-root data/insurance-fds-generated/demo-v1 --output data/insurance-fds-generated/camera-v1 --variants-per-document 3 --seed 20260604` -> 48 items.

## 남은 작업

1. OCR roundtrip validator 추가.
2. ComfyUI health check 및 dry-run smoke test.
3. 공개 보험금 청구서 양식 crawler seed list 구축.
4. FK_CASE_ABSTRACT taxonomy 및 coverage matrix 생성.

## 주의

전체 `pytest tests -q`는 이번 변경과 무관한 기존 collection error 2건 때문에 실패했다.
