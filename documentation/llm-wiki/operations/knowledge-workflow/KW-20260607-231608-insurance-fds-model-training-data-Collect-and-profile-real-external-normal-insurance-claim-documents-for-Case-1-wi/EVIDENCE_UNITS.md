# Evidence Units

1. command: `PYTHONPATH=. uv run --with pytest pytest tests/test_insurance_fds_case1_real_document_collector.py -q`
   exit_code: 2
   evidence: RED failed with ModuleNotFoundError for missing collector.

2. command: `PYTHONPATH=. uv run --with pytest pytest tests/test_insurance_fds_case1_real_document_collector.py tests/test_insurance_fds_five_case_coverage.py -q`
   exit_code: 0
   evidence: 13 passed after implementation.

3. command: `PYTHONPATH=. uv run --with pymupdf python scripts/insurance_fds_case1_real_document_collector.py --registry ... --output-dir ...`
   exit_code: 0
   artifact_path: data/insurance-fds-generated/five-case-dataset-ko/케이스1_정상_실손보험_청구문서_사진_수집/실제외부문서_원본보관_v0_1/케이스1_정상청구문서_실제외부문서_수집프로파일_v0_1.ko.json
   evidence: 5 official external PDF candidates downloaded, 0 failures.

4. command: `PYTHONPATH=. uv run --with pytest --with pymupdf pytest tests/test_insurance_fds_case1_real_document_collector.py tests/test_insurance_fds_five_case_coverage.py -q && python - <<'PY' ...`
   exit_code: 0
   evidence: 13 passed; downloaded_count=5, failed_count=0, generated_document_count=0, validation_ok=true.

verified_at: 2026-06-07T23:22:25
