---
type: scope
task_id: KW-20260701-164153-Red-Team-Studio-Implement-RedTeam-AX-v2-image-OCR-sensitive-visual-redaction-preview-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 image OCR sensitive visual redaction preview slice
created: 2026-07-01T16:41:53+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Implement the next RedTeam AX v2 slice for image/OCR sensitive visual redaction preview in Report Studio `레드팀 분석2`, while keeping the larger RedTeam AX goal active.

## Included

- Add a backend preview API that treats OCR/visual evidence as untrusted data, detects sensitive visual text, records required masking actions, blocks screenshot-only claims, and emits an archived preview artifact.
- Add focused API regression coverage for OCR sensitive data, screenshot-only claim policy, restricted visual review, and artifact creation.
- Add `레드팀 분석2` UI controls for image upload, browser SHA-256 calculation, manual OCR text, claim guardrail note, preview result, sanitized OCR text, and visual descriptor status.
- Update `FINAL_PLAN.md` for slice 22 completion and remaining OCR engine/pixel masking follow-ups.
- Run sanity, API, E2E, and frontend build verification.

## Excluded

- Actual OCR engine integration such as Tesseract or PaddleOCR.
- Pixel-level redacted image artifact generation.
- Live browser smoke against already-running `127.0.0.1:5177` and `127.0.0.1:8765`.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| backend | visual redaction preview model and router endpoint | `runtime/redteam_v2_models.py`, `runtime/redteam_v2_api_router.py` |
| tests | API regression for sensitive OCR preview | `tests/test_redteam_v2_api_router.py` |
| frontend | Report Studio RedTeam2 visual evidence preview panel | `soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` |
| plan | slice status and checklist update | `Red Team Studio/FINAL_PLAN.md` |
| verification | syntax, unittest, E2E, build, plan sanity | command evidence in `EVIDENCE_UNITS.md` |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| API endpoint | `/api/redteam/v2/visual-evidence/redaction-preview` | preview visual/OCR redaction policy without executing high-risk tools |
| preview archive | `archive/runs/redteam-ax-v2/**/visual-redaction-previews/*.json` | evidence of generated preview and descriptor |
| UI panel | `reports.js` `Visual Evidence OCR Redaction Preview` | analyst-facing workflow in `레드팀 분석2` |
| plan update | `Red Team Studio/FINAL_PLAN.md` | keep implementation plan current |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
