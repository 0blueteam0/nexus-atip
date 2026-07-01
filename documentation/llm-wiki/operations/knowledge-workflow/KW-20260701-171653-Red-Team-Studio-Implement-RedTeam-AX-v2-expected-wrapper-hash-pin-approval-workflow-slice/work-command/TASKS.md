---
type: work_command_record
task_id: KW-20260701-171653-Red-Team-Studio-Implement-RedTeam-AX-v2-expected-wrapper-hash-pin-approval-workflow-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 expected wrapper hash pin approval workflow slice
created: 2026-07-01T17:16:53+09:00
source_package: K:/wiki/work command
---

# TASKS

## Original Request

Continue the active RedTeam AX v2 goal and implement the next required step after wrapper manifest/hash preflight.

## Task

Implement expected SHA-256 wrapper pin request and approval workflow, including operator-attested version evidence and RedTeam2 UI controls.

## Status

Completed for slice 26. Remaining work: revoke/rotate, actual runner hard-block enforcement, live browser smoke.

## Execution Control

No scanner or version command was executed by the registry/API. Version data is operator-attested.

## Tools

`rg`, `apply_patch`, bundled Python unittest, bundled Node syntax check, Vite build, plan sanity, knowledge workflow.

## Verification

37 API tests OK, sample E2E OK, JS syntax OK, frontend build OK, plan sanity OK.

