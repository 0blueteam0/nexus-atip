# CASE2 - 기존 편집도구 기반 위변조 사례조사와 샘플화

case_family: `case2_traditional_editor_tamper_case_study`

## 아주 쉬운 설명

포토샵, PDF 편집기, 모바일 편집앱, 스캔앱 같은 도구로 실제 어떤 식의 조작이 가능한지 조사하고 그 흔적을 반영한 샘플을 만든다.

## 이 폴더에 들어갈 것

- 파일명은 반드시 `CASE2_case2_traditional_editor_tamper_case_study_...` 로 시작합니다.
- 문서 이미지에 보이는 필드명은 한국어 필드 기준입니다.
- manifest 내부 key는 영문이어도 되지만, 이미지에 노출되는 청구 문서 필드는 한국어 필드여야 합니다.
- 이미지 픽셀 안에 합성/모델학습/제출불가 문구 금지.
- 검은 박스, 큰 흰색 덮개, 비현실적 블록 금지.
- case 라벨은 이미지 안이 아니라 manifest/파일명/디렉터리명에만 둡니다.

## 대표 한국어 필드

- 진료비 총액
- 본인부담금
- 비급여금액
- 청구금액
- 진료일자
- 처방일자
- 요양기관명
- 환자명
- 진단명
- 질병분류기호

## 금지사항

- 실제 편집도구/사례조사 없이 임의 LLM 상상만으로 조작 유형을 만들지 않는다.
- 큰 흰색 박스나 검은 박스로 필드를 덮지 않는다.
- 이미지에 AF/합성/위조 같은 라벨을 직접 넣지 않는다.

## 예시 파일명

- `CASE2_case2_traditional_editor_tamper_case_study_AF_0001_amount_replace.png`
- `CASE2_case2_traditional_editor_tamper_case_study_AF_0001_labels.ko.json`
- `case2_traditional_editor_tamper_case_study/editor_tool_case_studies.ko.md`
