# Scope

Project: insurance-fds
Task: continue two fixed workstreams: real-web grounded exact-coordinate pseudonymized dataset and mass-test harness stabilization

## Fixed workstreams

1. Workstream A: Real-Web Grounded Exact-Coordinate Pseudonymized Dataset
   - Build field inventory before any AF/tamper generation.
   - Preserve provenance/privacy state.
   - Keep generated training images free of visible mask/block/synthetic-only/submission-invalid shortcuts.

2. Workstream B: Mass-Test Delay / Test Harness RCA and Stabilization
   - Remove collection blocker caused by missing `scripts/insurance_fds_real_image_field_inventory.py`.
   - Verify `tests/test_insurance_fds_*.py` collects and runs.
   - Record durations baseline.

## Non-goals

- No AF bulk dataset generation in this task.
- No real web source promotion to training data.
- No privacy/source gate weakening.
