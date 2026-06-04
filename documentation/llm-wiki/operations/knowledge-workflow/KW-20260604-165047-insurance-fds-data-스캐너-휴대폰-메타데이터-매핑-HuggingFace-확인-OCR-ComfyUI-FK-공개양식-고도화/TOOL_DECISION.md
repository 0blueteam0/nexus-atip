---
type: tool_decision
status: draft
project: insurance-fds-data
task: 스캐너-휴대폰-메타데이터-매핑-HuggingFace-확인-OCR-ComfyUI-FK-공개양식-고도화
created: 2026-06-04T16:50:47+09:00
---

# Tool Decision

## 작업 목표

## 필요한 능력

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| 후보 1 |  |  |  |  |
| 후보 2 |  |  |  |  |
| 후보 3 |  |  |  |  |
| 후보 4 |  |  |  |  |
| 후보 5 |  |  |  |  |

## 선택한 도구 또는 도구 체인

## 선택 이유

## 버린 대안과 이유

## 실패 시 fallback

## 실제 사용 결과

## 다음 재사용 규칙



## Tool decisions
- HuggingFace: hf CLI unavailable, used public REST API and fallback inventory.
- OCR: tesseract/pytesseract unavailable, emitted engine_probe and OCR roundtrip contract rather than fabricating OCR output.
- ComfyUI: local server unavailable, validated dry-run contract and did not attempt live generation.
