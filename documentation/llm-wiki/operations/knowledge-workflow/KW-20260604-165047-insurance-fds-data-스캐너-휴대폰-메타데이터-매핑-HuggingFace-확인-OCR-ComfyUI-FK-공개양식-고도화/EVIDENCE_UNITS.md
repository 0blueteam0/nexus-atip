---
type: evidence_unit
status: draft
id:
project: insurance-fds-data
created: 2026-06-04T16:50:47+09:00
---

# Evidence Unit

## Claim

## Source

- source_type:
- path_or_url:
- command:
- exit_code:
- collected_at:

## Evidence

## Confidence

## Limits

## Related Decisions



## Evidence
- command: pytest tests/test_insurance_fds_camera_image_generator.py tests/test_insurance_fds_priority_pipeline.py -q
  exit_code: 0
  observed: 9 passed in 31.52s
- command: python scripts/insurance_fds_priority_pipeline.py --source-root data/insurance-fds-generated/demo-v1 --camera-root data/insurance-fds-generated/camera-v1 --output data/insurance-fds-generated/priority-v1 --seed 20260604 --hf-live true
  exit_code: 0
  artifact_path: data/insurance-fds-generated/priority-v1/manifests/priority_manifest.json
- command: python scripts/insurance_fds_camera_image_generator.py --source-root data/insurance-fds-generated/priority-v1 --output data/insurance-fds-generated/priority-camera-v1 --variants-per-document 6 --seed 20260604
  exit_code: 0
  artifact_path: data/insurance-fds-generated/priority-camera-v1/manifests/camera_image_manifest.json
- verified_counts: Korean pairs 4, camera images 48, NO 24, AF 24, HF candidates 12, FK abstracts 4.
