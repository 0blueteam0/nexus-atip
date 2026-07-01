---
type: work_command_record
task_id: KW-20260701-125421-Red-Team-Studio-Implement-RedTeam-AX-v2-persistent-approval-queue-and-UI-reload
project: Red Team Studio
task: Implement RedTeam AX v2 persistent approval queue and UI reload
created: 2026-07-01T12:54:21+09:00
source_package: K:/wiki/work command
---

# TASKS

## Original Request

## Task

## Status

## Execution Control

## Tools

## Verification

## Slice 4 Task Breakdown

- [x] Read SPEC `25_TOOL_ACTION_CARD_AND_WEBAPP_SPEC.md` and `30_TOOLING_API_SPEC.md` for Approval Queue/API requirements.
- [x] Add persistent ToolAction list/get model helpers.
- [x] Add approval request and approval decision model helpers.
- [x] Expose list/get/request/approve FastAPI routes under `/api/redteam/v2`.
- [x] Connect `레드팀 분석2` status refresh to backend queue reload.
- [x] Connect Queue `Request Approval` button to backend API.
- [x] Extend v2 API tests for ApprovalRequested and Approved reload.
- [x] Extend sample E2E with approval request/decision before manual run.
- [x] Verify backend, frontend, live API, live browser smoke.
- [x] Update `FINAL_PLAN.md`.
- [ ] Implement role-aware approver authorization.
- [ ] Implement T5/two-person approval hard gate.
- [ ] Implement normalizer/import-output API.
- [ ] Implement approved report export API.

