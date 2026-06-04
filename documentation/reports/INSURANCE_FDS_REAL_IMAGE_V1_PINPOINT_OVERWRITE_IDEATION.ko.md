# 보험 FDS real-image-redteam-v1 핀포인트 위변조 테스트 데이터 아이데이션

> 상태: ideation + execution blueprint
> 기준 데이터셋: `data/insurance-fds-generated/real-image-redteam-v1`
> 폐기 기준: v3 계열 산출물은 실제 이미지 원본/정본 기준 좌표 보존에 실패한 버전으로 간주하고, 후속 수정 기준에서 제외한다.
> 목적: 실제 보험/의료 문서 이미지 후보에서 원본 좌표계를 보존한 채, 방어적 FDS 적대 테스트용 AF 샘플을 만들기 위한 모델 조합과 검증 체계를 설계한다.

---

## 1. 핵심 결론

`real-image-redteam-v1`이 방향상 맞다. 이 버전은 공개 실제 이미지 후보에서 파생된 NO/AF 구조와 source lineage를 이미 갖고 있다. 다만 현재 AF 생성 방식은 세밀한 필드 교체가 아니라, deterministic 비율 좌표에 큰 흰색 rectangle을 덮고 텍스트를 올리는 방식이다.

따라서 다음 버전은 새 synthetic template 계열이 아니라 `real-image-redteam-v1`의 후보 이미지와 manifest를 그대로 기준으로 삼아야 한다.

추천 새 타깃 이름:

```text
data/insurance-fds-generated/real-image-redteam-v1-pinpoint-overwrite
```

또는 기존 v1을 직접 고치지 않고 검증 가능한 파생본으로 만들 경우:

```text
real-image-redteam-v1.1-pinpoint-overwrite
```

가장 중요한 원칙:

```text
AF는 paired NO 이미지의 좌표계를 절대 재구성하지 않는다.
AF는 paired NO 이미지를 복사한 뒤, 검증된 target field polygon/mask 영역만 교체한다.
문서 전체 재렌더링, 임의 비율 box, shifted overlay, layout 재배치, 새 template 렌더링은 금지한다.
```

---

## 2. 현재 v1에서 문제가 되는 지점

확인 파일:

```text
scripts/insurance_fds_real_image_redteam_generator.py
```

문제 함수:

```python
def tamper_box_for(index: int, image: Image.Image) -> tuple[int, int, int, int]:
    zones = [
        (int(width * 0.18), int(height * 0.18), int(width * 0.62), int(height * 0.23)),
        ...
    ]
    return zones[index % len(zones)]


def overlay_tamper(image, scenario, scenario_index):
    box = tamper_box_for(scenario_index, out)
    draw.rectangle(box, fill=(252, 252, 248), outline=(80, 80, 80), width=2)
    draw.text((box[0] + 8, box[1] + 4), text, ...)
```

문제 요약:

1. target field를 실제 OCR/KIE로 찾지 않는다.
2. 이미지 크기 비율 기반 임의 zone을 사용한다.
3. 원본 필드 값의 실제 bbox/polygon을 기준으로 하지 않는다.
4. 큰 흰색 패치와 경계선을 추가하므로 실제 필드 교체가 아니라 눈에 띄는 overlay다.
5. NO/AF가 같은 source 후보에서 왔다는 lineage는 있으나, 같은 capture profile의 paired NO를 복사해서 AF를 만든다는 보장은 약하다.
6. mask는 “진짜 바뀐 픽셀”보다 “임의 overlay box”를 나타낸다.

contact sheet 시각 확인에서도 AF 샘플은 원본 필드 내부의 세밀 교체라기보다, 문서 위/중간에 큰 박스가 얹힌 형태로 보인다.

---

## 3. 목표 데이터 계약

각 AF record는 최소한 아래 필드를 가져야 한다.

```json
{
  "dataset_id": "AF_REAL_PINPOINT_0001",
  "paired_no_dataset_id": "NO_REAL_DERIVED_0001",
  "source_dataset_id": "NO_REAL_PUBLIC_IMAGE_0001",
  "source_image_path": "...",
  "paired_no_image_path": "images/NO/NO_REAL_DERIVED_0001.png",
  "af_image_path": "images/AF/AF_REAL_PINPOINT_0001.png",
  "target_field": {
    "field_family": "총진료비/본인부담금/청구금액",
    "original_text": "87,500",
    "mutated_text": "287,500",
    "bbox_xyxy": [x1, y1, x2, y2],
    "polygon_xy": [[x1, y1], [x2, y2], [x3, y3], [x4, y4]],
    "detection_source": "ocr_layout_ensemble",
    "confidence": 0.92
  },
  "overwrite_policy": {
    "coordinate_policy": "paired_no_exact_polygon_overwrite",
    "layout_reconstruction_allowed": false,
    "whole_document_rerender_allowed": false,
    "allowed_pixel_change_region": "target_field_mask_plus_tolerance"
  },
  "validation": {
    "outside_mask_changed_pixels": 0,
    "target_mask_positive_pixels": 1234,
    "ocr_before_after_checked": true,
    "vision_qa_passed": true
  }
}
```

---

## 4. 모델 조합 아이데이션

### A안: 안정형 MVP - OCR/KIE + SAM 계열 + OpenCV/Pillow deterministic overwrite

권장 우선순위: 1순위

구성:

1. OCR/Text detection
   - PaddleOCR PP-OCRv4/PP-OCRv5 계열
   - EasyOCR fallback
   - Tesseract fallback, 한국어 traineddata가 있을 때만
2. Layout/field candidate detection
   - LayoutParser/Detectron2 PubLayNet 계열 fallback
   - DocLayout-YOLO 또는 YOLO 문서 layout detector 후보
   - 표/셀 검출은 OpenCV line detection + contour 분석 병행
3. Vision pointing/segmentation
   - SAM 2 또는 SAM 계열: OCR bbox를 prompt box로 넣어 text region mask 정제
   - GroundingDINO + SAM: “금액”, “진료일자”, “수진자명” 같은 label prompt 후보 탐색
4. Text erasure/background repair
   - OpenCV inpaint 또는 LaMa 계열 inpainting
   - 문서 배경은 대부분 흰색/스캔 노이즈이므로 diffusion보다 deterministic inpaint가 우선
5. Replacement rendering
   - 원본 OCR crop에서 font size, stroke thickness, baseline, foreground color를 추정
   - 같은 polygon 내부에 fake value만 렌더링
   - Korean/number font는 system font 후보를 ranking하여 원본 crop과 SSIM/edge similarity가 가장 가까운 것을 선택

장점:
- 좌표 보존이 가장 쉽다.
- 재현성이 높다.
- 테스트 작성이 쉽다.
- 생성 결과가 “방어적 label/mask”로 명확하다.

단점:
- 고급 사진/복잡 배경에서는 inpaint 품질이 낮을 수 있다.
- 필드 검출 정확도는 OCR 품질에 의존한다.

### B안: 고정밀 모델 ensemble - OCR + KIE VLM + SAM/Florence-2 검증

권장 우선순위: 2순위

구성:

1. OCR 엔진 2개 이상으로 후보 생성
   - PaddleOCR + EasyOCR
2. VLM 기반 field grounding
   - Qwen2.5-VL, InternVL, GPT-4o/4.1 vision류 API, Claude vision류 API, Gemini vision류 API 중 사용 가능한 모델
   - 입력: 문서 이미지 + OCR 후보 + 찾을 필드명
   - 출력: field candidate bbox/polygon + confidence + 근거
3. Florence-2 / GroundingDINO류 open-vocabulary detector
   - “total amount field”, “date field”, “patient name field” 같은 prompt로 후보 박스 생성
4. SAM 계열 mask refinement
   - bbox를 polygon/mask로 정제
5. deterministic overwrite
   - 실제 pixel edit는 여전히 OpenCV/Pillow에서 수행
6. VLM QA
   - 생성 후 “바뀐 부분이 target field 내부뿐인지”, “큰 overlay가 없는지”, “문서 레이아웃이 그대로인지”를 자동 검수

장점:
- 필드 찾기 실패율이 낮다.
- 실제 영수증/진단서/청구서처럼 서식 다양성이 큰 이미지에 강하다.
- 사람 검수 전 자동 후보 scoring이 가능하다.

단점:
- API 모델 사용 시 비용/재현성/데이터 반출 이슈가 있다.
- VLM bbox는 hallucination 가능성이 있으므로 OCR/pixel 검증이 반드시 필요하다.

### C안: diffusion/inpainting 고급형 - SDXL/FLUX/Photoshop류 inpaint는 배경 복원에만 제한

권장 우선순위: 보조, 기본 생성 경로 아님

구성:

1. target mask는 OCR/SAM으로 이미 확정한다.
2. diffusion 모델은 target text 제거 후 배경 복원에만 사용한다.
3. 새 텍스트는 diffusion이 생성하지 않는다.
4. 새 텍스트는 deterministic renderer가 넣는다.
5. ControlNet/Reference/low-denoise 조건을 사용하더라도, document layout을 새로 만들게 하면 안 된다.

가능 후보:
- SDXL inpaint
- FLUX Fill/Kontext류 고급 image editing 모델
- LaMa/cleanup.pictures류 object removal 계열
- ComfyUI workflow로 mask-bound inpaint만 수행

금지:
- “금액을 287,500으로 자연스럽게 바꿔줘” 같은 end-to-end 이미지 생성 prompt
- 문서 전체 img2img 재생성
- 텍스트 의미를 diffusion 모델에 맡기는 방식
- 로고/직인/서명/실제 개인정보 재생성

장점:
- 배경/스캔 노이즈가 복잡한 경우 지움 흔적이 줄어든다.

단점:
- diffusion은 텍스트/숫자 재현이 불안정하다.
- layout drift와 hallucination 위험이 크다.
- 좌표/내용 검증 없이는 FDS gold label로 쓰면 안 된다.

### D안: human-in-the-loop QA형 - 모델이 후보를 만들고 사람이 승인

권장 우선순위: 실제 공개 이미지 후보에는 필수

구성:

1. 자동 OCR/KIE/SAM으로 후보 필드 bbox 생성
2. contact sheet 또는 HTML review UI 생성
3. 사람 또는 VLM reviewer가 승인/거절
4. 승인된 bbox만 AF 생성
5. validation JSON에 reviewer와 근거 저장

장점:
- 실제 공개 이미지의 PII/저작권/필드 오검출 위험을 낮춘다.

단점:
- 완전 자동화보다 느리다.

---

## 5. 추천 최종 아키텍처

```text
real-image-redteam-v1 source candidates
  -> NO capture derivative 생성 또는 기존 NO 선택
  -> OCR ensemble
  -> field candidate registry
  -> VLM/SAM pinpoint reviewer
  -> target_field_contract.json
  -> paired NO image copy
  -> target polygon erase/inpaint
  -> deterministic fake text render
  -> mask + diff validation
  -> OCR roundtrip validation
  -> VLM visual QA
  -> AF_REAL_PINPOINT_* dataset
```

핵심은 “모델은 좌표를 찾고 검증하는 역할”, “실제 픽셀 교체는 deterministic하게 통제된 코드가 수행”하는 분업이다.

---

## 6. 필드 포인팅 전략

### 6.1 OCR 기반 anchor 찾기

보험/의료 문서는 라벨-값 구조가 많다. 따라서 아래 순서로 찾는다.

1. OCR tokens 수집
2. label token 탐색
   - `수진자명`, `환자명`, `성명`, `생년월일`, `진료일자`, `발급일`, `총진료비`, `본인부담금`, `비급여`, `청구금액`, `영수증번호`, `질병분류기호`
3. label의 오른쪽/아래/같은 row에서 value candidate 탐색
4. table cell 구조가 있으면 row/column relation으로 보정
5. amount/date/name/code regex로 value 검증
6. bbox를 polygon으로 확장/축소하여 실제 글자 영역 mask 생성

### 6.2 SAM 기반 mask 정제

OCR bbox는 보통 사각형이다. 실제 편집 mask는 다음이 더 좋다.

1. OCR bbox를 prompt box로 SAM에 입력
2. mask 후보 중 text stroke/field background와 가장 일치하는 것을 선택
3. mask를 dilation 1~3px 하여 anti-aliasing 영역 포함
4. mask bounds를 field cell 내부로 clamp

### 6.3 VLM 기반 semantic QA

VLM에게 직접 편집을 맡기지 말고 QA에 쓴다.

질문 예:

```text
이 문서에서 '총진료비' 값 영역만 표시되어 있는가?
표 전체나 다른 행이 포함되었는가?
빨간 mask가 금액 숫자 영역 밖으로 많이 벗어났는가?
```

출력은 pass/fail + 이유 + bbox confidence만 저장한다.

---

## 7. 교체 렌더링 전략

### 7.1 숫자/날짜 필드

우선순위가 가장 높다. 탐지 label도 명확하다.

1. 원본 crop에서 글자색 추정: dark pixel median
2. font size 추정: OCR box height 또는 connected component height
3. baseline 추정: crop 내 dark pixel lower envelope
4. 배경 제거: inpaint 또는 local background sampling
5. mutated fake value 렌더링
6. bbox 안에 들어가지 않으면 값 후보를 다시 선택하거나 font size 축소
7. outside-mask diff 0 또는 tolerance 이하 확인

### 7.2 한글 이름/진단명 필드

숫자보다 어렵다. 초기 MVP에서는 다음 제한을 둔다.

1. fake name/value만 사용
2. 원본 text width와 비슷한 길이의 fake value 선택
3. 너무 긴 진단명은 multiline 또는 crop overflow 위험이 있어 보류
4. OCR roundtrip에서 기대 값이 인식되지 않으면 reject

### 7.3 line item 삽입

가장 어렵다. 기존 row/line 구조를 바꾸면 좌표 보존이 깨지므로 MVP에서는 “기존 line value 교체”만 허용한다.

금지:
- 새 row 삽입
- 표 전체 재배치
- totals 영역 자동 재계산 없이 항목만 추가

허용:
- 기존 row의 금액/급여구분/항목명만 같은 cell polygon에서 교체

---

## 8. 검증 게이트

필수 validation:

1. lineage
   - 모든 AF는 paired NO를 가진다.
   - paired NO와 AF의 width/height가 같다.
2. coordinate
   - target field bbox/polygon은 paired NO 좌표계 기준이다.
   - AF field bbox == paired NO target bbox.
3. pixel diff
   - changed pixels outside target mask + tolerance == 0 또는 설정 이하.
   - target mask positive pixels > 0.
4. OCR roundtrip
   - NO crop OCR은 original_text와 충분히 일치한다.
   - AF crop OCR은 mutated_text와 충분히 일치한다.
5. visual QA
   - 큰 흰색 rectangle, 외곽선, shifted overlay가 없어야 한다.
   - 문서 전체 layout hash/perceptual hash 변화가 target 외부에서 없어야 한다.
6. privacy/license
   - source는 여전히 quarantine/review 상태로 둔다.
   - 실제 PII가 crop에 있으면 mutation 대상에서 제외하거나 redaction review 필요.

---

## 9. 구현 우선순위

### Phase 0: 기존 v1 문제 고정 테스트

파일 후보:

```text
tests/test_insurance_fds_real_image_pinpoint_overwrite.py
```

테스트:

1. `test_should_not_use_ratio_based_tamper_box_for_pinpoint_pipeline`
2. `test_should_require_paired_no_for_every_af_pinpoint_record`
3. `test_should_reject_large_overlay_rectangle_outside_target_mask`
4. `test_should_preserve_image_size_and_external_pixels`
5. `test_should_store_target_field_contract`

### Phase 1: field candidate registry 생성

새 파일 후보:

```text
scripts/insurance_fds_real_image_field_pointer.py
```

출력:

```text
data/insurance-fds-generated/real-image-redteam-v1-pinpoint-overwrite/field-candidates/*.json
```

내용:
- OCR tokens
- label anchors
- value candidates
- bbox/polygon
- confidence
- rejection reason

### Phase 2: pinpoint overwrite generator

새 파일 후보:

```text
scripts/insurance_fds_real_image_pinpoint_overwrite.py
```

역할:
- 기존 v1 NO image를 paired source로 선택
- field candidate를 target으로 선택
- 해당 polygon만 erase/inpaint
- fake value render
- AF image/mask/manifest 저장

### Phase 3: validator

새 파일 후보:

```text
scripts/insurance_fds_real_image_pinpoint_validator.py
```

검증:
- pair lineage
- same size
- outside mask pixel diff
- OCR crop before/after
- visual QA placeholder

### Phase 4: review artifact

출력:

```text
indexes/pinpoint_pair_contact_sheet.png
indexes/pinpoint_review.html
validation/pinpoint_validation.json
manifests/pinpoint_pair_manifest.json
```

---

## 10. 모델 선택 권고

현재 요구에는 “고급 이미지 생성 모델”보다 “문서 필드 포인팅 + 검증 가능한 국소 편집”이 중요하다.

권장 기본 조합:

```text
PaddleOCR or EasyOCR
+ OpenCV table/line/cell detection
+ SAM/SAM2 mask refinement
+ deterministic OpenCV/Pillow inpaint/render
+ VLM QA optional
```

고급 옵션:

```text
GroundingDINO/Florence-2: open-vocabulary field candidate 보조
Qwen2.5-VL/InternVL/GPT-4o-class vision: semantic bbox QA 보조
LaMa/SDXL/FLUX inpaint: text 제거 후 배경 복원 보조
```

주의:

```text
diffusion/FLUX/SDXL에 새 문서나 새 숫자를 직접 생성시키면 안 된다.
그 모델들은 배경 복원에만 제한하고, 실제 값 렌더링은 deterministic renderer가 해야 한다.
```

---

## 11. 안전/윤리 경계

이 설계는 방어적 FDS 적대 테스트와 탐지 모델 hardening을 위한 것이다.

허용:
- fake value 기반 synthetic AF
- source lineage와 quarantine 상태 보존
- target mask/gold label 생성
- detector evaluation

금지:
- 실제 개인정보 재현/보존
- 실제 기관 로고/직인/서명을 사실적으로 재생성하는 목적의 모델 사용
- 실사용 가능한 위조 절차 문서화
- 문서 전체를 새롭게 위조 생성하는 end-to-end prompt 사용

---

## 12. 즉시 실행 가능한 다음 작업

1. v1 기준 pinpoint 테스트를 먼저 작성한다.
2. 현재 `overlay_tamper()` 방식은 기존 v1 legacy로 유지하되, 새 pinpoint pipeline에서는 사용 금지한다.
3. source NO 이미지 2~3개만 대상으로 OCR field candidate registry를 만든다.
4. 금액/날짜 필드만 MVP로 선택한다.
5. paired NO copy -> mask erase -> fake text render -> validation까지 닫는다.
6. 성공하면 이름/진단명/KCD 코드로 확장한다.

최초 MVP 성공 기준:

```text
AF_REAL_PINPOINT >= 5
paired NO lineage 100%
same image size 100%
outside target mask changed pixels == 0 또는 명시 tolerance 이하
large overlay detector pass
OCR after crop에서 mutated fake value 확인
contact sheet에서 shifted box 없음
```
