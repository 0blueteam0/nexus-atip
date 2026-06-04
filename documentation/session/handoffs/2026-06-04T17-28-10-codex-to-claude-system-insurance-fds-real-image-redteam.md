# System Handoff: insurance-fds-data real public-image redteam pipeline

- from: codex
- to: claude
- created_at: 2026-06-04T17:28:10+09:00
- system: insurance-fds-data

## What changed

Added a real public-image candidate collection and real-image redteam derivative pipeline for Korean 실손보험 FDS work.

## New scripts

- `scripts/insurance_fds_public_image_collector.py`
  - Builds Korean search queries for 실손보험 영수증, 진료비 계산서, 병원 영수증, 약제비 영수증, 보험금 청구서, etc.
  - Extracts Bing Images candidates, downloads images, inserts PNG text metadata, and writes JSON/Excel indexes.
  - Keeps all public images in quarantine due privacy/license risk.

- `scripts/insurance_fds_real_image_redteam_generator.py`
  - Takes curated public real-image candidates and creates `NO_REAL_DERIVED_*` scanner derivatives plus `AF_REAL_DERIVED_*` redteam overlay/mask samples.
  - Includes scanner profiles: `scanner_flatbed_300dpi`, `scanner_adf_200dpi`.
  - Includes phone/mobile profiles without LG phones: Samsung Galaxy S24, iPhone 15 style synthetic metadata.
  - Writes PNG metadata directly and Excel indexes.

## New outputs

- `data/insurance-fds-generated/public-real-candidates-v1-curated/`
  - 11 curated Korean public real-image candidates.
  - Manifest: `manifests/public_image_candidate_manifest.json`
  - Excel: `indexes/public_image_candidate_index.xlsx`
  - Contact sheet: `indexes/contact_sheet_curated_public_candidates.png`

- `data/insurance-fds-generated/real-image-redteam-v1/`
  - 22 NO scanner derivatives.
  - 66 AF redteam derivatives.
  - 66 AF masks.
  - Manifest: `manifests/real_image_redteam_manifest.json`
  - Excel: `indexes/real_image_redteam_index.xlsx`
  - Source-quality notes: `source_quality/public_image_search_and_template_notes.json`

## Verification

- `pytest tests/test_insurance_fds_public_image_collector.py tests/test_insurance_fds_real_image_redteam_generator.py tests/test_insurance_fds_camera_image_generator.py tests/test_insurance_fds_priority_pipeline.py -q`
- Result: `16 passed in 32.03s`

## Risks

- Public web images may contain real PII or copyrighted content. They are not clean training data until manual PII masking and license/source review.
- Google Images automation failed via browser tool with a UTF-8 decode error. Yandex was not automated. Use source-quality query set for manual cross-check.
- First broad Bing automatic batch was noisy and is recorded as rejected; use curated batch instead.

## Next actions

1. Add automated OCR/PII detection and redaction before promoting NO_REAL candidates.
2. Run Google/Yandex manual cross-check queries from `source_quality/public_image_search_and_template_notes.json`.
3. Add more insurer-specific 보험금청구서 PDFs and year-template drift samples.
4. Build train/val/test split after privacy review.
