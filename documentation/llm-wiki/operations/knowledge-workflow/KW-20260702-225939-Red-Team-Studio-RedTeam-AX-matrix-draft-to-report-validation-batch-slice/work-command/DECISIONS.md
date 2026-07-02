# Decisions

## Implemented

- Report draft generation is gated by Matrix draft readiness.
- Held rows block report generation.
- Existing `generate_report` remains canonical for Korean Report v2 rendering and report gate logic.
- Export approval remains separate.

## Rationale

This prevents unapproved Evidence/Finding candidates from entering a report and keeps all report generation tied to the same Claim-Evidence Matrix validation path.

## Revisit Later

Batch UX can be added after real candidate approvals exist.
