# AGENT_ROSTER

- command: `PYTHONPATH=src pytest tests/test_real_web_source_collector.py tests/test_stg_local_tamper.py -q`
- exit_code: 0
- verified_at: 2026-06-05T16:20:00+09:00
- artifact_path: `A3Work/FDSWork/GPTWork_FDS/new type/claim_fds_v3_pipeline_package/claim_fds_v3_pipeline/scripts/collect_real_insurance_claim_sources.py`
- source_path: `A3Work/FDSWork/GPTWork_FDS/new type/claim_fds_v3_pipeline_package/claim_fds_v3_pipeline/tests/test_real_web_source_collector.py`

이번 작업은 raw_images 과수집을 막기 위해 OCR/vision 게이트를 추가한 작업이다. 검색 결과의 페이지 관련성이 높더라도 이미지가 판다, 인물, 프로필, 로고, 아이콘, 스톡 이미지이면 raw_images에 들어가지 않도록 선차단한다. 다운로드가 필요한 경우에도 staging_images에 먼저 둔 뒤 OCR 한국어 청구문서 필드 신호와 문서형 이미지 비율을 통과해야 raw_images로 이동한다. 이 파일은 knowledge workflow close gate용 work-command 기록이며, 세부 증거는 EVIDENCE_UNITS.md와 WORKLOG.md에 연결된다.
