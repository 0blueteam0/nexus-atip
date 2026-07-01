---
type: work_command_record
task_id: KW-20260701-173209-Red-Team-Studio-Implement-RedTeam-AX-v2-approved-tool-runner-backend-preflight-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 approved tool runner backend preflight slice
created: 2026-07-01T17:32:09+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Filled Record

Tool need: implement source changes, verify API and frontend behavior, maintain evidence records, and avoid unrelated dirty worktree files.

Selected tooling: `apply_patch` for edits, Python unittest for backend regression, Node syntax check for frontend parse validation, Vite build for frontend integration, and knowledge workflow close for evidence gate.

Build versus adopt: no new dependency was added. The slice uses Python standard library `subprocess` under strict gates and existing artifact helpers for output capture.

Verification result: API regression exit_code 0 with 38 tests, sample E2E exit_code 0 with 1 test, frontend build exit_code 0, JavaScript syntax exit_code 0, plan sanity exit_code 0.

## Tool Need

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|

## Build vs Adopt

## Selected Tool

## Verification

