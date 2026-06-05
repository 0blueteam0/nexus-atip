# Handoff

- command: `PYTHONPATH=src pytest tests/test_real_web_source_collector.py tests/test_stg_local_tamper.py -q`
- exit_code: 0
- verified_at: 2026-06-05T16:20:00+09:00
- artifact_path: `A3Work/FDSWork/GPTWork_FDS/new type/claim_fds_v3_pipeline_package/claim_fds_v3_pipeline/scripts/collect_real_insurance_claim_sources.py`
- source_path: `tests/test_real_web_source_collector.py`

Changed collector and tests under claim_fds_v3_pipeline. Continue by adding rejected contact sheets, PDF OCR path, and optional isolated marker-pdf venv if LLM-enhanced marker extraction is needed. External Windows binaries require admin/portable install because winget failed with 0x80070005.
