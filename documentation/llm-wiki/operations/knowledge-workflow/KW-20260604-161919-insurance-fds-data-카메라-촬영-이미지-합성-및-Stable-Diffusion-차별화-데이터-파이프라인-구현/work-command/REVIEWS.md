# Reviews

## Self-review

- TDD 순서 준수: 테스트 작성 후 실패 확인, 구현 후 통과 확인.
- 파일명 prefix 정책 준수: NO/AF 이미지와 마스크 파일명이 prefix를 포함한다.
- 안전성 검토: 실제 개인정보/기관 로고/서명/직인을 생성하지 않는다.
- manifest 검토: degradation_recipe, submission_channel, pii_status, mask_positive_pixel_count 포함.

## Known issue review

- 전체 pytest는 unrelated import collection 오류로 실패한다.
- generated camera profile 분포는 deterministic이지만 완전 균등하지 않다. 이후 stratified sampler를 추가할 수 있다.
- ComfyUI는 dry contract만 생성했으므로 live model output quality는 아직 검증되지 않았다.
