# CASE4 - 실제/공식 문서 구조 grounding 기반 생성형AI 위변조 번들

case_family: `case4_real_grounded_genai_tamper_generation`

## 아주 쉬운 설명

실제 또는 공식 문서 구조와 보험 청구 업무규칙을 근거로, 문서 한 장이 아니라 청구 번들 전체의 불일치를 만들고 학습한다.

## 이 폴더에 들어갈 것

- 파일명은 반드시 `CASE4_case4_real_grounded_genai_tamper_generation_...` 로 시작합니다.
- 문서 이미지에 보이는 필드명은 한국어 필드 기준입니다.
- manifest 내부 key는 영문이어도 되지만, 이미지에 노출되는 청구 문서 필드는 한국어 필드여야 합니다.
- 이미지 픽셀 안에 합성/모델학습/제출불가 문구 금지.
- 검은 박스, 큰 흰색 덮개, 비현실적 블록 금지.
- case 라벨은 이미지 안이 아니라 manifest/파일명/디렉터리명에만 둡니다.

## 대표 한국어 필드

- 보험금 청구금액
- 진료비 총액
- 본인부담금
- 비급여금액
- 진료일자
- 입원일자
- 퇴원일자
- 진단명
- 질병분류기호
- 처방일자
- 약품명
- 요양기관명

## 금지사항

- 공식/실제 구조 grounding 없이 아무 문서나 상상 생성하지 않는다.
- 단일 이미지 자연스러움만 보고 통과시키지 않는다.
- 문서 간 일관성 라벨 없이 생성하지 않는다.

## 예시 파일명

- `CASE4_case4_real_grounded_genai_tamper_generation_AF_0001_bundle_manifest.ko.json`
- `CASE4_case4_real_grounded_genai_tamper_generation_AF_0001_medical_receipt.png`
- `case4_real_grounded_genai_tamper_generation/bundles.jsonl`
