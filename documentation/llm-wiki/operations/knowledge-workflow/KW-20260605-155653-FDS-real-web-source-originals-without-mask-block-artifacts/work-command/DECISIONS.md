## Decisions

- decision: broad Firecrawl query search remains opt-in; default collection is focused/trusted_seed.
- evidence: previous broad run emitted non-document IMPORTANT_CANDIDATE events.
- verified_at: 2026-06-05T16:05:00+09:00

- decision: visible masks, block overlays, 합성전용, 제출불가 markers are not used in STG outputs.
- evidence: tests/test_stg_local_tamper.py passed.
- exit_code: 0
