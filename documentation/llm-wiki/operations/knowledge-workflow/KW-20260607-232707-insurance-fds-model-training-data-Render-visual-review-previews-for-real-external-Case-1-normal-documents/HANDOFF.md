# Handoff

Changed files/artifacts:
- scripts/insurance_fds_case1_real_document_collector.py
- tests/test_insurance_fds_case1_real_document_collector.py
- data/insurance-fds-generated/five-case-dataset-ko/케이스1_정상_실손보험_청구문서_사진_수집/실제외부문서_원본보관_v0_1/육안검수_프리뷰_v0_1/케이스1_정상청구문서_육안검수_프리뷰_v0_1.ko.json
- data/insurance-fds-generated/five-case-dataset-ko/케이스1_정상_실손보험_청구문서_사진_수집/실제외부문서_원본보관_v0_1/육안검수_프리뷰_v0_1/케이스1_정상청구문서_육안검수_프리뷰_인덱스_v0_1.ko.md
- data/insurance-fds-generated/five-case-dataset-ko/케이스1_정상_실손보험_청구문서_사진_수집/실제외부문서_원본보관_v0_1/육안검수_프리뷰_v0_1/preview_images/*.png

Next steps:
1. Human visual review of the five PNG previews.
2. Mark approved/rejected status in a separate review decision manifest.
3. Only approved public blank forms should proceed to OCR/KIE field-coordinate extraction.
