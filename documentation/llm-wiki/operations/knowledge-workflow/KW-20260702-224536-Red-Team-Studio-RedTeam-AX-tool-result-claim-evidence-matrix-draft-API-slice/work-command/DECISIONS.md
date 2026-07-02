# Decisions

## Implemented Decisions

- Matrix draft is a separate API, not a side effect of promotion.
- Ready rows require approved Evidence and approved Finding severity.
- Held rows remain visible but are excluded from `report_validation_payload_preview`.
- Existing `validate_report` remains the only report gate implementation.
- The API writes an artifact but does not create Findings, insert report claims, run tools, or perform scans.

## Rationale

This keeps tool output as evidence candidate data and prevents unsupported or unapproved claims from entering Report v2 inputs. It also avoids a parallel validator that could drift from the existing report gate.

## Decisions To Revisit Later

- Whether final report generation should accept a Matrix draft artifact ID directly.
- Whether batch promotion should exist after real Evidence approvals are available.
