---
title: 실손보험 FDS 합성 데이터 생성 파이프라인 v1
created_at: 2026-06-04T16:12:00+09:00
project: insurance-fds-data
status: implemented_seed_v1
artifact_root: data/insurance-fds-generated/demo-v1
---

# 실손보험 FDS 합성 데이터 생성 파이프라인 v1

## 1. 목적

실손보험 청구서류 위조탐지 FDS를 고도화하려면 단순히 영수증 이미지만 모으는 것으로는 부족하다. 실제 운영 탐지는 다음 다층 증거를 함께 봐야 한다.

- 문서 이미지의 레이아웃/폰트/압축/복사 영역 이상
- OCR 결과의 필드 단위 정합성
- 영수증, 진료비 세부내역서, 처방전, 보험금 청구서 간 cross-document 정합성
- 청구자, 기관, 영수증 번호, 진료일, 발급일, 청구일의 시계열/그래프 이상
- 실제 공개 사례(FK), 정상 데이터(NO), 합성 이상(AF)의 라벨 정책 일관성

따라서 이번 v1은 한 가지 생성 도구에 의존하지 않고, 동일한 합성 원천 필드를 네 가지 생성 방식으로 내보낸다.

## 2. 생성 방식

| 방식 | 산출물 | 목적 | 다음 단계 도구 |
|---|---|---|---|
| structured_json | `structured/NO`, `structured/AF` | OCR/KIE/룰엔진/그래프 이상탐지 학습용 정형 데이터 | Python, SQLite, LangGraph, rule engine |
| html_template | `html/NO`, `html/AF` | 브라우저 렌더링, PDF/PNG 변환, DOM bbox 추출 | Playwright, WeasyPrint |
| svg_template | `svg/NO`, `svg/AF` | 좌표가 명확한 벡터 문서, bbox/mask 기준 | CairoSVG, resvg, Inkscape |
| diffusion_prompt_pack | `prompts/NO`, `prompts/AF` | ComfyUI/diffusers 연계용 안전 prompt contract | ComfyUI, diffusers, ControlNet |

## 3. v1 구현 파일

- 생성기: `scripts/insurance_fds_synthetic_generator.py`
- 테스트: `tests/test_insurance_fds_synthetic_generator.py`
- 실제 생성 output: `data/insurance-fds-generated/demo-v1`
- 라벨 기준표 JSON: `data/insurance-fds-generated/demo-v1/labels/insurance_fds_af_labeling_standard.json`
- 라벨 기준표 Markdown: `data/insurance-fds-generated/demo-v1/labels/INSURANCE_FDS_AF_LABELING_STANDARD.md`
- manifest: `data/insurance-fds-generated/demo-v1/manifests/generated_manifest.json`
- split manifest: `data/insurance-fds-generated/demo-v1/manifests/split_manifest.json`

## 4. 라벨 기준 핵심

### Prefix

- `NO`: 정상 문서 또는 정상 합성 문서. 업무 규칙이 통과되어야 한다.
- `FK`: 공개 판례/보도/수사자료/공개 위조 데이터셋 기반 추상 라벨. 실제 원문 PII는 저장하지 않는다.
- `AF`: 방어적 탐지 목적으로 만든 합성 이상/위변조 데이터. seed, 레시피, 라벨 증거를 기록한다.

### AF taxonomy v1

| Label | 탐지 관점 |
|---|---|
| AF_AMOUNT_INFLATION | 청구금액/본인부담금/세부항목 합계 불일치 |
| AF_CROSSDOC_DATE_CONFLICT | 진료일, 발급일, 청구일 순서 충돌 |
| AF_PROVIDER_ID_MISMATCH | 기관명/기관 ID 문서 간 불일치 |
| AF_DUPLICATE_RECEIPT_REUSE | 동일 영수증 번호/fingerprint 반복 |
| AF_ITEM_INSERTION | 세부내역 항목 삽입으로 합계 또는 정책 규칙 충돌 |
| AF_FONT_LAYOUT_ANOMALY | 특정 필드 영역 폰트/정렬/간격 이상 |
| AF_COMPRESSION_REGION_ANOMALY | 특정 영역 압축/노이즈 특성 불일치 |
| AF_COPYMOVE_FIELD_REGION | 방어적 mask가 붙은 copy-move 계열 영역 이상 |

## 5. QA Gate

v1 생성기는 아래를 테스트로 확인한다.

- CLI 실행 시 NO/AF 산출물 생성
- 네 가지 generation method 생성: structured_json, html_template, svg_template, diffusion_prompt_pack
- AF 라벨 기준표에 문서/필드/이미지포렌식/cross-document/claim_behavior 레벨 포함
- AF 샘플에 field_ref, evidence_type, severity, business_rule_checks, mask_layers 포함
- seed가 같으면 split manifest가 재현 가능

실행 명령:

```bash
pytest tests/test_insurance_fds_synthetic_generator.py -q
python scripts/insurance_fds_synthetic_generator.py --output data/insurance-fds-generated/demo-v1 --count-per-template 2 --seed 20260604
```

## 6. MCP/에이전트 확장 권장안

현재 v1은 로컬 Python 생성기로 구현했다. 다음 단계에서 MCP를 붙이면 아래 구조가 적합하다.

| MCP/Agent | 역할 | 안전 설정 |
|---|---|---|
| filesystem MCP | data/insurance-fds-*와 documentation/llm-wiki만 읽고 쓰기 | allowlist 경로 제한 |
| sqlite MCP | 생성 manifest, split, claim_group_id, duplicate 검증 DB | synthetic 데이터만 적재 |
| Playwright MCP | HTML 템플릿을 실제 PNG/PDF로 렌더링하고 bbox 추출 | 외부 사이트 자동 제출 금지 |
| Firecrawl/fetch MCP | 공식 출처 URL과 공개 사례 URL 갱신 | robots/약관/라이선스 기록 |
| OCR MCP 또는 local OCR agent | 생성 PNG/PDF OCR round-trip 평가 | 실제 PII 감지 시 격리 |
| ComfyUI MCP 또는 HTTP wrapper | 승인된 workflow JSON으로 배경/스캔 질감만 다양화 | 실제 로고/서명/직인 모방 금지 |
| Label QA agent | 라벨 누락, schema 불일치, split leakage 검수 | FK는 원문 PII 저장 금지 |

## 7. 다음 구현 단위

1. Playwright 렌더러 추가
   - HTML을 PNG/PDF로 변환
   - DOM 좌표 기반 bbox를 field_annotations에 병합

2. PyMuPDF/Pillow 후처리 추가
   - PDF/PNG round-trip
   - blur, JPEG compression, perspective, scanner noise 등 degradation recipe 기록

3. OCR round-trip 평가 추가
   - EasyOCR/Tesseract/PaddleOCR 중 사용 가능한 도구부터 연결
   - OCR field accuracy와 rule fail reason을 manifest에 기록

4. SQLite registry 추가
   - generated_manifest를 SQLite에 적재
   - claim_group_id split leakage와 receipt_no duplicate를 쿼리로 검증

5. FK 공개 사례 보강
   - 판례/보도/감독자료 URL 기반 FK case abstraction 추가
   - 실제 원문/PII는 저장하지 않고 taxonomy와 탐지 포인트만 저장

## 8. 금지 사항

- 실제 환자명, 주민등록번호, 전화번호, 주소, 계좌번호 저장 금지
- 실제 병원 로고, 실제 직인, 실제 의사 서명 원본 사용 금지
- 실제 위조 수행 절차를 재현 가능하게 설명하는 문서 생성 금지
- 공개 데이터셋 라이선스 확인 전 재배포 금지
- FK 공개 사례에서 피해자/환자 식별 가능 정보 저장 금지
