# CASE3 - Case 1 수집 문서 기반 AI/코딩도구 국소 위변조

case_family: `case3_ai_code_local_tamper_from_case1`

## 아주 쉬운 설명

Case 1에서 모은 정상 문서를 바탕으로 AI나 코드가 특정 필드만 정교하게 바꾸는 케이스다.

## 이 폴더에 들어갈 것

- 파일명은 반드시 `CASE3_case3_ai_code_local_tamper_from_case1_...` 로 시작합니다.
- 문서 이미지에 보이는 필드명은 한국어 필드 기준입니다.
- manifest 내부 key는 영문이어도 되지만, 이미지에 노출되는 청구 문서 필드는 한국어 필드여야 합니다.
- 이미지 픽셀 안에 합성/모델학습/제출불가 문구 금지.
- 검은 박스, 큰 흰색 덮개, 비현실적 블록 금지.
- case 라벨은 이미지 안이 아니라 manifest/파일명/디렉터리명에만 둡니다.

## 대표 한국어 필드

- 청구금액
- 진료비 총액
- 본인부담금
- 비급여금액
- 진료일자
- 진단명
- 질병분류기호
- 약품명
- 입원일자
- 퇴원일자

## 금지사항

- 전체 문서를 새로 생성하지 않는다.
- Case 1과 무관한 임의 template 위에서만 만들지 않는다.
- 필드 위치가 밀리거나 문서 레이아웃이 바뀌면 통과시키지 않는다.

## 예시 파일명

- `CASE3_case3_ai_code_local_tamper_from_case1_AF_0001_claim_amount.png`
- `CASE3_case3_ai_code_local_tamper_from_case1_AF_0001_ocr_before_after.ko.json`
- `case3_ai_code_local_tamper_from_case1/pairs.jsonl`
