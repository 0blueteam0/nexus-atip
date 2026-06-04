# Scope

프로젝트: insurance-fds-data
작업: 실손보험 청구서류 FDS용 카메라 촬영 이미지 합성 및 Stable Diffusion/ComfyUI 차별화 데이터 파이프라인 구현

## 범위

- 기존 demo-v1 structured_json 합성 문서를 실제 모바일 제출 환경에 가까운 PNG 이미지로 변환한다.
- NO/AF prefix와 AF tamper mask 라벨을 이미지/마스크 파일명과 manifest에 보존한다.
- Stable Diffusion/ComfyUI를 즉시 실행하지 않고, 안전한 img2img/control contract를 생성한다.
- 공개 데이터/도구 후보 접근성을 확인하고 차별화 전략 문서에 반영한다.

## 비범위

- 실제 환자/병원/보험사 개인정보, 실제 로고, 실제 직인, 실제 서명 수집/생성은 제외한다.
- 실제 위조 절차를 재현하는 공격적 가이드는 작성하지 않는다.
- ComfyUI live generation은 이번 단계에서 기본 비활성화(dry contract)로 둔다.
