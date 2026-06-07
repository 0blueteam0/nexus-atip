# CASE1 - 정상 실손보험 청구 문서/사진 수집

case_family: `case1_normal_claim_document_collection`

## 아주 쉬운 설명

보험사에 실제로 제출하는 정상 서류와 사진의 범위를 정하고 모으는 단계다.

## 이 폴더에 들어갈 것

- 파일명은 반드시 `CASE1_case1_normal_claim_document_collection_...` 로 시작합니다.
- 문서 이미지에 보이는 필드명은 한국어 필드 기준입니다.
- manifest 내부 key는 영문이어도 되지만, 이미지에 노출되는 청구 문서 필드는 한국어 필드여야 합니다.
- 이미지 픽셀 안에 합성/모델학습/제출불가 문구 금지.
- 검은 박스, 큰 흰색 덮개, 비현실적 블록 금지.
- case 라벨은 이미지 안이 아니라 manifest/파일명/디렉터리명에만 둡니다.

## 대표 한국어 필드

- 환자명
- 생년월일
- 진료일자
- 발행일자
- 요양기관명
- 사업자등록번호
- 영수증번호
- 진단명
- 질병분류기호
- 진료비 총액
- 본인부담금
- 비급여금액
- 청구금액
- 입원일자
- 퇴원일자
- 처방일자
- 약품명

## 금지사항

- 정상 문서 수집 없이 바로 LLM 생성부터 시작하지 않는다.
- 실제 개인정보 원본을 학습용 이미지로 그대로 승격하지 않는다.
- 이미지에 합성데이터/모델학습용 문구를 넣지 않는다.

## 예시 파일명

- `CASE1_case1_normal_claim_document_collection_NO_0001_medical_receipt.png`
- `CASE1_case1_normal_claim_document_collection_NO_0001_fields.ko.json`
- `case1_normal_claim_document_collection/manifest.jsonl`
