# Tool Decision

## 사용 도구

- Pillow: 문서 페이지 렌더링, 배경 합성, 회전/왜곡/블러/압축 왕복, 마스크 생성에 사용.
- pytest: TDD RED/GREEN 검증.
- browser: 사용자 제공 ChatGPT share 링크 접근 확인.
- urllib direct status check: 검색엔진 차단을 우회해 공개 데이터/도구 URL 접근성을 확인.
- knowledge_workflow.py: 작업 증거 세션 시작/종료.

## ComfyUI/Stable Diffusion 처리 결정

ComfyUI live generation은 이번 단계에서 실행하지 않았다. 이유:

- 실제 실행에는 모델/라이선스/GPU 또는 Comfy Cloud 키 확인이 필요하다.
- 문서 내용/로고/서명 hallucination 위험이 있어 안전 contract가 먼저 필요하다.
- 현재 목표는 이미지 데이터 차별화 포인트를 구현 가능한 로컬 파이프라인과 manifest로 고정하는 것이다.

대신 `generative_contracts/comfyui_img2img_control_contract.json`과 `stable_diffusion_camera_diversification_strategy.json`을 생성했다.
