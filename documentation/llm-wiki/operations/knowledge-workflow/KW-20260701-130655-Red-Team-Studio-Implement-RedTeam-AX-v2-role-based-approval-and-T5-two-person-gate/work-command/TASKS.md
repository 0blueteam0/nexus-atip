---
type: work_command_record
task_id: KW-20260701-130655-Red-Team-Studio-Implement-RedTeam-AX-v2-role-based-approval-and-T5-two-person-gate
project: Red Team Studio
task: Implement RedTeam AX v2 role based approval and T5 two person gate
created: 2026-07-01T13:06:55+09:00
source_package: K:/wiki/work command
---

# TASKS

## Original Request

## Task

## Status

## Execution Control

## Tools

## Verification

## Slice 5 Task Breakdown

- [x] Read approval/HITL SPEC references for Control Team and two-person requirements.
- [x] Add `approver_role` normalization and allow-list.
- [x] Add approval policy helper for T3/T4/T5.
- [x] Reject unauthorized approver roles.
- [x] Keep T5 as `PartiallyApproved` until two distinct approvers satisfy required roles.
- [x] Block high-risk manual-run before `Approved`.
- [x] Block manual-run without ToolActionCard.
- [x] Display required approval roles in `레드팀 분석2` queue.
- [x] Add API tests for role/T5/manual-run gates.
- [x] Run backend/frontend/live verification.
- [ ] Bind approver identity to actual auth provider.
- [ ] Implement approved report export API.
- [ ] Implement normalizer/import-output API.

