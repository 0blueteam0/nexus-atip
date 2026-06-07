# Insurance FDS Four-Case Ideation and Quality Upgrade Plan

> For Hermes: planning/ideation only. Do not execute data generation from this plan until the user explicitly asks to proceed.

Goal: 실손보험 FDS 모델 개발을 위해 필요한 4가지 사례군을 실제 데이터, 전통 편집 위변조, 생성형 AI 기반 위변조, 실제 청구서류 기반 생성형 AI 위변조로 재분류하고, 기존 3번 중심 생성 작업을 단계적으로 고품질화하는 실행 전 아이데이션/계획을 고정한다.

Architecture: 기존 “처음부터 합성 문서 생성” 중심 흐름을 유지하되, 그것을 주축이 아니라 하나의 하위 축으로 내린다. 앞으로의 중심은 원본/정본 NO 확보, 실제 문서 좌표계/필드 이해, 국소치환 기반 AF 생성, 위변조 의도/사기 시나리오 라벨링, 모델 학습 목적별 데이터 균형으로 이동한다.

Tech Stack 후보: Python, Pillow/OpenCV, OCR/PaddleOCR/EasyOCR/Tesseract, KIE/Layout parser, SAM/SAM2류 segmentation, VLM field grounding, browser/web-source review, insurer/hospital/pharmacy/public-form source registry, manifest-driven dataset registry. 공개 데이터셋은 주 데이터 소스가 아니라 라벨 포맷·baseline·benchmark 참고용으로만 둔다.

Important user override: 이 프로젝트에서는 knowledge workflow gate를 사용하지 않는다. 사용자가 별도로 호출하기 전에는 `knowledge_workflow.py start/close`를 실행하지 않는다. 또한 불필요한 API call을 하지 않는다. 논문/데이터셋 API는 사용자가 요청했거나, 일반 웹/브라우저 방식으로는 필요한 근거를 얻을 수 없고 그 이유가 명확할 때만 사용한다.

Important interpretation correction: 이 작업은 사이버 시큐리티 문제가 아니라 실손보험 FDS 개발과 모델 학습용 데이터 구축 작업이다. 위변조 데이터는 악용 목적이 아니라 FDS 탐지·분류·localization·OCR/KIE consistency 학습을 위한 방어적 학습 데이터다. 오탐을 피하기 위해 security/red-team 프레임보다 insurance fraud detection dataset engineering 프레임으로 다룬다.

---

## 1. 방향 전환 판단

결론: 방향 전환이 필요하다. 단, 기존 작업을 폐기하는 전환이 아니라 “축 재배치”가 필요하다.

현재 확인된 기존 산출물은 아래 경향을 가진다.

1. `field-pseudonymized-v3.2-exact-coordinate-overwrite`는 동일좌표 조건을 만족하는 synthetic gold label에 가깝다.
2. `real-image-redteam-v1-pinpoint-overwrite`는 실제 이미지 후보 기반 국소치환 MVP로 방향은 맞지만, semantic OCR/KIE가 아직 약하다.
3. `camera-v1`은 제출 채널 현실성, 촬영/압축/흐림/조명 변형을 다루지만 실제 실손 청구 원본 데이터 자체의 폭은 아직 부족하다.
4. 기존 작업의 많은 부분은 “처음부터 문서를 만들어 위변조”하는 3번류 또는 synthetic template류에 치우쳤다.
5. 사용자가 요구한 FDS 모델에는 실제 청구 관련 문서 생태, 전통 편집 도구 위변조, 생성형 AI 위변조, 실제 서류 기반 생성형 위변조가 모두 필요하다.

따라서 다음 단계는 “더 많은 생성”이 아니라 다음 순서로 전환해야 한다.

- 먼저 데이터/사례 taxonomy를 4분류로 고정한다.
- 각 분류마다 NO/FK/AF와 fraud intent를 분리한다.
- 실제 청구서류의 문서 유형/필드/좌표/업무 규칙을 먼저 inventory한다.
- AF 생성은 전체 문서 재생성보다 paired NO 기반 국소치환을 기본값으로 둔다.
- 생성형 AI는 마지막에 “질감/촬영/배경/복잡한 국소 inpaint 고도화”로 붙인다.

---

## 2. 네 가지 사례군 재정의

### Case 1. 실제 실손보험 청구 관련 서류/이미지 데이터

목적: 정상 청구 생태와 실제 제출 채널 분포를 학습하기 위한 NO/참조 데이터.

포함 문서:

- 진료비 영수증
- 진료비 세부산정내역서
- 처방전
- 약제비 영수증
- 입퇴원확인서
- 진단서/소견서
- 통원확인서
- 보험금 청구서 양식
- 신분증/통장사본 등 부속 서류는 개인정보 위험 때문에 별도 격리 또는 제외

데이터 유형:

- 보험사/협회/공공기관 공개 양식 PDF/이미지
- 병원/약국/보험사 안내 페이지의 샘플/양식
- 공개 OCR/KIE 데이터셋 중 영수증/청구서/문서 양식에 가까운 것
- 실제 제출 채널을 모사한 촬영/스캔/압축 변형

필수 라벨:

- document_type
- source_type: public_template, public_sample, synthetic_reference, real_web_reference_quarantined
- privacy_state: no_pii, pseudonymized, pii_detected_quarantined
- capture_profile: scanner, mobile_camera_topdown, mobile_camera_oblique, scan_app, messenger_reupload
- OCR tokens, bbox, line/block hierarchy
- KIE fields: 날짜, 의료기관, 환자명/가명, 총액, 본인부담금, 급여/비급여, 처방/약제비, 발급번호 등
- business consistency fields: 청구일, 진료일, 금액 합계, 기관/사업자번호, 보험사 청구 항목

FDS 관점 사기 의도 라벨 후보:

- 정상 청구
- 중복 청구 위험
- 과다 청구 위험
- 날짜 불일치 위험
- 진료/약제 항목 불일치 위험
- 동일 문서 재사용 위험

주의:

- 실제 개인정보/실제 병원 로고/직인/서명은 무단 저장하지 않는다.
- 원본을 학습에 바로 넣지 않고 quarantine -> provenance/license/privacy gate -> derived/pseudonymized로 승격한다.

### Case 2. 기존 이미지/문서 편집도구를 이용한 위변조

목적: 포토샵, 스캔앱, PDF 편집기, 모바일 사진 편집 앱 등 전통 도구 기반 위변조 흔적을 학습한다.

위변조 방식:

- 금액 숫자 일부 수정: 75,200 -> 275,200
- 날짜 수정: 진료일/발급일 변경
- 병원명/약국명/사업자번호 교체
- 환자명/수진자명 교체
- 진료 항목 추가/삭제
- 표의 행 복사/붙여넣기
- 영수증 일부 crop 후 다른 문서에 붙이기
- 스캔 앱 자동보정 후 재압축으로 흔적 희석
- PDF 텍스트 레이어 편집 후 이미지 export
- 모바일 편집 앱으로 숫자/텍스트만 덧칠

필요한 조작 계층:

1. Pixel-level edit: copy-move, splicing, clone stamp, blur, smudge, white patch, local erase.
2. Document-layer edit: PDF text layer rewrite, vector text replacement, form field edit.
3. Capture-laundering: 편집 후 프린트-재촬영, 화면촬영, 메신저 재압축.
4. Manual annotation-like edit: 펜 글씨, 하이라이트, 체크 표시, 메모를 가장한 변경.

필수 라벨:

- tamper_tool_family: photoshop_like, pdf_editor, mobile_editor, scan_app, manual_markup
- tamper_operation: text_replace, digit_insert, row_copy_move, field_delete, splice, clone, inpaint_like_erase
- tamper_target_field
- tamper_mask
- original_value, mutated_value
- fraud_intent: amount_inflation, date_shift, patient_swap, provider_swap, duplicate_claim, coverage_eligibility_manipulation
- laundering_profile: none, print_scan, camera_recapture, jpeg_recompress, messenger_reupload

품질 기준:

- 모델 shortcut이 되는 검은 박스/합성전용 라벨/큰 경계선 금지.
- 실제 편집 도구가 남길 만한 edge/color/noise/compression mismatch를 별도 feature로 보존.
- 국소치환 결과는 paired NO와 크기/좌표계가 같아야 하며, 변경 픽셀은 target mask+tolerance 안에 있어야 한다.

### Case 3. LLM/코딩 도구/생성형 AI로 기존 실손보험 청구 이미지 등을 위변조

목적: 생성형 AI 또는 코딩 도구가 기존 이미지 위에서 field edit/inpaint/render를 수행하는 공격면을 방어적으로 모델링한다.

현 상태 판단:

- 기존 작업은 이 축을 많이 다뤘지만 품질이 낮았다.
- 낮은 품질의 주원인은 전체 문서 재렌더링, 임의 박스 overlay, semantic field 이해 부족, font/baseline/노이즈 매칭 부족, OCR roundtrip 검증 부재다.

개선 방향:

1. 생성형 AI가 전체 문서를 새로 만들게 하지 않는다.
2. 기존 NO 이미지를 paired source로 고정한다.
3. OCR/KIE/VLM으로 target field를 식별한다.
4. SAM/contour로 field mask를 정제한다.
5. deterministic erase/render 또는 낮은 denoise inpaint로 국소만 바꾼다.
6. 결과는 OCR before/after, outside-mask diff, VLM QA, forensic metrics로 검수한다.

공격/방어 시나리오:

- 코딩 도구로 특정 bbox를 찾아 금액만 자동 치환
- LLM이 문서 구조를 읽고 사기 의도에 맞는 값 조합을 제안
- diffusion inpaint가 숫자/날짜를 자연스럽게 바꿈
- VLM이 “어느 필드를 바꾸면 보험금이 올라가는지”를 찾는 공격
- OCR 결과를 보고 반복적으로 edit -> OCR pass까지 자동 보정

필수 라벨:

- genai_role: prompt_assisted, code_generated_edit, diffusion_inpaint, vlm_guided_field_selection, agentic_loop
- model_or_tool_family: local_script, llm_code, vlm, diffusion_inpaint, multimodal_agent
- prompt_intent_class: defensive_generation, fraud_like_redteam_simulation
- human_in_loop: none, review_only, field_selected_by_human
- edit_algorithm: deterministic_render, opencv_inpaint, lama_inpaint, diffusion_inpaint, img2img_low_denoise
- validation_loop_count

품질 상승 단계:

- L0: synthetic template, exact bbox, deterministic replacement. 좌표/manifest 테스트용.
- L1: real-image NO copy + dark-pixel/OCR token bbox + deterministic replacement. 현재 MVP와 유사.
- L2: OCR/KIE semantic field pointer + font/color/baseline matching.
- L3: SAM/refined mask + inpaint background repair + OCR roundtrip.
- L4: VLM-guided candidate selection + multi-engine OCR consensus + manual review queue.
- L5: camera-laundered AF: edit 후 촬영/압축/스캔앱 변형까지 paired transform으로 반영.
- L6: adversarial evaluation set: 모델이 놓치는 hardest cases만 선별.

### Case 4. 실제 청구서류를 바탕으로 생성형 AI가 위변조 생성

목적: 실제 청구서류/실제 공개 양식을 grounding으로 쓰되, 개인정보/저작권/위조 악용 위험을 통제하면서 realistic AF를 만든다.

Case 3과 차이:

- Case 3은 “생성형 AI가 기존 이미지를 위변조하는 도구/프로세스” 자체가 초점이다.
- Case 4는 “실제 청구서류의 레이아웃/필드/업무규칙을 seed로 삼아 생성형 AI가 AF 사례를 만들어내는 것”이 초점이다.

권장 구조:

1. 실제/공개 청구 양식에서 layout schema 추출.
2. 원본 이미지는 quarantine하고, 학습에는 derived schema/좌표/비식별 값만 사용.
3. 동일 layout에 pseudonymized NO를 먼저 생성.
4. fraud intent별 AF mutation plan을 만든다.
5. paired NO를 복사한 뒤 target field만 국소치환한다.
6. 필요 시 생성형 AI는 배경/촬영질감/노이즈/접힘/그림자만 강화한다.
7. 텍스트/숫자/기관명/직인 자체 생성은 deterministic 또는 allowlist 기반으로 제한한다.

사기 의도 taxonomy:

- 금액 증액: 본인부담금/총액/비급여 금액 조작
- 날짜 조작: 보장기간 안으로 진료일 이동
- 기관 조작: 보장 가능한 의료기관처럼 보이게 변경
- 환자/피보험자 조작: 수진자명 교체
- 항목 조작: 미보장 항목을 보장 항목처럼 변경
- 중복 청구: 같은 영수증을 다른 날짜/기관/금액으로 재사용
- 처방/진료 불일치 은폐: 처방전과 영수증의 날짜/기관/금액 관계 변경

필수 라벨:

- grounding_source_type: real_public_form, real_web_reference, public_dataset_reference, synthetic_schema_from_real_layout
- derivation_level: schema_only, pseudonymized_copy, local_edit_on_pseudonymized_copy
- pii_policy
- fraud_intent
- target_field_graph: 어떤 필드를 바꾸면 어떤 업무 규칙이 깨지는지
- consistency_constraints_before_after

---

## 3. 가장 중요한 설계 전환: “문서 생성”보다 “필드 이해 + 국소치환”

앞으로의 기본 생성 단위는 문서 전체가 아니라 field-level edit record여야 한다.

권장 record schema:

```json
{
  "case_family": "case2_traditional_edit | case3_genai_edit | case4_real_grounded_genai",
  "paired_no_dataset_id": "NO_...",
  "source_lineage": {
    "source_type": "public_template | synthetic | real_reference_quarantined",
    "license_state": "checked | pending | prohibited",
    "privacy_state": "no_pii | pseudonymized | quarantined"
  },
  "document_context": {
    "document_type": "medical_receipt",
    "capture_profile": "mobile_camera_oblique",
    "ocr_quality_bucket": "good | medium | hard"
  },
  "target_field": {
    "field_name": "total_medical_amount",
    "field_family": "amount",
    "original_text": "75,200",
    "mutated_text": "275,200",
    "bbox_xyxy": [0, 0, 0, 0],
    "polygon_xy": [],
    "mask_path": "...",
    "field_detection_source": "ocr_kie_consensus",
    "field_confidence": 0.0
  },
  "tamper_plan": {
    "fraud_intent": "amount_inflation",
    "tool_family": "traditional_editor | genai_inpaint | deterministic_local_render",
    "operation": "local_text_replace",
    "whole_document_rerender_allowed": false,
    "outside_mask_change_allowed": false
  },
  "validation": {
    "outside_mask_changed_pixels": 0,
    "ocr_before": "75,200",
    "ocr_after": "275,200",
    "layout_shift_score": 0.0,
    "visual_shortcut_reject": false,
    "review_status": "pending | pass | fail"
  }
}
```

---

## 4. 실제 서류 기반 국소치환 방법 상세 아이데이션

### 4.1 Field discovery

목표: 바꿀 필드가 어디인지 실제로 찾아야 한다.

단계:

1. 이미지 전처리: deskew, orientation detect, resize normalization, contrast normalization.
2. OCR token 추출: PaddleOCR 우선, EasyOCR/Tesseract fallback.
3. Token grouping: line, block, table cell 단위로 묶기.
4. Label-value relation 추정:
   - “총액”, “본인부담금”, “진료일”, “수진자”, “의료기관” 같은 label token 주변의 value token 탐색.
   - 표 구조에서는 같은 row/column 관계를 사용.
5. Field 후보 score:
   - regex score: 금액/날짜/사업자번호/전화번호 패턴
   - label proximity score
   - table alignment score
   - document type prior
   - OCR confidence
6. 후보 JSON 저장 후 사람 검수 또는 VLM QA로 승격.

### 4.2 Mask refinement

목표: 바꿀 글자/필드 영역만 mask로 잡아야 한다.

단계:

1. OCR bbox를 seed box로 사용.
2. crop 내부 dark-pixel/connected component로 실제 글자 영역 추출.
3. dilation을 아주 작게 적용해 anti-alias edge 포함.
4. SAM/SAM2 사용 가능 시 bbox prompt로 text region mask refinement.
5. mask가 너무 크면 reject:
   - image_area 대비 mask_area 상한
   - field bbox 대비 mask_area 상한
   - label 영역 침범 여부
6. mask와 bbox/polygon을 별도 artifact로 저장한다. mask를 이미지에 합성하지 않는다.

### 4.3 Background erase

목표: 기존 텍스트를 지워도 주변 종이/스캔 노이즈가 자연스러워야 한다.

우선순위:

1. 단색/밝은 배경: local median/background color fill.
2. 스캔 노이즈 배경: OpenCV inpaint 또는 주변 patch texture copy.
3. 표 선이 지나가는 영역: horizontal/vertical line restoration.
4. 복잡한 사진/그림자: LaMa/inpaint 후보.
5. diffusion inpaint는 마지막. denoise 낮게, mask 작게, 텍스트 hallucination 금지.

검증:

- erase 후 OCR이 원래 값을 읽지 않아야 한다.
- 배경이 큰 흰색 박스처럼 보이면 reject.
- 표 선/경계선이 끊기면 line restoration 실패로 reject.

### 4.4 Replacement rendering

목표: 새 값이 원래 문서의 font/color/baseline/spacing과 맞아야 한다.

단계:

1. 원본 crop에서 foreground color 추정.
2. 글자 높이, stroke width, baseline, 기울기 추정.
3. 사용 가능한 system font 후보를 ranking.
4. 숫자/한글/영문별 font fallback 구성.
5. mutated_text가 원래 bbox에 들어가는지 확인.
6. 들어가지 않으면 fraud scenario 자체를 조정한다. bbox 밖 확장 금지.
7. anti-aliasing, blur, JPEG loop를 원본 crop과 맞춘다.
8. 카메라 이미지라면 edit 후 전체 이미지가 아니라 crop 주변에만 미세 color/noise matching.

검증:

- bbox 밖 pixel diff 0 또는 tolerance 이하.
- OCR after가 mutated_text로 읽히는지 확인.
- 사람이 봤을 때 큰 overlay/경계선/마스크가 없어야 한다.

### 4.5 Consistency-aware mutation

목표: 단순 픽셀 위변조가 아니라 실손보험 사기 의도와 업무 규칙을 반영한다.

예:

- 총액을 올렸다면 본인부담금/급여/비급여 합계 관계가 깨질 수 있다. 일부 샘플은 “단일 필드만 조작해 합계 불일치”를 만들고, 일부는 관련 필드들을 함께 조작해 더 어려운 샘플을 만든다.
- 날짜를 보장기간 안으로 옮겼다면 처방전/영수증 날짜 불일치가 생길 수 있다.
- 환자명을 바꾸면 주민번호/생년월일/보험계약자 관계가 깨질 수 있다. 개인정보 위험 때문에 실제 값은 pseudonym only.

라벨:

- single_field_inconsistent
- multi_field_consistent_but_forged
- cross_document_inconsistent
- duplicate_claim_variant

---

## 5. 단계별 품질 상승 로드맵

### Phase 0. Taxonomy freeze

목표: 4가지 case family와 fraud intent taxonomy를 코드/문서/manifest에 고정한다.

산출물:

- `documentation/reports/INSURANCE_FDS_FOUR_CASE_TAXONOMY_AND_DATA_PLAN.ko.md`
- `data/insurance-fds-generated/taxonomy/four_case_taxonomy.json`

검증:

- 4 case가 모두 존재.
- 각 case에 NO/FK/AF, fraud_intent, source_policy, privacy_policy가 정의됨.

### Phase 1. Real document/source inventory

목표: 실제/공개 실손 청구 관련 서류 생태를 확보한다.

작업:

- 보험사별 청구서 양식 URL seed list.
- 병원/약국 서류 종류 taxonomy.
- 공개 OCR/KIE 데이터셋과 보험 도메인 gap 기록.
- source quarantine registry.

검증:

- 실제 원본 저장 전 license/privacy 상태가 기록됨.
- 원본 이미지가 바로 training으로 승격되지 않음.

### Phase 2. Field inventory and semantic pointer

목표: 실제/공개/합성 문서에서 바꿀 필드 좌표와 의미를 찾는다.

작업:

- 기존 `insurance_fds_real_image_field_inventory.py`를 semantic OCR/KIE로 승격.
- field candidate JSON에 original_text=unknown 상태를 줄인다.
- 금액/날짜/기관/환자/항목 field family를 분류한다.

검증:

- 후보 bbox가 ratio-based가 아니라 OCR/token/component 기반.
- 최소 샘플에서 original_text와 field_family가 채워짐.

### Phase 3. Local substitution engine quality upgrade

목표: 실제 서류/이미지에서 target field만 자연스럽게 치환한다.

작업:

- background erase 모듈.
- font/color/baseline matching 모듈.
- line/table restoration 모듈.
- outside-mask diff validator.
- OCR before/after validator.

검증:

- mask 밖 변경 픽셀 tolerance 이하.
- OCR after 성공률 측정.
- large overlay reject 0.

### Phase 4. Traditional editor simulation

목표: Case 2 전통 편집 도구 위변조 데이터셋을 만든다.

작업:

- photoshop_like layer replacement simulation.
- pdf_editor export artifact simulation.
- mobile_editor/JPEG recompression laundering.
- print-scan/camera recapture transform.

검증:

- tool_family별 artifact feature가 manifest에 기록됨.
- 동일 fraud_intent에 대해 tool_family만 다른 paired variants가 생성됨.

### Phase 5. GenAI-assisted edit upgrade

목표: Case 3 품질을 단계적으로 올린다.

작업:

- VLM field selection은 후보 제안까지만, pixel edit는 deterministic/local engine 우선.
- diffusion/inpaint는 작은 mask와 낮은 denoise에서만 사용.
- edit -> OCR -> retry loop를 제한된 횟수로 도입.

검증:

- 모델/프롬프트/seed/workflow_hash 기록.
- prompt가 위조 튜토리얼이 아니라 방어적 redteam simulation 목적임을 manifest에 기록.
- 결과가 전체 문서 재생성이 아님을 outside diff로 증명.

### Phase 6. Real-grounded GenAI variants

목표: Case 4를 구현한다.

작업:

- 실제 공개 양식에서 layout schema 추출.
- pseudonymized NO를 먼저 생성.
- fraud intent별 AF mutation plan 생성.
- paired local substitution 수행.
- camera/capture laundering 적용.

검증:

- 원본 real document PII가 training image에 남지 않음.
- source lineage와 derivation_level이 기록됨.
- field graph/업무규칙 consistency 라벨이 있음.

### Phase 7. Balanced evaluation set

목표: 모델 평가용으로 4 case를 균형 있게 만든다.

분할 예:

- Case 1 정상/참조: 25%
- Case 2 전통 편집 위변조: 25%
- Case 3 생성형AI/코딩도구 위변조: 25%
- Case 4 실제서류 grounding 생성형 위변조: 25%

추가 split:

- easy/medium/hard
- scanner/mobile/scan_app/messenger
- amount/date/provider/patient/item/duplicate
- single_document/cross_document

검증:

- train/val/test source leakage 방지.
- 같은 source document의 NO/AF가 split을 넘나들지 않음.
- 모델 shortcut 방지: 합성전용 label, visible mask, large patch 없음.

---

## 6. 실제 웹 조사 기반 source seed와 모델 학습 설계 보강

이번 보정 조사에서 확인한 1차 source seed는 공개 데이터셋이 아니라 실제 청구 서류 생태를 설명하는 보험사/공식 페이지 중심이다.

### 6.1 1차 source seed

| source | URL | 확인된 활용 포인트 | 학습 데이터 관점 |
|---|---|---|---|
| 손해보험협회 소비자포털 | `https://consumer.knia.or.kr/m/consumer/insurance-guide/0202.do` | 실손의료보험금 청구서류 표준화, 소액 통원/입원 청구별 필요서류, 추가심사 조건 | claim_amount_bucket, outpatient/inpatient, required_document_set, extra_review_trigger 라벨 설계 |
| 실손24 | `https://www.silson24.or.kr/claim/web/custSupp/custSuppNoticeDetail?postNo=153&postType=notice` | 전자 전송 가능 서류: 진료비 계산서·영수증, 진료비 세부산정내역서, 처방전 | electronic_claim_document_type, transmission_allowed_doc 라벨 |
| 실손24 guide PDF | `https://www.silson24.or.kr/claim/dn/silson24_guide_document.pdf` | 전산청구 가능 서류와 추가서류 구분 | official_doc_flow, electronic_submission_flow |
| DB손해보험 질병/상해 청구서류 | `https://www.idbins.com/pc/bizxpress/ct/dc/FWCUSV1301.shtm`, `https://www.idbins.com/pc/bizxpress/ct/dc/FWCUSV1300.shtm` | 입원/통원별 진료비계산영수증, 진료비세부내역서, 진단명 포함 서류 | insurer_required_doc_set, document_bundle_consistency |
| 한화생명 신청서류 | `https://www.hanwhalife.com/static/main/customerCenter/documents/CU_RD00000_T1T100.jsp`, `https://www.hanwhalife.com/static/main/myPage/insurance/accident/document/MY_INAPADC_T70000.jsp` | 실손 입원/통원 확인서류, 질병분류기호 처방전, 일자별 영수증 | diagnosis_code_presence, per_date_receipt, outpatient_bundle |
| 삼성화재 필요서류 | `https://direct.samsungfire.com/m/claim/MP040202_001.html`, `https://www.samsungfire.com/claim/P_P03_01_02_009.html` | 실손 의료비 필수서류, 약값 발생 시 약제비 영수증/처방전, 법정 표준영수증 언급 | medical_receipt_standard_form, pharmacy_receipt_bundle, invalid_receipt_type |
| 한화생명 조사대상 선정기준 | `https://www.hanwhalife.com/main/myPage/insurance/accident/selectionStandard/MY_INAPSSD_P10000.do` | 허위 진료비 계산서·영수증, 허위 발행 정황 등 조사대상 단서 | investigation_trigger_label, provider_risk_signal |
| 금융감독원/보험연구원 보도 PDF 검색 결과 | `https://kiri.or.kr/PDF/weeklytrend/20241111/trend20241111_3.pdf` | 진료비 쪼개기, 허위 통원 입력, 진단명 바꿔치기 사례 | fraud_intent taxonomy: split_billing, false_visit, diagnosis_swap |
| 언론 사례 검색 결과 | 연합뉴스/중앙일보/KBS/YTN 등 | 진단서 위변조, 허위 영수증, 진료일 쪼개기, 병명 바꿔치기 | scenario mining only; 원문 이미지는 저장하지 않음 |

주의: 위 seed는 바로 이미지 학습 데이터로 쓰는 것이 아니라 `source_registry`의 근거 URL과 문서/필드/업무규칙 추출 대상으로 등록한다.

### 6.2 FDS 모델 학습 태스크 재정의

이 데이터셋은 단일 binary classifier용이 아니라 최소 5개 태스크를 동시에 지원해야 한다.

1. Document type classification
   - 보험금청구서, 진료비계산서·영수증, 진료비세부내역서, 처방전, 진단서, 입퇴원확인서, 통원확인서, 약제비영수증.

2. Field extraction / KIE
   - 의료기관, 진료일, 발급일, 환자/수진자, 질병분류기호, 총액, 본인부담금, 비급여, 처방/약제비, 문서번호, 사업자번호 후보.

3. Tamper detection
   - NO/AF binary뿐 아니라 traditional_edit, genai_local_edit, real_grounded_genai_edit, manual_or_provider_false_issue를 구분.

4. Tamper localization
   - field bbox/polygon/mask 단위 localization. mask는 별도 supervision artifact이며 이미지 픽셀에 합성하지 않는다.

5. Claim consistency / fraud intent classification
   - amount_inflation, date_shift, diagnosis_swap, split_billing, false_visit, provider_swap, patient_swap, duplicate_claim, unsupported_item_claim.

### 6.3 공개 데이터셋의 위치 재정의

공개 데이터셋은 우선순위가 아니다. 역할은 다음으로 제한한다.

- OCR/KIE 라벨 포맷 참고
- forgery localization mask 포맷 참고
- baseline 모델 성능 sanity check
- 보험/의료 청구 도메인 gap 분석

공개 데이터셋을 실제 FDS 학습 주축으로 삼지 않는다. 실제 FDS 학습 주축은 보험사/공식/의료기관 문서 흐름에서 추출한 document schema, field schema, claim rule, fraud intent taxonomy, 그리고 paired NO-AF 국소치환 데이터다.

---

## 7. 검색/API 오탐 방지 및 실제 편집도구 연계 보강

사용자 정정에 따라 다음 운영 원칙을 추가한다.

1. API-first 검색 금지
   - 논문/데이터셋 API를 먼저 호출하지 않는다.
   - 공식 웹/보험사/협회/병원/약국/보도자료/판례/로컬 산출물 검토를 우선한다.
   - API는 사용자가 요청했거나 일반 웹 방식으로 근거 확보가 불가능한 경우에만 이유를 기록하고 사용한다.

2. cybersecurity 오탐 유발 검색어 회피
   - 이 작업은 cyber attack/red-team/exploit/evasion이 아니라 실손보험 FDS 모델 학습 데이터 구축이다.
   - 검색어는 “문서 편집 흔적”, “진료비 영수증”, “청구서류”, “OCR/KIE”, “위변조 의도 라벨”, “편집도구 기능”처럼 보험/문서처리/FDS 중심으로 구성한다.
   - `attack`, `exploit`, `bypass`, `jailbreak`, `forgery how-to` 같은 단어를 주 검색어로 쓰지 않는다.

3. 실제 편집도구 Case 2 연계
   - Case 2는 단순 합성 조작이 아니라 실제 편집도구 계열을 `tool_family`로 모델링한다.
   - 도구군:
     - PDF editor text layer
     - raster image editor
     - mobile scan app/document scanner
     - OCR editable conversion
     - manual markup/annotation
   - 각 도구군은 실제 GUI 도구를 바로 자동화하기보다, 먼저 로컬 재현 가능한 Python/CLI analog로 artifact를 만든다.
   - 이후 필요 시 GIMP/LibreOffice/ImageMagick/Tesseract/OCR 도구를 격리 환경에 설치해 실제 도구 signature를 확장한다.

4. 이번 단계 신규 산출물
   - `data/insurance-fds-generated/taxonomy/search_and_source_policy_v0_1.json`
   - `data/insurance-fds-generated/taxonomy/editor_tool_integration_case2_v0_1.json`
   - `data/insurance-fds-generated/taxonomy/editor_tool_capability_inventory_v0_1.json`

5. 현재 로컬 tool inventory 결과
   - 사용 가능: `pdftoppm` via TeX Live
   - 현재 없음: ImageMagick `magick`, GIMP, LibreOffice, Tesseract, ocrmypdf
   - 현재 Python 환경에 없음: Pillow, OpenCV, PyMuPDF, pikepdf, reportlab, numpy
   - 주의: Windows `convert.exe`는 ImageMagick이 아니므로 이미지 변환에 사용하지 않는다.

---

## 8. 즉시 다음 단계 권고

실행을 시작한다면 바로 생성기를 돌리지 말고 아래 순서가 맞다.

1. 4-case taxonomy 파일부터 만든다.
2. 기존 manifest들에 case_family/fraud_intent/source_policy 필드를 추가하는 migration plan을 작성한다.
3. 실제/공개 실손 청구서류 source seed list를 만든다.
4. `real_image_field_inventory`를 OCR/KIE semantic pointer로 업그레이드한다.
5. 국소치환 engine의 erase/render/validate를 분리한다.
6. 그 다음에야 Case 2/3/4별 소량 smoke dataset을 만든다.

권장 첫 구현 단위:

- Task A: taxonomy JSON + 문서 보고서
- Task B: source registry schema
- Task C: semantic field candidate schema/test
- Task D: local substitution quality validator
- Task E: traditional editor simulation MVP
- Task F: genAI-assisted edit contract only, execution은 나중

---

## 7. 위험과 통제

1. 개인정보 위험
   - 실제 서류는 quarantine이 기본이다.
   - 실제 PII가 들어간 이미지는 학습/생성으로 승격하지 않는다.

2. 위조 악용 위험
   - 산출물은 방어적 FDS redteam 데이터로 한정한다.
   - fraud tutorial이 아니라 detection/evaluation 목적 manifest를 둔다.

3. 모델 shortcut 위험
   - visible mask, 합성전용 라벨, 큰 박스, shifted overlay 금지.
   - supervision mask는 별도 파일로만 저장한다.

4. 품질 착시 위험
   - “보기 그럴듯함”보다 OCR/KIE/forensic validation이 우선이다.
   - outside diff, OCR before/after, layout shift, field semantic confidence를 모두 기록한다.

5. 3번 과집중 위험
   - 앞으로 모든 작업은 4-case balance table을 업데이트해야 한다.
   - Case 3 산출물이 늘어날 때 Case 1/2/4의 대응 산출물도 계획에 반영한다.

---

## 8. 실행 보류 기준

아래가 준비되기 전에는 대량 생성하지 않는다.

- four_case_taxonomy.json
- source registry schema
- field candidate schema
- privacy/provenance policy
- local substitution validation gate
- 4 case별 최소 1개 smoke scenario 정의

---

## 9. 이 플랜에서의 최종 판단

방향 전환은 필요하다.

기존 “생성형 AI/코딩 도구로 새 문서를 만들거나 합성 문서를 위변조하는 방식”은 FDS 모델에 필요한 일부 축일 뿐이다. 다음 단계의 중심은 실제 실손 청구 서류의 문서/필드/좌표/업무규칙을 이해하고, paired NO 이미지에서 target field만 국소치환하는 고품질 AF 생성으로 이동해야 한다. 생성형 AI는 그 위에서 field selection, 자연스러운 inpaint, 촬영 질감 다양화, hard negative 생성에 제한적으로 사용해야 한다.
