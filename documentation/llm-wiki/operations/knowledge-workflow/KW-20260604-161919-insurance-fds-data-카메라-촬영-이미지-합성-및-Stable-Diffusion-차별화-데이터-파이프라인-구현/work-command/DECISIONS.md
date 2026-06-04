# Decisions

- 카메라 이미지 생성은 기존 합성 데이터 생성기와 분리해 별도 CLI로 구현했다.
- ComfyUI/Stable Diffusion은 즉시 live 실행하지 않고 safety contract로 먼저 고정했다.
- AF mask는 임의 생성하지 않고 structured forensic bbox에서 투영했다.
- 실제 PII/로고/직인/서명은 생성 금지하고 synthetic placeholder만 사용했다.
- 전체 테스트 실패는 unrelated collection error로 기록하고, scoped tests를 검증 근거로 삼았다.
