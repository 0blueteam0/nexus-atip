# WORKLOG

- 이전 보험 FDS 데이터 구축 세션을 검색해 중단 지점 확인: 사용자는 AF 위변조 데이터를 NO 정본과 같은 좌표/같은 위치에 넣어야 한다고 지적하고 중단함.
- `fraud-detection-data-engineering` skill 및 TDD skill을 로드함.
- v3.1 파이프라인 점검 결과, JSON bbox는 같지만 AF를 별도 렌더링/화질변환하므로 실제 픽셀 레벨의 paired NO 동일좌표 보장이 약하다는 결함 확인.
- RED: `tests/test_insurance_fds_exact_coordinate_pipeline.py` 작성 후, 새 모듈 부재로 실패 확인.
- GREEN: `scripts/insurance_fds_exact_coordinate_pipeline.py` 구현.
- v3.2 데이터셋 생성: NO 32, AF 32, pair 32.
- 좌표 검증: bbox mismatch 0, missing pair 0, pixel diff outside bbox 0.
- 전체 보험 FDS 테스트: 25 passed.
- contact sheet 생성 및 시각 검수 수행.
- 보고서 작성: `documentation/reports/INSURANCE_FDS_EXACT_COORDINATE_V3_2_REPORT.ko.md`.
- skill 보강: AF same-template tampering must rewrite exact paired NO bbox.
