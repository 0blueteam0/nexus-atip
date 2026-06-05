# Tasks

## TASK-001: Fix Workstream A

work: Real-web grounded exact-coordinate pseudonymized dataset pipeline.
purpose: Continue insurance claim document synthetic/tampered data work using actual web-source originals as reference basis.
method: Improve source extraction, field inventory, OCR/KIE, privacy gates, exact-coordinate rewrite.
done: Scope fixed in `documentation/reports/INSURANCE_FDS_TWO_FIXED_WORKSTREAMS_SCOPE_20260605.ko.md`.
impact: Agent A can proceed without mixing in test-harness RCA.
evidence: EU-001, EU-002, EU-003, EU-004, EU-007.

## TASK-002: Fix Workstream B

work: Mass-test delay and test-harness RCA.
purpose: Recover the previous large-test delay/missing-script issue separately from data generation.
method: Restore missing field inventory script, split slow tests, record duration budgets.
done: Current collection failure and slow-test baseline recorded in the scope report.
impact: Agent B can proceed without changing data-generation policy.
evidence: EU-005, EU-006, EU-007.

## TASK-003: Shared guardrail

work: Keep visible shortcut artifacts out of images.
purpose: Respect the user requirement and avoid shortcut learning.
method: Enforce generated image checks against visible mask/block/synthetic-only/submission-invalid text or boxes.
done: Guardrail written into the fixed scope document.
impact: Both agents share one policy baseline.
evidence: EU-004, EU-007.
