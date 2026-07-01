---
type: work_command_record
task_id: KW-20260701-171653-Red-Team-Studio-Implement-RedTeam-AX-v2-expected-wrapper-hash-pin-approval-workflow-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 expected wrapper hash pin approval workflow slice
created: 2026-07-01T17:16:53+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Decisions

- Store wrapper pin requests and approvals as artifacts.
- Keep version evidence operator-attested; do not execute version commands in API.
- Require `red_team_lead` approval for expected SHA-256 trust pins.
- Reject wrapper pin requests for import-only tools.
- Feed approved pins back into manifests through `expected_sha256_source=approved_pin`.

## Rationale

The workflow advances runner trust readiness without introducing active scanner execution or unapproved trust mutation.

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

