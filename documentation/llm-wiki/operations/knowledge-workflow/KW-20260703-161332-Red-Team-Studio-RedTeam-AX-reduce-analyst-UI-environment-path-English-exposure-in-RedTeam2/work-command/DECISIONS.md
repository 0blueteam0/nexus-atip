# Decisions

## Display Layer

Raw path and API values remain in backend payloads and Evidence artifacts for audit traceability. The analyst-facing RedTeam2 UI now displays Korean state summaries instead of direct locations.

## Placeholder Policy

Default local absolute path examples were removed. Inputs that still need paths use placeholders such as `관리자가 승인한 운영 산출물 폴더` or instruct users to generate JSON through buttons.

## Sanity Policy

The frontend launch readiness contract now rejects representative raw exposure strings including `stored: ${`, `plan: ${`, `report: ${`, local manifest path examples, and old endpoint URL warnings.

## Completion Audit

Added `RTA-COMP-073` as a proved display-minimization requirement while explicitly keeping goal status active and incomplete.
