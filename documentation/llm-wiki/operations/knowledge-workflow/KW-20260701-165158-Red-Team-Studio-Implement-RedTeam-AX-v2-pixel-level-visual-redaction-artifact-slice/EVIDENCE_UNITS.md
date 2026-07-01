---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-01T16:51:58+09:00
---

# Evidence Units

| id | source_path | command | exit_code | artifact_path | verified_at | finding |
|---|---|---|---:|---|---|---|
| EV-001 | `SPEC/06_VISUAL_EVIDENCE_CAPTURE_SPEC.md` | `rg -n "redacted_artifact_path\|original_artifact_path\|pixel\|OCR\|VisualEvidence\|visual evidence\|redaction" ...` | 0 | `FINAL_PLAN.md`, `SPEC/06_VISUAL_EVIDENCE_CAPTURE_SPEC.md` | 2026-07-01T16:52+09:00 | SPEC requires original/redacted paths and visual bundle artifacts. |
| EV-002 | `.venv` | `.venv\\Scripts\\python.exe -c "import importlib.util; ..."` | 0 | local Python environment | 2026-07-01T16:53+09:00 | PIL, cv2, and numpy are available; Pillow selected. |
| EV-003 | `reports.js` | `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 0 | `reports.js` | 2026-07-01T16:56+09:00 | Frontend syntax passed. |
| EV-004 | `tests/test_redteam_v2_api_router.py` | `.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"` | 0 | generated `visual-bundles/**/original.png`, `redacted.png`, manifest | 2026-07-01T16:56+09:00 | 33 API tests passed, including PNG data URL redaction artifact generation. |
| EV-005 | `tests/test_redteam_v2_sample_e2e.py` | `.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"` | 0 | sample E2E result | 2026-07-01T16:56+09:00 | Sample v2 E2E remained green. |
| EV-006 | `soc-frontend-vite-react/soc-frontend/idiomatic-react` | `npm.cmd run build` | 0 | `dist/` | 2026-07-01T16:56+09:00 | Vite production build passed with existing large chunk warning. |
| EV-007 | `Red Team Studio/FINAL_PLAN.md` | `..\\.venv\\Scripts\\python.exe 고도화\\sanity\\test_plan_contract.py` | 0 | `FINAL_PLAN.md` | 2026-07-01T16:56+09:00 | Plan contract sanity passed. |

## Confidence

High for backend artifact creation contract and build/test health. Medium for live browser UX because live 5177/8765 smoke remains pending.

## Limits

Estimated OCR bands are used when OCR bounding boxes are unavailable. Actual OCR bbox integration is still open.

## Related Decisions

- Use Pillow from the existing environment.
- Generate artifacts from `image_data_url` without adding a new OCR engine.
- Keep visual content untrusted and require human review for estimated masks.

