# Handoff

Use `scripts/collect_real_insurance_claim_sources.py` with `--verification-mode ocr_vision` for future source collection. Treat `outputs/real_web_claim_sources_run_20260605` as legacy broad/unverified. Its re-profile summary now reports zero accepted candidates because all profiled rows lacked OCR/vision-pass status. If real originals are needed, rerun collection with the new gate and then perform manual PII/license review before using any image.
