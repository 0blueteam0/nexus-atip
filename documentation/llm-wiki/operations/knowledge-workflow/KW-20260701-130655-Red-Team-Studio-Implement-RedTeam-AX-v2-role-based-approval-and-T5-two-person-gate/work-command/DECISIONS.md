---
type: work_command_record
task_id: KW-20260701-130655-Red-Team-Studio-Implement-RedTeam-AX-v2-role-based-approval-and-T5-two-person-gate
project: Red Team Studio
task: Implement RedTeam AX v2 role based approval and T5 two person gate
created: 2026-07-01T13:06:55+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

## Slice 5 Decisions

1. T3 requires `red_team_lead`; T4 requires `control_team`; T5 requires `control_team` and `second_approver`.
   Evidence: `approval_policy_for` and API tests.

2. T5 two-person approval requires distinct approver identities.
   Evidence: same actor second approval returns `two_person_approval_requires_distinct_approvers`.

3. Manual-run requires ToolActionCard existence.
   Evidence: missing action test returns `tool_action_card_required_before_manual_run`.

4. High-risk manual-run requires action status `Approved`.
   Evidence: live T5 partial approval smoke blocks manual-run.

