## Tooling

- tool: pytest
- command: PYTHONPATH=src python -m pytest tests/test_stg_local_tamper.py tests/test_real_web_source_collector.py -q
- exit_code: 0
- verified_at: 2026-06-05T16:05:00+09:00

- tool: collector smoke CLI
- command: python scripts/collect_real_insurance_claim_sources.py --output-dir outputs/real_web_claim_sources_focused_no_noise_smoke3 --max-queries 2 --per-query 2 --download-images --sleep-min 0 --sleep-max 0 --source-mode focused --firecrawl-mode trusted_seed
- exit_code: 0
- verified_at: 2026-06-05T16:05:00+09:00
