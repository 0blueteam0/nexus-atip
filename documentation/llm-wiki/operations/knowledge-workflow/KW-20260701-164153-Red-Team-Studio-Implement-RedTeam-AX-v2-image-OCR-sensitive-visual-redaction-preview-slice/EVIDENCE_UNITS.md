---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-01T16:41:53+09:00
---

# Evidence Units

| id | source_path | command | exit_code | artifact_path | verified_at | finding |
|---|---|---|---:|---|---|---|
| EV-001 | `runtime/redteam_v2_models.py` | `rg -n "sanitize-preview\|preview_tool_output_sanitizer\|SECRET_REDACTION_PATTERNS\|VisualEvidenceDescriptor\|visual redaction\|redaction-preview" ...` | 0 | `runtime/redteam_v2_models.py` | 2026-07-01T16:42+09:00 | Existing sanitizer foundation located and extended for visual/OCR preview. |
| EV-002 | `soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 0 | `reports.js` | 2026-07-01T16:47+09:00 | Frontend method/panel syntax is valid. |
| EV-003 | `tests/test_redteam_v2_api_router.py` | `.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"` | 0 | `tests/test_redteam_v2_api_router.py` | 2026-07-01T16:47+09:00 | 33 v2 API router tests passed, including new visual OCR redaction preview regression. |
| EV-004 | `tests/test_redteam_v2_sample_e2e.py` | `.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"` | 0 | `tests/test_redteam_v2_sample_e2e.py` | 2026-07-01T16:48+09:00 | Sample RedTeam AX v2 E2E remained green. |
| EV-005 | `soc-frontend-vite-react/soc-frontend/idiomatic-react` | `npm.cmd run build` | 0 | `dist/` | 2026-07-01T16:48+09:00 | Vite production build completed; only existing large chunk warning observed. |
| EV-006 | `Red Team Studio/FINAL_PLAN.md` | `..\\.venv\\Scripts\\python.exe 고도화\\sanity\\test_plan_contract.py` | 0 | `Red Team Studio/FINAL_PLAN.md` | 2026-07-01T16:49+09:00 | Plan contract sanity passed after slice 22 status update. |

## Confidence

High for API contract, unit behavior, and frontend build syntax. Medium for live UI behavior because browser smoke against running services remains a follow-up.

## Limits

This slice does not perform OCR extraction or pixel-level masking. It records manual OCR preview and masking actions for later human/engine processing.

## Related Decisions

- Keep raw image/OCR content untrusted and data-only.
- Do not let screenshots alone support findings or compromise claims.
- Require human review for restricted visual evidence.

