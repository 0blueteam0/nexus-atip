# Evidence Units

## Commands

- `pytest tests/test_insurance_fds_public_image_collector.py -q` -> 4 passed.
- `python scripts/insurance_fds_public_image_collector.py --output-root data/insurance-fds-generated/public-real-candidates-v1 --max-queries 12 --per-query 10 --max-downloads 30 --sleep-seconds 0.7` -> downloaded_count 10; later rejected as noisy.
- Browser Bing Images DOM extraction returned Korean medical receipt/insurance claim image URLs.
- Curated download Python harness -> downloaded_count 11, errors 0.
- `pytest tests/test_insurance_fds_real_image_redteam_generator.py tests/test_insurance_fds_public_image_collector.py -q` -> 7 passed.
- `python scripts/insurance_fds_real_image_redteam_generator.py --source-root data/insurance-fds-generated/public-real-candidates-v1-curated --output-root data/insurance-fds-generated/real-image-redteam-v1 --max-sources 11 --variants-per-source 6` -> no_count 22, af_count 66, records 88.
- `pytest tests/test_insurance_fds_public_image_collector.py tests/test_insurance_fds_real_image_redteam_generator.py tests/test_insurance_fds_camera_image_generator.py tests/test_insurance_fds_priority_pipeline.py -q` -> 16 passed in 32.03s.

## Artifacts

- `data/insurance-fds-generated/public-real-candidates-v1-curated/manifests/public_image_candidate_manifest.json`
- `data/insurance-fds-generated/public-real-candidates-v1-curated/indexes/public_image_candidate_index.xlsx`
- `data/insurance-fds-generated/public-real-candidates-v1-curated/indexes/contact_sheet_curated_public_candidates.png`
- `data/insurance-fds-generated/real-image-redteam-v1/manifests/real_image_redteam_manifest.json`
- `data/insurance-fds-generated/real-image-redteam-v1/indexes/real_image_redteam_index.xlsx`
- `data/insurance-fds-generated/real-image-redteam-v1/indexes/contact_sheet_real_image_redteam_sample.png`
- `data/insurance-fds-generated/real-image-redteam-v1/source_quality/public_image_search_and_template_notes.json`
