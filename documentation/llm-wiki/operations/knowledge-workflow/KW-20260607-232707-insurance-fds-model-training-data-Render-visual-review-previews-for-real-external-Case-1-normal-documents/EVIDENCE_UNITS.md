# Evidence Units

1. command: `PYTHONPATH=. uv run --with pytest --with pymupdf pytest tests/test_insurance_fds_case1_real_document_collector.py -q`
   exit_code: 2
   evidence: RED import failure for missing preview API.

2. command: `PYTHONPATH=. uv run --with pytest --with pymupdf pytest tests/test_insurance_fds_case1_real_document_collector.py tests/test_insurance_fds_five_case_coverage.py -q`
   exit_code: 0
   evidence: 15 passed after preview implementation.

3. command: `PYTHONPATH=. uv run --with pymupdf python scripts/insurance_fds_case1_real_document_collector.py --mode visual-review --manifest ... --output-dir ...`
   exit_code: 0
   artifact_path: data/insurance-fds-generated/five-case-dataset-ko/케이스1_정상_실손보험_청구문서_사진_수집/실제외부문서_원본보관_v0_1/육안검수_프리뷰_v0_1/케이스1_정상청구문서_육안검수_프리뷰_v0_1.ko.json

4. command: final validation Python snippet
   exit_code: 0
   evidence: preview_count=5, failure_count=0, generated_document_count=0, validation_ok=true, existing_preview_files=5, preview_total_bytes=1057039.

5. visual check: `vision_analyze` on CASE1-SRC-0001__first_page.png
   evidence: preview visibly rendered as a structured 보험금청구서 page with HiLife/현대해상 branding and blank form fields; authenticity still requires provenance/human review.

verified_at: 2026-06-07T23:31:31
