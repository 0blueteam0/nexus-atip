---
type: scope
task_id: KW-20260701-165158-Red-Team-Studio-Implement-RedTeam-AX-v2-pixel-level-visual-redaction-artifact-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 pixel-level visual redaction artifact slice
created: 2026-07-01T16:51:58+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue RedTeam AX v2 implementation by turning the previous visual/OCR redaction preview into an artifact-producing workflow with original and redacted image paths.

## Included

- Store uploaded image data URL as a case-scoped visual bundle.
- Generate `original.png`, `redacted.png`, `screenshot_manifest.json`, and `sha256sums.txt`.
- Link `original_artifact_path`, `redacted_artifact_path`, image hashes, and masking regions into the VisualEvidenceDescriptor.
- Extend Report Studio `레드팀 분석2` to show redacted artifact path/hash and bundle status.
- Add API regression coverage for PNG data URL -> original/redacted artifact generation.
- Update `FINAL_PLAN.md` slice status.

## Excluded

- Real OCR engine extraction and OCR bbox generation.
- Live browser smoke against running `127.0.0.1:5177` and `127.0.0.1:8765`.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| backend | visual bundle decoding, hashing, redacted PNG creation | `runtime/redteam_v2_models.py` |
| tests | real PNG data URL artifact generation regression | `tests/test_redteam_v2_api_router.py` |
| frontend | display visual bundle artifact path/hash | `reports.js` |
| plan | slice 23 checklist | `FINAL_PLAN.md` |
| verification | syntax, unit, E2E, build, plan sanity | `EVIDENCE_UNITS.md` |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| original visual artifact | `archive/runs/redteam-ax-v2/<case>/visual-bundles/<visual_evidence_id>/original.png` | preserve original image bundle |
| redacted visual artifact | `archive/runs/redteam-ax-v2/<case>/visual-bundles/<visual_evidence_id>/redacted.png` | report-safe masked copy candidate |
| manifest | `archive/runs/redteam-ax-v2/<case>/visual-bundles/<visual_evidence_id>/screenshot_manifest.json` | bundle metadata and hashes |
| API test | `tests/test_redteam_v2_api_router.py` | prove artifact generation |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
