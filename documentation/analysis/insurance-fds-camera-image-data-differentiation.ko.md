---
title: "실손보험 FDS 카메라 이미지 데이터 차별화 전략"
created_at: "2026-06-04"
project: "insurance-fds-data"
status: "draft_verified_with_local_generator"
collected_via: ["local_generator", "browser_reference", "direct_url_status_check"]
evidence_level: "tool_verified_local_artifacts_and_public_url_reachability"
related:
  - "data/insurance-fds-generated/demo-v1/labels/INSURANCE_FDS_AF_LABELING_STANDARD.md"
  - "scripts/insurance_fds_camera_image_generator.py"
  - "data/insurance-fds-generated/camera-v1/manifests/camera_image_manifest.json"
ontology:
  entities: ["insurance_fds", "camera_captured_document", "tamper_mask", "comfyui", "stable_diffusion", "ocr_roundtrip"]
  relations:
    - ["camera_captured_document", "improves", "submission_channel_realism"]
    - ["tamper_mask", "supervises", "image_forensic_detector"]
    - ["stable_diffusion", "diversifies", "camera_domain_randomization"]
---

# 실손보험 FDS 카메라 이미지 데이터 차별화 전략

## 1. 결론

실손보험 청구서류 FDS 데이터의 차별화 포인트는 단순히 `NO 정상`, `FK 실제 공개 위조 사례`, `AF 합성 이상`을 텍스트/JSON으로 나누는 것이 아니라, 실제 제출 채널의 이미지 특성을 데이터셋에 포함하는 것이다.

실제 모바일 청구에서는 다음 형태가 자주 발생한다.

- 병원 영수증/진료비 세부산정내역서/처방전/청구서를 휴대폰 카메라로 촬영
- 모바일 스캔 앱으로 촬영 후 자동 보정
- 갤러리/메신저를 거친 재압축 이미지 업로드
- 원본 문서와 촬영 이미지 간 OCR 오차, 그림자, 기울어짐, 부분 잘림, 흐림 발생
- 위변조 영역이 촬영 노이즈와 섞여 단순 픽셀 탐지만으로는 분리하기 어려움

따라서 FDS용 데이터는 아래 4축을 동시에 가져야 한다.

1. 문서 업무 규칙 라벨: 금액, 날짜, 기관, 청구 항목 정합성
2. OCR/KIE 라벨: 필드 bbox, 정규화 값, 문서 유형
3. 이미지 포렌식 라벨: AF mask, compression/noise/font/layout anomaly
4. 제출 채널 라벨: mobile_camera_upload, mobile_scan_app, mixed_camera_gallery

## 2. 이번에 구현한 로컬 차별화 산출물

구현 파일:

- `scripts/insurance_fds_camera_image_generator.py`

생성 산출물:

- `data/insurance-fds-generated/camera-v1/images/NO/*.png`
- `data/insurance-fds-generated/camera-v1/images/AF/*.png`
- `data/insurance-fds-generated/camera-v1/masks/NO/*_MASK.png`
- `data/insurance-fds-generated/camera-v1/masks/AF/*_MASK.png`
- `data/insurance-fds-generated/camera-v1/manifests/camera_image_manifest.json`
- `data/insurance-fds-generated/camera-v1/generative_contracts/comfyui_img2img_control_contract.json`
- `data/insurance-fds-generated/camera-v1/generative_contracts/stable_diffusion_camera_diversification_strategy.json`

검증된 생성 결과:

- 총 48개 카메라 이미지
- NO 24개, AF 24개
- 이미지 크기 1400x1600 PNG
- AF 24개 모두 tamper mask 양성 픽셀 보유
- camera profile: smartphone_topdown, smartphone_oblique, mobile_scan_app, low_light_gallery_reupload
- 모든 샘플 PII 상태: synthetic_no_real_pii

## 3. 파일명/라벨 정책

기존 prefix 정책을 이미지에도 그대로 유지한다.

- `NO_CAMERA_IMAGE_...png`: 정상 합성 문서 촬영 이미지
- `AF_CAMERA_IMAGE_...png`: 합성 이상/위변조 학습용 촬영 이미지
- `*_MASK.png`: 동일 좌표계의 tamper localization mask
- `FK_...`: 실제 공개 위조 사례 기반으로 추상화한 사례가 확보될 때만 사용. 실제 PII/원본 위조문서는 저장하지 않고 비식별·공개·라이선스 검토 후 sidecar evidence를 남긴다.

AF mask 정책:

- structured_json의 `forensic_annotations.mask_layers`를 카메라 이미지 변환 후 투영
- manifest에 `tamper_mask_policy=projected_from_structured_forensic_annotations` 기록
- `mask_positive_pixel_count`로 mask 유효성 검증

## 4. 카메라 이미지 domain randomization 항목

manifest의 `degradation_recipe`에는 아래 항목을 기록한다.

- illumination: soft_window_light, fluorescent_office, low_light_warm, scan_app_flattened
- perspective: smartphone_topdown, smartphone_oblique, mobile_scan_app, low_light_gallery_reupload
- shadow: left_edge_soft_shadow, bottom_corner_shadow, minimal_scan_shadow
- background_surface: warm_wood_desk, gray_office_table, blue_fabric, clipboard_board
- compression_quality: JPEG 왕복 압축 quality
- motion_blur_radius: 약한 흐림 정도
- scanner_noise: none, low_iso_noise, paper_texture_noise
- phone_capture_simulation: device_class, orientation, gallery_reupload

이 항목들은 단순 augmentation이 아니라 FDS 모델이 제출 채널 현실성을 학습하도록 하는 데이터 moat다.

## 5. Stable Diffusion / ComfyUI 확장 전략

현재 로컬 생성기는 ComfyUI를 직접 실행하지 않고 안전 contract를 만든다. 실제 ComfyUI/Stable Diffusion 연결 시 권장 구조는 다음과 같다.

### 5.1 기본 워크플로우

1. structured_json -> deterministic clean document render
2. clean render -> camera-v1 이미지와 AF mask 생성
3. camera image를 ComfyUI img2img 입력으로 사용
4. ControlNet Canny/Lineart/Depth 계열로 문서 레이아웃 보존
5. denoise 0.15-0.35의 낮은 범위로 배경, 조명, 종이 질감, 촬영 노이즈만 다양화
6. text field/기관명/로고/서명/직인 영역은 inpaint 금지 또는 synthetic placeholder 유지
7. 결과 manifest에 model_id, workflow_hash, seed, license, safety_review_status 기록
8. OCR roundtrip으로 필드 인식 가능성 점수화

### 5.2 추천 생성 모드

- SDXL img2img: 실제 카메라 질감, 배경, 조명 다양화
- ControlNet Canny/Lineart: 문서 레이아웃 유지
- Inpaint background only: 문서 내용이 아니라 배경/그림자/종이 질감만 변화
- Upscale/Downscale loop: 모바일 앱 압축/리사이즈 재현
- Low-light/crop/blur variants: 제출 실패 경계 사례 생성

### 5.3 안전 금지 프롬프트

negative prompt에 반드시 포함할 항목:

- real hospital logo
- real doctor signature
- real personal ID number
- real patient name
- counterfeit instruction
- illegal forgery tutorial
- hallucinated official seal

## 6. 공개 데이터/도구 후보

아래 URL은 직접 접근 상태를 확인한 공개 후보다. 실제 다운로드/학습 사용 전에는 각 라이선스와 개인정보/상업적 이용 조건을 별도로 확인해야 한다.

| 후보 | URL | 분류 | FDS 활용 포인트 | 주의사항 |
|---|---|---|---|---|
| DocTamper | https://github.com/qcf-568/DocTamper | FK/AF 참고, 문서 변조 탐지 | 문서 이미지 tampering localization, mask 학습 아이디어 | 보험 문서 전용 아님. 라이선스/데이터 접근 조건 확인 필요 |
| CORD | https://github.com/clovaai/cord | NO 참고, 영수증 OCR/KIE | receipt OCR, key information extraction, layout parsing | 의료 영수증 아님. 상업 영수증 도메인 차이 보정 필요 |
| SROIE ICDAR 2019 | https://rrc.cvc.uab.es/?ch=13 | NO 참고, 영수증 OCR | scanned receipt OCR, field extraction benchmark | SSL 검증 실패가 있었으나 공식 ICDAR 계열로 별도 접근 필요 |
| FUNSD | https://guillaumejaume.github.io/FUNSD/ | NO 참고, form understanding | form key-value extraction, bbox relation 학습 | 보험 청구 양식 전용 아님 |
| RVL-CDIP | https://www.cs.cmu.edu/~aharley/rvl-cdip/ | NO 참고, 문서분류 | 문서 이미지 분류 pretraining | 오래된 스캔 문서 중심, 모바일 촬영 도메인 부족 |
| MIDV-500 | https://github.com/fcakyon/midv500 | NO 참고, 모바일 촬영 문서 | mobile captured document, perspective/blur/lighting variation | 신분증 문서 중심. 보험 문서에는 촬영 변형만 참조 |
| PaddleOCR | https://github.com/PaddlePaddle/PaddleOCR | 도구 | OCR roundtrip scoring, field extraction baseline | 한국어/의료 문서 튜닝 필요 |
| Donut | https://github.com/clovaai/donut | 도구/모델 | OCR-free document understanding baseline | GPU/학습 비용 고려 |
| ComfyUI | https://github.com/comfyanonymous/ComfyUI | 생성 도구 | img2img/control workflow 실행 | 모델 라이선스와 안전 프롬프트 관리 필요 |
| ControlNet | https://github.com/lllyasviel/ControlNet | 생성 제어 | 레이아웃 보존형 이미지 다양화 | 문서 텍스트 변형 방지 필요 |

## 7. 실제 청구서류 수집 방향

실제 청구용 진짜 서류 원본은 개인정보와 병원/보험사 양식 저작권 문제가 있으므로, 무차별 저장하면 안 된다. 안전한 수집 순서는 다음과 같다.

1. 보험사/협회가 공개한 보험금 청구서 양식 PDF/이미지만 수집
2. 병원/약국/보험사 안내 페이지의 필요서류 목록 수집
3. 공개 샘플 이미지가 있으면 `NO_PUBLIC_TEMPLATE`로 저장하되 실제 개인정보가 있으면 제외
4. 실제 위조 사례는 판례/보도/수사자료의 문장형 사례를 taxonomy로 추상화하고 원본 이미지는 저장하지 않음
5. 공개 위조 데이터셋은 보험 도메인이 아니더라도 FK/AF 라벨 설계와 mask 학습에 참조
6. 합성 문서는 현재처럼 synthetic namespace로 생성하고, ComfyUI로 촬영 도메인을 확장

## 8. 다음 추천 작업

우선순위 1: OCR roundtrip validator 추가

- PaddleOCR 또는 Tesseract를 붙여 camera-v1 이미지에서 OCR 추출
- structured_json 값과 OCR 결과를 비교해 `ocr_quality_bucket` 생성
- blur/crop/compression이 심한 샘플을 hard negative로 분리

우선순위 2: ComfyUI 실행 연결

- `generative_contracts/comfyui_img2img_control_contract.json`을 API workflow로 변환
- 로컬/Cloud 선택 후 health check
- 1개 샘플 dry-run smoke test
- model_id/license/seed/workflow_hash manifest 기록

우선순위 3: 공개 양식 crawler seed list 구축

- 보험사별 보험금 청구서 양식 URL
- 손해보험협회/생명보험협회/보험개발원/금융감독원 소비자 안내 URL
- 실손 청구 필요서류 안내 페이지
- 수집 결과는 `NO_PUBLIC_TEMPLATE` 후보로 별도 evidence sidecar 관리

우선순위 4: FK 사례 taxonomy 보강

- 보험사기 판례/보도자료/금감원 사례에서 문서 위변조 유형만 추상화
- 실제 원본 이미지/PII 없이 `FK_CASE_ABSTRACT_*.json` 생성
- AF 합성 레시피가 FK taxonomy를 커버하는지 coverage matrix 작성

## 9. 모델 학습 관점의 차별화 포인트

- Classification: NO/AF/FK 문서 단위 탐지
- Segmentation: AF tamper mask localization
- OCR/KIE: 촬영 노이즈 하 필드 추출
- Rule engine: 금액/날짜/기관/항목 정합성
- Graph FDS: 동일 환자 alias, provider alias, receipt_no, claim_group_id 관계망
- Robustness: 모바일 촬영/스캔/재압축/저조도/crop/blur domain shift 대응

이 조합이 단순 문서 이미지 데이터셋과 다른 차별화 지점이다.
