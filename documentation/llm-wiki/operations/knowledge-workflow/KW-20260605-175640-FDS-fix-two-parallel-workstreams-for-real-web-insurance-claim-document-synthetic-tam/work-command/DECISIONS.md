# Decisions

## DEC-001: Two parallel workstreams only

Decision: Proceed with exactly two parallel workstreams.
Rationale: The user explicitly asked to fix the work scope into two items before proceeding.
Evidence: Prior handoffs and current pytest runs show two separable needs: data pipeline continuation and test harness RCA.
Impact: Prevents scope creep across source collection, synthetic data generation, and test-performance work.

## DEC-002: No visible shortcut artifacts in generated images

Decision: Generated images must not contain visible masks, blocks, synthetic-only boxes, actual-submission-invalid labels, watermark-like labels, or useless dummy values.
Rationale: The user asked for anonymization/pseudonymization only, and visible artifacts can cause shortcut learning.
Evidence: User instruction; `PSEUDONYMIZATION_AND_DEIDENTIFICATION_POLICY.md`; fixed scope report.
Impact: Future data-generation tests must distinguish internal label artifacts from rendered image pixels.

## DEC-003: Test collection error is the first RCA item

Decision: Fix the missing field inventory script or stale test before interpreting the full insurance FDS test-suite duration.
Rationale: The glob test does not reach execution timing because collection stops first.
Evidence: `python -m pytest tests/test_insurance_fds_*.py -q --durations=12` exited 2 due missing `scripts/insurance_fds_real_image_field_inventory.py`.
Impact: Agent B starts with collection repair, then slow-test marker/fixture work.

## DEC-004: Web-original reference basis, not automatic promotion

Decision: Use real web-source originals as reference basis but keep candidates quarantined until provenance/privacy/license gates pass.
Rationale: User wants proper originals from the web, but the prior bg2 run had zero verified downloads and public images may contain PII/copyright risk.
Evidence: bg2 zero-download analysis and real-image redteam handoff risk notes.
Impact: Agent A improves deep extraction and profiling without bypassing review gates.
