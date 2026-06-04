# Decision Log

## Decision 1: 카메라 이미지 생성기를 별도 스크립트로 추가

- 결정: 기존 synthetic generator를 수정하지 않고 `scripts/insurance_fds_camera_image_generator.py`를 새로 추가.
- 이유: structured_json/HTML/SVG 생성과 camera image augmentation은 책임이 다르며, ComfyUI 확장 contract도 별도 관리가 적합하다.

## Decision 2: Live Stable Diffusion 실행 대신 contract 생성

- 결정: live generation은 비활성화하고 dry contract JSON을 생성.
- 이유: GPU/Cloud/API key/model license 확인 전에는 실행하지 않는 것이 안전하며, 실제 문서 내용 hallucination 방지가 필요하다.

## Decision 3: AF mask를 structured forensic bbox에서 투영

- 결정: AF mask는 임의 영역이 아니라 structured_json의 `forensic_annotations.mask_layers`에서 생성.
- 이유: 필드/업무규칙/이미지 포렌식 라벨 연결성을 보존한다.
