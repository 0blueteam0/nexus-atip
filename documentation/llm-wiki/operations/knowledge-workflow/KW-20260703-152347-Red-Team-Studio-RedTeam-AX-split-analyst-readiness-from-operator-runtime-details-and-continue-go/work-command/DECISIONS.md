---
type: work_command_record
task_id: KW-20260703-152347-Red-Team-Studio-RedTeam-AX-split-analyst-readiness-from-operator-runtime-details-and-continue-go
project: Red Team Studio
task: RedTeam AX split analyst readiness from operator/runtime details and continue governed tool execution UX
created: 2026-07-03T15:23:47+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

# Decisions

1. Backend source of truth:
   - Add `analyst_readiness_summary`, `operator_environment_summary`, and `role_separated_next_steps` to `/api/redteam/v2/runtime-readiness`.
   - Reason: frontend-only wording would not give tests and future clients a stable role-separated contract.

2. Preserve raw readiness:
   - Keep `next_action_plan`, raw blockers, and artifact projections.
   - Reason: administrator/operator troubleshooting and audit need the original detail.

3. Safety language:
   - Analyst summary explicitly sets `can_run_active_scan=false`.
   - Reason: beginner-friendly UX must not imply permission for high-risk execution.

4. Completion status:
   - Do not mark the active goal complete.
   - Reason: real organization endpoint import and real six-tool evidence closure remain missing.
