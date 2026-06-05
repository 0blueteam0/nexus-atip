# Worklog

## Step 1: Noisy broad run stopped
- command: process.kill proc_6daf894f6032, proc_a940f9d5ad43, proc_df9eb81532b2
- exit_code: 0
- verified_at: 2026-06-05T16:05:00+09:00
- evidence: previous IMPORTANT_CANDIDATE events included default_L.png, no-image-v1.png, homeimg.png, AdobeStock, and guide images.

## Step 2: Regression tests added
- artifact_path: tests/test_real_web_source_collector.py
- verified_at: 2026-06-05T16:05:00+09:00
- evidence: test file checks placeholder, stock, logo, banner, navigation, QR, HIRA guide component, and Korean document-type visual labels.

## Step 3: Collector patched
- artifact_path: scripts/collect_real_insurance_claim_sources.py
- verified_at: 2026-06-05T16:05:00+09:00
- evidence: NEGATIVE_ASSET_PATTERNS added; too-small files unlinked; contact sheet limited to downloaded_quarantine; image download requires score >= 4.

## Step 4: Verification commands
- command: PYTHONPATH=src python -m pytest tests/test_stg_local_tamper.py tests/test_real_web_source_collector.py -q
- exit_code: 0
- verified_at: 2026-06-05T16:05:00+09:00
- result: 5 passed, 8 Pillow deprecation warnings.

- command: python scripts/collect_real_insurance_claim_sources.py --output-dir outputs/real_web_claim_sources_focused_no_noise_smoke3 --max-queries 2 --per-query 2 --download-images --sleep-min 0 --sleep-max 0 --source-mode focused --firecrawl-mode trusted_seed
- exit_code: 0
- verified_at: 2026-06-05T16:05:00+09:00
- result: query_count=2, candidate_count=18, downloaded_count=1, important_event_count=1.
