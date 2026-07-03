---
type: work_command_record
task_id: KW-20260703-155758-Red-Team-Studio-RedTeam-AX-add-operating-closure-progress-summary-for-real-scanner-evidence-work
project: Red Team Studio
task: RedTeam AX add operating closure progress summary for real scanner evidence workflow
created: 2026-07-03T15:57:58+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Decision

Use a shared `operating_closure_progress_summary` object attached to existing closure API responses instead of adding a separate polling endpoint.

## Reason

The existing APIs already know their stage readiness and blockers. A shared projection reduces UI complexity and keeps the next-button logic consistent across readiness, package, human review, reviewed close, certification, and audit.

## Rejected Alternatives

Adding a new endpoint was rejected because it would require additional state lookup and more frontend orchestration. Moving all logic into frontend was rejected because the backend owns safety flags and stage semantics.

## Safety Boundary

The summary must keep `does_not_mark_goal_complete=true`; it guides a user but does not approve Evidence, promote Findings, export reports, or complete the goal.

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries
