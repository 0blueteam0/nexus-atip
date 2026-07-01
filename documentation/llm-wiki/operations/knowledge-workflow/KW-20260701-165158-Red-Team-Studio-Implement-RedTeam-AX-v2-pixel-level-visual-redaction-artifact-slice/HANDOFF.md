---
type: handoff
status: active
project: Red-Team-Studio
updated: 2026-07-01T16:51:58+09:00
---

# Handoff

## 현재 상태

Slice 23 is implemented and verified. The overall RedTeam AX goal remains active.

## 완료된 것

- Backend creates visual evidence bundles from image data URLs.
- `original.png`, `redacted.png`, `screenshot_manifest.json`, and `sha256sums.txt` are written under the case archive.
- VisualEvidenceDescriptor now links original/redacted paths and hashes.
- Report Studio `레드팀 분석2` displays redacted artifact state and hash.
- API regression verifies actual PNG artifact generation.

## 검증된 것

- `node --check reports.js` exit_code 0.
- `test_redteam_v2_api_router.py` exit_code 0, 33 tests.
- `test_redteam_v2_sample_e2e.py` exit_code 0, 1 test.
- `npm.cmd run build` exit_code 0.
- `고도화/sanity/test_plan_contract.py` exit_code 0.

## 아직 위험한 것

- OCR extraction and OCR bbox generation are not implemented yet.
- Estimated OCR bands need human review before report inclusion.
- Live browser smoke against running services remains pending.

## 열린 질문

- Which OCR engine should become the pinned default?
- Should exact redaction regions be stored as bbox-only or include confidence and OCR source metadata?

## 다음 액션

- Implement OCR engine extraction with version/hash pinning.
- Feed OCR bbox into `redaction_regions`.
- Run live Report Studio browser smoke and report export gate test.

## 반드시 읽을 문서

- `Red Team Studio/FINAL_PLAN.md`
- `Red Team Studio/SPEC/06_VISUAL_EVIDENCE_CAPTURE_SPEC.md`
- `runtime/redteam_v2_models.py`
- `tests/test_redteam_v2_api_router.py`

## 관련 도구와 스크립트

- `.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`
- `npm.cmd run build`
- `고도화\\sanity\\test_plan_contract.py`

## 다시 논의하지 않아도 되는 결정

- Pillow is adequate for this artifact-generation slice.
- SHA-256 mismatch invalidates the preview.
- Estimated bands are a temporary fallback, not final OCR precision.

