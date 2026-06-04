# Insights

- 실제 실손 청구 제출 환경은 모바일 촬영/스캔/재압축 이미지가 많으므로 JSON/HTML/SVG만으로는 FDS 이미지 domain shift를 충분히 다루기 어렵다.
- 차별화 포인트는 카메라 촬영 domain randomization, tamper mask supervision, OCR roundtrip quality bucket, 문서 업무 규칙을 같은 manifest에서 연결하는 것이다.
- Stable Diffusion/ComfyUI는 문서 텍스트 자체를 생성하게 하면 hallucination/불법 위조 리스크가 커진다. 따라서 낮은 denoise img2img + ControlNet + inpaint background only 정책이 안전하다.
- 공개 데이터셋은 대부분 보험 청구 전용이 아니므로, OCR/KIE/문서변조/모바일촬영의 구성 요소를 참조하고 보험 도메인은 합성/공개 양식 기반으로 맞춰야 한다.
