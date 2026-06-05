# Handoff

Next agent should use updated collector with `--verification-mode ocr_vision`. Existing `outputs/real_web_claim_sources_run_20260605` is treated as legacy broad/unverified; do not train on it. Use it only as a negative/noise audit or rerun collection under the new gate.
