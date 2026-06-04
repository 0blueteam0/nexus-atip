# Worklog

1. 관련 스킬 로드: comfyui, ocr-and-documents, test-driven-development, writing-plans.
2. 기존 demo-v1 구조화 데이터와 생성기 구조 확인.
3. Pillow 미설치 확인 후 `python -m pip install pillow` 실행.
4. TDD RED: `tests/test_insurance_fds_camera_image_generator.py` 작성 후 4개 테스트 실패 확인. 실패 원인: `scripts/insurance_fds_camera_image_generator.py` 부재.
5. GREEN: 카메라 이미지 생성기 구현.
6. 관련 테스트 통과: `pytest tests/test_insurance_fds_camera_image_generator.py -q` -> 4 passed.
7. 실제 산출물 생성: `python scripts/insurance_fds_camera_image_generator.py --source-root data/insurance-fds-generated/demo-v1 --output data/insurance-fds-generated/camera-v1 --variants-per-document 3 --seed 20260604` -> 48 items.
8. Pillow deprecation warning 발견 후 histogram 기반 mask pixel count로 수정.
9. 공개 후보 URL 직접 접근성 확인: DocTamper, CORD, FUNSD, RVL-CDIP, MIDV-500, PaddleOCR, ComfyUI, ControlNet, Donut 등.
10. 참고 ChatGPT share 링크 접근 확인: 보험 FDS 데이터 레이어와 문서/이미지/디지털 채널 메타데이터 방향 확인.
11. 차별화 전략 문서 작성: `documentation/analysis/insurance-fds-camera-image-data-differentiation.ko.md`.
12. 관련 테스트 재검증: `pytest tests/test_insurance_fds_synthetic_generator.py tests/test_insurance_fds_camera_image_generator.py -q` -> 8 passed.
13. 전체 테스트 시도: `pytest tests -q` -> 기존 unrelated collection error 2건으로 실패.
