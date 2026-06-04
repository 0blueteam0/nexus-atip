---
type: evidence_unit
status: draft
id:
project: insurance-fds-data
created: 2026-06-04T15:58:40+09:00
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


## Evidence - synthetic generator v1
- command: `pytest tests/test_insurance_fds_synthetic_generator.py -q`
- exit_code: 0
- output: `4 passed in 2.11s`
- command: `python scripts/insurance_fds_synthetic_generator.py --output data/insurance-fds-generated/demo-v1 --count-per-template 2 --seed 20260604`
- exit_code: 0
- artifact_path: `data/insurance-fds-generated/demo-v1/manifests/generated_manifest.json`
- generated_items: 64
- verified_at: 2026-06-04T16:12:29+09:00
