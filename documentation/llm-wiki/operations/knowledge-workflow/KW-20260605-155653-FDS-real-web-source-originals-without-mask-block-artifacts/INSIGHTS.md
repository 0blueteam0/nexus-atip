# Insights

## Scoring failure mode
- evidence_type: event inspection
- verified_at: 2026-06-05T16:05:00+09:00
- source_path: outputs/real_web_claim_sources_run_20260605/events/important_candidate_*.txt
- insight: Page title relevance by itself promoted non-document assets. Examples included default images, stock images, organization home images, and guide-flow components.

## Corrected collection rule
- evidence_type: regression and smoke verification
- command: PYTHONPATH=src python -m pytest tests/test_stg_local_tamper.py tests/test_real_web_source_collector.py -q
- exit_code: 0
- verified_at: 2026-06-05T16:05:00+09:00
- insight: Asset URL negative patterns plus stricter download/contact-sheet criteria prevent known non-document assets from being promoted.

## Remaining curation boundary
- artifact_path: outputs/real_web_claim_sources_focused_no_noise_smoke3/real_web_source_candidates.manifest.jsonl
- verified_at: 2026-06-05T16:05:00+09:00
- insight: The smoke output is a quarantine candidate set only. PII/license review remains required before training or redistribution.
