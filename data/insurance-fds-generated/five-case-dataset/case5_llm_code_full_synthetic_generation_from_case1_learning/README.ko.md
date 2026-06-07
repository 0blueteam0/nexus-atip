# CASE5 - Case 1 학습 기반 LLM/코딩도구 전체 문서 생성

case_family: `case5_llm_code_full_synthetic_generation_from_case1_learning`

## 아주 쉬운 설명

Case 1에서 확인한 한국어 필드와 문서 구조를 배운 뒤, LLM/코딩도구가 새 문서를 처음부터 생성하는 케이스다. 단, 생성물 범위에 한정한다.

## 이 폴더에 들어갈 것

- 파일명은 반드시 `CASE5_case5_llm_code_full_synthetic_generation_from_case1_learning_...` 로 시작합니다.
- 문서 이미지에 보이는 필드명은 한국어 필드 기준입니다.
- manifest 내부 key는 영문이어도 되지만, 이미지에 노출되는 청구 문서 필드는 한국어 필드여야 합니다.
- 이미지 픽셀 안에 합성/모델학습/제출불가 문구 금지.
- 검은 박스, 큰 흰색 덮개, 비현실적 블록 금지.
- case 라벨은 이미지 안이 아니라 manifest/파일명/디렉터리명에만 둡니다.

## 대표 한국어 필드

- 환자명
- 생년월일
- 진료일자
- 요양기관명
- 진단명
- 질병분류기호
- 진료비 총액
- 본인부담금
- 비급여금액
- 청구금액
- 보험금 지급계좌
- 청구인
- 연락처

## 금지사항

- 영문 필드명 문서를 생성하지 않는다.
- Case 1에서 확인되지 않은 임의 문서 구조를 주력으로 만들지 않는다.
- 생성물 이미지에 모델학습용/합성데이터 표시를 넣지 않는다.
- Case 5를 전체 전략의 중심으로 두지 않는다.

## 예시 파일명

- `CASE5_case5_llm_code_full_synthetic_generation_from_case1_learning_NO_0001_claim_form.png`
- `CASE5_case5_llm_code_full_synthetic_generation_from_case1_learning_AF_0001_amount_mismatch_bundle.ko.json`
- `case5_llm_code_full_synthetic_generation_from_case1_learning/generated_manifest.jsonl`
