---
type: handoff
status: active
project: Red-Team-Studio
updated: 2026-07-01T16:41:53+09:00
---

# Handoff

## 현재 상태

RedTeam AX v2 slice 22 is implemented as a preview/control layer. The overall RedTeam AX goal remains active.

## 완료된 것

- Backend endpoint `/api/redteam/v2/visual-evidence/redaction-preview`.
- Visual/OCR sensitive pattern detection and redaction action generation.
- Screenshot-only claim policy warning and restricted visual human review flag.
- Report Studio `레드팀 분석2` panel for image upload, browser SHA-256, manual OCR text, claim guardrail note, preview cards/table, image preview, and sanitized OCR output.
- `FINAL_PLAN.md` slice 22 checklist update.

## 검증된 것

- `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` exit_code 0.
- `.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"` exit_code 0, 33 tests.
- `.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"` exit_code 0, 1 test.
- `npm.cmd run build` exit_code 0.
- `..\\.venv\\Scripts\\python.exe 고도화\\sanity\\test_plan_contract.py` exit_code 0.

## 아직 위험한 것

- No OCR engine extraction is wired yet; current flow uses manual OCR text.
- No pixel-level redacted image artifact is generated yet.
- Live browser smoke against running 5177/8765 was not performed in this slice.
- Existing Vite large chunk warning remains.

## 열린 질문

- Which OCR engine should be pinned first for Windows local use: Tesseract, PaddleOCR, or a Python-only fallback?
- Should redacted images be stored under the same case archive as raw visual artifacts or under a separate evidence-review bundle?

## 다음 액션

- Add OCR engine version/hash pin and a backend extraction endpoint.
- Add pixel-level redacted image artifact generation and link original/redacted paths into the visual descriptor.
- Run Playwright/live browser smoke for the new panel.

## 반드시 읽을 문서

- `Red Team Studio/FINAL_PLAN.md`
- `Red Team Studio/SPEC/06_VISUAL_EVIDENCE_CAPTURE_SPEC.md`
- `Red Team Studio/SPEC/21_GUARDRAIL_AGENT_PROMPTS.md`
- `runtime/redteam_v2_models.py`
- `soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`

## 관련 도구와 스크립트

- `.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`
- `.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"`
- `npm.cmd run build`
- `고도화\\sanity\\test_plan_contract.py`

## 다시 논의하지 않아도 되는 결정

- OCR/visual content is data-only and never trusted as instruction.
- Screenshot-only findings are blocked until corroborated.
- Restricted visual evidence requires human review.
- Pixel-level redaction remains a follow-up, not part of slice 22 completion.

