# Handoff

Changed files:
- scripts/insurance_fds_case1_real_document_collector.py
- tests/test_insurance_fds_case1_real_document_collector.py
- data/insurance-fds-generated/five-case-dataset-ko/케이스1_정상_실손보험_청구문서_사진_수집/실제외부문서_원본보관_v0_1/

Next steps:
1. Perform visual/human review of the 5 external PDFs.
2. Search and acquire additional real external document/image examples for prescription, pharmacy receipt, diagnosis certificate, admission/discharge confirmation, outpatient confirmation, medical opinion, and operation confirmation.
3. Build OCR/KIE field-coordinate manifests only after strict real-document and privacy gates pass.
